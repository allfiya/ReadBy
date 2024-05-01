// ADMIN DASHBOARD SIDE MENU EXPANSION

const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});

$(document).ready(function () {
  // Define a function to handle the change event for all status dropdowns
  const handleStatusChange = function () {
    const orderId = $(this).attr("id").split("_")[1]; // Extracting the order ID from the dropdown's ID
    const selectedStatus = $(this).val(); // Get the selected status

    if (selectedStatus) {
      $.ajax({
        type: "POST",
        url: "/admin/change-order-status", // Your endpoint URL
        data: {
          orderId: orderId,
          selectedStatus: selectedStatus,
        },
        success: function (response) {
          // This function updates the dropdown with the new status
          const statusElementId = `status_${orderId}`;
          const statusHtml = createStatusDropdown(response.newStatus, orderId); // Generate the updated dropdown

          $(`#${statusElementId}`).html(statusHtml); // Replace the old dropdown with the updated one

          // Re-attach the event handler to the new dropdown
          $(`#itemDropdown_${orderId}`).change(handleStatusChange);
        },
        error: function (xhr, status, error) {
          console.error("Error updating order status:", error);
        },
      });
    }
  };

  // Attach the event handler to all status dropdowns on page load
  $('[id^="itemDropdown_"]').change(handleStatusChange);
});

// Function to generate the correct status dropdown based on the new status
function createStatusDropdown(newStatus, orderId) {
  const options = [
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
  ];

  let dropdown = `<select class="status_btn ${newStatus}-btn  py-2 px-2" id="itemDropdown_${orderId}">`;

  options.forEach((option) => {
    const selected = option.value === newStatus ? "selected" : "";
    dropdown += `<option class="bg-light text-dark" value="${option.value}" ${selected}>${option.label}</option>`;
  });

  dropdown += `</select>`;

  return dropdown;
}
