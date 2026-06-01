pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/hack3rinsider/Devops-Multi-Tier-App.git'
            }
        }

        stage('Build') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                docker rm -f \
                postgres \
                auth-service \
                gateway \
                task-service-1 \
                task-service-2 \
                worker-service \
                frontend \
                nginx \
                redis \
                rabbitmq || true

                docker-compose down -v || true

                docker volume rm testpipeline_postgres_data || true
                docker volume rm testpipeline_redis_data || true
                docker volume rm testpipeline_rabbitmq_data || true

                docker-compose up -d
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                chmod +x test.sh
                ./test.sh
                '''
            }
        }
    }
}
