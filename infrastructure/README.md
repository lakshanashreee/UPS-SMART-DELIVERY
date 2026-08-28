# Infrastructure as Code — Terraform

This directory contains the Terraform configuration for the Logistics Control Tower AWS infrastructure in region `us-east-1`.

---

## 🏗️ Resources Overview

Future deployment will provision:
- **Amazon Cognito User Pool & Client**: User authentication.
- **Amazon DynamoDB**: Single-table storage for shipments, hubs, and telemetry logs.
- **AWS Lambda (Python 3.10)**: Rerouting engine and telemetry ingest handlers.
- **AWS API Gateway (HTTP API)**: RESTful endpoints for ingestion and sync.
- **AWS IoT Core**: MQTT topic rules for RFID scanner telemetry.
- **AppSync Events**: WebSocket subscriptions for realtime UI updates.
- **AWS CloudWatch**: Logging and monitoring dashboards.

---

## 🔒 Security Guidelines

1. **Credentials Management**:
   - Credentials MUST be supplied through AWS CLI (`aws configure`) or environment variables set by AWS CLI (`AWS_PROFILE`).
   - Never place secret keys in `.tfvars` or code files.
2. **IAM Roles**:
   - All Lambda and service roles follow the principle of least privilege.
   - AdministratorAccess roles are strictly prohibited.

---

## 🛠️ Terraform Commands

```bash
# Initialize working directory
terraform init -backend=false

# Format code according to standard
terraform fmt

# Validate syntax & configuration
terraform validate

# Plan deployment (when AWS CLI credentials are set)
terraform plan

# Apply deployment
terraform apply

# Destroy infrastructure safely
terraform destroy
```
