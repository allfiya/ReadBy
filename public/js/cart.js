// let buttonPlus  = $(".qty-btn-plus");
// let buttonMinus = $(".qty-btn-minus");

// let incrementPlus = buttonPlus.click(function() {
//   let $n = $(this)
//   .parent(".qty-container")
//   .find(".input-qty");
//   $n.val(Number($n.val())+1 );
// });

// let incrementMinus = buttonMinus.click(function() {
//   let $n = $(this)
//   .parent(".qty-container")
//   .find(".input-qty");
//   let amount = Number($n.val());
//   if (amount > 1) {
//     $n.val(amount-1);
//   }
// });











function validateInput(input, index) {
    // Remove non-numeric characters from the input value
    input.value = input.value.replace(/[^\d]/g, '');

    // Parse the input value to an integer
    let quantity = parseInt(input.value, 10);

    // Check if the parsed value is less than or equal to 1 or NaN
    if (quantity <= 0 || isNaN(quantity )) {
        // If the value is less than or equal to 0 or NaN, reset the input value to 1
        input.value = '';
        
    }

    


    // Retrieve existing cart items from the cookies or initialize an empty array
    let cartItems = JSON.parse(decodeURIComponent(getCookie('cartItems')) || '[]');

    if (quantity >= 1 || (!(isNaN(quantity)))) {
        cartItems[index].quantity = quantity;
    }

    
    

    // Update the cartItems cookie with the updated cart items array
    document.cookie = `cartItems=${encodeURIComponent(JSON.stringify(cartItems))}; path=/`; // Update the cookie

    // Check if the input value is valid before reloading the page
    if (quantity > 0) {
        // Reload the page only if the input value is valid
        location.reload();
    }
}






// Function to retrieve a cookie by name
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check if the cookie starts with the given name
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null; // Return null if the cookie is not found
}


// Function to increment the quantity
function incrementQuantity(index) {
    let cartItems = JSON.parse(decodeURIComponent(getCookie('cartItems')) || '[]');
    cartItems[index].quantity += 1;
    document.cookie = `cartItems=${encodeURIComponent(JSON.stringify(cartItems))}; path=/`;
    location.reload(); // Reload the page after updating the quantity
}

// Function to decrement the quantity
function decrementQuantity(index) {
    let cartItems = JSON.parse(decodeURIComponent(getCookie('cartItems')) || '[]');
    // Decrement the quantity only if it's greater than 1
    if (cartItems[index].quantity > 1) {
        cartItems[index].quantity -= 1;
        document.cookie = `cartItems=${encodeURIComponent(JSON.stringify(cartItems))}; path=/`;
        location.reload(); // Reload the page after updating the quantity
    }
}


















const prices = [];
document.querySelectorAll('.group-price').forEach(p => {
    const priceText = p.innerText.replace('₹', ''); // Remove the rupees symbol
    const price = parseInt(priceText, 10); // Parse the price string to an integer
    prices.push(price); // Add the parsed price to the array
});


const subtotal = prices.reduce((acc, curr) => acc + curr, 0);

document.getElementById('subtotal').innerHTML=`₹${subtotal}`
const taxPercentage = 17


const taxAmount = ((taxPercentage * subtotal) / 100).toFixed(2);
const tax = parseFloat(taxAmount); // Convert the string to a number if needed


document.getElementById('tax').innerHTML=`₹${tax}`

document.getElementById('total').innerHTML=`₹${tax + subtotal}`


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