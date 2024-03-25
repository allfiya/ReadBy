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