#!/bin/bash

# COMPASS Design GenAI - AWS Infrastructure Destruction Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
PROJECT_NAME="compass-design-genai"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

configure_aws() {
    log_info "Configuring AWS credentials..."
    
    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    export AWS_DEFAULT_REGION=$AWS_REGION
    
    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    aws configure set default.region $AWS_REGION
    
    log_success "AWS credentials configured"
}

stop_ecs_services() {
    log_info "Stopping ECS services..."
    
    # Set desired count to 0 for both services
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-frontend-service \
        --desired-count 0 \
        --region $AWS_REGION 2>/dev/null || true
    
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-backend-service \
        --desired-count 0 \
        --region $AWS_REGION 2>/dev/null || true
    
    log_info "Waiting for services to stop..."
    sleep 30
    
    log_success "ECS services stopped"
}

empty_ecr_repositories() {
    log_info "Emptying ECR repositories..."
    
    # Delete all images from frontend repository
    aws ecr list-images \
        --repository-name $PROJECT_NAME-frontend \
        --region $AWS_REGION \
        --query 'imageIds[*]' \
        --output json | \
    jq '.[] | select(has("imageTag"))' | \
    jq -s '.' | \
    aws ecr batch-delete-image \
        --repository-name $PROJECT_NAME-frontend \
        --region $AWS_REGION \
        --image-ids file:///dev/stdin 2>/dev/null || true
    
    # Delete all images from backend repository
    aws ecr list-images \
        --repository-name $PROJECT_NAME-backend \
        --region $AWS_REGION \
        --query 'imageIds[*]' \
        --output json | \
    jq '.[] | select(has("imageTag"))' | \
    jq -s '.' | \
    aws ecr batch-delete-image \
        --repository-name $PROJECT_NAME-backend \
        --region $AWS_REGION \
        --image-ids file:///dev/stdin 2>/dev/null || true
    
    log_success "ECR repositories emptied"
}

terraform_destroy() {
    log_info "Destroying Terraform infrastructure..."
    
    cd terraform
    terraform destroy -auto-approve -var="aws_access_key=$AWS_ACCESS_KEY_ID" -var="aws_secret_key=$AWS_SECRET_ACCESS_KEY"
    cd ..
    
    log_success "Infrastructure destroyed successfully"
}

cleanup_local_files() {
    log_info "Cleaning up local files..."
    
    # Remove environment files
    rm -f compass-design-bridge/.env
    rm -f compass-design-bridge-server/.env
    
    # Remove Terraform state files (optional)
    read -p "Do you want to remove Terraform state files? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f terraform/terraform.tfstate*
        rm -rf terraform/.terraform/
        log_success "Terraform state files removed"
    fi
    
    log_success "Local cleanup completed"
}

main() {
    log_warning "⚠️  DANGER: This will completely destroy your AWS infrastructure!"
    log_warning "This action is IRREVERSIBLE and will delete:"
    echo "  - ECS Cluster and Services"
    echo "  - Application Load Balancer"
    echo "  - RDS Database (including all data)"
    echo "  - VPC and all networking components"
    echo "  - ECR repositories and all container images"
    echo "  - CloudWatch log groups"
    echo ""
    
    read -p "Are you absolutely sure you want to proceed? Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Destruction cancelled by user"
        exit 0
    fi
    
    log_info "Starting infrastructure destruction..."
    
    configure_aws
    stop_ecs_services
    empty_ecr_repositories
    terraform_destroy
    cleanup_local_files
    
    log_success "🎉 Infrastructure successfully destroyed!"
    log_info "All AWS resources have been removed."
}

main "$@" 