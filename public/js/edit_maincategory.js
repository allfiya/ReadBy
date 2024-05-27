const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});





let inputField = document.getElementById('input-td');

    // Add an event listener for key presses
    inputField.addEventListener('keypress', function(event) {
        // Check if the key pressed is Enter (key code 13)
        if (event.keyCode === 13) {
            // Prevent the default form submission
            event.preventDefault();
            // Submit the form
            document.getElementById('subcategory-form').submit();
        }
    });

