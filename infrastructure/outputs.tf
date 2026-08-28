output "region" {
  value       = var.aws_region
  description = "Target AWS Region"
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.pool.id
  description = "Amazon Cognito User Pool ID"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.spa_client.id
  description = "Amazon Cognito User Pool App Client ID"
}

output "api_gateway_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "API Gateway HTTP API Endpoint Base URL"
}

output "dynamodb_table_names" {
  value = {
    shipments     = aws_dynamodb_table.shipments.name
    network_edges = aws_dynamodb_table.network_edges.name
    events        = aws_dynamodb_table.events.name
  }
  description = "DynamoDB Table Names"
}

output "iot_topic" {
  value       = "logistics/events"
  description = "AWS IoT Core MQTT Topic for event ingestion"
}
