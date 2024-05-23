
$(document).ready(function () {
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
});
