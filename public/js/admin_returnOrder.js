$("#rejectReturnRequest").click(() => {
  const orderId = $("#rejectReturnRequest").val();

  console.log(orderId);

  $.ajax({
    url: "/admin/reject-return-request",
    type: "POST",
    data: { orderId },
    success: function (response) {
      console.log(response);
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});

$("#approveReturnRequest").click(() => {
  const orderId = $("#approveReturnRequest").val();

  $.ajax({
    url: "/admin/approve-return-request",
    type: "POST",
    data: { orderId },

    success: function (response) {
      console.log(response);
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});

$("#pickedReturnPackage").click(() => {
  const orderId = $("#pickedReturnPackage").val();

  $.ajax({
    url: "/admin/pickedUp-return-package",
    type: "POST",
    data: { orderId },

    success: function (response) {
      console.log(response);
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});

// $("#refundCODReturnPayment").click(() => {
//   const orderId = $("#refundCODReturnPayment").val();
//   const holderName = $("#holderName").val();
//   const accountNumber = $("#accountNumber").val();
//   const ifsc = $("#ifsc").val();
//   const totalAmount = $("#totalAmount").val();

//   $.ajax({
//     url: "/admin/return-refund-cod",
//     type: "POST",
//     data: { orderId, holderName, accountNumber, ifsc, totalAmount },

//     success: function (response) {
//       console.log("Refund Status: ", response.refundStatus);

//       if (response.refundStatus === "processed") {
//         alert("Amount Refunded Successfully!");
//         window.location.href = `/admin/orders`;
//       } else if (response.refundStatus === "failed") {
//         alert("Amount refunding failed!");
//       }
//     },
//     error: function (xhr, status, error) {
//       console.error(error);
//     },
//   });
// });

$("#refundCODReturnPayment").click(() => {
  const orderId = $("#refundCODReturnPayment").val();
  const holderName = $("#holderName").val();
  const accountNumber = $("#accountNumber").val();
  const ifsc = $("#ifsc").val();
  const totalAmount = $("#totalAmount").val();

  $.ajax({
    url: "/admin/return-refund-cod",
    type: "POST",
    data: { orderId },

    success: function (response) {
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});

$("#completeReturnProcess").click(() => {
  const orderId = $("#completeReturnProcess").val();
  $.ajax({
    url: "/admin/complete-return-proccess",
    type: "POST",
    data: { orderId },

    success: function (response) {
      window.location.reload();
    },
    error: function (xhr, status, error) {
      console.error(error);
    },
  });
});

$("#refundReturnPayment").on("click", function () {
  const orderId = $("#refundReturnPayment").val();

  $.ajax({
    url: "/refund-order",
    method: "POST",
    data: { orderId: orderId },
    success: function (response) {
      console.log("Refund Status: ", response.refundStatus);
      if (response.refundStatus === "processed") {
        alert("Amount Refunded Successfully!");
        window.location.reload()
      } else if (response.refundStatus === "failed") {
        alert("Amount refunding failed!");
      }
    },
    error: function (error) {
      console.error(error);
    },
  });
});
