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
        
        // --- PYTHON FIX: Explicit Path ---
        // Your confirmed executable path.
        PYTHON_EXE = 'C:\\Users\\nisha_r821nho\\AppData\\Local\\Programs\\Python\\Python38\\python.exe'
        PYTHON_VENV_SCRIPTS = 'venv\\Scripts' // Path to pip.exe inside the venv
    }

    stages {
        
        stage('Checkout & Setup') {
            steps {
                echo "Cloning repository: ${env.REPO_URL}"
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
                            bat 'npm install'
                        }
                    }
                }
                
                // --- Frontend Setup Branch ---
                stage('Frontend Install') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo 'Installing Frontend Node dependencies...'
                            bat 'npm install'
                            bat 'npm install -g @angular/cli' 
                        }
                    }
                }
                
                // --- Python Setup Branch ---
                stage('Python Setup') {
                    steps {
                        echo 'Setting up Python Virtual Environment and tools (using explicit path)...'
                        // FIX 1: Using the explicit PYTHON_EXE for reliability
                        // FIX 2: Deleting cached driver manager data to force a fresh download
                        bat """
                        ${env.PYTHON_EXE} -m venv venv
                        
                        // Clear cached webdriver-manager downloads
                        rmdir /S /Q %HOMEPATH%\\AppData\\Local\\WebDriverManager\\
                        
                        // Use pip from the newly created VENV to install dependencies
                        ${env.PYTHON_VENV_SCRIPTS}\\pip.exe install pytest selenium webdriver-manager pytest-html
                        """
                    }
                }
            } // end parallel
        }

        // ------------------------------------------------------------------------------------------------
        stage('Start Services (Parallel)') {
             parallel {
                
                stage('Start Backend Service') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            echo "Starting Node Backend on port ${env.BACKEND_PORT}..."
                            bat "start /B node server.js" 
                        }
                    }
                }
                
                stage('Start Frontend Service') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            echo "Starting Angular Frontend on port ${env.FRONTEND_PORT}..."
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
                sleep 30 
                
                dir(env.TESTING_DIR) {
                    echo 'Executing Selenium tests within VENV...'
                    // Use the pip-installed pytest executable directly from the VENV
                    bat "..\\${env.VENV_DIR}\\Scripts\\pytest.exe --html=report.html --self-contained-html -v"
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
            echo 'Cleanup: Killing background Node/Angular processes using taskkill (Windows fix)...'
            // FIX: Replaced powershell with bat and using standard taskkill command
            bat 'taskkill /F /IM node.exe /T /FI "WINDOWTITLE eq MemoryMap-Test-Pipeline" 2>nul || exit 0' 
            bat 'taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq ng" 2>nul || exit 0'
            echo 'Cleanup complete.'
        }
    }
}