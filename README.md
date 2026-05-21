📌 About App

DevOps Multi-Tier Control Center is a full-stack distributed system built to simulate real-world cloud-native microservices architecture.

It demonstrates how modern applications are designed, deployed, and monitored using DevOps principles.

⚙️ Architecture Overview

The system consists of multiple interconnected services:

Frontend Dashboard (React) – UI for monitoring system health, metrics, logs, and reports
API Gateway (Node.js + Express) – Central entry point routing all requests
Auth Service – Handles user authentication and authorization
Task Service – Manages task creation and lifecycle
Worker Service – Processes background jobs asynchronously
PostgreSQL – Primary relational database
Redis – Caching layer for performance optimization
RabbitMQ – Message broker for async job processing
NGINX – Reverse proxy and load balancer

🚀 Key Features
🔐 User Authentication system (Login/Register)
📊 Real-time system health monitoring
📈 Metrics tracking (requests, cache hits/misses, jobs)
⚡ Redis caching with fallback to database
🧵 RabbitMQ-based background job processing
🔄 Load balancing across multiple task service instances
📜 Audit logs for system actions
📦 Dockerized microservices architecture
🎯 Purpose of Project

This project is designed for:

DevOps learning and demonstration
Microservices architecture understanding
Docker + NGINX + Message Queue integration practice
System design interview showcase
🧠 What it demonstrates
Container orchestration using Docker Compose
Service-to-service communication
Fault tolerance (Redis down, worker failure handling)
Load balancing and scaling simulation
Observability through metrics and logs
🏁 Summary

This is a production-style DevOps simulation project that replicates how real-world backend systems operate in cloud environments like AWS or Kubernetes-based infrastructure.
