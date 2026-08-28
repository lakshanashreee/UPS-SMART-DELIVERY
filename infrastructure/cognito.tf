resource "aws_cognito_user_pool" "pool" {
  name = "${local.name_prefix}-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  auto_verified_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }

  tags = {
    Name = "${local.name_prefix}-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "spa_client" {
  name         = "${local.name_prefix}-spa-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_group" "admin" {
  name         = "ADMIN"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Admin group with administrative access to logistics tower"
}

resource "aws_cognito_user_group" "operator" {
  name         = "OPERATOR"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Operator group with standard operations access"
}

# Provision Default Admin User in Cognito User Pool
resource "aws_cognito_user" "admin_user" {
  user_pool_id = aws_cognito_user_pool.pool.id
  username     = "admin@ups.com"

  attributes = {
    email          = "admin@ups.com"
    email_verified = "true"
  }

  password = "UPSAdmin#2026"
}
