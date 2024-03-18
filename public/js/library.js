$(document).ready(function () {
  $(".drop-menu-item-category").hover(function () {
    let categoryId = $(this).find(".nested-drop-menu").data("category-id");
    let nestedMenu = $(this).find(".nested-drop-menu");

    // Make AJAX request to fetch subcategories
    $.ajax({
      url: "/getSubcategories",
      method: "GET",
      data: { categoryId: categoryId },
      success: function (subcategories) {
        // Clear existing items
        nestedMenu.empty();

        // Populate subcategories
        subcategories.forEach(function (subcategory) {
          // Replace spaces with &nbsp;
          let subcategoryName = subcategory.name.replace(/ /g, "&nbsp;");
          nestedMenu.append(
            '<li class="nested-drop-menu-item"><a href="#">' +
              subcategoryName +
              "</a></li>"
          );
        });
      },
    });
  });
});

$(function () {
  $(".heart").on("click", function () {
    $(this).toggleClass("is-active");
  });
});

// $(document).ready(function () {
//     $(".language-filter").on("change", function () {
//       const selectedLanguages = $(".language-filter:checked")
//         .map(function () {
//           return $(this).data("language-id");
//         })
//         .get();
  
//       // Construct the query string with selected language IDs
//       const queryString = $.param({ languages: selectedLanguages }, true);
  
//       // Update the URL without reloading the page
//       history.pushState(null, null, "/library?" + queryString);
  
//       // Make AJAX request to /library route with the constructed query string
//       $.ajax({
//         url: "/library?" + queryString,
//         method: "GET",
//         success: function (data) {
//           console.log("AJAX request successful");
//         },
//         error: function (err) {
//           console.error(err);
//         },
//       });
//     });
//   });
  

$(document).ready(function () {
    $(".language-filter").on("change", function () {
      const selectedLanguages = $(".language-filter:checked")
        .map(function () {
          return $(this).data("language-id");
        })
        .get();
  
      // Construct the query string with selected language IDs
      const queryString = $.param({ language: selectedLanguages }, true);
  
      // Update the URL without reloading the page
      history.pushState(null, null, "/library?" + queryString);
  
      // Reload the page
      window.location.reload();
    });
  });
  