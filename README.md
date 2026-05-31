# 🚀 DevOps Multi-Tier Control Center

A production-style multi-tier microservices application built to demonstrate modern DevOps practices, distributed system design, containerization, CI/CD automation, asynchronous processing, caching, and load balancing.

---

# 🏗️ Architecture

Frontend (React)
↓
NGINX Reverse Proxy
↓
API Gateway (Node.js)
↓
├── Auth Service
├── Task Service (Replica 1)
├── Task Service (Replica 2)
└── Worker Service
↓
PostgreSQL + Redis + RabbitMQ

---

# ⚡ Tech Stack

* React
* Node.js
* Express.js
* PostgreSQL
* Redis
* RabbitMQ
* NGINX
* Docker
* Docker Compose
* Jenkins
* GitHub

---

# ✨ Features

### Authentication

* User registration
* User login
* JWT-based authentication
* Role support

### Task Management

* Create tasks
* Retrieve tasks
* Multi-instance task services
* NGINX load balancing

### Asynchronous Report Processing

* Report generation requests
* RabbitMQ message queue
* Worker service processing
* Automatic status updates

### Caching Layer

* Redis integration
* Cache-first architecture
* Database fallback

### Metrics & Monitoring

* Request metrics
* Report metrics
* System statistics dashboard
* Health monitoring

### Audit System

* Audit log storage
* Activity tracking

---

# 🐳 Dockerized Infrastructure

All services run inside Docker containers:

* frontend
* nginx
* gateway
* auth-service
* task-service-1
* task-service-2
* worker-service
* postgres
* redis
* rabbitmq

---

# 🔄 CI/CD Pipeline

Jenkins Pipeline:

1. Checkout source code from GitHub
2. Build Docker images
3. Deploy services using Docker Compose
4. Run automated validation tests

Pipeline Stages:

* Checkout
* Build
* Deploy
* Test

---

# 🧪 End-to-End Validation

The application includes automated validation proving:

* API Gateway communication
* PostgreSQL connectivity
* Redis connectivity
* RabbitMQ messaging
* Worker processing
* Database persistence

Example verification:

```bash
curl -s -X POST http://localhost/api/reports/generate && \
sleep 3 && \
docker exec postgres psql -U devops -d devopsdb -c \
"select report_name,status from reports order by id desc limit 1;"
```

Expected Output:

```text
Generated Report XXXXX | completed
```

This proves the complete workflow:

Client
→ NGINX
→ Gateway
→ RabbitMQ
→ Worker
→ PostgreSQL

---

# 🚀 Run Locally

```bash
git clone https://github.com/hack3rinsider/Devops-Multi-Tier-App.git

cd Devops-Multi-Tier-App

docker compose up -d
```

Access:

Frontend:
http://localhost

RabbitMQ Dashboard:
http://localhost:15672

---

# 🎯 DevOps Concepts Demonstrated

* Microservices Architecture
* Reverse Proxy
* Load Balancing
* Message Queues
* Distributed Systems
* CI/CD Pipelines
* Containerization
* Service Discovery
* Caching Strategies
* Background Job Processing

---

# 👨‍💻 Author

Prashant Kaushik

GitHub:
https://github.com/hack3rinsider
# webhook test
webhook test Mon Jun  1 12:56:39 PM IST 2026
webhook test Mon Jun  1 01:00:16 PM IST 2026

## Development Notes - May 30

## Development Notes - May 31
