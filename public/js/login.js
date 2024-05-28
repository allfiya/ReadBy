$("#submitLoginForm").click(function () {
  $("#emailError").html(``);
  $("#passwordError").html(``);
  $("#loginForm").submit();
});

$("#loginForm").submit(function (event) {
  event.preventDefault(); // Prevent default form submission
  const validLoginForm = validateLoginForm()
  
  if (validLoginForm) {
    $.ajax({
      type: "POST",
      url: "/account/login", // Ensure this matches your Express route
      data: $(this).serialize(), // Serialize form data
      success: function (response) {
        console.log(response.status);
  
        switch (response.status) {
          case "emailError":
            $("#emailError").html(`Incorrect email or username.`);
  
            break;
  
          case "passwordError":
            $("#passwordError").html(`Incorrect password.`);
  
            break;
  
          case "loggedIn":
            window.location.href = `/`;
            break;
  
          default:
            break;
        }
      },
      error: function (xhr, status, error) {
        console.error(xhr.responseText); // Log error message
        alert("An error occurred. Please try again."); // Show generic error message
      },
    });
  }
 

});

function validateLoginForm() {
  $("#emailError").html(``);
  $("#passwordError").html(``);

  const emailOrUsername = $("#emailOrUsername").val().trim();
  const password = $("#password").val().trim();

  if (emailOrUsername === "") {
    $("#emailError").html(`Email or username field cannot be blank.`);
    return false;
  } else if (password === "") {
    $("#passwordError").html(`Password field cannot be blank.`);
    return false;
  }

  return true
}
