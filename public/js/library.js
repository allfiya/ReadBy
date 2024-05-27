$(".language-filter, .author-filter, .format-filter, .publisher-filter").on(
  "change",
  function () {
    const selectedLanguages = $(".language-filter:checked")
      .map(function () {
        return $(this).data("language-id");
      })
      .get();

    const selectedAuthors = $(".author-filter:checked")
      .map(function () {
        return $(this).data("author-id");
      })
      .get();

    const selectedFormats = $(".format-filter:checked")
      .map(function () {
        return $(this).data("format-id");
      })
      .get();

    const selectedPublishers = $(".publisher-filter:checked")
      .map(function () {
        return $(this).data("publisher-id");
      })
      .get();

    // Construct the query string with selected language IDs and author IDs
    const queryString = $.param(
      {
        language: selectedLanguages,
        author: selectedAuthors,
        format: selectedFormats,
        publisher: selectedPublishers,
      },
      true
    );

    // Update the URL without reloading the page
    history.pushState(null, null, "/library?" + queryString);

    // Reload the page
    window.location.reload();
  }
);

$(".all-product").each(function () {
  const productId = $(this).data("id");
  const $starInside = $(this).find(".rating-section");
  $.ajax({
    url: `/get-averageRating`,
    type: "POST",
    data: { productId },
    success: function (res) {
      const averageRating = res.averageRatingInNumber;

      if (averageRating === 0) {
        $starInside.addClass("bg-secondary");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      } else if (averageRating < 4) {
        $starInside.addClass("bg-warning");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      } else {
        $starInside.addClass("bg-success");
        $starInside.html(`${averageRating}<i class="bi ms-1  bi-star-fill"></i>`);
      }
    },
  });
});


$(".best-sellers").each(function () {
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

