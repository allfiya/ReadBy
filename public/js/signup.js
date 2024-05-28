$("#submitSignupForm").click(function () {
  $("#emailError").html(``);
  $("#passwordError").html(``);
  $("#signupForm").submit();
});

$("#signupForm").submit(function (event) {
  event.preventDefault(); // Prevent default form submission

  const validSignupForm = validateSignupForm();

  if (validSignupForm) {
    $.ajax({
      type: "POST",
      url: "/account/signup", // Ensure this matches your Express route
      data: $(this).serialize(), // Serialize form data
      success: function (response) {
        console.log(response.status);
        

        switch (response.status) {
          case "emailTaken":
            $("#emailError").html(`Email already registered.`);

            break;

          case "usernameTaken":
            $("#usernameError").html(`Username already taken.`);

            break;

          case "otpSendError":
            $("#passwordError").html(`Error sending OTP.`);
            break;
          case "otpSuccess":
            window.location.href = `/account/verify/otp`;
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

function validateSignupForm() {
  // Clear previous error messages
  $("#emailError").html(``);
  $("#passwordError").html(``);
  $("#firstNameError").html(``);
  $("#lastNameError").html(``);
  $("#usernameError").html(``);

  // Get values and trim whitespace
  const formFields = {
    firstName: $("#first_name").val().trim(),
    lastName: $("#last_name").val().trim(),
    email: $("#email").val().trim(),
    username: $("#username").val().trim(),
    password1: $("#password1").val().trim(),
    password2: $("#password2").val().trim(),
  };

  // Check each field and display appropriate error messages
  for (const [field, value] of Object.entries(formFields)) {
    if (value === "") {
      switch (field) {
        case "firstName":
          $("#firstNameError").html(`First name field cannot be blank.`);
          break;
        case "lastName":
          continue;
        case "email":
          $("#emailError").html(`Email field cannot be blank.`);
          break;
        case "username":
          $("#usernameError").html(`Username field cannot be blank.`);
          break;
        case "password1":
          $("#passwordError").html(`Password field cannot be blank.`);
          break;
        case "password2":
          $("#passwordError").html(`Passwords does not match`);
          break;
      }
      return false;
    }
  }

  if (!/^[\sa-zA-Z]+$/.test(formFields.firstName)) {
    $("#firstNameError").html(`Enter a valid first name.`);
    return false;
  }
  if (!/^[\sa-zA-Z]+$/.test(formFields.lastName) && formFields.lastName !== "") {
    $("#lastNameError").html(`Enter valid last name`);
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formFields.email)) {
      $("#emailError").html(`Invalid email format.`);
      return false;
    }

  if (!/^[a-zA-Z0-9]+$/.test(formFields.username)) {
    $("#usernameError").html(
      `Username must contain only alphanumeric characters.`
    );
    return false;
  }

  if (formFields.username.length < 3) {
    $("#usernameError").html(`Username must be at least 3 characters long.`);
    return false;
  }

  const passwordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;

  if (/\s/.test(formFields.password1)) {
    $("#passwordError").html(`Password must not contain any white spaces.`);
    return false;
  }

  if (!passwordPattern.test(formFields.password1)) {
    $("#passwordError").html(
      `Password must be at least 8 characters long, contain at least 1 capital letter, 1 number, and 1 special symbol.`
    );
    return false;
  }

  if (formFields.password1 !== formFields.password2) {
    $("#passwordError").html(`Passwords does not match`);
    return false;
  }

  return true;
}
