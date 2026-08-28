# Assume Role policy document for Lambda functions
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_exec" {
  name               = "${local.name_prefix}-lambda-exec-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# Policy Document for CloudWatch Logs & DynamoDB Access (Least Privilege)
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid    = "DynamoDBTableAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      aws_dynamodb_table.shipments.arn,
      "${aws_dynamodb_table.shipments.arn}/*",
      aws_dynamodb_table.network_edges.arn,
      "${aws_dynamodb_table.network_edges.arn}/*",
      aws_dynamodb_table.events.arn,
      "${aws_dynamodb_table.events.arn}/*"
    ]
  }

  statement {
    sid       = "IoTPublish"
    effect    = "Allow"
    actions   = ["iot:Publish"]
    resources = ["arn:aws:iot:*:*:topic/logistics/events"]
  }
}

resource "aws_iam_role_policy" "lambda_policy_attachment" {
  name   = "${local.name_prefix}-lambda-policy"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}
