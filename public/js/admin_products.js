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
  const { selectedIds: authorIds, selectedNames: authorNames } =
    initializeDropdownBehavior(
      ".author-dropdown-items",
      "#author-select-btn",
      ".author-dropdown-menu"
    );

  const { selectedIds: formatIds, selectedNames: formatNames } =
    initializeDropdownBehavior(
      ".format-dropdown-items",
      "#format-select-btn",
      ".format-dropdown-menu"
    );

  const { selectedIds: languageIds, selectedNames: languageNames } =
    initializeDropdownBehavior(
      ".language-dropdown-items",
      "#language-select-btn",
      ".language-dropdown-menu"
    );

  const { selectedIds: awardIds, selectedNames: awardNames } =
    initializeDropdownBehavior(
      ".award-dropdown-items",
      "#award-select-btn",
      ".award-dropdown-menu"
    );

  function initializeDropdownBehavior(
    itemSelector,
    buttonSelector,
    menuSelector
  ) {
    let selectedNames = []; // Variable to store selected author names
    let selectedIds = []; // Variable to store selected author _ids

    $(itemSelector).click(function (e) {
      e.preventDefault();
      let id = $(this).attr("data-value"); // Get the _id of the author
      let name = $(this).attr("data-name"); // Get the name of the author

      let isSelected = selectedIds.includes(id);

      if (isSelected) {
        // Remove the unselected author's name and id from the arrays
        selectedNames = selectedNames.filter(
          (authorName) => authorName !== name
        );
        selectedIds = selectedIds.filter((authorId) => authorId !== id);
        $(this).removeClass("selected");
      } else {
        selectedNames.push(name); // Add the selected author's name to the array
        selectedIds.push(id); // Add the selected author's _id to the array
        $(this).addClass("selected");
      }

      e.stopPropagation();

      $(buttonSelector).text(
        selectedNames.length > 0 ? selectedNames.join(", ") : "--Select--"
      );
    });

    $(document).on("click", function (e) {
      if (
        !$(e.target).closest(menuSelector).length &&
        !$(e.target).is(buttonSelector)
      ) {
        $(menuSelector).removeClass("show");
      }
    });

    $(buttonSelector).on("click", function () {
      $(menuSelector).toggleClass("show");
    });

    return { selectedIds, selectedNames };
  }

  // FETCHING SUBCATEGORY ACCORDING TO MAIN CATEGORY SELECTION

  $("#mainCategory").change(function () {
    let mainCategoryId = $(this).val();
    if (mainCategoryId) {
      $.ajax({
        url: "/admin/get/subcategories",
        method: "GET",
        data: { mainCategoryId: mainCategoryId },
        success: function (response) {
          $("#subCategory")
            .empty()
            .append('<option value="" selected>--Select--</option>'); // Re-add default option
          response.forEach(function (subcategory) {
            $("#subCategory").append(
              '<option value="' +
                subcategory._id +
                '">' +
                subcategory.name +
                "</option>"
            );
          });
        },
        error: function (xhr, status, error) {
          console.error(error);
        },
      });
    } else {
      $("#subCategory")
        .empty()
        .append('<option value="" selected>--Select--</option>'); // Default option when no main category selected
    }
  });

  $("#subCategory").change(function () {
    let subcategoryId = $(this).val();
    if (subcategoryId) {
      // Subcategory manually selected
      // You can perform additional actions here if needed
    }
  });

  // CLICK SAVE BUTTON

  $("#step-1").click(function () {
    // Disable the Save button
    $(this).prop("disabled", true);

    generateStep2Structure();

    // Disable all form elements inside the step-1-row div
    $("#step-1-row :input").prop("disabled", true);

    // Change the content of the specific element inside the step-1-row div
    $("#step-1-row .base-edit").append(
      '<i id="step-1-edit" class="bi bi-pencil ms-3"></i>'
    );

    // Change the text of the button to "Saved"
    $(this).text("Saved");

    // Convert selected authors array to JSON string and store in hidden input field
    $("#selectedAuthors").val(JSON.stringify(authorIds));
    $("#selectedFormats").val(JSON.stringify(formatIds));
    $("#selectedLanguages").val(JSON.stringify(languageIds));

    // Remove disabled attribute before form submission
    $("#step-1-row :input").prop("disabled", false);
  });

  // Assuming your form has an ID of "myForm"
  $("#myForm").submit(function (event) {
    // Prevent the default form submission behavior
      event.preventDefault();


    // Update awardsData and stockData
    awardsData = updateAwardsData();
    stockData = updateStockData();
    basePrice = updateBaseData();
    salePrice = updateSaleData();

    // Convert data to JSON strings
    const awardsDataJSON = JSON.stringify(awardsData);
    const stockDataJSON = JSON.stringify(stockData);
    const baseDataJSON = JSON.stringify(basePrice);
    const saleDataJSON = JSON.stringify(salePrice);

    // Set the JSON data to hidden input fields in the form
    $("#awardsData").val(awardsDataJSON);
    $("#stockData").val(stockDataJSON);
    $("#basePrice").val(baseDataJSON);
    $("#salePrice").val(saleDataJSON);

    // Submit the form
    this.submit();
  });


  // GENERATE STRUCTURE

  let awardsData = [];
  let stockData = {};
  let basePrice = {};
  let salePrice = {};

  function generateStep2Structure() {
    if (formatIds.length > 0 && languageIds.length > 0) {
      // Clear any existing content in the step-2-row div
      $("#step-2-row").empty();

      // Add the initial structure
      $("#step-2-row").append(`
          <div class="d-flex">
            <h2 class="d-inline">STOCK DETAILS</h2>
          </div>
        `);

      // Iterate over selected formats
      formatNames.forEach((format, index) => {
        // Add the format heading
        $("#step-2-row").append(`<h5>${format}</h5>`);

        // Iterate over selected languages
        languageNames.forEach((language) => {
          // Add the input field for each language under the format
          $("#step-2-row").append(`
              <div class="col-md-2">
                <label for="selected-${format}-${language}">${language}</label>
                <input type="number" data-format="${formatIds[index]}" data-language="${languageIds[index]}"  id="selected-${format}-${language}" name="selected-${format}-${language}" class=" stock-field form-control"
                  placeholder="Number in stock" aria-label="Number in stock">
              </div>
            `);
        });
      });

      $("#step-2-row").append(`
          <div class="d-flex">
            <h2 class="d-inline">PRICE DETAILS</h2>
          </div>
        `);

      formatNames.forEach((format, index) => {
        const formatId = formatIds[index];
        // Add the format heading
        $("#step-2-row").append(`<h5>${format}</h5>
          <div class="col-md-2">
          <label for="${formatId}-base">Base Price</label>
          <input type="number" data-format="${formatId}" id="${formatId}-base" name="${formatId}-base" class="form-control base-field">
        </div>
            <div class="col-md-2">
              <label for="title">Sale Price</label>
              <input type="number" data-format="${formatId}" id="${formatId}-sale" name="${formatId}-sale"  class="form-control sale-field">
            </div>`);
      });

      $("#step-2-row").append(`
          <div class="d-flex">
            <h2 class="d-inline">AWARD WINNING YEARS</h2>
          </div>
    
          <div class="d-flex" id="years">
    
          </div>
        `);

      //   // Iterate over each award name
      awardNames.forEach((award, index) => {
        // Append the award HTML to the '#years' element
        $("#years").append(`
            <div class="d-flex flex-column">
              <h5>${award}</h5>
              <div class="col-md-6">
                <label for="${award}-year">Year</label>
                <input type="number" id="${award}-year" data-id="${awardIds[index]}" name="${award}-year" class="form-control award-field">
              </div>
            </div>
          `);
      });

      $(".award-field")
        .off("input")
        .on("input", function () {
          awardsData = updateAwardsData();
        });

      $(".stock-field")
        .off("input")
        .on("input", function () {
          stockData = updateStockData();
        });

      $(".base-field")
        .off("input")
        .on("input", function () {
          basePrice = updateBaseData();
        });

      $(".sale-field")
        .off("input")
        .on("input", function () {
          salePrice = updateSaleData();
        });

      $("#step-2-row").append(`
          <div>
            <button class="btn btn-outline-dark" type="submit">Add book</button>
          </div>
        `);
    } else {
      $("#step-2-row").append(`
          <div>
            <button class="btn btn-outline-dark" type="submit">Add book</button>
          </div>
        `);
    }
  }

  function updateBaseData() {
    // Clear the basePrice object before updating
    basePrice = {};
    // Iterate over formatIds to update basePrice
    formatIds.forEach((formatId) => {
      // Get the input value for the current format
      const inputValue = $(`#${formatId}-base`).val();
      // Convert inputValue to a number and assign it to basePrice
      basePrice[formatId] = parseInt(inputValue) || 0;
    });
    // Log the updated basePrice object
    return basePrice;
  }

  function updateSaleData() {
    // Clear the basePrice object before updating
    salePrice = {};
    // Iterate over formatIds to update salePrice
    formatIds.forEach((formatId) => {
      // Get the input value for the current format
      const inputValue = $(`#${formatId}-sale`).val();
      // Convert inputValue to a number and assign it to salePrice
      salePrice[formatId] = parseInt(inputValue) || 0;
    });
    // Log the updated salePrice object
    return salePrice;
  }

  // Function to update stockData object
  function updateStockData() {
    stockData = {}; // Reset stockData object
    // Iterate over each format
    formatIds.forEach((formatId, formatIndex) => {
      const formatName = formatNames[formatIndex];
      stockData[formatId] = {}; // Initialize sub-object for each format
      // Iterate over each language
      languageIds.forEach((languageId, languageIndex) => {
        const languageName = languageNames[languageIndex];
        // Get the input value for the current format and language
        const inputValue = $(`#selected-${formatName}-${languageName}`).val();
        stockData[formatId][languageId] = parseInt(inputValue) || 0; // Update stockData with parsed integer value or 0
      });
    });
    return stockData;
  }

  // Function to update awardsData array with current input values
  function updateAwardsData() {
    awardsData = []; // Clear the array
    // Iterate over each award name
    awardNames.forEach((award, index) => {
      const yearInput = document.getElementById(`${award}-year`);
      const yearValue = yearInput.value;
      // Push an object with award and year to awardsData array
      awardsData.push({
        award: awardIds[index],
        year: yearValue,
      });
    });
    return awardsData;
  }

  // CLICK EDIT ICON

  $("#step-1-row").on("click", "#step-1-edit", function () {
    $("#step-2-row").empty();
    // Enable the Save button
    $("#step-1").prop("disabled", false);

    // Enable all form elements inside the step-1-row div
    $("#step-1-row :input").prop("disabled", false);

    // Change the text of the Save button back to "Save"
    $("#step-1").text("Save");

    // Remove the edit icon
    $(this).remove();
  });
});


