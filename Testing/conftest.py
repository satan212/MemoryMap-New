import pytest
import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "smoke: mark test as smoke test")
    config.addinivalue_line("markers", "critical: mark test as critical functionality")

@pytest.fixture(scope="session")
def chrome_options():
    """Configure Chrome options for all tests"""
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    return options

@pytest.fixture
def driver_with_options(chrome_options):
    """Create a Chrome WebDriver with custom options"""
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

@pytest.fixture
def test_user_credentials():
    """Provide test user credentials"""
    return {"username": "Nishanthan", "password": "nish@1234"}

@pytest.fixture
def test_coordinates():
    """Provide test coordinates for memory creation"""
    return {"lat": 25.1234, "lng": 80.5678}

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment before all tests"""
    print("\n" + "="*60)
    print("MEMORY MAP SELENIUM TEST SUITE (REDUCED)")
    print("="*60)
    print("Application URL: http://localhost:4200")
    print("Backend API: http://localhost:3000")
    print("="*60)
    yield
    print("\nTEST SUITE COMPLETED")
    print("="*60)

def pytest_html_report_title(report):
    """Customize HTML report title"""
    report.title = "Memory Map Application - Reduced Test Report"