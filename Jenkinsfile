pipeline {
    agent any

    environment {
    DOCKER_HUB_REPO = 'ameyrane05/quiz-portal'
    REGISTRY_CREDENTIALS_ID = 'docker-hub-credentials'
    DB_CREDENTIALS_ID = 'mysql-db-credentials'
    APP_CONTAINER_NAME = 'quiz-portal-app'
}

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo 'Building application and running unit tests...'
                sh 'mvn clean test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }

        stage('Package App') {
            steps {
                echo 'Packaging application into executable JAR...'
                sh 'mvn package -DskipTests'
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo 'Scanning code artifact vulnerabilities...'
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL ${DOCKER_HUB_REPO}:latest || true'
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    echo 'Building and pushing Docker image to registry...'
                    docker.withRegistry('https://index.docker.io/v1/', REGISTRY_CREDENTIALS_ID) {
                        def appImage = docker.build("${DOCKER_HUB_REPO}:${BUILD_NUMBER}")
                        appImage.push()
                        appImage.push("latest")
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(credentialsId: DB_CREDENTIALS_ID, usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS')]) {
                    echo 'Deploying application container...'
                    sh """
                        docker stop ${APP_CONTAINER_NAME} || true
                        docker rm ${APP_CONTAINER_NAME} || true

                        docker run -d \
                          --name ${APP_CONTAINER_NAME} \
                          --network quiz-network \
                          -p 8080:8080 \
                          -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql-db:3306/quizdb?useSSL=false&allowPublicKeyRetrieval=true \
                          -e SPRING_DATASOURCE_USERNAME=\${DB_USER} \
                          -e SPRING_DATASOURCE_PASSWORD=\${DB_PASS} \
                          ${DOCKER_HUB_REPO}:${BUILD_NUMBER}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline finished successfully! Version #${BUILD_NUMBER} is now live."
        }
        failure {
            echo "Pipeline failed at build/test stage! Deployment aborted. Working version remains active."
        }
    }
}
