const tax = 18;
let isCouponApplied = false;
let appliedCouponCode = null; // Variable to store the applied coupon code

// This function checks if it's the first time the page is loaded
function isFirstLoad() {
  // Try to get a value from local storage
  const firstLoad = localStorage.getItem("firstLoad");

  if (firstLoad === null) {
    // If there's no value, it means it's the first time
    // Set the value in local storage
    localStorage.setItem("firstLoad", "no");
    return true;
  } else {
    // If there's a value, it means the page has been loaded before
    return false;
  }
}

window.addEventListener("DOMContentLoaded", (event) => {
  if (isFirstLoad()) {
    // It's the first time, no need to do anything
    console.log("First load, no alert.");
  } else {
    // If it's not the first time, add the beforeunload event listener
    window.addEventListener("beforeunload", (e) => {
      const confirmationMessage =
        "Are you sure you want to leave or refresh the page?";

      // This line is necessary to trigger the browser's default behavior
      (e || window.event).returnValue = confirmationMessage;

      // Return the confirmation message
      return confirmationMessage;
    });
  }
});

function changePaymentValue(amount) {
  $("#totalAmount").val(amount);
}

function triggerAjaxForStep3() {
  $.ajax({
    url: "/get-coupons",
    type: "GET",
    success: function (response) {
      let initialContent = `
            <input id="couponCode" type="text" placeholder="Enter coupon code" class="py-2 my-4 px-3 col-9 me-3" style="border-radius: 5px; border: none;">
            <button id="applyCoupon" class="btn btn-outline-dark">Apply</button>
            <div class="d-flex justify-content-end">
              <a href="" class="text-decoration-none">View all coupons</a>
            </div>`;

      response.coupons.forEach((coupon) => {
        initialContent += `
              <div class="coupon-bg p-3 mb-3 text-center">
                <h6>${coupon.description}</h6>
                <div class="d-flex justify-content-center align-items-center">
                  <span class="code-pt col-6 bg-light d-flex align-items-center justify-content-center">${coupon.code}</span>
                  <button class="copy-pt col-4 btn btn-light">COPY CODE</button>
                </div>
              </div>`;
      });

      function setupEventHandlers() {
        $(".copy-pt")
          .off("click")
          .on("click", function () {
            const code = $(this).siblings(".code-pt").text();
            navigator.clipboard.writeText(code);
            $(this).text("COPIED");
            setTimeout(() => $(this).text("COPY CODE"), 2000);
          });

        $("#applyCoupon")
          .off("click")
          .on("click", function () {
            const enteredCode = $("#couponCode").val().trim();
            const rawTotal = $("#total").html(); // example: '₹520'

            const cleanedTotal = rawTotal.replace("₹", ""); // Ensures all non-numeric characters are removed
            const numericTotal = parseFloat(cleanedTotal);

            $.ajax({
              url: "/apply-coupon",
              type: "POST",
              data: {
                code: enteredCode,
                total: numericTotal,
              },
              success: function (response) {
                $("#total").html(
                  `₹${response.changedTotal} <strike id="strike-amount" class="text-secondary">₹${numericTotal}</strike> <span class="text-success">₹${response.reducedAmount} Saved!</span>`
                );

                // Update the coupon section to show the applied coupon with an option to remove
                $("#coupon-section").html(`
                    <span class="text-success mt-4 ms-2 fw-bold">Coupon Applied!</span>
                    <div class="coupon-bg p-3 mt-2 text-center">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="text-light fw-bold">${response.code}</div>
                        <button class="btn" id="remove-coupon">Remove</button>
                      </div>
                    </div>`);

                isCouponApplied = true;
                appliedCouponCode = response.code;

                // Re-bind the remove-coupon event handler
                $("#remove-coupon")
                  .off("click")
                  .on("click", function () {
                    // Reset to initial content and rebind event handlers
                    $("#coupon-section").html(initialContent);
                    $("#total").html(`₹${numericTotal}`);
                    isCouponApplied = false;
                    appliedCouponCode = null;

                    changePaymentValue(numericTotal);

                    setupEventHandlers(); // Re-bind handlers for newly created content
                  });

                changePaymentValue(response.changedTotal);
              },
              error: function (error) {
                console.error("AJAX POST error:", error);
              },
            });
          });
      }

      $("#coupon-section").html(initialContent);

      // Update coupon section with initial content
      setupEventHandlers(); // Bind the initial event handlers
    },
    error: function (error) {
      console.error("AJAX GET error:", error);
    },
  });
}

$(document).ready(function ($) {
  // Function to handle showing a step and triggering an AJAX request if it's the 3rd step

  function showStep(step) {
    $(".step-content").hide(); // Hide all content sections
    $(`.step-${step}-content`).show(); // Show the desired step's content
    $(".process-wrap").attr("class", `process-wrap active-step${step}`); // Update process-wrap class

    if (step === 3) {
      if (isCouponApplied && appliedCouponCode) {
        $("#coupon-section").html(`
                <span class="text-success mt-4 ms-2 fw-bold" style="font-size:small;">Coupon Applied</span>
                <div class="coupon-bg p-3 mt-2 text-center">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-light fw-bold">'${appliedCouponCode}'</div>
                        <button class="btn" id="remove-coupon">Remove Coupon</button>
                    </div>
                </div>
            `);

        const rawTotal = $("#strike-amount").html(); // example: '₹520'

        const cleanedTotal = rawTotal.replace("₹", ""); // Ensures all non-numeric characters are removed
        const numericTotal = parseFloat(cleanedTotal);

        // Re-bind the remove-coupon event handler
        $("#remove-coupon")
          .off("click")
          .on("click", function () {
            isCouponApplied = false;
            appliedCouponCode = null;

            $("#total").html(`₹${numericTotal}`);
            updateTotalAmount(numericTotal);

            // Reset the coupon section with the fetched coupons
            triggerAjaxForStep3(); // Re-fetch and display the coupons
            setupEventHandlers(); // Re-bind event handlers
          });
      } else {
        // If no coupon is applied, fetch and display available coupons
        triggerAjaxForStep3();
      }
    } else {
      // Clear coupon section for other steps
      $("#coupon-section").html("");
    }
  }

  // Function to register event handlers for step transitions
  function registerStepTransitions() {
    const stepTransitions = [
      { selector: "#moveToStep2", step: 2 },
      { selector: "#moveToStep3", step: 3 },
      { selector: "#moveToStep4", step: 4 },
      { selector: "#moveBackToStep3", step: 3 },
      { selector: "#moveBackToStep2", step: 2 },
      { selector: "#moveBackToStep1", step: 1 },
    ];

    stepTransitions.forEach((transition) => {
      $(transition.selector).click(() => {
        showStep(transition.step);
      });
    });
  }

  // Register the transitions and start at the appropriate step
  if (customer) {
    registerStepTransitions();
    showStep(2); // Default start at Step 2
    updateTotalAmount(); // Ensure total amount is updated
  }

  // Handle clicks on the process steps and call AJAX when reaching Step 3
  $(".process-step").click(function () {
    const theClass = $(this)
      .attr("class")
      .match(/(^|\s)step-\S+/g);
    const step = theClass ? $.trim(theClass[0]).split("-")[1] : null;

    if (step && customer) {
      showStep(parseInt(step)); // Ensure it's parsed to integer
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

                if (!isCouponApplied) {
                  triggerAjaxForStep3();
                }
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
            if (!isCouponApplied) {
              triggerAjaxForStep3();
            }
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

$(document).ready(function () {
  $("#placeOrderBtn").click(function () {
    const form = $("#placeOrderForm");

    form.off("submit").on("submit", function (event) {
      event.preventDefault(); // Prevent default form submission

      const paymentMethod = $('input[name="paymentMethod"]:checked').val();
      const orderData = {
        customerId: form.find('input[name="customerId"]').val(),
        cartItems: JSON.parse(form.find('input[name="cartItems"]').val()),
        totalAmount: form.find('input[name="totalAmount"]').val(),
        addressIndexStore: form.find('input[name="addressIndexStore"]').val(),
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
      };

      if (paymentMethod === "Razor Pay") {
        $.ajax({
          type: "POST",
          url: "/create-order",
          data: orderData,
          success: function (response) {
            console.log("Order creation successful");

            const orderId = response.orderId;
            const razorId = response.razorpayOrder.id;

            // Razorpay options for payment
            const options = {
              key: response.razorpayKey,
              amount: orderData.totalAmount * 100,
              currency: "INR",
              name: "ReadBy",
              description: "Test Transaction",
              order_id: razorId,
              handler: function () {
                window.location.href = `/my-orders?orderId=${orderId}`;
              },
              modal: {
                ondismiss: function () {
                  $.ajax({
                    type: "POST",
                    url: "/update-order-status",
                    data: {
                      orderId: orderId,
                      paymentStatus: "cancelled",
                      razorpayPaymentId: razorId,
                    },
                    success: function (response) {
                      console.log(
                        "Razorpay modal was closed without completing payment."
                      );

                      alert("Payment process was interrupted. You can retry.");
                    },
                  });
                },
              },
              prefill: {
                name: response.customerName,
                email: response.customerEmail,
                contact: response.customerContact,
              },
              notes: {
                address: "Your Address",
              },
              theme: {
                color: "#F37254",
              },
            };

            // Create a Razorpay instance
            const rzp1 = new Razorpay(options);

            // Open the modal to initiate payment
            rzp1.open();
          },
          error: function (err) {
            alert("Failed to create order.");
          },
        });
      } else {
        $.ajax({
          type: "POST",
          url: "/place-order",
          data: orderData,
          success: function () {
            alert("Order placed successfully!");
          },
          error: function () {
            alert("Failed to place order.");
          },
        });
      }
    });
  });
});

const cpnBtn = document.getElementsByClassName("copy_btn");
const cpnCode = document.getElementsByClassName("copy_code");

if (cpnBtn) {
  cpnBtn.onclick = function () {
    navigator.clipboard.writeText(cpnCode.innerHTML);
    cpnBtn.innerHTML = "COPIED";
    setTimeout(function () {
      cpnBtn.innerHTML = "COPY CODE";
    }, 3000);
  };
}
