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
