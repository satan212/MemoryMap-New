import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture
def driver():
    """Setup Chrome driver"""
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-web-security")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()

def login_user(driver):
    """Helper function to login before testing map functionality"""
    driver.get("http://localhost:4200/login")
    wait = WebDriverWait(driver, 10)
    
    username = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder='Username']")))
    password = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Password']")
    login_button = driver.find_element(By.XPATH, "//button[contains(text(),'Login')]")
    
    username.clear()
    username.send_keys("Nishanthan")
    password.clear()
    password.send_keys("nish@1234")
    login_button.click()
    
    try:
        alert = wait.until(EC.alert_is_present())
        alert.accept()
    except (TimeoutException):
        pass

@pytest.mark.smoke
@pytest.mark.critical
def test_map_page_loads_after_login(driver):
    """Test that map page loads after successful login"""
    login_user(driver)
    
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    page_container = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "page-container")))
    assert page_container.is_displayed()
    
    search_container = driver.find_element(By.CLASS_NAME, "search-container")
    assert search_container.is_displayed()
    
    map_container = driver.find_element(By.ID, "map")
    assert map_container.is_displayed()

def test_map_search_functionality(driver):
    """Test map search functionality"""
    login_user(driver)
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    search_input = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder*='Search memories']")))
    search_button = driver.find_element(By.CLASS_NAME, "search-btn")
    clear_button = driver.find_element(By.CLASS_NAME, "clear-btn")
    
    # Test search input
    search_input.clear()
    search_input.send_keys("vacation")
    search_button.click()
    time.sleep(2)
    
    # Test clear button
    clear_button.click()
    time.sleep(1)
    
    assert search_input.get_attribute("value") == ""

def test_map_click_functionality(driver):
    """Test clicking on map to add new memory"""
    login_user(driver)
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    map_element = wait.until(EC.presence_of_element_located((By.ID, "map")))
    
    # Click on map center
    actions = ActionChains(driver)
    actions.move_to_element(map_element).click().perform()
    
    time.sleep(3)
    
    try:
        alert = driver.switch_to.alert
        alert_text = alert.text
        if "add a memory" in alert_text.lower():
            alert.accept()
            time.sleep(2)
            current_url = driver.current_url
            assert "add-memory" in current_url or current_url != "http://localhost:4200/map"
        else:
            alert.dismiss()
    except:
        pass

def test_map_instructions_visibility(driver):
    """Test that map instructions are visible"""
    login_user(driver)
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    instructions = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "instructions")))
    assert instructions.is_displayed()
    
    instruction_text = instructions.text
    assert "click anywhere on the map" in instruction_text.lower()

def test_navigation_links(driver):
    """Test navigation links in the navbar"""
    login_user(driver)
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    navbar = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "navbar")))
    assert navbar.is_displayed()
    
    logo_link = driver.find_element(By.CSS_SELECTOR, "a[routerLink='/map']")
    assert logo_link.is_displayed()
    assert "Memory Map" in logo_link.text

def test_responsive_design_elements(driver):
    """Test responsive design elements on map page"""
    login_user(driver)
    driver.get("http://localhost:4200/map")
    wait = WebDriverWait(driver, 15)
    
    # Test desktop view
    driver.set_window_size(1200, 800)
    time.sleep(1)
    
    search_container = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "search-container")))
    assert search_container.is_displayed()
    
    # Test mobile view
    driver.set_window_size(375, 667)
    time.sleep(1)
    assert search_container.is_displayed()
    
    # Reset to desktop view
    driver.set_window_size(1200, 800)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])