resource "aws_dynamodb_table" "shipments" {
  name         = "logistics_shipments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shipmentId"

  attribute {
    name = "shipmentId"
    type = "S"
  }

  tags = {
    Name = "${local.name_prefix}-shipments"
  }
}

resource "aws_dynamodb_table" "network_edges" {
  name         = "logistics_network_edges"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "edgeId"

  attribute {
    name = "edgeId"
    type = "S"
  }

  tags = {
    Name = "${local.name_prefix}-network-edges"
  }
}

resource "aws_dynamodb_table" "events" {
  name         = "logistics_events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"
  range_key    = "timestamp"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = {
    Name = "${local.name_prefix}-events"
  }
}
