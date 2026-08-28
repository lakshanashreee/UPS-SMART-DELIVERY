resource "aws_apigatewayv2_api" "http_api" {
  name          = "${local.name_prefix}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Integrations
resource "aws_apigatewayv2_integration" "shipments_api" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.shipments_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "network_api" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.network_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "route_api" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.route_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "legacy_simulator" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.legacy_simulator.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "sync_api" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sync_api.invoke_arn
  payload_format_version = "2.0"
}

# Routes
resource "aws_apigatewayv2_route" "get_shipments" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /shipments"
  target    = "integrations/${aws_apigatewayv2_integration.shipments_api.id}"
}

resource "aws_apigatewayv2_route" "get_shipment_by_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /shipments/{shipmentId}"
  target    = "integrations/${aws_apigatewayv2_integration.shipments_api.id}"
}

resource "aws_apigatewayv2_route" "get_network" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /network"
  target    = "integrations/${aws_apigatewayv2_integration.network_api.id}"
}

resource "aws_apigatewayv2_route" "post_route_calculate" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /route/calculate"
  target    = "integrations/${aws_apigatewayv2_integration.route_api.id}"
}

resource "aws_apigatewayv2_route" "post_admin_simulate_event" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /admin/simulate-event"
  target    = "integrations/${aws_apigatewayv2_integration.legacy_simulator.id}"
}

resource "aws_apigatewayv2_route" "post_sync_events" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /sync/events"
  target    = "integrations/${aws_apigatewayv2_integration.sync_api.id}"
}

# Lambda Permissions for API Gateway Execution
resource "aws_lambda_permission" "apigw_shipments_api" {
  statement_id  = "AllowAPIGatewayInvokeShipments"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shipments_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_network_api" {
  statement_id  = "AllowAPIGatewayInvokeNetwork"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.network_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_route_api" {
  statement_id  = "AllowAPIGatewayInvokeRoute"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.route_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_legacy_simulator" {
  statement_id  = "AllowAPIGatewayInvokeSimulator"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.legacy_simulator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_sync_api" {
  statement_id  = "AllowAPIGatewayInvokeSync"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sync_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
