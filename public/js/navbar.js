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

$("#search-field").on("keydown", function (event) {
  // Check if Enter key is pressed (key code 13)
  if (event.keyCode === 13) {
    $("#search").submit();
  }
});

$("#search").on("submit", function (event) {
  event.preventDefault();

  const searchTerm = $("#search-field").val().trim();
  if (searchTerm.length > 0) {
    $.ajax({
      url: "/add-to-recentSearch",
      type: "POST",
      data: { searchTerm },
      success: function (res) {
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        window.location.href = `/library?search=${encodedSearchTerm}`;
      },
    });
  }
});

$("#search-field").on("input", function () {
  const searchText = $(this).val().trim();

  if (searchText === "") {
    $("#search-suggestion").hide();
    if (!$("#recent-search").html(``)) {
      $("#recent-search").show(); // Show recent searches if input is empty
    }
  } else {
    $("#recent-search").hide(); // Hide recent searches when typing
    $.ajax({
      url: "/search-suggestion",
      type: "GET",
      data: { text: searchText },
      success: function (response) {
        if (response.products.length > 0 || response.authors.length > 0) {
          let htmlContent = ``;

          response.products.forEach((product) => {
            htmlContent += `
              <div class="d-flex align-items-center justify-content-between">    
              <div data-id="${product._id}" style="font-size: medium;" class="my-1 d-flex align-items-center showProduct col-11 ps-2">
              <img class="col-1 me-2" height="35" src="/${product.images[0]}" alt="">
                  ${product.title}
                </div>
                <i class="bi bi-search my-1 fs-5 pe-3"></i>
              </div>`;
          });
          response.authors.forEach((author) => {
            htmlContent += `
              <div class="d-flex align-items-center justify-content-between">
                <div  style="font-size: medium;" class="my-1 col-11 showSuggestion ps-2">
                  ${author.name}
                </div>
                <i class="bi bi-search my-1 fs-5 pe-3"></i>
              </div>`;
          });

          $("#search-suggestion").html(htmlContent).show();

          $(".showProduct")
            .off("click")
            .on("click", function () {
              const productId = $(this).data("id");
              const searchTerm = $(this).text().trim();
              if (searchTerm.length > 0) {
                $.ajax({
                  url: "/add-to-recentSearch",
                  type: "POST",
                  data: { searchTerm, productId },
                  success: function (res) {
                    window.location.href = `/view/${productId}`;
                  },
                  error: function (err) {
                    console.error("Error adding search term:", err);
                    // Handle error if needed
                  },
                });
              }
            });

          $(".showSuggestion")
            .off("click")
            .on("click", function () {
              const searchTerm = $(this).text().trim();
              if (searchTerm.length > 0) {
                $.ajax({
                  url: "/add-to-recentSearch",
                  type: "POST",
                  data: { searchTerm },
                  success: function (res) {
                    window.location.href = `/library?search=${searchTerm}`;
                  },
                  error: function (err) {
                    console.error("Error adding search term:", err);
                    // Handle error if needed
                  },
                });
              }
            });
        } else {
          $("#search-suggestion").hide();
        }
      },
      error: function (err) {
        // Handle error
        console.error("Error fetching data:", err);
      },
    });
  }
});

$("#search-field").on("focus", function () {
  if ($(this).val().trim() === "") {
    // Only fetch recent searches if the input is empty
    $.ajax({
      url: "/recent-search",
      type: "GET",
      success: function (response) {
        if (response.recentSearches.length > 0) {
          let htmlContent = `<span class="" style="font-size: x-small;">RECENT SEARCH</span>`;

          response.recentSearches.forEach((item, index) => {
            if (item.productId) {
              htmlContent += `
                <div class="d-flex align-items-center justify-content-between">
                    <a class="text-decoration-none col-11" href="/view/${item.productId}">
                        <div style="font-size: medium;" class="my-1 ps-2">${item.query}</div>
                    </a>
                    <i data-index="${index}" class="bi removeFromRecentSearch bi-x my-1 fs-5 pe-3"></i>
                </div>`;
            } else {
              htmlContent += `
                <div class="d-flex align-items-center justify-content-between">
                    <a class="text-decoration-none col-11" href="/library?search=${item.query}">
                        <div style="font-size: medium;" class="my-1 ps-2">${item.query}</div>
                    </a>
                    <i data-index="${index}" class="bi removeFromRecentSearch bi-x my-1 fs-5 pe-3"></i>
                </div>`;
            }
          });

          $("#recent-search").html(htmlContent).show();

          $(document).on("click", ".removeFromRecentSearch", function () {
            const index = $(this).data("index");

            $.ajax({
              url: "/delete-recent-search",
              method: "POST",
              data: { index },
              success: function (response) {
                if (response.recentSearches.length > 0) {
                  let htmlContent = `
          <div style="background-color: white; font-size: x-small;" id="recent-search" class="recent-search p-2">
            RECENT SEARCH`;

                  response.recentSearches.forEach((item, idx) => {
                    htmlContent += `
            <div class="d-flex align-items-center justify-content-between">
              <div style="font-size: medium;" class="my-1 ps-2">
                ${item.query}
              </div>
              <i data-index="${idx}" class="bi removeFromRecentSearch my-1 fs-5 bi-x pe-3"></i>
            </div>`;
                  });

                  htmlContent += `
          </div>`;
                  $("#recent-search").html(htmlContent);
                } else {
                  $("#recent-search").hide();
                }
              },
              error: function (error) {
                console.error("Error updating status:", error);
              },
            });
          });
        } else {
          $("#recent-search").hide();
        }
      },
      error: function (err) {
        // Handle error
        console.error("Error fetching data:", err);
      },
    });
  }
});

$(document).on("click", function (event) {
  if (!$(event.target).closest("#search-field, #recent-search").length) {
    $("#recent-search").hide();
  } else if (
    !$(event.target).closest("#search-field, #search-suggestion").length
  ) {
    $("#search-suggestion").hide();
  }
});

localStorage.setItem("signupClicked", false);

$("#signupLink").click(() => {
  localStorage.setItem("signupClicked", true);
});
$("#loginLink").click(() => {
  localStorage.setItem("signupClicked", false);
});


const nav = document.querySelector(".nav"),
  searchIcon = document.querySelector("#searchIcon"),
  navOpenBtn = document.querySelector(".navOpenBtn"),
  navCloseBtn = document.querySelector(".navCloseBtn");

searchIcon.addEventListener("click", () => {
  nav.classList.toggle("openSearch");
  nav.classList.remove("openNav");
  if (nav.classList.contains("openSearch")) {
    return searchIcon.classList.replace("bi-search", "bi-x-lg");
  }
  searchIcon.classList.replace("bi-x-lg", "bi-search");
});

navOpenBtn.addEventListener("click", () => {
  nav.classList.add("openNav");
  nav.classList.remove("openSearch");
  searchIcon.classList.replace("bi-x-lg", "bi-search");
});
navCloseBtn.addEventListener("click", () => {
  nav.classList.remove("openNav");
});
