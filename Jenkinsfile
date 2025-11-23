pipeline {
    agent any

    environment {
        // Credentials ID stored in Jenkins settings
        DOCKER_CREDS = credentials('docker-hub-credentials')
        DOCKER_HUB_USER = 'your-dockerhub-username' 
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'cd backend && npm install'
                sh 'cd frontend/invoice-generator && npm install'
            }
        }

        stage('Test') {
            steps {
                echo 'Running Backend Tests...'
                // Setting a dummy secret for testing
                sh 'cd backend && export JWT_SECRET=test && npm test'
                
                echo 'Running Frontend Unit Tests...'
                sh 'cd frontend/invoice-generator && npm run test:unit'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building Backend Image...'
                    sh "docker build -t ${DOCKER_HUB_USER}/invoice-backend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/invoice-backend:latest ./backend"
                    
                    echo 'Building Frontend Image...'
                    sh "docker build -t ${DOCKER_HUB_USER}/invoice-frontend:${IMAGE_TAG} -t ${DOCKER_HUB_USER}/invoice-frontend:latest ./frontend/invoice-generator"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo 'Logging into Docker Hub...'
                    sh "echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin"
                    
                    echo 'Pushing Images...'
                    sh "docker push ${DOCKER_HUB_USER}/invoice-backend:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_HUB_USER}/invoice-backend:latest"
                    
                    sh "docker push ${DOCKER_HUB_USER}/invoice-frontend:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_HUB_USER}/invoice-frontend:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                // In a real scenario, this would SSH into a server. 
                // For this example, we simulate deployment by starting containers locally.
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            // Clean up workspace to save space
            cleanWs()
            // Logout from docker to clean up credentials
            sh 'docker logout'
        }
        success {
            echo 'Pipeline successfully completed.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}