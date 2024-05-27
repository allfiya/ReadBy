

$(".top-rated").each(function () {
  const productId = $(this).data("id");
  const $starInside = $(this).find('.stars-inner');
  $.ajax({
    url: `/get-averageRating`,
    type: "POST",
    data: { productId },
    success: function (res) {
      const averageRating = res.averageRating;
      
      $starInside.css("width", `${averageRating}%`);
      
      
    },
  });
});
