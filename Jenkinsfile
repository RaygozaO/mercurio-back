pipeline {
    agent any

    environment {
        BACKEND_DIR = "." // raíz del repo
        DEPLOY_DIR = "/var/www/mercurio-back"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'npm install'
                }
            }
        }
        stage('Deploy') {
            steps {
                sh "rsync -avz --exclude='node_modules' ${BACKEND_DIR}/ ${DEPLOY_DIR}/"
                sh "pm2 reload mercurio-back || pm2 start ${DEPLOY_DIR}/app.js --name mercurio-back"
            }
        }
    }
}
