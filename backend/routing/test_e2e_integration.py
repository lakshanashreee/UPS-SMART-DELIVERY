import unittest
import json
import os
import sys

# Add parent directory to sys.path so backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.routing.dijkstra import Graph, find_fastest_route
from backend.lambdas.event_processor.handler import lambda_handler as event_processor_handler
from backend.lambdas.legacy_simulator.handler import lambda_handler as legacy_simulator_handler
from backend.lambdas.sync_api.handler import lambda_handler as sync_api_handler

class TestE2EIntegration(unittest.TestCase):
    def setUp(self):
        self.shipment_id = "SHIP-001"
        self.origin = "Chennai"
        self.destination = "Mumbai"

    def test_step1_live_location_update(self):
        """STEP 1: Admin sends LOCATION_UPDATE from Hyderabad to Pune"""
        payload = {
            "shipmentId": self.shipment_id,
            "eventType": "LOCATION_UPDATE",
            "hub": "Pune",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "delayMinutes": 0
        }
        event = {
            "body": json.dumps(payload),
            "headers": {"Authorization": "Bearer mock-admin-jwt"}
        }

        response = legacy_simulator_handler(event, None)
        self.assertEqual(response["statusCode"], 200)

        body = json.loads(response["body"])
        self.assertEqual(body["topic"], "logistics/events")
        self.assertEqual(body["event"]["shipmentId"], self.shipment_id)
        self.assertEqual(body["event"]["hub"], "Pune")
        self.assertEqual(body["event"]["eventType"], "LOCATION_UPDATE")

    def test_step2_delay_and_dijkstra_rerouting(self):
        """STEP 2: Admin sends CONGESTION (180 min delay on Pune -> Mumbai corridor)"""
        payload = {
            "eventId": "EVT-E2E-002",
            "shipmentId": self.shipment_id,
            "eventType": "CONGESTION",
            "hub": "Hyderabad",
            "delayMinutes": 180,
            "latitude": 17.3850,
            "longitude": 78.4867,
            "timestamp": "2026-08-28T11:17:00Z"
        }

        # Invoke event processor Lambda (executes 9-step processing pipeline)
        response = event_processor_handler(payload, None)
        self.assertEqual(response["statusCode"], 200)

        result = json.loads(response["body"])
        self.assertEqual(result["status"], "AT_RISK")
        self.assertEqual(result["riskLevel"], "HIGH")
        self.assertEqual(result["riskScore"], 0.87)
        self.assertIn("Chennai", result["routePath"])
        self.assertIn("Mumbai", result["routePath"])

    def test_step3_dijkstra_graph_recalculation(self):
        """STEP 3: Direct Dijkstra Graph execution with congestion weight penalty"""
        g = Graph()
        # Initial edges: Hyderabad corridor is fastest (180 + 180 = 360m)
        g.add_edge('Chennai', 'Hyderabad', 180)
        g.add_edge('Hyderabad', 'Mumbai', 180)
        # Alternate corridor via Bengaluru & Pune (210 + 300 + 90 = 600m)
        g.add_edge('Chennai', 'Bengaluru', 210)
        g.add_edge('Bengaluru', 'Pune', 300)
        g.add_edge('Pune', 'Mumbai', 90)

        # Baseline route via Hyderabad = 360 mins
        route_normal = find_fastest_route(g, 'Chennai', 'Mumbai')
        self.assertTrue(route_normal['found'])
        self.assertEqual(route_normal['path'], ['Chennai', 'Hyderabad', 'Mumbai'])

        # Introduce congestion delay at Hyderabad (+300 mins -> 180 + 300 = 480m, total 660m)
        g.update_edge_weight('Hyderabad', 'Mumbai', 480)
        route_recalculated = find_fastest_route(g, 'Chennai', 'Mumbai')
        self.assertTrue(route_recalculated['found'])
        # Recalculated path bypasses congested Hyderabad -> goes via Bengaluru & Pune
        self.assertEqual(route_recalculated['path'], ['Chennai', 'Bengaluru', 'Pune', 'Mumbai'])
        self.assertEqual(route_recalculated['total_time_minutes'], 600)

    def test_step4_and_step5_offline_queue_and_batch_sync(self):
        """STEP 4 & STEP 5: Offline event queueing and reconnect batch sync execution"""
        sync_batch_payload = {
            "events": [
                {
                    "eventId": "EVT-OFFLINE-001",
                    "action": "LOCATION_UPDATE",
                    "payload": {
                        "shipmentId": self.shipment_id,
                        "eventType": "LOCATION_UPDATE",
                        "hub": "Mumbai",
                        "latitude": 19.0760,
                        "longitude": 72.8777
                    },
                    "idempotencyKey": "EVT-OFFLINE-001",
                    "timestamp": "2026-08-28T11:17:05Z"
                }
            ]
        }
        event = {
            "body": json.dumps(sync_batch_payload),
            "requestContext": {"http": {"method": "POST"}}
        }

        response = sync_api_handler(event, None)
        self.assertEqual(response["statusCode"], 200)

        res_body = json.loads(response["body"])
        self.assertEqual(res_body["syncedCount"], 1)
        self.assertEqual(res_body["status"], "SYNCED")
        self.assertIn("EVT-OFFLINE-001", res_body["syncedIds"])

if __name__ == '__main__':
    unittest.main()
