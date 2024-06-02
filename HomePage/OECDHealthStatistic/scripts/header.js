function loadHeader() {
    fetch('../header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadHeader);
