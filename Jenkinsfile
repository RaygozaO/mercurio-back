pipeline {
    agent any

    environment {
        BRANCH_NAME = 'main'
        BACKEND_DIR = "."
    }

    stages {
        stage('Setup Deploy Directory') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_DIR = "/var/www/mercurio-back"
                        env.PM2_APP_NAME = "mercurio-back"
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.DEPLOY_DIR = "/var/www/mercurio-back-dev"
                        env.PM2_APP_NAME = "mercurio-back-dev"
                    } else {
                        error "Branch '${env.BRANCH_NAME}' no tiene configuración de despliegue."
                    }
                }
            }
        }

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
                sh "pm2 reload ${PM2_APP_NAME} || pm2 start ${DEPLOY_DIR}/app.js --name ${PM2_APP_NAME}"
            }
        }
    }
}
