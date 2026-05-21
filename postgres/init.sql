CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255),
    status VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) UNIQUE,
    metric_value BIGINT DEFAULT 0
);

INSERT INTO users(username,password,role)
VALUES
('admin','$2b$10$9fB4dSg1TjP4S0oB4D4Y4u5fM3L9S6gYk7M8P9K0L1N2O3P4Q5R6S','admin'),
('john','demo','user'),
('alice','demo','user'),
('bob','demo','user'),
('emma','demo','user'),
('tom','demo','user'),
('jerry','demo','user'),
('mike','demo','user'),
('sara','demo','user'),
('david','demo','user')
ON CONFLICT DO NOTHING;

INSERT INTO tasks(title,status)
VALUES
('Docker Setup','completed'),
('Redis Cache Demo','pending'),
('RabbitMQ Integration','pending'),
('Create Dashboard','completed'),
('Health Checks','completed'),
('Metrics Service','pending'),
('Database Explorer','completed'),
('JWT Authentication','completed'),
('Worker Service','pending'),
('Load Balancer Test','pending'),
('Seed Data Creation','completed'),
('Task Monitoring','pending'),
('API Gateway','completed'),
('Frontend Routing','completed'),
('Audit Logging','pending'),
('Performance Test','pending'),
('Cache Warmup','completed'),
('Queue Processing','pending'),
('Container Health','completed'),
('Final Demo','pending');

INSERT INTO reports(report_name,status)
VALUES
('System Health','completed'),
('Queue Metrics','completed'),
('Redis Stats','completed'),
('Request Metrics','completed'),
('Task Summary','completed'),
('Container Status','completed'),
('Worker Report','completed'),
('Database Audit','completed'),
('Performance Metrics','completed'),
('Daily Report','completed');

INSERT INTO audit_logs(action,details)
VALUES
('LOGIN','Admin logged in'),
('TASK_CREATE','Task created'),
('CACHE_HIT','Redis cache used'),
('CACHE_MISS','Database queried'),
('QUEUE_JOB','Report queued'),
('WORKER_DONE','Job processed'),
('HEALTH_CHECK','Service healthy'),
('TASK_DELETE','Task removed'),
('REPORT_CREATED','Report generated'),
('METRIC_UPDATE','Counter incremented'),
('AUTH_VERIFY','JWT verified'),
('DB_QUERY','Users fetched'),
('REDIS_CLEAR','Cache cleared'),
('REDIS_WARM','Cache warmed'),
('LB_TEST','Load balancing tested'),
('SERVICE_START','Container started'),
('SERVICE_STOP','Container stopped'),
('QUEUE_CONSUME','Worker consumed job'),
('REPORT_SAVE','Saved report'),
('API_REQUEST','Gateway request');

INSERT INTO metrics(metric_name,metric_value)
VALUES
('total_requests',0),
('cache_hits',0),
('cache_misses',0),
('tasks_created',0),
('jobs_processed',0),
('failed_jobs',0),
('reports_generated',0)
ON CONFLICT(metric_name)
DO NOTHING;
