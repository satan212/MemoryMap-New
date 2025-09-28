// Save this file as 'Jenkinsfile' in the root of your Git repository.
pipeline {
    agent any

    tools {
        // Ensures the specified Node.js version (configured in Jenkins Tools) is used
        nodejs "Node18"
    }

    environment {
        // --- Application Configuration ---
        PYTHON = "python3"
        BACKEND_PORT = "3000"
        FRONTEND_PORT = "4200"
        
        // --- Paths (Relative to the Jenkins Workspace Root) ---
        BACKEND_DIR = "BackEnd"
        FRONTEND_DIR = "FrontEnd"
        TESTING_DIR = "Testing"
        VENV_DIR = "venv" 
    }

    stages {
        
        stage('Checkout & Setup') {
            steps {
                // 🚨 ACTION REQUIRED: Replace with your actual Git details 🚨
                git branch: 'main', url: 'https://github.com/<your-username>/<repo-name>.git'
                echo 'Git Checkout Complete.'
            }
        }
        
        // ------------------------------------------------------------------------------------------------
        stage('Install Dependencies (Parallel)') {
            // Run Node dependencies (Backend & Frontend) and Python dependencies in parallel
            parallel {
                
                // --- Backend Setup Branch ---
                stage('Backend Install') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            echo 'Installing Backend Node dependencies...'
                            sh 'npm install'
                        }
                    }
                }
                
                // --- Frontend Setup Branch ---
                stage('Frontend Install') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo 'Installing Frontend Node dependencies...'
                            sh 'npm install'
                            // Only install Angular CLI globally if absolutely necessary for the ng serve command
                            sh 'npm install -g @angular/cli' 
                        }
                    }
                }
                
                // --- Python Setup Branch ---
                stage('Python Setup') {
                    steps {
                        echo 'Setting up Python Virtual Environment and tools...'
                        sh '''
                        // Create venv at the workspace root
                        python3 -m venv venv
                        . venv/bin/activate
                        // Install testing libraries
                        pip install pytest selenium webdriver-manager pytest-html
                        '''
                    }
                }
            } // end parallel
        }

        // ------------------------------------------------------------------------------------------------
        stage('Start Services (Parallel)') {
             // Run the backend and frontend startup commands in parallel
             parallel {
                
                // --- Start Backend Branch ---
                stage('Start Backend Service') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            echo "Starting Node Backend on port ${env.BACKEND_PORT}..."
                            sh "nohup node server.js > backend.log 2>&1 &"
                        }
                    }
                }
                
                // --- Start Frontend Branch ---
                stage('Start Frontend Service') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo "Starting Angular Frontend on port ${env.FRONTEND_PORT}..."
                            // ng serve starts the development server
                            sh "nohup ng serve --port ${env.FRONTEND_PORT} --host 0.0.0.0 > frontend.log 2>&1 &"
                        }
                    }
                }
            } // end parallel
        }
        
        // ------------------------------------------------------------------------------------------------
        stage('Wait for Apps & Run Tests') {
            steps {
                echo 'Waiting 30 seconds for services to become fully stable...'
                sh 'sleep 30'
                
                dir(env.TESTING_DIR) {
                    echo 'Activating Python Venv and executing Selenium tests...'
                    // Activate venv using the path relative to the Testing directory
                    sh '''
                    . ../venv/bin/activate
                    pytest --html=report.html --self-contained-html -v
                    '''
                }
            }
        }

        // ------------------------------------------------------------------------------------------------
        stage('Publish Test Report') {
            steps {
                echo 'Publishing HTML test report to Jenkins UI...'
                // Assumes 'report.html' is generated inside the 'Testing' directory
                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: env.TESTING_DIR,
                    reportFiles: 'report.html',
                    reportName: 'Selenium Test Report'
                ])
            }
        }
    }

    // ------------------------------------------------------------------------------------------------
    post {
        always {
            echo 'Cleanup: Killing background Node/Angular processes...'
            // Use '|| true' to ensure the pipeline doesn't fail if the processes already died.
            sh 'pkill -f "ng serve" || true'
            sh 'pkill -f "node server.js" || true'
            echo 'Cleanup complete.'
        }
    }
}