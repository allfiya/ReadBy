const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});

const buttonElement = document.querySelectorAll(".tablinks");
const tabContent = document.querySelectorAll(".tabcontent");

tabContent[0].style.display = "block";

buttonElement.forEach(function (i) {
  i.addEventListener("click", function (event) {
    for (let x = 0; x < buttonElement.length; x++) {
      if (event.target.id == buttonElement[x].id) {
        buttonElement[x].className = buttonElement[x].className.replace(
          " active",
          ""
        );
        tabContent[x].style.display = "block";
        event.currentTarget.className += " active";
      } else {
        tabContent[x].style.display = "none";
        buttonElement[x].className = buttonElement[x].className.replace(
          " active",
          ""
        );
      }
    }
  });
});

$(document).ready(function () {
  let applicableCategories = [];
  let applicableProducts = [];

  // Function to update the hidden input with the applicable categories array
  function updateHiddenInput() {
    const hiddenInput = $("#applicable_categories");
    hiddenInput.val(JSON.stringify(applicableCategories)); // Store as JSON string
  }

  function updateApplicableCategories() {
    applicableCategories = []; // Clear existing array

    $('[name="dropdown-group"]').each(function () {
      const mainCategoryId = $(this).val(); // Main category ID
      const subcategories = $(
        `ul.subcategories[data-category-id="${mainCategoryId}"]`
      ).find('input[type="checkbox"]');

      const subcategoriesChecked = subcategories.filter(":checked");
      const allSubcategoriesChecked =
        subcategories.length > 0 &&
        subcategories.length === subcategoriesChecked.length;

      if (allSubcategoriesChecked) {
        applicableCategories.push(mainCategoryId); // Add the main category ID if all subcategories are checked
      } else {
        subcategoriesChecked.each(function () {
          applicableCategories.push($(this).val()); // Add selected subcategory IDs
        });
      }

      // If no subcategories are checked, uncheck the main category and remove the UI
      if (subcategoriesChecked.length === 0) {
        $(`[value="${mainCategoryId}"]`).prop("checked", false); // Uncheck the main category
        const subcategoriesUl = $(
          `ul.subcategories[data-category-id="${mainCategoryId}"]`
        );
        subcategoriesUl.remove(); // Remove the subcategories UI
        applicableCategories = applicableCategories.filter(
          (id) => id !== mainCategoryId // Remove the main category ID from the array
        );
      }
    });

    // Check if all checkboxes are checked to automatically check the 'Select All' checkbox
    const totalMainCheckboxes = $('[name="dropdown-group"]').not(
      '[value="all"]'
    ).length; // Excluding 'Select All'
    const totalMainChecked = $('[name="dropdown-group"]')
      .not('[value="all"]')
      .filter(":checked").length;

    const totalSubCheckboxes = $('[name="subcategory-group"]').length; // Excluding 'Select All'
    const totalSubChecked = $('[name="subcategory-group"]').filter(
      ":checked"
    ).length;

    const totalChecked = totalMainChecked + totalSubChecked;
    const totalCheckboxes = totalMainCheckboxes + totalSubCheckboxes;

    // Check 'Select All' if all other checkboxes are checked
    if (totalChecked === totalCheckboxes) {
      $('[value="all"]').prop("checked", true);
    } else {
      $('[value="all"]').prop("checked", false);
    }

  }

  // Event handler for when a main category checkbox is clicked
  $('[name="dropdown-group"]').on("change", function () {
    const categoryId = $(this).val();
    const $parentCheckbox = $(this);

    if ($parentCheckbox.is(":checked") && categoryId !== "all") {
      const subcategoriesUl = $(
        `ul.subcategories[data-category-id="${categoryId}"]`
      );

      if (subcategoriesUl.length === 0) {
        // If the subcategories haven't been fetched yet, fetch them
        $.ajax({
          url: `/categories/${categoryId}/subcategories`,
          method: "GET",
          success: function (subcategories) {
            const newSubcategoriesUl = $(
              `<ul class="subcategories" data-category-id="${categoryId}"></ul>`
            );
            subcategories.forEach((sub) => {
              const subListItem = `
                <li>
                  <label class="dropdown-option">
                    <input type="checkbox" name="subcategory-group" value="${sub._id}" />
                    ${sub.name}
                  </label>
                </li>`;
              newSubcategoriesUl.append(subListItem);
            });

            $parentCheckbox.closest("li").append(newSubcategoriesUl);
            newSubcategoriesUl
              .find('input[type="checkbox"]')
              .prop("checked", true); // Auto-check subcategories
            updateApplicableCategories(); // Update applicable categories
          },
          error: function (error) {
            console.error("Error fetching subcategories:", error);
          },
        });
      } else {
        // If subcategories already exist, just auto-check them
        subcategoriesUl.find('input[type="checkbox"]').prop("checked", true);
      }
    } else if (categoryId === "all" && $parentCheckbox.is(":checked")) {
      // Select all main categories
      $('[name="dropdown-group"]').prop("checked", true);

      // Clear the existing applicable categories array
      applicableCategories = [];

      // Loop through each main category and fetch subcategories
      $('[name="dropdown-group"]').each(function () {
        const categoryId = $(this).val();

        if (categoryId !== "all") {
          applicableCategories.push(categoryId); // Add the main category ID to the array

          const $mainCategoryCheckbox = $(this);

          // Check if subcategories already exist
          const existingSubcategoriesUl = $(
            `ul.subcategories[data-category-id="${categoryId}"]`
          );

          if (existingSubcategoriesUl.length === 0) {
            // Fetch and auto-check subcategories for each main category
            $.ajax({
              url: `/categories/${categoryId}/subcategories`,
              method: "GET",
              success: function (subcategories) {
                const newSubcategoriesUl = $(
                  `<ul class="subcategories" data-category-id="${categoryId}"></ul>`
                );

                subcategories.forEach((sub) => {
                  const subListItem = `
                    <li>
                      <label class="dropdown-option">
                        <input type="checkbox" name="subcategory-group" value="${sub._id}" />
                        ${sub.name}
                      </label>
                    </li>`;
                  newSubcategoriesUl.append(subListItem);
                });

                $mainCategoryCheckbox.closest("li").append(newSubcategoriesUl);
                newSubcategoriesUl
                  .find('input[type="checkbox"]')
                  .prop("checked", true); // Auto-check subcategories
              },
              error: function (error) {
                console.error("Error fetching subcategories:", error);
              },
            });
          } else {
            // Auto-check subcategories if already fetched
            existingSubcategoriesUl
              .find('input[type="checkbox"]')
              .prop("checked", true);
          }
        }
      });

    } else if (categoryId === "all" && !$parentCheckbox.is(":checked")) {
      $('[name="dropdown-group"]').prop("checked", false);
      $('[name="subcategory-group"]').prop("checked", false);

      updateApplicableCategories();
    } else {
      // If the main category is unchecked, remove subcategories and update the array
      const subcategoriesUl = $(
        `ul.subcategories[data-category-id="${categoryId}"]`
      );
      subcategoriesUl.find('input[type="checkbox"]').prop("checked", false); // Uncheck all
      subcategoriesUl.remove(); // Remove the subcategory UI
      applicableCategories = applicableCategories.filter(
        (id) => id !== categoryId
      ); // Remove the main category ID
      updateApplicableCategories(); // Update applicable categories
    }
  });

  // Event handler for when a subcategory checkbox changes
  $(document).on("change", 'input[name="subcategory-group"]', function () {
    updateApplicableCategories(); // Update applicable categories when subcategories change
  });

  function updateProductInput() {
    const hiddenInput = $("#applicable_products");
    hiddenInput.val(JSON.stringify(applicableProducts)); // Store as JSON string
  }

  function updateApplicableProducts() {
    applicableProducts = []; // Clear existing array

    // If "Select All" is checked, add all product IDs to applicableProducts
    const allChecked = $('input[name="dropdown-pdt-group"][value="all"]').is(
      ":checked"
    );

    if (allChecked) {
      $('input[name="dropdown-pdt-group"]').each(function () {
        const productId = $(this).val();
        if (productId !== "all") {
          applicableProducts.push(productId);
        }
      });
    } else {
      // If "Select All" is not checked, add only individual checked product IDs
      $('input[name="dropdown-pdt-group"]:checked').each(function () {
        const productId = $(this).val();
        if (productId !== "all") {
          applicableProducts.push(productId);
        }
      });
    }

    updateProductInput(); // Update the hidden input with the applicable products
  }

  $('input[name="dropdown-pdt-group"]').on("change", function () {
    const isSelectAll = $(this).val() === "all";

    const isChecked = $(this).is(":checked");
    if (isSelectAll) {
      if (isChecked) {
        $('input[name="dropdown-pdt-group"]').prop("checked", true);
      } else {
        $('input[name="dropdown-pdt-group"]').prop("checked", false);
      }
    } else {
      // Count all checkboxes in the "dropdown-pdt-group" except the one with value 'all'
      const totalCheckboxes = $('input[name="dropdown-pdt-group"]').not(
        '[value="all"]'
      ).length;
      const checkedCount = $('input[name="dropdown-pdt-group"]:checked').not(
        '[value="all"]'
      ).length;

      if (totalCheckboxes === checkedCount) {
        $('input[name="dropdown-pdt-group"][value="all"]').prop(
          "checked",
          true
        );
      } else {
        $('input[name="dropdown-pdt-group"][value="all"]').prop(
          "checked",
          false
        );
      }
    }

    // Update the applicable products
    updateApplicableProducts();
  });

  $("#addCoupon").submit(function (event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    $("#applicable_categories").val(JSON.stringify(applicableCategories));
    $("#applicable_products").val(JSON.stringify(applicableProducts));

    // Submit the form
    this.submit();
  });
});

// CATEGORY

(function ($) {
  const CheckboxDropdown = function (el) {
    const _this = this;
    this.isOpen = false;
    this.areAllChecked = false;
    this.$el = $(el);
    this.$label = this.$el.find(".dropdown-label");
    this.$checkAll = this.$el.find('[data-toggle="check-all"]').first();
    this.$inputs = this.$el.find('[type="checkbox"]');

    this.onCheckBox();

    this.$label.on("click", function (e) {
      e.preventDefault();
      _this.toggleOpen();
    });

    this.$checkAll.on("click", function (e) {
      e.preventDefault();
      _this.onCheckAll();
    });

    this.$inputs.on("change", function (e) {
      _this.onCheckBox();
    });
  };

  CheckboxDropdown.prototype.onCheckBox = function () {
    this.updateStatus();
  };

  CheckboxDropdown.prototype.updateStatus = function () {
    const checked = this.$el.find(":checked");

    this.areAllChecked = false;
    this.$checkAll.html("Check All");

    if (checked.length <= 0) {
      this.$label.html("--Select--");
    } else if (checked.length === 1) {
      this.$label.html(checked.parent("label").text());
    } else if (checked.length === this.$inputs.length) {
      this.$label.html("All Selected");
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
    } else {
      this.$label.html(checked.length + " Selected");
    }
  };

  CheckboxDropdown.prototype.onCheckAll = function (checkAll) {
    if (!this.areAllChecked || checkAll) {
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
      this.$inputs.prop("checked", true);
    } else {
      this.areAllChecked = false;
      this.$checkAll.html("Check All");
      this.$inputs.prop("checked", false);
    }

    this.updateStatus();
  };

  CheckboxDropdown.prototype.toggleOpen = function (forceOpen) {
    const _this = this;

    if (!this.isOpen || forceOpen) {
      this.isOpen = true;
      this.$el.addClass("on");
      $(document).on("click", function (e) {
        if (!$(e.target).closest("[data-control]").length) {
          _this.toggleOpen();
        }
      });
    } else {
      this.isOpen = false;
      this.$el.removeClass("on");
      $(document).off("click");
    }
  };

  const checkboxesDropdowns = document.querySelectorAll(
    '[data-control="checkbox-dropdown"]'
  );
  for (let i = 0, length = checkboxesDropdowns.length; i < length; i++) {
    new CheckboxDropdown(checkboxesDropdowns[i]);
  }
})(jQuery);

// PRODUCTS

(function ($) {
  const CheckboxDropdown = function ($el) {
    this.isOpen = false;
    this.areAllChecked = false;
    this.$el = $el;
    this.$label = this.$el.find(".dropdown-pdt-label");
    this.$checkAll = this.$el.find('[data-toggle="check-all"]').first();
    this.$inputs = this.$el.find('[type="checkbox"]');

    this.onCheckBox(); // Initialize status

    // Bind event handlers
    this.$label.on("click", (e) => {
      e.preventDefault();
      this.toggleOpen();
    });

    this.$checkAll.on("click", (e) => {
      e.preventDefault();
      this.onCheckAll();
    });

    this.$inputs.on("change", (e) => {
      this.onCheckBox();
    });
  };

  CheckboxDropdown.prototype.onCheckBox = function () {
    this.updateStatus();
  };

  CheckboxDropdown.prototype.updateStatus = function () {
    const $checked = this.$el.find(":checked");

    this.areAllChecked = false;
    this.$checkAll.html("Check All");

    if ($checked.length === 0) {
      this.$label.html("--Select--");
    } else if ($checked.length === 1) {
      this.$label.html($checked.closest("label").text());
    } else if ($checked.length === this.$inputs.length) {
      this.$label.html("All Selected");
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
    } else {
      this.$label.html(`${$checked.length} Selected`);
    }
  };

  CheckboxDropdown.prototype.onCheckAll = function (checkAll = false) {
    if (!this.areAllChecked || checkAll) {
      this.areAllChecked = true;
      this.$checkAll.html("Uncheck All");
      this.$inputs.prop("checked", true);
    } else {
      this.areAllChecked = false;
      this.$checkAll.html("Check All");
      this.$inputs.prop("checked", false);
    }

    this.updateStatus();
  };

  CheckboxDropdown.prototype.toggleOpen = function (forceOpen = false) {
    if (!this.isOpen || forceOpen) {
      this.isOpen = true;
      this.$el.addClass("on");
      const closeHandler = (e) => {
        if (!$(e.target).closest("[data-control]").length) {
          this.toggleOpen(); // Close dropdown when clicking outside
          $(document).off("click", closeHandler); // Unbind handler after closing
        }
      };

      $(document).on("click", closeHandler); // Bind click event on the document
    } else {
      this.isOpen = false;
      this.$el.removeClass("on");
    }
  };

  $(document).ready(function () {
    const $checkboxesDropdowns = $('[data-control="checkbox-dropdown-pdt"]');

    $checkboxesDropdowns.each(function () {
      new CheckboxDropdown($(this));
    });
  });
})(jQuery);

$(document).on("click", "#status_btn", function (event) {
  const couponId = $(this).val(); // Get the coupon ID from the button's value

  // Send an AJAX POST request to update the status
  $.ajax({
    url: "/admin/update-coupon-status",
    method: "POST",
    data: { couponId: couponId }, // Send the updated status
    success: function (response) {
      // Toggle the button's class and text to reflect the new status
      if (!response.activeStatus) {
        $("#status_btn")
          .removeClass("btn-success")
          .addClass("btn-danger")
          .text("Inactive");
      } else {
        $("#status_btn")
          .removeClass("btn-danger")
          .addClass("btn-success")
          .text("Active");
      }
    },
    error: function (error) {
      console.error("Error updating status:", error);
    },
  });
});
