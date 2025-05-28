// API Documentation Interactive Features
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const apiNavItems = document.querySelectorAll('.api-nav li');
  const apiSections = document.querySelectorAll('.api-section');
  const apiTestButton = document.getElementById('api-test-button');
  const apiTestEndpoint = document.getElementById('api-test-endpoint');
  const apiTestOutput = document.getElementById('api-test-output');
  const apiTestStatus = document.getElementById('api-test-status');
  const apiBaseUrlElements = document.querySelectorAll('.api-base-url');
  
  // Set base URL based on current location
  const baseUrl = window.location.origin;
  apiBaseUrlElements.forEach(el => {
    el.textContent = baseUrl;
  });
  
  // Tab navigation
  apiNavItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all items
      apiNavItems.forEach(i => i.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Hide all sections
      apiSections.forEach(section => section.classList.remove('active'));
      
      // Show selected section
      const sectionId = item.getAttribute('data-section');
      document.getElementById(`${sectionId}-section`).classList.add('active');
    });
  });
  
  // API Testing
  if (apiTestButton) {
    apiTestButton.addEventListener('click', async () => {
      const endpoint = apiTestEndpoint.value;
      apiTestOutput.textContent = 'Chargement...';
      apiTestStatus.textContent = '';
      apiTestStatus.className = '';
      
      try {
        const response = await fetch(endpoint);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          apiTestOutput.textContent = JSON.stringify(data, null, 2);
        } else {
          const text = await response.text();
          apiTestOutput.textContent = text;
        }
        
        if (response.ok) {
          apiTestStatus.textContent = `${response.status} ${response.statusText}`;
          apiTestStatus.className = 'success';
        } else {
          apiTestStatus.textContent = `${response.status} ${response.statusText}`;
          apiTestStatus.className = 'error';
        }
      } catch (error) {
        apiTestOutput.textContent = `Erreur: ${error.message}`;
        apiTestStatus.textContent = 'Erreur';
        apiTestStatus.className = 'error';
      }
    });
  }
});
