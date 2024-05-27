let cancelledReason = "";

const $textarea = $("#cancelled_reason");

$textarea.on("input", function () {
  cancelledReason = $(this).val();
});

// Set up the click event listener for the cancel button
$("#cod-cancel").click(function () {
  const orderId = getOrderId();

  // Perform the AJAX POST request to cancel the order
  $.ajax({
    url: "/cancel-cod-order", // Your API endpoint to handle order cancellation
    type: "POST", // Using POST for data modification
    data: {
      order_id: orderId,
      cancelled_reason: cancelledReason, // Data to send to the server, you might need more info
    },
    // Successful AJAX response
    success: function (response) {
      $("#cod-cancel").remove();

      const cancelled_at = response.cancelled_at;

      // Check if `cancelled_at` is a valid Date object or undefined
      if (cancelled_at) {
        const date = new Date(cancelled_at); // Convert to a Date object
        const dateOptions = {
          day: "numeric",
          month: "short",
          year: "numeric",
        };

        const cancelledDate = date.toLocaleDateString("en-GB", dateOptions); // Format the date

        $("#order-status").remove(); // Removal operation

        // Display the formatted date
        $("#order-status-custom").html(`Order Cancelled On ${cancelledDate}`);
      } else {
        console.error("Cancelled date is undefined or invalid.");
      }
    },

    error: function (xhr, status, error) {
      // Handle errors, e.g., display an error message
      console.error("Error cancelling order:", error);
      alert("Failed to cancel the order. Please try again later.");
    },
  });
});

function getOrderId() {
  // Return the order ID from your application context
  // This might be fetched from a data attribute, a hidden input, or elsewhere
  return $("#order-id").val(); // Example of getting order ID from a hidden field
}

// Attach click event handler to the button
$("#retryPaymentBtn").click(function () {
  const orderId = $(this).val();

  $.ajax({
    type: "GET",
    url: "/fetch-razorpayKey",
    success: function (response) {
      const razorpayKey = response.razorpayKey;
      $.ajax({
        type: "POST", // or "POST" depending on your server route
        url: "/fetch-order-details", // Update with your server route
        data: {
          orderId: orderId,
        },
        success: function (response) {
          const amount = response.totalAmount * 100;
          const razorpayOrderId = response.razorpayOrderId;

          let isGeneral;
          let isWallet;

          if (response.paymentMethod === "Razor Pay") {
            isGeneral = true;
          } else if (response.paymentMethod === "Wallet") {
            isWallet = true;
          }

          // Create Razorpay options
          const options = {
            key: razorpayKey,
            amount: amount,
            currency: "INR",
            name: "ReadBy",
            description: "Test Transaction",
            order_id: razorpayOrderId,
            notes: {
              wallet: isWallet,
              general: isGeneral,
              userId: response.userId,
              walletAmount: response.fromWallet,
            },
            handler: function (response) {
              window.location.href = `/my-orders?orderId=${orderId}`;
            },
            modal: {
              ondismiss: function () {
                if (isGeneral) {
                  $.ajax({
                    type: "POST",
                    url: "/update-order-status",
                    data: {
                      orderId: orderId,
                      paymentStatus: "cancelled",
                      razorpayPaymentId: razorpayOrderId,
                    },
                    success: function (response) {
                      alert("Payment process was interrupted. You can retry.");
                    },
                  });
                } else {
                  $.ajax({
                    type: "POST",
                    url: "/update-wallet-order-status",
                    data: {
                      orderId: orderId,
                      paymentStatus: "cancelled",
                      razorpayPaymentId: razorpayOrderId,
                      walletAmount: response.fromWallet,
                    },
                    success: function (response) {
                      alert("Payment process was interrupted. You can retry.");
                    },
                  });
                }
              },
            },
            prefill: {
              name: "",
              email: "",
              contact: "",
            },
            theme: {
              color: "#F37254",
            },
          };

          // Create a new Razorpay instance
          const rzp = new Razorpay(options);

          // Open Razorpay modal to initiate payment
          rzp.open();
        },
        error: function (xhr, status, error) {
          // Handle error
          console.error("Failed to fetch order details:", error);
          alert("Failed to fetch order details. Please try again later.");
        },
      });
    },
    error: function () {
      alert("Failed to get Razorpay key.");
    },
  });

  // Make AJAX request to fetch order details
});

let isAddingToWallet;

$("#payment-order-cancel").click(function () {
  const orderId = getOrderId();

  // Perform the AJAX POST request to cancel the order
  if (isAddingToWallet) {
    $.ajax({
      url: "/refund-to-wallet",
      method: "POST",
      data: { orderTotal, orderId, cancelledReason },
      success: function (response) {
        window.location.reload();
      },
      error: function (xhr, status, error) {
        console.error(error);
      },
    });
  } else {
    $.ajax({
      url: "/refund-to-account",
      method: "POST",
      data: { orderId, cancelledReason },
      success: function (response) {
        window.location.reload();
      },
      error: function (xhr, status, error) {
        console.error(error);
      },
    });
  }
});

$("#NO").click(function () {
  isAddingToWallet = false;

});

$("#YES").click(function () {
  isAddingToWallet = true;
});

$("#submitReturnRequest").click(function () {
  const orderId = $(this).data("id");
  const returnReason = $("#returnReason").val();
  const bankName = $("#bankName").val();
  const branchName = $("#branchName").val();
  const accountNumber = $("#accountNumber").val();
  const holderName = $("#holderName").val();
  const ifsc = $("#ifsc").val();
  const contactNumber = $("#contactNumber").val();
  const files = $("#returnProof")[0].files;

  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("returnReason", returnReason);
  formData.append("bankName", bankName);
  formData.append("branchName", branchName);
  formData.append("accountNumber", accountNumber);
  formData.append("holderName", holderName);
  formData.append("ifsc", ifsc);
  formData.append("contactNumber", contactNumber);

  for (let i = 0; i < files.length; i++) {
    formData.append("proof", files[i]);
  }

  $.ajax({
    url: "/return-request",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});


$(".suggestion-book").each(function () {
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