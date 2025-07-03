#!/bin/bash

# COMPASS Design GenAI - AWS Deployment Script
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

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

configure_aws() {
    log_info "Configuring AWS credentials..."
    
    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
    export AWS_DEFAULT_REGION=$AWS_REGION
    
    # Configure AWS CLI
    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    aws configure set default.region $AWS_REGION
    
    log_success "AWS credentials configured"
}

create_env_files() {
    log_info "Creating environment files..."
    
    # Backend .env
    cat > compass-design-bridge-server/.env << EOF
NODE_ENV=production
PORT=3002
DATABASE_URL=mysql://compass_user:compass_password@mysql:3306/compass_db
DB_HOST=mysql
DB_USER=compass_user
DB_PASSWORD=compass_password
DB_NAME=compass_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
FIGMA_ACCESS_TOKEN=your-figma-access-token
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
MCP_PORT=3003
EOF

    # Frontend .env
    cat > compass-design-bridge/.env << EOF
VITE_API_BASE_URL=http://localhost:3002
VITE_APP_TITLE=COMPASS Design GenAI
VITE_APP_DESCRIPTION=AI-Powered Design Platform
EOF

    log_success "Environment files created"
}

terraform_init_and_plan() {
    log_info "Initializing and planning Terraform..."
    
    cd terraform
    terraform init
    terraform plan -var="aws_access_key=$AWS_ACCESS_KEY_ID" -var="aws_secret_key=$AWS_SECRET_ACCESS_KEY"
    cd ..
    
    log_success "Terraform initialized and planned"
}

terraform_apply() {
    log_info "Applying Terraform configuration..."
    
    cd terraform
    terraform apply -auto-approve -var="aws_access_key=$AWS_ACCESS_KEY_ID" -var="aws_secret_key=$AWS_SECRET_ACCESS_KEY"
    cd ..
    
    log_success "Infrastructure created successfully"
}

get_ecr_repositories() {
    log_info "Getting ECR repository URLs..."
    
    cd terraform
    FRONTEND_ECR_URL=$(terraform output -raw ecr_frontend_url)
    BACKEND_ECR_URL=$(terraform output -raw ecr_backend_url)
    cd ..
    
    echo "Frontend ECR: $FRONTEND_ECR_URL"
    echo "Backend ECR: $BACKEND_ECR_URL"
}

build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $FRONTEND_ECR_URL
    
    # Build and push frontend
    log_info "Building frontend image..."
    cd compass-design-bridge
    docker build -t $PROJECT_NAME-frontend .
    docker tag $PROJECT_NAME-frontend:latest $FRONTEND_ECR_URL:latest
    docker push $FRONTEND_ECR_URL:latest
    cd ..
    
    # Build and push backend
    log_info "Building backend image..."
    cd compass-design-bridge-server
    docker build -t $PROJECT_NAME-backend .
    docker tag $PROJECT_NAME-backend:latest $BACKEND_ECR_URL:latest
    docker push $BACKEND_ECR_URL:latest
    cd ..
    
    log_success "Docker images built and pushed successfully"
}

update_ecs_services() {
    log_info "Updating ECS services..."
    
    # Force new deployment for all services
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-mysql-service \
        --force-new-deployment \
        --region $AWS_REGION
    
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-frontend-service \
        --force-new-deployment \
        --region $AWS_REGION
    
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $PROJECT_NAME-backend-service \
        --force-new-deployment \
        --region $AWS_REGION
    
    log_success "ECS services updated"
}

get_deployment_urls() {
    log_info "Getting deployment URLs..."
    
    cd terraform
    LOAD_BALANCER_DNS=$(terraform output -raw load_balancer_dns)
    FRONTEND_URL="http://$LOAD_BALANCER_DNS"
    BACKEND_URL="http://$LOAD_BALANCER_DNS:3002"
    cd ..
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "===================="
    echo "Frontend URL: $FRONTEND_URL"
    echo "Backend URL: $BACKEND_URL"
    echo "Backend Health: $BACKEND_URL/health"
    echo ""
    echo "📊 MySQL Database running in ECS with persistent EFS storage"
    echo "Note: It may take a few minutes for all services to become fully available."
    echo "The MySQL service will start first, followed by the backend, then frontend."
}

# Main deployment flow
main() {
    log_info "Starting COMPASS Design GenAI deployment to AWS with MySQL..."
    
    check_prerequisites
    configure_aws
    create_env_files
    terraform_init_and_plan
    
    # Ask for confirmation before applying
    echo ""
    log_warning "This will create AWS resources that may incur charges."
    log_info "Resources to be created:"
    echo "  - ECS Fargate Cluster with MySQL, Backend, and Frontend services"
    echo "  - EFS for MySQL data persistence"
    echo "  - Application Load Balancer"
    echo "  - VPC with public subnets"
    echo "  - ECR repositories"
    echo "  - CloudWatch logs"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform_apply
        get_ecr_repositories
        build_and_push_images
        update_ecs_services
        get_deployment_urls
    else
        log_info "Deployment cancelled by user"
        exit 0
    fi
}

# Run main function
main "$@" 