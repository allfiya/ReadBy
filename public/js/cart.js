function validateInput(input, index) {
  // Remove non-numeric characters from the input value
  input.value = input.value.replace(/[^\d]/g, "");

  // Parse the input value to an integer
  let quantity = parseInt(input.value, 10);

  // Check if the parsed value is less than or equal to 1 or NaN
  if (quantity <= 0 || isNaN(quantity)) {
    // If the value is less than or equal to 0 or NaN, reset the input value to 1
    input.value = "";
  }

  // Retrieve existing cart items from the cookies or initialize an empty array
  let cartItems = JSON.parse(
    decodeURIComponent(getCookie("cartItems")) || "[]"
  );

  if (quantity >= 1 || !isNaN(quantity)) {
    cartItems[index].quantity = quantity;
  }

  // Update the cartItems cookie with the updated cart items array
  document.cookie = `cartItems=${encodeURIComponent(
    JSON.stringify(cartItems)
  )}; path=/`; // Update the cookie

  // Check if the input value is valid before reloading the page
  if (quantity > 0) {
    // Reload the page only if the input value is valid
    location.reload();
  }
}

// Function to retrieve a cookie by name
function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Check if the cookie starts with the given name
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null; // Return null if the cookie is not found
}

// Function to increment the quantity
function incrementQuantity(index) {
  let cartItems = JSON.parse(
    decodeURIComponent(getCookie("cartItems")) || "[]"
  );
  cartItems[index].quantity += 1;
  document.cookie = `cartItems=${encodeURIComponent(
    JSON.stringify(cartItems)
  )}; path=/`;
  location.reload(); // Reload the page after updating the quantity
}

// Function to decrement the quantity
function decrementQuantity(index) {
  let cartItems = JSON.parse(
    decodeURIComponent(getCookie("cartItems")) || "[]"
  );
  // Decrement the quantity only if it's greater than 1
  if (cartItems[index].quantity > 1) {
    cartItems[index].quantity -= 1;
    document.cookie = `cartItems=${encodeURIComponent(
      JSON.stringify(cartItems)
    )}; path=/`;
    location.reload(); // Reload the page after updating the quantity
  }
}

$(document).on("click", ".qty-btn-plus-db", function () {
  const itemId = $(this).data("item-id");

  $.ajax({
    type: "POST",
    url: "/cart/increment",
    data: { itemId: itemId },
    success: function (response) {
      // Reload the page after successful increment
      location.reload();
    },
    error: function (err) {
      console.error("Error incrementing quantity:", err);
    },
  });
});

$(document).on("click", ".qty-btn-minus-db", function () {
    const itemId = $(this).data("item-id");
  
    $.ajax({
      type: "POST",
      url: "/cart/decrement",
      data: { itemId: itemId },
      success: function (response) {
        // Reload the page after successful decrement
        location.reload();
      },
      error: function (err) {
        console.error("Error decrementing quantity:", err);
      },
    });
  });



$(document).on('change', '.input-qty-db', function() {
    const newQuantity = parseInt($(this).val());
    if (newQuantity > 0) {
        const itemId = $(this).closest('.cartItem').find('.qty-btn-plus-db').data('item-id');
        updateQuantity(itemId, newQuantity);
    } else {
        // If entered quantity is not greater than 0, revert back to the original value
        const originalQuantity = parseInt($(this).data('original-quantity'));
        $(this).val(originalQuantity);
    }
});

function updateQuantity(itemId, newQuantity) {
    $.ajax({
        type: 'POST',
        url: '/cart/updateInput',
        data: { itemId: itemId, newQuantity: newQuantity },
        success: function(response) {
            
            // Reload the page after successful update
            location.reload();
        },
        error: function(err) {
            console.error('Error updating quantity:', err);
        }
    });
}



const prices = [];
document.querySelectorAll(".group-price").forEach((p) => {
  const priceText = p.innerText.replace("₹", ""); // Remove the rupees symbol
  const price = parseInt(priceText, 10); // Parse the price string to an integer
  prices.push(price); // Add the parsed price to the array
});

const subtotal = prices.reduce((acc, curr) => acc + curr, 0);

document.getElementById("subtotal").innerHTML = `₹${subtotal}`;
const taxPercentage = 17;

const taxAmount = ((taxPercentage * subtotal) / 100).toFixed(2);
const tax = parseFloat(taxAmount); // Convert the string to a number if needed

document.getElementById("tax").innerHTML = `₹${tax}`;

document.getElementById("total").innerHTML = `₹${tax + subtotal}`;

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
