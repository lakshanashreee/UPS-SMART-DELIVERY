import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SHIPMENTS_TABLE = os.environ.get("SHIPMENTS_TABLE", "logistics_shipments")

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path_parameters = event.get("pathParameters") or {}
    shipment_id = path_parameters.get("shipmentId")
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    }

    if shipment_id:
        body = {
            "message": f"Shipment details for {shipment_id}",
            "shipmentId": shipment_id,
            "status": "IN_TRANSIT",
            "origin": "HUB_A",
            "destination": "HUB_D",
            "currentLocation": "HUB_B",
            "atRisk": False
        }
    else:
        body = {
            "message": "List of active shipments",
            "shipments": []
        }
        
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps(body)
    }
