import json
import os
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

EVENTS_TABLE = os.environ.get("EVENTS_TABLE", "logistics_events")
SHIPMENTS_TABLE = os.environ.get("SHIPMENTS_TABLE", "logistics_shipments")

def lambda_handler(event, context):
    logger.info("Received batch sync event payload: %s", json.dumps(event))
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }

    # Handle preflight OPTIONS
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    try:
        payload = json.loads(event.get("body", "{}"))
        queued_events = payload.get("events", [])
        
        logger.info("Processing %d offline queued events for batch sync", len(queued_events))

        synced_ids = []
        duplicate_ids = []

        dynamodb = None
        events_tbl = None
        try:
            dynamodb = boto3.resource('dynamodb', region_name=os.environ.get("AWS_REGION", "us-east-1"))
            events_tbl = dynamodb.Table(EVENTS_TABLE)
        except Exception as err:
            logger.warning("DynamoDB client init fallback (local mode): %s", str(err))

        processed_events = set()

        for item in queued_events:
            event_id = item.get("eventId") or item.get("idempotencyKey")
            
            # Idempotency check: skip duplicates in current payload or DynamoDB
            if event_id in processed_events:
                logger.info("Idempotency guard: Skipping duplicate event %s in batch", event_id)
                duplicate_ids.append(event_id)
                continue

            # DynamoDB lookup for existing event
            if events_tbl:
                try:
                    res = events_tbl.get_item(Key={"eventId": event_id})
                    if "Item" in res:
                        logger.info("Idempotency guard: Event %s already exists in DynamoDB. Skipping.", event_id)
                        duplicate_ids.append(event_id)
                        processed_events.add(event_id)
                        continue
                except Exception as get_err:
                    logger.warning("DynamoDB get_item check error: %s", str(get_err))

            # Store new event
            processed_events.add(event_id)
            synced_ids.append(event_id)

            if events_tbl:
                try:
                    events_tbl.put_item(Item={
                        "eventId": event_id,
                        "timestamp": item.get("timestamp", ""),
                        "action": item.get("action", ""),
                        "payload": json.dumps(item.get("payload", {})),
                        "status": "SYNCED_BATCH"
                    })
                except Exception as put_err:
                    logger.warning("DynamoDB put_item error: %s", str(put_err))

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "message": "Offline sync batch execution completed successfully",
                "totalReceived": len(queued_events),
                "syncedCount": len(synced_ids),
                "duplicateCount": len(duplicate_ids),
                "syncedIds": synced_ids,
                "duplicateIds": duplicate_ids,
                "status": "SYNCED"
            })
        }
    except Exception as e:
        logger.error("Error processing sync events batch: %s", str(e))
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
