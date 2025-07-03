#!/bin/bash

# COMPASS Design GenAI - Dependency Installation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="ubuntu"
        elif [ -f /etc/redhat-release ]; then
            OS="rhel"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    
    log_info "Detected OS: $OS"
}

install_aws_cli() {
    log_info "Installing AWS CLI..."
    
    case $OS in
        ubuntu)
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            rm -rf awscliv2.zip aws/
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install awscli
            else
                curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
                sudo installer -pkg AWSCLIV2.pkg -target /
                rm AWSCLIV2.pkg
            fi
            ;;
        windows)
            log_error "Please install AWS CLI manually from: https://aws.amazon.com/cli/"
            exit 1
            ;;
        *)
            log_error "Unsupported OS for automatic AWS CLI installation"
            exit 1
            ;;
    esac
    
    log_success "AWS CLI installed successfully"
}

install_terraform() {
    log_info "Installing Terraform..."
    
    TERRAFORM_VERSION="1.6.6"
    
    case $OS in
        ubuntu)
            wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            sudo mv terraform /usr/local/bin/
            rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install terraform
            else
                wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_darwin_amd64.zip
                unzip terraform_${TERRAFORM_VERSION}_darwin_amd64.zip
                sudo mv terraform /usr/local/bin/
                rm terraform_${TERRAFORM_VERSION}_darwin_amd64.zip
            fi
            ;;
        windows)
            log_error "Please install Terraform manually from: https://terraform.io/downloads"
            exit 1
            ;;
        *)
            log_error "Unsupported OS for automatic Terraform installation"
            exit 1
            ;;
    esac
    
    log_success "Terraform installed successfully"
}

install_docker() {
    log_info "Installing Docker..."
    
    case $OS in
        ubuntu)
            # Update package index
            sudo apt-get update
            
            # Install prerequisite packages
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Add Docker repository
            echo \
              "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
              $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
            
            # Add user to docker group
            sudo usermod -aG docker $USER
            ;;
        macos)
            log_info "Please install Docker Desktop for Mac from: https://www.docker.com/products/docker-desktop"
            ;;
        windows)
            log_info "Please install Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop"
            ;;
        *)
            log_error "Unsupported OS for automatic Docker installation"
            exit 1
            ;;
    esac
    
    log_success "Docker installation completed"
}

check_existing_tools() {
    log_info "Checking for existing tools..."
    
    if command -v aws &> /dev/null; then
        log_success "AWS CLI is already installed"
        AWS_INSTALLED=true
    else
        AWS_INSTALLED=false
    fi
    
    if command -v terraform &> /dev/null; then
        log_success "Terraform is already installed"
        TERRAFORM_INSTALLED=true
    else
        TERRAFORM_INSTALLED=false
    fi
    
    if command -v docker &> /dev/null; then
        log_success "Docker is already installed"
        DOCKER_INSTALLED=true
    else
        DOCKER_INSTALLED=false
    fi
}

main() {
    log_info "Starting dependency installation for COMPASS Design GenAI..."
    
    detect_os
    check_existing_tools
    
    if [ "$AWS_INSTALLED" = false ]; then
        install_aws_cli
    fi
    
    if [ "$TERRAFORM_INSTALLED" = false ]; then
        install_terraform
    fi
    
    if [ "$DOCKER_INSTALLED" = false ]; then
        install_docker
    fi
    
    log_success "All dependencies installed successfully!"
    log_info "Please restart your terminal or run 'source ~/.bashrc' to ensure all tools are in your PATH"
    
    if [ "$OS" = "ubuntu" ] && [ "$DOCKER_INSTALLED" = false ]; then
        log_info "You may need to log out and back in for Docker group permissions to take effect"
    fi
}

main "$@" 