$("#refundButton").on("click", function () {
  const orderId = $(this).data("order-id");

  $.ajax({
    url: "/refund-order",
    method: "POST",
    data: { orderId: orderId },
    success: function (response) {

      if (response.refundStatus === "processed") {
          alert("Amount Refunded Successfully!");
          window.location.href = `/admin/payments`;
      } else if (response.refundStatus === "failed") {
        alert("Amount refunding failed!");
      }
    },
    error: function (error) {
      console.error(error);
    },
  });
});


