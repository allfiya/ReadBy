const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});

// let categoryForm = document.getElementById("category_form");

// categoryForm.addEventListener("submit", function (event) {
//   event.preventDefault(); // Prevent the default form submission

//   let subsTextarea = document.getElementById("subs");
//   let subsValue = subsTextarea.value.trim();

//   if (subsValue !== "") {
//     let subsArray = subsValue.split(",");
//     console.log(subsArray); // Optional: Log the array to the console for verification

//     // Set the value of a hidden input field to the JSON string representation of the array
//     document.getElementById("subcategories_input").value =
//       JSON.stringify(subsArray);
//   }

//   // Submit the form
//   categoryForm.submit();
// });



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

