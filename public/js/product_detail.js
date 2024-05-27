let selectedFormatActive = $('input[name="format"]:checked').val();
let selectedLanguageActive = $('input[name="language"]:checked').val();

const languageRadiosActive = document.querySelectorAll(
  'input[name="language"]'
);

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

  $('input[name="format"], input[name="language"]').change(function () {
    updateContentActive(); // Call updateContentActive function when there's a change in the radio inputs
  });

  updateContentActive();
}

// ADD TO COOKIE & CART STATUS UPDATE

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

  $('input[name="formatId"], input[name="languageId"]').change(function () {
    updateContentInactive(); // Call updateContentInactive function when there's a change in the radio inputs
  });

  updateContentInactive();
}

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

function getCheckedRadioValue(name) {
  // Select the radio button group by name
  const radios = document.getElementsByName(name);

  // Iterate through the radio buttons to find the checked one
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return radios[i].value; // Return the value of the checked radio button
    }
  }

  return null; // Return null if no radio button is checked (though in your case, one will always be checked)
}

function checkRatingAvailability() {
  const productId = $("#productId").val();
  const selectedFormatId = $('input[name="format"]:checked').val();
  const selectedLanguageId = $('input[name="language"]:checked').val();
  $.ajax({
    url: "/check-ifRated",
    method: "POST",
    data: { productId, selectedLanguageId, selectedFormatId }, // Send the updated status
    success: function (response) {
      if (response.canRate) {
        $("#review_section").html(`
                <h3>Rate and Review this Book.</h3>
                <div class="d-flex flex-column justify-content-center align-items-center ">
                    <div class="rating">
                        <input value="5" name="rate" id="star5" type="radio">
                        <label title="text" for="star5"></label>
                        <input value="4" name="rate" id="star4" type="radio">
                        <label title="text" for="star4"></label>
                        <input value="3" name="rate" id="star3" type="radio">
                        <label title="text" for="star3"></label>
                        <input value="2" name="rate" id="star2" type="radio">
                        <label title="text" for="star2"></label>
                        <input value="1" name="rate" id="star1" type="radio">
                        <label title="text" for="star1"></label>
                    </div>
                    <input type="text" id="shortReview" required placeholder="Review the book in one word." class="col-12 form-control my-4">
                    <label for="review_images">Upload images for review: </label>
                    <input type="file" class="form-control my-4" multiple accept="image/*" id="review_images" col-12">
                    <textarea name="longReview" id="longReview" class="col-12 ps-3 pt-2" rows="10" placeholder="Share your thoughts about the book. (Optional)"></textarea>
                    <button type="submit" id="submitReview" class="btn btn-primary mt-3 px-5">Submit</button>
                </div>
            `);

        let longReview = "";

        const $textarea = $("#longReview");

        $textarea.on("input", function () {
          longReview = $(this).val();
        });

        $("#submitReview").click(() => {
          const ratedValue = $('input[name="rate"]:checked').val();
          const shortReview = $("#shortReview").val();
          const files = $("#review_images")[0].files;

          const formData = new FormData();
          formData.append("longReview", longReview);
          formData.append("ratedValue", ratedValue);
          formData.append("shortReview", shortReview);
          formData.append("productId", productId);
          formData.append("selectedLanguageId", selectedLanguageId);
          formData.append("selectedFormatId", selectedFormatId);

          for (let i = 0; i < files.length; i++) {
            formData.append("review_images", files[i]);
          }

          $.ajax({
            url: "/submit-review",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
              window.location.reload();
            },
            error: function (error) {
              console.error("Error updating status:", error);
            },
          });
        });
      } else {
        $("#review_section").html(``);
      }
    },
    error: function (error) {
      console.error("Error updating status:", error);
    },
  });
}

$('input[name="language"]').change(function () {
  checkRatingAvailability();
});

$('input[name="format"]').change(function () {
  checkRatingAvailability();
});
checkRatingAvailability();

$("#shareProduct").on("click", function (event) {
  $("#shareOptions").removeClass("d-none"); // Hide share options

  const url = window.location.href;
  const shareContent = `
      <i id="copyLink" class="bi bi-copy fs-4 text-dark mb-2"></i>
      <a class="text-decoration-none mb-2 text-dark" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}" target="_blank"><i class="bi fs-4 bi-facebook"></i></a>
      <a class="text-decoration-none mb-2 text-dark" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}" target="_blank"><i class="bi fs-4 bi-twitter-x"></i></a>
      <a class="text-decoration-none mb-2 text-dark" href="mailto:?subject=Check%20this%20out&body=${encodeURIComponent(
        url
      )}" target="_blank"><i class="bi fs-4 bi-envelope-arrow-up-fill"></i></a>
    `;

  $("#shareOptions").html(shareContent);

  $("#copyLink").click(() => {
    navigator.clipboard.writeText(url);
  });
});

// Click handler for document to hide shareOptions when clicking outside
$(document).on("click", function (event) {
  if (
    !$(event.target).closest("#shareProduct").length &&
    !$(event.target).closest("#shareOptions").length
  ) {
    $("#shareOptions").addClass("d-none"); // Hide share options
  }
});



$(".similar-book").each(function () {
  const productId = $(this).data("id");
  const $starInside = $(this).find(".rating-section");
  $.ajax({
    url: `/get-averageRating`,
    type: "POST",
    data: { productId },
    success: function (res) {
      const averageRating = res.averageRatingInNumber;

      if (averageRating === 0) {
        $starInside.addClass("bg-secondary");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      } else if (averageRating < 4) {
        $starInside.addClass("bg-warning");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      } else {
        $starInside.addClass("bg-success");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      }
    },
  });
});

function updateMainImage(clickedImg) {
  const mainImg = document.getElementById('magnify-img');
  
  // Swap the src attributes between the main image and the clicked image
  const tempSrc = mainImg.src;
  mainImg.src = clickedImg.src;
  clickedImg.src = tempSrc;
}
