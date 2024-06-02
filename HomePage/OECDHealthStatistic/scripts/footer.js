// footer.js
function loadFooter() {
    fetch('../footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadFooter);
