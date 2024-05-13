$(".credit-card").on("click", function () {
  const walletIndex = $(this).data("index"); // Get the wallet index

  // Send AJAX request to fetch wallet details
  $.ajax({
    url: `/wallet/${walletIndex}`, // Endpoint to fetch wallet details
    type: "GET",
    success: function (data) {
      // Update the transactions-wrapper with the received data
      $(".transactions-wrapper .transactions").empty(); // Clear previous content

      $("#wallet-balance").html(`₹${data.totalAmount}`);

      // Assuming data.transactions is an array of transaction logs
      data.transactions.forEach(function (transaction) {
        if (transaction.transactionType === "debit") {
          $(".transactions-wrapper .transactions").append(
            `<div class="transaction-item ">
                    <div class="transaction-item_details">
                        <h6>Order Id: ${transaction.orderId}</h6><span class="details">${transaction.date}</span>
                    </div>
                    <div class="transaction-item_amount"><span>$</span>
                        <p class="amount text-danger">-₹${transaction.amount}</p>
                    </div>
                </div>`
          );
        } else {
          $(".transactions-wrapper .transactions").append(
            `<div class="transaction-item ">
                        <div class="transaction-item_details">
                            <h6>Order Id: ${transaction.orderId}</h6><span class="details">${transaction.date}</span>
                        </div>
                        <div class="transaction-item_amount"><span>$</span>
                            <p class="amount text-success">+₹${transaction.amount}</p>
                        </div>
                    </div>`
          );
        }
      });
    },
    error: function (err) {
      console.error("Error fetching wallet details:", err);
    },
  });
});

$("#createWalletBtn").on("click", function () {
  $("#createWallet").submit(function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get form data
    const amount = $("#amount").val();
    const pin = $("#pin").val();
    const name = $("#name").val();
    const userId = $("#userId").val();

    // Fetch Razorpay key asynchronously
    $.ajax({
      type: "POST",
      url: "/create-razorpayOrder",
      data: {
        amount: amount,
      },
      success: function (response) {
        const razorpayKey = response.razorpayKey;
        const razorId = response.razorpayOrder.id;

        // Razorpay initialization code
        const options = {
          key: razorpayKey,
          amount: amount * 100,
          currency: "INR",
          name: "Readby Wallet",
          description: "Wallet Top-up",
          image: "your_logo_url",
          order_id: razorId,
          notes: {
            userId: userId,
            amount: amount,
            pin: pin,
            name: name,
          },

          handler: function (response) {},

          // Other options
        };

        const rzp2 = new Razorpay(options);

        // Open the modal to initiate payment
        rzp2.open();
      },
      error: function () {
        alert("Failed to get Razorpay key.");
      },
    });
  });
});
