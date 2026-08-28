variable "aws_region" {
  type        = string
  description = "AWS Region for deployment"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name tag"
  default     = "logistics-control-tower"
}

variable "environment" {
  type        = string
  description = "Environment stage (dev, staging, prod)"
  default     = "dev"
}
