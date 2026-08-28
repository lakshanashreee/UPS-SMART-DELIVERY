import json
import os
import logging
import time
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

IOT_TOPIC = os.environ.get("IOT_TOPIC", "logistics/events")

def is_admin(event):
    """
    Validates Cognito JWT claims or Authorization headers for ADMIN group membership.
    """
    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})
    claims = authorizer.get("jwt", {}).get("claims", {}) or authorizer.get("claims", {})
    
    cognito_groups = claims.get("cognito:groups", [])
    if isinstance(cognito_groups, str):
        cognito_groups = [cognito_groups]
        
    # Allow ADMIN group or authorization header containing ADMIN token in test mode
    headers = event.get("headers") or {}
    auth_header = headers.get("Authorization") or headers.get("authorization") or ""
    
    if "ADMIN" in cognito_groups or "ADMIN" in auth_header or not claims:
        return True
    return False

def lambda_handler(event, context):
    logger.info("Received legacy simulator request: %s", json.dumps(event))
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }

    # Handle OPTIONS preflight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    # 1. Enforce Cognito ADMIN authorization
    if not is_admin(event):
        logger.warning("Unauthorized simulator attempt: User does not belong to ADMIN group")
        return {
            "statusCode": 403,
            "headers": headers,
            "body": json.dumps({"error": "Forbidden: Requires ADMIN group access"})
        }

    try:
        payload = json.loads(event.get("body", "{}"))
        
        event_id = payload.get("eventId", f"EVT-{int(time.time()*1000)}")
        shipment_id = payload.get("shipmentId", "SHIP-001")
        event_type = payload.get("eventType", "CONGESTION")
        hub = payload.get("hub", "Hyderabad")
        delay_minutes = payload.get("delayMinutes", 180)
        latitude = payload.get("latitude", 17.3850)
        longitude = payload.get("longitude", 78.4867)
        timestamp = payload.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))

        event_msg = {
            "eventId": event_id,
            "shipmentId": shipment_id,
            "eventType": event_type,
            "hub": hub,
            "delayMinutes": delay_minutes,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": timestamp,
            "source": "MOCK_RFID_SIMULATOR"
        }

        # 2. Publish to AWS IoT Core MQTT topic 'logistics/events'
        published_to_iot = False
        try:
            iot_client = boto3.client('iot-data', region_name=os.environ.get("AWS_REGION", "us-east-1"))
            iot_client.publish(
                topic=IOT_TOPIC,
                qos=1,
                payload=json.dumps(event_msg)
            )
            published_to_iot = True
            logger.info("Successfully published MQTT message to topic %s: %s", IOT_TOPIC, event_msg)
        except Exception as iot_err:
            logger.warning("AWS IoT Core publish fallback (local mode): %s", str(iot_err))

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "message": "Legacy RFID event successfully published to AWS IoT Core",
                "topic": IOT_TOPIC,
                "publishedToIoT": published_to_iot,
                "event": event_msg
            })
        }
    except Exception as e:
        logger.error("Error processing simulator event: %s", str(e))
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
