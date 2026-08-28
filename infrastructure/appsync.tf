# AWS AppSync Events / GraphQL API Infrastructure
resource "aws_appsync_graphql_api" "events_api" {
  name                = "${local.name_prefix}-appsync-events"
  authentication_type = "API_KEY"

  schema = <<EOF
type ShipmentUpdate {
  type: String!
  shipmentId: String!
  latitude: Float!
  longitude: Float!
  status: String!
  riskScore: Float!
  riskLevel: String!
  eta: String
  etaMinutes: Int
  routePath: [String]
  delayMinutes: Int
  timestamp: String
}

type Query {
  getShipmentStatus(shipmentId: String!): ShipmentUpdate
}

type Mutation {
  publishShipmentUpdate(input: String!): ShipmentUpdate
}

type Subscription {
  onShipmentUpdated(channel: String!): ShipmentUpdate
    @aws_subscribe(mutations: ["publishShipmentUpdate"])
}
EOF

  tags = {
    Name = "${local.name_prefix}-appsync-events"
  }
}

resource "aws_appsync_api_key" "events_api_key" {
  api_id  = aws_appsync_graphql_api.events_api.id
  expires = timeadd(timestamp(), "4320h") # 180 days
}

output "appsync_events_endpoint" {
  value       = aws_appsync_graphql_api.events_api.uris["GRAPHQL"]
  description = "AWS AppSync Events GraphQL / Realtime WebSocket Endpoint"
}

output "appsync_events_api_key" {
  value       = aws_appsync_api_key.events_api_key.key
  description = "AWS AppSync API Key"
  sensitive   = true
}
