let selectedFormatActive = $('input[name="format"]:checked').val();
let selectedLanguageActive = $('input[name="language"]:checked').val();

const languageRadiosActive = document.querySelectorAll(
  'input[name="language"]'
);

// Loop through each radio button
languageRadiosActive.forEach((radio) => {
  // Add event listener for change event
  radio.addEventListener("change", function () {
    // If this radio button is checked
    if (this.checked) {
      // Set the "checked" attribute for the initially checked radio button to false
      document
        .querySelector('input[name="language"][checked]')
        .removeAttribute("checked");
      // Set the "checked" attribute for the currently checked radio button to true
      this.setAttribute("checked", "checked");
      selectedLanguageActive = this.value;
    }
  });
});

const formatRadiosActive = document.querySelectorAll('input[name="format"]');

// Loop through each radio button
formatRadiosActive.forEach((radio) => {
  // Add event listener for change event
  radio.addEventListener("change", function () {
    // If this radio button is checked
    if (this.checked) {
      // Set the "checked" attribute for the initially checked radio button to false
      document
        .querySelector('input[name="format"][checked]')
        .removeAttribute("checked");
      // Set the "checked" attribute for the currently checked radio button to true
      this.setAttribute("checked", "checked");
      selectedFormatActive = this.value;
    }
  });
});

function updateContentActive() {
  // Get selected format and language IDs
  const selectedFormatId = $('input[name="format"]:checked').val();
  const selectedLanguageId = $('input[name="language"]:checked').val();
  const productId = $('input[name="productId"]').val();

  let stock;

  // Send AJAX request
  $.ajax({
    url: "/check-cart", // Endpoint to check if the item is in the cart
    method: "POST",
    data: {
      productId: productId,
      formatId: selectedFormatId,
      languageId: selectedLanguageId,
    },
    success: function (response) {
      $("#salePrice").html(`₹${response.salePrice}`);
      $("#basePrice").html(`₹${response.basePrice}`);
      stock = response.stock;

      if (response.isCartItem) {
        // Item is already in the cart
        $("#cart-status").html(`<div class="d-flex">
    
                        <button type="button" id="decrease-qty">-</button>
                        <input type="number" min="1" class="ps-3" id="quantity" value="${response.quantity}"  name="quantity" style="width:50px;">
                        <button type="button" id="increase-qty">+</button>
                    
                    </div>`);

        $("#increase-qty").on("click", function () {
          // Send AJAX request to increment quantity
          if ($("#quantity").val() < stock) {
            $.ajax({
              url: "/cart-increment",
              method: "POST",
              data: {
                productId: productId,
                formatId: selectedFormatId,
                languageId: selectedLanguageId,
              },
              success: function (response) {
                // Handle success response
                console.log("Quantity incremented");

                // Set the value of the element with ID 'quantity' to response.latestQuantity
                $("#quantity").val(response.latestQuantity);

                // // Update content if needed
                // updateContentActive();
              },
              error: function (xhr, status, error) {
                console.error(error);
              },
            });
          }
        });

        $("#decrease-qty").on("click", function () {
          // Send AJAX request to increment quantity
          $.ajax({
            url: "/cart-decrement",
            method: "POST",
            data: {
              productId: productId,
              formatId: selectedFormatId,
              languageId: selectedLanguageId,
            },
            success: function (response) {
              // Handle success response
              console.log("Quantity incremented");

              // Set the value of the element with ID 'quantity' to response.latestQuantity
              $("#quantity").val(response.latestQuantity);

              // // Update content if needed
              // updateContentActive();
            },
            error: function (xhr, status, error) {
              console.error(error);
            },
          });
        });
      } else {
        // Item is not in the cart
        $("#cart-status").html(
          '<button type="submit" class="btn btn-dark">Add to Cart</button>'
        );
      }
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
}

function updateContentInactive() {
  // Get selected format and language IDs
  const selectedFormatId = $('input[name="formatId"]:checked').val();
  const selectedLanguageId = $('input[name="languageId"]:checked').val();
  const productId = $('input[name="productIdCookie"]').val();
  let stock;

  // Send AJAX request
  $.ajax({
    url: "/check-cart-cookie", // Endpoint to check if the item is in the cart
    method: "POST",
    data: {
      productId: productId,
      formatId: selectedFormatId,
      languageId: selectedLanguageId,
    },
    success: function (response) {
      // Update content based on response
      stock = response.stock;
      $("#salePrice").html(`₹${response.salePrice}`);
      $("#basePrice").html(`₹${response.basePrice}`);
      if (response.isCartItem) {
        // Item is already in the cart
        $("#cart-status-cookie").html(`<div class="d-flex">
      
                          <button type="button" id="decrease-qty-cookie">-</button>
                          <input type="number" min="1" class="ps-3" id="quantityCookie" value="${response.quantity}"  name="quantity" style="width:50px;">
                          <button type="button" id="increase-qty-cookie">+</button>
                      
                      </div>`);

        $("#increase-qty-cookie").on("click", function () {
          if ($("#quantityCookie").val() < stock) {
            // Send AJAX request to increment quantity
            $.ajax({
              url: "/cart-increment-cookie",
              method: "POST",
              data: {
                productId: productId,
                formatId: selectedFormatId,
                languageId: selectedLanguageId,
              },
              success: function (response) {
                // Handle success response
                console.log("Quantity incremented");

                // Set the value of the element with ID 'quantity' to response.latestQuantity
                $("#quantityCookie").val(response.latestQuantity);

                // // Update content if needed
                // updateContentInactive();
              },
              error: function (xhr, status, error) {
                console.error(error);
              },
            });
          }
        });

        $("#decrease-qty-cookie").on("click", function () {
          if ($("#quantityCookie").val() > 1) {
            $.ajax({
              url: "/cart-decrement-cookie",
              method: "POST",
              data: {
                productId: productId,
                formatId: selectedFormatId,
                languageId: selectedLanguageId,
              },
              success: function (response) {
                // Handle success response
                console.log("Quantity incremented");

                // Set the value of the element with ID 'quantity' to response.latestQuantity
                $("#quantityCookie").val(response.latestQuantity);

                // // Update content if needed
                // updateContentInactive();
              },
              error: function (xhr, status, error) {
                console.error(error);
              },
            });
          }
        });
      } else {
        // Item is not in the cart
        $("#cart-status-cookie").html(
          '<button type="submit" class="btn btn-dark">Add to Cart</button>'
        );
      }
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
}

if (customerData) {
  updateContentActive();
} else {
  updateContentInactive();
}

$(document).ready(function () {
  $(".drop-menu-item-category").hover(function () {
    let categoryId = $(this).find(".nested-drop-menu").data("category-id");
    let nestedMenu = $(this).find(".nested-drop-menu");

    // Make AJAX request to fetch subcategories
    $.ajax({
      url: "/getSubcategories",
      method: "GET",
      data: { categoryId: categoryId },
      success: function (subcategories) {
        // Clear existing items
        nestedMenu.empty();

        // Populate subcategories
        subcategories.forEach(function (subcategory) {
          // Replace spaces with &nbsp;
          let subcategoryName = subcategory.name.replace(/ /g, "&nbsp;");
          nestedMenu.append(
            '<li class="nested-drop-menu-item"><a href="#">' +
              subcategoryName +
              "</a></li>"
          );
        });
      },
    });
  });
});

// LIKE BUTTON FUCTIONALITY




const buttonElement = document.querySelectorAll(".tablinks");
const tabContent = document.querySelectorAll(".tabcontent");

tabContent[0].style.display = "block";

buttonElement.forEach(function (i) {
  i.addEventListener("click", function (event) {
    for (let x = 0; x < buttonElement.length; x++) {
      if (event.target.id == buttonElement[x].id) {
        buttonElement[x].className = buttonElement[x].className.replace(
          " active",
          ""
        );
        tabContent[x].style.display = "block";
        event.currentTarget.className += " active";
      } else {
        tabContent[x].style.display = "none";
        buttonElement[x].className = buttonElement[x].className.replace(
          " active",
          ""
        );
      }
    }
  });
});

// document.addEventListener("DOMContentLoaded", function () {
//   const languageRadioButtons = document.querySelectorAll(
//     'input[type="radio"][name="language"]'
//   );
//   const formatRadioButtons = document.querySelectorAll(
//     'input[type="radio"][name="format"]'
//   );

//   // Function to save the state of the selected radio button
//   function saveCheckedState(radioButtons, key) {
//     let checkedValue = null;
//     radioButtons.forEach(function (radioButton) {
//       if (radioButton.checked) {
//         checkedValue = radioButton.value;
//       }
//     });
//     localStorage.setItem(key, checkedValue);
//   }

//   // Function to restore the state of the selected radio button
//   function restoreCheckedState(radioButtons, key) {
//     const checkedValue = localStorage.getItem(key);
//     radioButtons.forEach(function (radioButton) {
//       if (radioButton.value === checkedValue) {
//         radioButton.checked = true;
//       }
//     });
//   }

//   // Restore the initial checked state when the page loads
//   restoreCheckedState(languageRadioButtons, "language");
//   restoreCheckedState(formatRadioButtons, "format");

//   // Add event listeners to update the checked state
//   languageRadioButtons.forEach(function (radioButton) {
//     radioButton.addEventListener("change", function () {
//       saveCheckedState(languageRadioButtons, "language");
//     });
//   });

//   formatRadioButtons.forEach(function (radioButton) {
//     radioButton.addEventListener("change", function () {
//       saveCheckedState(formatRadioButtons, "format");
//     });
//   });
// });

document.addEventListener("DOMContentLoaded", function () {
  const languageRadioButtons = document.querySelectorAll(
    'input[type="radio"][name="languageId"]'
  );
  const formatRadioButtons = document.querySelectorAll(
    'input[type="radio"][name="formatId"]'
  );

  // Function to save the state of the selected radio button
  function saveCheckedState(radioButtons, key) {
    let checkedValue = null;
    radioButtons.forEach(function (radioButton) {
      if (radioButton.checked) {
        checkedValue = radioButton.value;
      }
    });
    localStorage.setItem(key, checkedValue);
  }

  // Function to restore the state of the selected radio button
  function restoreCheckedState(radioButtons, key) {
    const checkedValue = localStorage.getItem(key);
    radioButtons.forEach(function (radioButton) {
      if (radioButton.value === checkedValue) {
        radioButton.checked = true;
      }
    });
  }

  // Restore the initial checked state when the page loads
  restoreCheckedState(languageRadioButtons, "languageId");
  restoreCheckedState(formatRadioButtons, "formatId");

  // Add event listeners to update the checked state
  languageRadioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function () {
      saveCheckedState(languageRadioButtons, "languageId");
    });
  });

  formatRadioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function () {
      saveCheckedState(formatRadioButtons, "formatId");
    });
  });
});

// ADD TO CART & CART STATUS UPDATE

$(document).ready(function () {
  if (customerData) {
    $("#addToCartForm").submit(function (event) {
      event.preventDefault();

      // AJAX POST request to add item to cart
      $.ajax({
        type: "POST",
        url: "/add-to-cart",
        data: $(this).serialize(),
        success: function (response) {
          updateContentActive();
          $("#count-bg-active").html(response.cartNumber);
        },
        error: function (xhr, status, error) {
          console.error(xhr.responseText); // Log error message
          alert("An error occurred. Please try again."); // Show generic error message
        },
      });
    });

    // Function to send AJAX request

    // Attach change event listener to format and language inputs
    $('input[name="format"], input[name="language"]').change(function () {
      updateContentActive(); // Call updateContentActive function when there's a change in the radio inputs
    });

    // Initial call to updateContentActive function to set initial content

    updateContentActive();
  }
});

// ADD TO COOKIE & CART STATUS UPDATE

$(document).ready(function () {
  if (cartCookie) {
    $("#addToCookieForm").submit(function (event) {
      event.preventDefault(); // Prevent default form submission

      // AJAX POST request to add item to cart
      $.ajax({
        type: "POST",
        url: "/add-to-cookie",
        data: $(this).serialize(), // Serialize form data
        success: function (response) {
          updateContentInactive();
          $("#count-bg-active").html(response.cartNumber);
        },
        error: function (xhr, status, error) {
          console.error(xhr.responseText); // Log error message
          alert("An error occurred. Please try again."); // Show generic error message
        },
      });
    });

    // $("#buyNowBtn").click(function () {
    //   alert("Buy Now button clicked!");
    // });

    // Attach change event listener to format and language inputs
    $('input[name="formatId"], input[name="languageId"]').change(function () {
      updateContentInactive(); // Call updateContentInactive function when there's a change in the radio inputs
    });

    // Initial call to updateContentInactive function to set initial content

    updateContentInactive();
  }
});

const searchField = document.getElementById("search-field");

searchField.addEventListener("keydown", function (event) {
  // Check if Enter key is pressed (key code 13)
  if (event.keyCode === 13) {
    const searchTerm = searchField.value.trim();
    if (searchTerm.length > 0) {
      // Redirect to /library route with search query as URL parameter
      window.location.href = `/library?search=${encodeURIComponent(
        searchTerm
      )}`;
    }
  }
});

$("#buyNowBtn").click(function () {
  if (customerData) {
    const selectedFormatId = $('input[name="format"]:checked').val();
    const selectedLanguageId = $('input[name="language"]:checked').val();
    const productId = $('input[name="productId"]').val();

    $.ajax({
      type: "POST",
      url: "/buy-now-cart",
      data: {
        productId: productId,
        formatId: selectedFormatId,
        languageId: selectedLanguageId,
      },
      success: function (response) {
        window.location.href = "/buy-now/checkout"; // Redirect to checkout page
      },
      error: function (xhr, status, error) {
        console.error(xhr.responseText); // Log error message
        alert("An error occurred. Please try again."); // Show generic error message
      },
    });
  } else {
    const selectedFormatId = $('input[name="formatId"]:checked').val();
    const selectedLanguageId = $('input[name="languageId"]:checked').val();
    const productId = $('input[name="productIdCookie"]').val();

    $.ajax({
      type: "POST",
      url: "/buy-now-cookie",
      data: {
        productId: productId,
        formatId: selectedFormatId,
        languageId: selectedLanguageId,
      },
      success: function (response) {
        window.location.href = "/buy-now/checkout"; // Redirect to checkout page
      },
      error: function (xhr, status, error) {
        console.error(xhr.responseText); // Log error message
        alert("An error occurred. Please try again."); // Show generic error message
      },
    });
  }
});

// Zoom effect

const magnify_area = document.getElementById("magnify-area");
const magnify_img = document.getElementById("magnify-img");

magnify_area.addEventListener("mousemove", function (event) {
  let clientX = event.clientX - magnify_area.offsetLeft;
  let clientY = event.clientY - magnify_area.offsetTop;
  const mWidth = magnify_area.offsetWidth;
  const mHeight = magnify_area.offsetHeight;

  clientX = (clientX / mWidth) * 100;
  clientY = (clientY / mHeight) * 100;

  magnify_img.style.transform =
    "translate(-" + clientX + "%,-" + clientY + "%) scale(2)";
});

magnify_area.addEventListener("mouseleave", function (event) {
  magnify_img.style.transform = "translate(-50%,-50%) scale(1)";
});
