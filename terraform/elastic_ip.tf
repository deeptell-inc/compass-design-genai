# Elastic IPs for Network Load Balancer
resource "aws_eip" "nlb_1" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-nlb-eip-1"
    Environment = var.environment
  }
}

resource "aws_eip" "nlb_2" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-nlb-eip-2"
    Environment = var.environment
  }
}

# Network Load Balancer with Elastic IPs
resource "aws_lb" "nlb" {
  name               = "${var.project_name}-nlb"
  internal           = false
  load_balancer_type = "network"
  
  subnet_mapping {
    subnet_id     = aws_subnet.public_1.id
    allocation_id = aws_eip.nlb_1.id
  }
  
  subnet_mapping {
    subnet_id     = aws_subnet.public_2.id
    allocation_id = aws_eip.nlb_2.id
  }

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-nlb"
    Environment = var.environment
  }
}

# NLB Target Group for Frontend (HTTP)
resource "aws_lb_target_group" "nlb_frontend" {
  name     = "compass-nlb-frontend-tg"
  port     = 80
  protocol = "TCP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 6
    interval            = 30
    port                = "traffic-port"
    protocol            = "TCP"
  }

  tags = {
    Name        = "${var.project_name}-nlb-frontend-tg"
    Environment = var.environment
  }
}

# NLB Target Group for Backend (HTTP)
resource "aws_lb_target_group" "nlb_backend" {
  name     = "compass-nlb-backend-tg"
  port     = 3002
  protocol = "TCP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 6
    interval            = 30
    port                = "traffic-port"
    protocol            = "TCP"
  }

  tags = {
    Name        = "${var.project_name}-nlb-backend-tg"
    Environment = var.environment
  }
}

# NLB Listener for Frontend (Port 80)
resource "aws_lb_listener" "nlb_frontend" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = "80"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nlb_frontend.arn
  }
}

# NLB Listener for Backend (Port 3002)
resource "aws_lb_listener" "nlb_backend" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = "3002"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nlb_backend.arn
  }
} 