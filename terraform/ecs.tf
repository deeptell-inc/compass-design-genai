# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role with EFS permissions
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_role_policy" {
  name = "${var.project_name}-ecs-task-role-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticfilesystem:CreateAccessPoint",
          "elasticfilesystem:CreateFileSystem",
          "elasticfilesystem:CreateMountTarget",
          "elasticfilesystem:DescribeAccessPoints",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:TagResource"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "mysql" {
  name              = "/ecs/${var.project_name}-mysql"
  retention_in_days = 7
}

# ECS Task Definition - MySQL
resource "aws_ecs_task_definition" "mysql" {
  family                   = "${var.project_name}-mysql"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  volume {
    name = "mysql-data"
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.mysql_data.id
      root_directory = "/"
    }
  }

  container_definitions = jsonencode([
    {
      name  = "mysql"
      image = "mysql:8.0"
      portMappings = [
        {
          containerPort = 3306
          protocol      = "tcp"
        }
      ]
      essential = true
      mountPoints = [
        {
          sourceVolume  = "mysql-data"
          containerPath = "/var/lib/mysql"
        }
      ]
      healthCheck = {
        command = ["CMD", "mysqladmin", "ping", "-h", "localhost"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.mysql.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "MYSQL_ROOT_PASSWORD"
          value = "compass_root_password"
        },
        {
          name  = "MYSQL_DATABASE"
          value = "compass_db"
        },
        {
          name  = "MYSQL_USER"
          value = "compass_user"
        },
        {
          name  = "MYSQL_PASSWORD"
          value = "compass_password"
        }
      ]
    }
  ])

  tags = {
    Name        = "${var.project_name}-mysql-task"
    Environment = var.environment
  }
}

# ECS Task Definition - Frontend
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:latest"
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "VITE_API_BASE_URL"
          value = "http://${aws_lb.main.dns_name}:3002"
        }
      ]
    }
  ])

  tags = {
    Name        = "${var.project_name}-frontend-task"
    Environment = var.environment
  }
}

# ECS Task Definition - Backend
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3002
          protocol      = "tcp"
        }
      ]
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3002"
        },
        {
          name  = "DATABASE_URL"
          value = "mysql://compass_user:compass_password@mysql.${var.project_name}.local:3306/compass_db"
        },
        {
          name  = "DB_HOST"
          value = "mysql.${var.project_name}.local"
        },
        {
          name  = "DB_USER"
          value = "compass_user"
        },
        {
          name  = "DB_PASSWORD"
          value = "compass_password"
        },
        {
          name  = "DB_NAME"
          value = "compass_db"
        },
        {
          name  = "JWT_SECRET"
          value = "your-super-secret-jwt-key-change-this-in-production"
        },
        {
          name  = "CORS_ORIGIN"
          value = "http://${aws_lb.main.dns_name}"
        }
      ]
    }
  ])

  tags = {
    Name        = "${var.project_name}-backend-task"
    Environment = var.environment
  }
}

# ECS Service - MySQL
resource "aws_ecs_service" "mysql" {
  name            = "${var.project_name}-mysql-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.mysql.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.web.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.mysql.arn
  }

  depends_on = [aws_efs_mount_target.mysql_data_1, aws_efs_mount_target.mysql_data_2]

  tags = {
    Name        = "${var.project_name}-mysql-service"
    Environment = var.environment
  }
}

# Service Discovery for MySQL
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.project_name}.local"
  description = "Private DNS namespace for ${var.project_name}"
  vpc         = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-dns-namespace"
    Environment = var.environment
  }
}

resource "aws_service_discovery_service" "mysql" {
  name = "mysql"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  tags = {
    Name        = "${var.project_name}-mysql-discovery"
    Environment = var.environment
  }
}

# ECS Service - Frontend
resource "aws_ecs_service" "frontend" {
  name            = "${var.project_name}-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.web.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nlb_frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.frontend, aws_lb_listener.nlb_frontend]

  tags = {
    Name        = "${var.project_name}-frontend-service"
    Environment = var.environment
  }
}

# ECS Service - Backend
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.web.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3002
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nlb_backend.arn
    container_name   = "backend"
    container_port   = 3002
  }

  depends_on = [aws_lb_listener.backend, aws_ecs_service.mysql]

  tags = {
    Name        = "${var.project_name}-backend-service"
    Environment = var.environment
  }
} 