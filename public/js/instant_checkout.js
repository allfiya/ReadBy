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
                      `₹${totalPrice}

                      <i data-item-id="${itemId}"
                data-item-format="${itemFormat}"
                data-item-language="${itemLanguage}"
                class="bi delete bi-trash3-fill text-danger fs-3 mt-5"></i>
                    `
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
                  `₹${totalPrice}
                  <i data-item-id="${itemId}"
                  data-item-format="${itemFormat}"
                  data-item-language="${itemLanguage}"
                  class="bi delete bi-trash3-fill text-danger fs-3 mt-5"></i>`
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
  