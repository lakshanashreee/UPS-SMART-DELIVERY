import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

NETWORK_EDGES_TABLE = os.environ.get("NETWORK_EDGES_TABLE", "logistics_network_edges")

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    }

    body = {
        "message": "Logistics hub network topology",
        "nodes": [
            {"id": "HUB_A", "name": "Atlanta Hub", "lat": 33.7490, "lng": -84.3880},
            {"id": "HUB_B", "name": "Birmingham Hub", "lat": 33.5186, "lng": -86.8104},
            {"id": "HUB_C", "name": "Charlotte Hub", "lat": 35.2271, "lng": -80.8431},
            {"id": "HUB_D", "name": "Dallas Hub", "lat": 32.7767, "lng": -96.7970}
        ],
        "edges": [
            {"id": "EDGE_A_B", "source": "HUB_A", "target": "HUB_B", "weight": 2.5, "status": "CLEAR"},
            {"id": "EDGE_B_D", "source": "HUB_B", "target": "HUB_D", "weight": 9.0, "status": "DELAYED"},
            {"id": "EDGE_A_C", "source": "HUB_A", "target": "HUB_C", "weight": 4.0, "status": "CLEAR"},
            {"id": "EDGE_C_D", "source": "HUB_C", "target": "HUB_D", "weight": 11.0, "status": "CLEAR"}
        ]
    }
        
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps(body)
    }
