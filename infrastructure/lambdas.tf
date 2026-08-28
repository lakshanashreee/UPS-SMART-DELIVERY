# Zip Lambda Handlers
data "archive_file" "shipments_api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/shipments_api"
  output_path = "${path.module}/build/shipments_api.zip"
}

data "archive_file" "network_api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/network_api"
  output_path = "${path.module}/build/network_api.zip"
}

data "archive_file" "route_api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/route_api"
  output_path = "${path.module}/build/route_api.zip"
}

data "archive_file" "legacy_simulator_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/legacy_simulator"
  output_path = "${path.module}/build/legacy_simulator.zip"
}

data "archive_file" "event_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/event_processor"
  output_path = "${path.module}/build/event_processor.zip"
}

data "archive_file" "sync_api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/sync_api"
  output_path = "${path.module}/build/sync_api.zip"
}

# 1. shipments_api Lambda
resource "aws_lambda_function" "shipments_api" {
  filename         = data.archive_file.shipments_api_zip.output_path
  function_name    = "${local.name_prefix}-shipments-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.shipments_api_zip.output_base64sha256

  environment {
    variables = {
      SHIPMENTS_TABLE = aws_dynamodb_table.shipments.name
    }
  }
}

resource "aws_cloudwatch_log_group" "shipments_api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.shipments_api.function_name}"
  retention_in_days = 14
}

# 2. network_api Lambda
resource "aws_lambda_function" "network_api" {
  filename         = data.archive_file.network_api_zip.output_path
  function_name    = "${local.name_prefix}-network-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.network_api_zip.output_base64sha256

  environment {
    variables = {
      NETWORK_EDGES_TABLE = aws_dynamodb_table.network_edges.name
    }
  }
}

resource "aws_cloudwatch_log_group" "network_api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.network_api.function_name}"
  retention_in_days = 14
}

# 3. route_api Lambda
resource "aws_lambda_function" "route_api" {
  filename         = data.archive_file.route_api_zip.output_path
  function_name    = "${local.name_prefix}-route-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.route_api_zip.output_base64sha256

  environment {
    variables = {
      NETWORK_EDGES_TABLE = aws_dynamodb_table.network_edges.name
    }
  }
}

resource "aws_cloudwatch_log_group" "route_api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.route_api.function_name}"
  retention_in_days = 14
}

# 4. legacy_simulator Lambda
resource "aws_lambda_function" "legacy_simulator" {
  filename         = data.archive_file.legacy_simulator_zip.output_path
  function_name    = "${local.name_prefix}-legacy-simulator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.legacy_simulator_zip.output_base64sha256

  environment {
    variables = {
      EVENTS_TABLE = aws_dynamodb_table.events.name
    }
  }
}

resource "aws_cloudwatch_log_group" "legacy_simulator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.legacy_simulator.function_name}"
  retention_in_days = 14
}

# 5. event_processor Lambda
resource "aws_lambda_function" "event_processor" {
  filename         = data.archive_file.event_processor_zip.output_path
  function_name    = "${local.name_prefix}-event-processor"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.event_processor_zip.output_base64sha256

  environment {
    variables = {
      EVENTS_TABLE    = aws_dynamodb_table.events.name
      SHIPMENTS_TABLE = aws_dynamodb_table.shipments.name
    }
  }
}

resource "aws_cloudwatch_log_group" "event_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.event_processor.function_name}"
  retention_in_days = 14
}

# 6. sync_api Lambda
resource "aws_lambda_function" "sync_api" {
  filename         = data.archive_file.sync_api_zip.output_path
  function_name    = "${local.name_prefix}-sync-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.sync_api_zip.output_base64sha256

  environment {
    variables = {
      EVENTS_TABLE = aws_dynamodb_table.events.name
    }
  }
}

resource "aws_cloudwatch_log_group" "sync_api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.sync_api.function_name}"
  retention_in_days = 14
}
