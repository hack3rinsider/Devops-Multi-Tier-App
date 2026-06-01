#!/bin/bash

set -e

echo "=== CONTAINERS ==="
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'postgres|redis|rabbitmq|auth-service|task-service-1|task-service-2|worker-service|gateway|nginx|frontend'

echo -e "\n=== FRONTEND ==="
curl -I http://localhost | head -1

echo -e "\n=== POSTGRES ==="
docker exec postgres pg_isready -U devops -d devopsdb

echo -e "\n=== REDIS ==="
docker exec redis redis-cli ping

echo -e "\n=== RABBITMQ ==="
docker exec rabbitmq rabbitmq-diagnostics ping | tail -1

echo -e "\n=== AUTH SERVICE ==="
docker logs auth-service --tail 50 | grep "PostgreSQL connected"

echo -e "\n=== TASK SERVICE 1 ==="
docker logs task-service-1 --tail 50 | grep "RabbitMQ Connected"

echo -e "\n=== TASK SERVICE 2 ==="
docker logs task-service-2 --tail 50 | grep "RabbitMQ Connected"

echo -e "\n=== GATEWAY ==="
docker logs gateway --tail 50 | grep "gateway running"

echo -e "\n✅ FULL MULTI-TIER STACK HEALTH CHECK PASSED"
