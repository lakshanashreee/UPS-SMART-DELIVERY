terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      UseCase     = "2026-GH-CT-02"
    }
  }
}

# Local variables for resource naming
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
