$(function () {
  $(".heart").on("click", function () {
    $(this).toggleClass("is-active");
  });
});

$(document).ready(function () {
  // Set up the click event listener for the cancel button
  $("#user-cancel-btn").click(function () {
    // Get the order ID to be cancelled (this may vary depending on your setup)
    const orderId = getOrderId(); // Assume this function retrieves the current order ID

    // Perform the AJAX POST request to cancel the order
    $.ajax({
      url: "/cancel-order", // Your API endpoint to handle order cancellation
      type: "POST", // Using POST for data modification
      data: {
        order_id: orderId, // Data to send to the server, you might need more info
      },
      // Successful AJAX response
      success: function (response) {
        $("#user-cancel-btn").remove();

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

          console.log("before");

          $("#order-status").remove(); // Removal operation
          console.log("after");

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
});
