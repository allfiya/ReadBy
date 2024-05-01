if (customerData) {
  document.querySelectorAll(" .cart-increase-cookie").forEach((button) => {
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

                

                const groupPrices = [];
                $(".group-price").each(function (index, element) {
                  // Get the text content of the element and remove whitespace and ₹ symbol
                  const cleanedText = $(element)
                    .text()
                    .replace(/\s/g, "")
                    .replace("₹", "");
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

                // // Update content if needed
                // updateContentInactive();
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

  document.querySelectorAll(" .cart-decrease-cookie").forEach((button) => {
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
              
            const groupPrices = [];
            $(".group-price").each(function (index, element) {
              // Get the text content of the element and remove whitespace and ₹ symbol
              const cleanedText = $(element)
                .text()
                .replace(/\s/g, "")
                .replace("₹", "");
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

            // // Update content if needed
            // updateContentInactive();
          },
          error: function (xhr, status, error) {
            console.error(error);
          },
        });
      }
    });
  });

  $(document).ready(function () {
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
  });
} else if (cartCookie) {
  document.querySelectorAll(" .cart-increase-cookie").forEach((button) => {
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
            $(`#quantityCookie-${itemId}-${itemFormat}-${itemLanguage}`).val() <
            stock
          ) {
            $.ajax({
              url: "/cart-increment-cookie",
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
                $(
                  `#quantityCookie-${itemId}-${itemFormat}-${itemLanguage}`
                ).val(response.latestQuantity);
                const itemPrice = $(
                  `#group-price-${itemId}-${itemFormat}-${itemLanguage}`
                ).data("item-price");
                const totalPrice = response.latestQuantity * itemPrice;
                $(`#group-price-${itemId}-${itemFormat}-${itemLanguage}`).html(
                  `₹${totalPrice}`
                  );
                  
                const groupPrices = [];
                $(".group-price").each(function (index, element) {
                  // Get the text content of the element and remove whitespace and ₹ symbol
                  const cleanedText = $(element)
                    .text()
                    .replace(/\s/g, "")
                    .replace("₹", "");
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

                // // Update content if needed
                // updateContentInactive();
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

      // Now you can use itemId, itemFormat, and itemLanguage variables as needed
    });
  });

  document.querySelectorAll(" .cart-decrease-cookie").forEach((button) => {
    button.addEventListener("click", function () {
      // Extracting data attributes from the clicked button
      const itemId = this.getAttribute("data-item-id");
      const itemFormat = this.getAttribute("data-item-format");
      const itemLanguage = this.getAttribute("data-item-language");

      // Now you can use itemId, itemFormat, and itemLanguage variables as needed

      if (
        $(`#quantityCookie-${itemId}-${itemFormat}-${itemLanguage}`).val() > 1
      ) {
        $.ajax({
          url: "/cart-decrement-cookie",
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
            $(`#quantityCookie-${itemId}-${itemFormat}-${itemLanguage}`).val(
              response.latestQuantity
            );
            const itemPrice = $(
              `#group-price-${itemId}-${itemFormat}-${itemLanguage}`
            ).data("item-price");
            const totalPrice = response.latestQuantity * itemPrice;
            $(`#group-price-${itemId}-${itemFormat}-${itemLanguage}`).html(
              `₹${totalPrice}`
              );
              
            const groupPrices = [];
            $(".group-price").each(function (index, element) {
              // Get the text content of the element and remove whitespace and ₹ symbol
              const cleanedText = $(element)
                .text()
                .replace(/\s/g, "")
                .replace("₹", "");
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

            // // Update content if needed
            // updateContentInactive();
          },
          error: function (xhr, status, error) {
            console.error(error);
          },
        });
      }
    });
  });

  $(document).ready(function () {
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
  });
}

const searchField = document.getElementById("search-field");

searchField.addEventListener("keydown", function (event) {
  // Check if Enter key is pressed (key code 13)
  if (event.keyCode === 13) {
    const searchTerm = searchField.value.trim();
    if (searchTerm.length > 0) {
      // Redirect to /library route with search query as URL parameter
      window.location.href = `/library?search=${encodeURIComponent(
        searchTerm
      )}`;
    }
  }
});
