$(document).ready(function ($) {
  // Check if the user is authenticated
  if (customer) {
    // Add both classes to Step 2
    $(".process-wrap").attr("class", "process-wrap active-step2");
    $(".step-content").hide(); // Hide all content sections
    $(".step-2-content").show();

    updateTotalAmount();
  }

  $(".process-step").click(function () {
    let theClass = $(this)
      .attr("class")
      .match(/(^|\s)step-\S+/g);
    let bute = $.trim(theClass);
    switch (bute) {
      case "step-1":
        $(".process-wrap").attr("class", "process-wrap active-step1");
        $(".step-content").hide(); // Hide all content sections
        $(".step-1-content").show(); // Show content for Step 1
        break;
      case "step-2":
        if (customer) {
          $(".process-wrap").attr("class", "process-wrap active-step2");
          $(".step-content").hide(); // Hide all content sections
          $(".step-2-content").show();
        } // Show content for Step 2
        break;
      case "step-3":
        if (customer) {
          $(".process-wrap").attr("class", "process-wrap active-step3");
          $(".step-content").hide(); // Hide all content sections
          $(".step-3-content").show(); // Show content for Step 3
        }
        break;
      case "step-4":
        if (customer) {
          $(".process-wrap").attr("class", "process-wrap active-step4");
          $(".step-content").hide(); // Hide all content sections
          $(".step-4-content").show(); // Show content for Step 4
        }
        break;
      default:
        $(".process-wrap").attr("class", "process-wrap");
        $(".step-content").hide(); // Hide all content sections
    }
  });

  $("#loginForm").submit(function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Get form data
    let formData = $(this).serialize();

    // Make AJAX request
    $.ajax({
      url: $(this).attr("action"), // Form action URL
      type: $(this).attr("method"), // Form method (POST)
      data: formData, // Form data
      success: function (response) {
        $(".process-wrap").attr("class", "process-wrap active-step2");
        $(".step-content").hide(); // Hide all content sections
        $(".step-2-content").show();

        window.location.reload();
      },
      error: function (xhr, status, error) {
        // Handle error
        console.error(error);
      },
    });
  });

  $("#addAddress").submit(function (event) {
    // Prevent the default form submission
    event.preventDefault();

    // Collect form data
    const formData = {
      customerId: $("#customerId").val(),
      name: $("#name").val(),
      address: $("#address").val(),
      locality: $("#locality").val(),
      district: $("#district").val(),
      state: $("#state").val(),
      country: $("#country").val(),
      pin: $("#pin").val(),
      mobile: $("#mobile").val(),
      alt_mobile: $("#alt_mobile").val(),
      nickname: $("#nickname").val(),
      landmark: $("#landmark").val(),
    };

    // Send AJAX request
    $.ajax({
      type: "POST",
      url: "/save-address",
      data: formData,
      success: function (response) {
        // Handle success
        console.log("Address saved successfully");
        window.location.reload();
      },
      error: function (xhr, status, error) {
        // Handle error
        console.error("Error saving address:", error);
      },
    });
  });
});

if (customer) {
  document.querySelectorAll(" .cart-increase").forEach((button) => {
    button.addEventListener("click", function () {
      // Extracting data attributes from the clicked button
      const itemId = this.getAttribute("data-item-id");
      const itemFormat = this.getAttribute("data-item-format");
      const itemLanguage = this.getAttribute("data-item-language");

      $.ajax({
        url: "/check-cart-cookie", // Endpoint to check if the item is in the cart
        method: "POST",
        data: {
          productId: itemId,
          formatId: itemFormat,
          languageId: itemLanguage,
        },
        success: function (response) {
          const stock = response.stock;
          if (
            $(`#cartQuantity-${itemId}-${itemFormat}-${itemLanguage}`).val() <
            stock
          ) {
            $.ajax({
              url: "/cart-increment",
              method: "POST",
              data: {
                productId: itemId,
                formatId: itemFormat,
                languageId: itemLanguage,
              },
              success: function (response) {
                // Handle success response
                console.log("Quantity incremented");

                // Set the value of the element with ID 'quantity' to response.latestQuantity
                $(`#cartQuantity-${itemId}-${itemFormat}-${itemLanguage}`).val(
                  response.latestQuantity
                );

                const itemPrice = $(
                  `#group-price-${itemId}-${itemFormat}-${itemLanguage}`
                ).data("item-price");
                const totalPrice = response.latestQuantity * itemPrice;
                $(`#group-price-${itemId}-${itemFormat}-${itemLanguage}`).html(
                  `₹${totalPrice}`
                );
                updateTotalAmount();
              },
              error: function (xhr, status, error) {
                console.error(error);
              },
            });
          }
        },
        error: function (xhr, status, error) {
          console.error(error);
        },
      });
    });
  });

  document.querySelectorAll(" .cart-decrease").forEach((button) => {
    button.addEventListener("click", function () {
      // Extracting data attributes from the clicked button
      const itemId = this.getAttribute("data-item-id");
      const itemFormat = this.getAttribute("data-item-format");
      const itemLanguage = this.getAttribute("data-item-language");

      // Now you can use itemId, itemFormat, and itemLanguage variables as needed

      if (
        $(`#cartQuantity-${itemId}-${itemFormat}-${itemLanguage}`).val() > 1
      ) {
        $.ajax({
          url: "/cart-decrement",
          method: "POST",
          data: {
            productId: itemId,
            formatId: itemFormat,
            languageId: itemLanguage,
          },
          success: function (response) {
            // Handle success response
            console.log("Quantity incremented");

            // Set the value of the element with ID 'quantity' to response.latestQuantity
            $(`#cartQuantity-${itemId}-${itemFormat}-${itemLanguage}`).val(
              response.latestQuantity
            );
            const itemPrice = $(
              `#group-price-${itemId}-${itemFormat}-${itemLanguage}`
            ).data("item-price");
            const totalPrice = response.latestQuantity * itemPrice;
            $(`#group-price-${itemId}-${itemFormat}-${itemLanguage}`).html(
              `₹${totalPrice}`
            );
            updateTotalAmount();
          },
          error: function (xhr, status, error) {
            console.error(error);
          },
        });
      }
    });
  });
}

function updateTotalAmount() {
  const groupPrices = [];
  $(".group-price").each(function (index, element) {
    // Get the text content of the element and remove whitespace and ₹ symbol
    const cleanedText = $(element).text().replace(/\s/g, "").replace("₹", "");
    // Convert the cleaned text content to a number
    const price = parseFloat(cleanedText);
    // Push the number into the groupPrices array
    groupPrices.push(price);
  });

  // Calculate the sum of all elements in the array using reduce()
  const subtotal = groupPrices.reduce(
    (total, currentValue) => total + currentValue,
    0
  );

  $(`#subtotal`).html(`₹${subtotal}`);

  const tax = 18;

  const taxAmount = (tax * subtotal) / 100;

  $(`#tax`).html(`₹${taxAmount}`);

  const total = taxAmount + subtotal;

  $(`#total`).html(`₹${total}`);

  $(`#totalAmount`).val(total);
}

const paymentMethodRadios = document.querySelectorAll(
  'input[name="paymentMethod"]'
);

// Loop through each radio button
paymentMethodRadios.forEach((radio) => {
  // Add event listener for change event
  radio.addEventListener("change", function () {
    // If this radio button is checked
    if (this.checked) {
      // Set the "checked" attribute for the initially checked radio button to false
      document
        .querySelector('input[name="paymentMethod"][checked]')
        .removeAttribute("checked");
      // Set the "checked" attribute for the currently checked radio button to true
      this.setAttribute("checked", "checked");
    }
  });
});

const addressRadios = document.querySelectorAll('input[name="addressIndex"]');

let addressIndex = document.getElementById("addressIndex").value;

$("#addressIndexStore").val(addressIndex);
console.log($("#addressIndexStore").val());

// Loop through each radio button
addressRadios.forEach((radio) => {
  // Add event listener for change event
  radio.addEventListener("change", function () {
    // If this radio button is checked
    if (this.checked) {
      // Log the value of the newly checked radio button
      addressIndex = this.value;
      $("#addressIndexStore").val(addressIndex);

      // Set the "checked" attribute for the initially checked radio button to false
      document
        .querySelector('input[name="addressIndex"][checked]')
        .removeAttribute("checked");

      // Set the "checked" attribute for the currently checked radio button to true
      this.setAttribute("checked", "checked");
    }
  });
});

document.getElementById("addAddressBtn").addEventListener("click", () => {
  document.getElementById("addAddress").style.display = "block";
  document.getElementById("addNoticeBtn").style.display = "none";
  document.getElementById("addAddressBtn").style.display = "none";
  document.getElementById("addressIndex").checked = false;
});

document.getElementById("addCancelBtn").addEventListener("click", () => {
  document.getElementById("addAddress").style.display = "none";
  document.getElementById("addNoticeBtn").style.display = "block";
  document.getElementById("addAddressBtn").style.display = "block";
  document.getElementById("addressIndex").checked = true;
});

// $(document).ready(function () {
//   $("#placeOrderBtn").click(function (event) {
//     event.preventDefault(); // Prevent default form submission

//     const formData = $("#placeOrderForm").serialize();

//     $.ajax({
//       url: "/place-order", // Endpoint to handle order placement
//       type: "POST", // HTTP method
//       data: formData, // Data to send to the backend
//       success: function (response) {
//         // Handle different payment methods
//         if (response.paymentMethod === "Razor Pay") {
//           console.log("Payment method is Razor Pay");

//           const options = {
//             key: response.razorpayKeyId, // Razorpay key ID
//             amount: response.razorpayAmount, // Amount to be paid
//             currency: "INR", // Currency
//             order_id: response.razorpayOrderId, // Razorpay order ID
//             prefill: {
//               name: response.customerName, // Customer's name
//               email: response.customerEmail, // Customer's email
//               contact: response.customerContact, // Customer's contact number
//               },

//             handler: function (paymentData) {

//                 $.ajax({
//                   url: "/update-payment-status", // Your backend endpoint for updating order status
//                   type: "POST",
//                   data: {
//                       orderId: response.orderId, // Your order ID
//                       paymentId:paymentData.razorpay_payment_id
//                   },
//                   success: function () {
//                     console.log("Order status updated successfully."); // Log successful update
//                     window.location.href = `/my-orders?orderId=${response.orderId}`;
//                   },
//                   error: function (jqXHR, textStatus, errorThrown) {
//                     console.error("Error updating order status:", errorThrown); // Log error
//                     alert(
//                       "An error occurred while updating order status. Please contact support."
//                     ); // User-friendly message
//                   },
//                 });

//               },

//           };

//           const razorpay = new Razorpay(options);
//           razorpay.open(); // Open Razorpay payment gateway
//         } else if (response.paymentMethod === "cod") {
//           console.log("Payment method is Cash On Delivery");
//           // Redirect to the order confirmation page for COD
//           window.location.href = `/my-orders?orderId=${response.orderId}`;
//         }
//       },
//       error: function (jqXHR, textStatus, errorThrown) {
//         console.error("Error placing order:", errorThrown); // Log errors
//         alert("Error placing order. Please try again."); // User-friendly error message
//       },
//     });
//   });
// });

$(document).ready(function () {
  $("#placeOrderBtn").click(function (event) {
    event.preventDefault();

    const formData = $("#placeOrderForm").serialize();

    $.ajax({
      url: "/place-order",
      type: "POST",
      data: formData,
      success: function (response) {
        if (response.paymentMethod === "Razor Pay") {
          const options = {
            key: response.razorpayKeyId,
            amount: response.razorpayAmount,
            currency: "INR",
            order_id: response.razorpayOrderId,
            prefill: {
              name: response.customerName,
              email: response.customerEmail,
              contact: response.customerContact,
            },
            handler: function (paymentData) {
              // Now create the database order with payment information

              // Extract key information from formData or other sources
              const formData = $("#placeOrderForm").serializeArray();

              const customerId = formData.find(
                (f) => f.name === "customerId"
              )?.value;
              const cartItems = formData.find(
                (f) => f.name === "cartItems"
              )?.value;
              const totalAmount = parseFloat(
                formData.find((f) => f.name === "totalAmount")?.value
              );
              const addressIndexStore = parseInt(
                formData.find((f) => f.name === "addressIndexStore")?.value,
                10
              );
              const paymentMethod = formData.find(
                (f) => f.name === "paymentMethod"
              )?.value;

              // Ensure all required fields are valid before sending to the backend
              if (
                !customerId ||
                !cartItems ||
                isNaN(totalAmount) ||
                isNaN(addressIndexStore)
              ) {
                console.error("Missing or invalid required fields.");
                return;
              }

              $.ajax({
                url: "/create-order",
                type: "POST",
                data: {
                  razorpayOrderId: response.razorpayOrderId,
                  customerId,
                  cartItems,
                  totalAmount,
                  addressIndexStore,
                  paymentId: paymentData.razorpay_payment_id,
                  paymentMethod,
                },
                success: function (response) {
                  window.location.href = `/my-orders?orderId=${response.orderId}`;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  console.error("Error creating order:", errorThrown);
                },
              });
            },
          };

          const razorpay = new Razorpay(options);
          razorpay.open();
        } else {
          window.location.href = `/my-orders?orderId=${response.orderId}`;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Error placing order:", errorThrown);
        alert("Error placing order. Please try again.");
      },
    });
  });
});
