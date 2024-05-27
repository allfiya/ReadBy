// POPOVER FOR WISHLIST

const popoverTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="popover"]')
);
const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl);
});


function showToast() {

    $("#toast").html(`

    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div id="liveToast" class="toast hide" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <img src="..." class="rounded me-2" alt="...">
          <strong class="me-auto">Bootstrap</strong>
          <small>11 mins ago</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          Hello, world! This is a toast message.
        </div>
      </div>
    </div>`)
    
}

// ADD TO WISHLIST - LIKE ANIMATION - REMOVE FROM WISHLIST

$(".heart").on("click", function () {
  const $heart = $(this);
  const dataId = $heart.data("id");

  if ($heart.hasClass("is-active")) {
    // If the heart is active, remove it from the wishlist
    $heart.removeClass("is-active");

    $.ajax({
      url: "/remove-from-wishlist",
      method: "POST",
      data: { productId: dataId },
      success: function (response) {
        $("#recently-viewed .heart[data-id='" + dataId + "']").removeClass(
          "is-active"
          );
      },
      error: function (error) {
        console.error("Error removing from wishlist:", error);
      },
    });
  } else {
    // If the heart is not active, add it to the wishlist
    $heart.addClass("is-active");

    $.ajax({
      url: "/add-to-wishlist",
      method: "POST",
      data: { productId: dataId },
      success: function (response) {
        $("#recently-viewed .heart[data-id='" + dataId + "']").addClass(
          "is-active"
        );
      },
      error: function (error) {
        console.error("Error adding to wishlist:", error);
      },
    });
  }
});

$(".heart-below").on("click", function () {
  const $heart = $(this);
  const dataId = $heart.data("id");

  if ($heart.hasClass("is-active")) {
    // If the heart is active, remove it from the wishlist
    $heart.removeClass("is-active");

    $.ajax({
      url: "/remove-from-wishlist",
      method: "POST",
      data: { productId: dataId },
      success: function (response) {
      },
      error: function (error) {
        console.error("Error removing from wishlist:", error);
      },
    });
  } else {
    // If the heart is not active, add it to the wishlist
    $heart.addClass("is-active");

    $.ajax({
      url: "/add-to-wishlist",
      method: "POST",
      data: { productId: dataId },
      success: function (response) {
      },
      error: function (error) {
        console.error("Error adding to wishlist:", error);
      },
    });
  }
});




