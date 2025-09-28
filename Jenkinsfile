// Save this file as 'Jenkinsfile' in the root of your Git repository.
pipeline {
    agent any

    tools {
        // Must match the name configured in Manage Jenkins -> Global Tool Configuration
        nodejs "Node22" 
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
        
        // --- Git URL FIX ---
        REPO_URL = 'https://github.com/satan212/MemoryMap-New'
    }

    stages {
        
        stage('Checkout & Setup') {
            steps {
                echo "Cloning repository: ${env.REPO_URL}"
                // FIX: Used correct repository URL from environment variable
                git branch: 'main', url: env.REPO_URL 
                echo 'Git Checkout Complete.'
            }
        }
        
        // ------------------------------------------------------------------------------------------------
        stage('Install Dependencies (Parallel)') {
            parallel {
                
                // --- Backend Setup Branch ---
                stage('Backend Install') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            echo 'Installing Backend Node dependencies...'
                            // FIX: Changed sh to bat for Windows execution
                            bat 'npm install'
                        }
                    }
                }
                
                // --- Frontend Setup Branch ---
                stage('Frontend Install') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo 'Installing Frontend Node dependencies...'
                            // FIX: Changed sh to bat for Windows execution
                            bat 'npm install'
                            bat 'npm install -g @angular/cli' 
                        }
                    }
                }
                
                // --- Python Setup Branch ---
                stage('Python Setup') {
                    steps {
                        echo 'Setting up Python Virtual Environment and tools...'
                        // FIX: Changed sh to bat for Windows execution
                        bat """
                        python -m venv venv
                        // Note: Venv activation command is different on Windows cmd/bat, 
                        // but pip/python calls often work after environment setup.
                        // We will rely on explicit pathing or ensuring python/pip are in the PATH.
                        pip install pytest selenium webdriver-manager pytest-html
                        """
                    }
                }
            } // end parallel
        }

        // ------------------------------------------------------------------------------------------------
        stage('Start Services (Parallel)') {
             parallel {
                
                // --- Start Backend Branch ---
                stage('Start Backend Service') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            echo "Starting Node Backend on port ${env.BACKEND_PORT}..."
                            // FIX: Changed sh to bat for Windows execution
                            // Use START command to run in the background on Windows
                            bat "start /B node server.js" 
                        }
                    }
                }
                
                // --- Start Frontend Branch ---
                stage('Start Frontend Service') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo "Starting Angular Frontend on port ${env.FRONTEND_PORT}..."
                            // FIX: Changed sh to bat for Windows execution
                            bat "start /B ng serve --port ${env.FRONTEND_PORT} --host 0.0.0.0"
                        }
                    }
                }
            } // end parallel
        }
        
        // ------------------------------------------------------------------------------------------------
        stage('Wait for Apps & Run Tests') {
            steps {
                echo 'Waiting 30 seconds for services to become fully stable...'
                // The sleep step is generic and should be fine
                sleep 30 
                
                dir(env.TESTING_DIR) {
                    echo 'Activating Python Venv and executing Selenium tests...'
                    // FIX: Changed sh to bat for Windows execution
                    // Note: Venv activation is complex in BAT/CMD. We will use the direct python path if needed.
                    // For now, let's try the simple bat call:
                    bat "pytest --html=report.html --self-contained-html -v"
                }
            }
        }

        // ------------------------------------------------------------------------------------------------
        stage('Publish Test Report') {
            steps {
                echo 'Publishing HTML test report to Jenkins UI...'
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
            echo 'Cleanup: Killing background Node/Angular processes using PowerShell...'
            // FIX: Replaced pkill (Linux) with taskkill (Windows) via powershell
            powershell '''
                # Kill node processes started by the CI job
                taskkill /F /IM node.exe /T /FI "WINDOWTITLE eq MemoryMap-Test-Pipeline" | Out-Null
                # Kill Angular CLI processes (often run as node.exe)
                taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq ng" | Out-Null
                # $LASTEXITCODE is 0 if successful or if processes weren't found.
            '''
            echo 'Cleanup complete.'
        }
    }
}