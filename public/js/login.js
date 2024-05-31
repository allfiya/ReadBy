const signupClicked = localStorage.getItem("signupClicked");
let isSignup;
if (signupClicked === "false") {
  isSignup = false;
} else {
  isSignup = true;
}

console.log("Clicked", isSignup);

if (isSignup) {
  toggleForm();
}

$("#loginSubmitBtn").click(function () {
  $("#loginEmailError").html(``);
  $("#loginPasswordError").html(``);
  $("#loginForm").submit();
});

$("#loginForm").submit(function (event) {
  event.preventDefault(); // Prevent default form submission
  const validLoginForm = validateLoginForm();

  if (validLoginForm) {
    $.ajax({
      type: "POST",
      url: "/account/login", // Ensure this matches your Express route
      data: $(this).serialize(), // Serialize form data
      success: function (response) {
        switch (response.status) {
          case "loginEmailOrUsername":
            $("#loginEmailError").html(`Incorrect email or username.`);

            break;

          case "loginPasswordError":
            $("#loginPasswordError").html(`Incorrect password.`);

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
  $("#loginEmailError").html(``);
  $("#loginPasswordError").html(``);

  const loginEmailOrUsername = $("#loginEmailOrUsername").val().trim();
  const loginPassword = $("#loginPassword").val().trim();

  if (loginEmailOrUsername === "") {
    $("#loginEmailError").html(`Email or username field cannot be blank.`);
    return false;
  } else if (loginPassword === "") {
    $("#loginPasswordError").html(`Password field cannot be blank.`);
    return false;
  }

  return true;
}
$("#signupSubmitBtn").click(function () {
  $("#signupForm").submit();
});

$("#signupForm").submit(function (event) {
  event.preventDefault(); // Prevent default form submission
  console.log("Prevented");

  const validSignupForm = validateSignupForm();

  console.log(validSignupForm);

  if (validSignupForm) {
    $.ajax({
      type: "POST",
      url: "/account/signup", // Ensure this matches your Express route
      data: $(this).serialize(), // Serialize form data
      success: function (response) {
        console.log(response.status);

        switch (response.status) {
          case "emailTaken":
            $("#signupEmailError").html(`Email already registered.`);

            break;

          case "usernameTaken":
            $("#signupUsernameError").html(`Username already taken.`);

            break;

          case "otpSendError":
            $("#signupPasswordError").html(`Error sending OTP.`);
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
  $("#signupEmailError").html(``);
  $("#signupPasswordError").html(``);
  $("#firstNameError").html(``);
  $("#lastNameError").html(``);
  $("#signupUsernameError").html(``);

  // Get values and trim whitespace
  const formFields = {
    firstName: $("#signupFirstName").val().trim(),
    lastName: $("#signupLastName").val().trim(),
    email: $("#signupEmail").val().trim(),
    username: $("#signupUsername").val().trim(),
    password1: $("#signupPassword1").val().trim(),
    password2: $("#signupPassword2").val().trim(),
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
          $("#signupEmailError").html(`Email field cannot be blank.`);
          break;
        case "username":
          $("#signupUsernameError").html(`Username field cannot be blank.`);
          break;
        case "password1":
          $("#signupPasswordError").html(`Password field cannot be blank.`);
          break;
        case "password2":
          $("#signupPasswordError").html(`Passwords does not match`);
          break;
      }
      return false;
    }
  }

  if (!/^[\sa-zA-Z]+$/.test(formFields.firstName)) {
    $("#firstNameError").html(`Enter a valid first name.`);
    return false;
  }
  if (
    !/^[\sa-zA-Z]+$/.test(formFields.lastName) &&
    formFields.lastName !== ""
  ) {
    $("#lastNameError").html(`Enter valid last name`);
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formFields.email)) {
    $("#signupEmailError").html(`Invalid email format.`);
    return false;
  }

  if (!/^[a-zA-Z0-9]+$/.test(formFields.username)) {
    $("#signupUsernameError").html(
      `Username must contain only alphanumeric characters.`
    );
    return false;
  }

  if (formFields.username.length < 3) {
    $("#signupUsernameError").html(
      `Username must be at least 3 characters long.`
    );
    return false;
  }

  const passwordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;

  if (/\s/.test(formFields.password1)) {
    $("#signupPasswordError").html(
      `Password must not contain any white spaces.`
    );
    return false;
  }

  if (!passwordPattern.test(formFields.password1)) {
    $("#signupPasswordError").html(
      `Password must be at least 8 characters long, contain at least 1 capital letter, 1 number, and 1 special symbol.`
    );
    return false;
  }

  if (formFields.password1 !== formFields.password2) {
    $("#signupPasswordError").html(`Passwords does not match`);
    return false;
  }

  return true;
}

// const toggleForm = () => {
//   const container = document.querySelector(".container");
//   container.classList.toggle("active");
// };

function toggleForm() {
  const container = document.querySelector(".container");
  container.classList.toggle("active");
}
