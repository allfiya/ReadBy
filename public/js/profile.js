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
  

const searchField = document.getElementById('search-field');

searchField.addEventListener('keydown', function(event) {
    // Check if Enter key is pressed (key code 13)
    if (event.keyCode === 13) {
        const searchTerm = searchField.value.trim();
        if (searchTerm.length > 0) {
            // Redirect to /library route with search query as URL parameter
            window.location.href = `/library?search=${encodeURIComponent(searchTerm)}`;
        }
    }
});



