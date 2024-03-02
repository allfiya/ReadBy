const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});

const existing_formatsId = [];
const existing_languagesId = [];
const existing_authorsId = [];
const existing_awardsId = [];
product.formats.forEach((format) => {
  existing_formatsId.push(format._id);
});
product.languages.forEach((language) => {
  existing_languagesId.push(language._id);
});
product.author.forEach((author) => {
  existing_authorsId.push(author._id);
});
product.awards.forEach((award) => {
  existing_awardsId.push(award.award._id);
});

const existing_formatNames = [];
const existing_languageNames = [];
const existing_authorNames = [];
const existing_awardNames = [];
product.formats.forEach((format) => {
  existing_formatNames.push(format.name);
});
product.languages.forEach((language) => {
  existing_languageNames.push(language.name);
});
product.author.forEach((author) => {
  existing_authorNames.push(author.name);
});
product.awards.forEach((award) => {
  existing_awardNames.push(award.award.name);
});

initializeDropdownBehavior(
  ".author-dropdown-items",
  "#author-select-btn",
  ".author-dropdown-menu",
  existing_authorsId,
  existing_authorNames
);

initializeDropdownBehavior(
  ".format-dropdown-items",
  "#format-select-btn",
  ".format-dropdown-menu",
  existing_formatsId,
  existing_formatNames
);

initializeDropdownBehavior(
  ".language-dropdown-items",
  "#language-select-btn",
  ".language-dropdown-menu",
  existing_languagesId,
  existing_languageNames
);

initializeDropdownBehavior(
  ".award-dropdown-items",
  "#award-select-btn",
  ".award-dropdown-menu",
  existing_awardsId,
  existing_awardNames
);

function initializeDropdownBehavior(
  itemSelector,
  buttonSelector,
  menuSelector,
  existing_ID,
  existing_Names
) {
  document.querySelectorAll(itemSelector).forEach(function (item) {
    let id = item.getAttribute("data-value");
    if (existing_ID.includes(id)) {
      item.classList.add("selected");
    }

    item.addEventListener("click", function (e) {
      e.preventDefault();
      let id = this.getAttribute("data-value");
      let name = this.getAttribute("data-name");

      let isSelected = existing_ID.includes(id);

      if (isSelected) {
        existing_Names = existing_Names.filter(
          (existing_authorNames) => existing_authorNames !== name
        );
        existing_ID = existing_ID.filter((authorId) => authorId !== id);
        this.classList.remove("selected");
      } else {
        existing_Names.push(name);
        existing_ID.push(id);
        this.classList.add("selected");
      }

      e.stopPropagation();

      document.querySelector(buttonSelector).textContent =
        existing_Names.length > 0 ? existing_Names.join(", ") : "--Select--";
    });
  });

  document.addEventListener("click", function (e) {
    if (
      !e.target.closest(menuSelector) &&
      e.target !== document.querySelector(buttonSelector)
    ) {
      document.querySelector(menuSelector).classList.remove("show");
    }
  });

  document.querySelector(buttonSelector).addEventListener("click", function () {
    document.querySelector(menuSelector).classList.toggle("show");
  });
}


document.getElementById("myForm").addEventListener("submit", function () {
  document.getElementById("selectedAuthors").value =
    JSON.stringify(existing_authorsId);
  document.getElementById("awardsData").value =
    JSON.stringify(existing_awardsId);
  document.getElementById("selectedFormats").value =
    JSON.stringify(existing_formatsId);
  document.getElementById("selectedLanguages").value =
    JSON.stringify(existing_languagesId);
});

document.getElementById("mainCategory").addEventListener("change", function () {
  let mainCategoryId = this.value;
  if (mainCategoryId) {
    fetch("/admin/get/subcategories?mainCategoryId=" + mainCategoryId)
      .then((response) => response.json())
      .then((data) => {
        const subCategorySelect = document.getElementById("subCategory");
        subCategorySelect.innerHTML = "";
        data.forEach(function (subcategory) {
          const option = document.createElement("option");
          option.value = subcategory._id;
          option.textContent = subcategory.name;
          subCategorySelect.appendChild(option);
        });
      })
      .catch((error) => console.error(error));
  } else {
    const subCategorySelect = document.getElementById("subCategory");
    subCategorySelect.innerHTML =
      '<option value="" selected>--Select--</option>';
  }
});

document.getElementById("mainCategory").dispatchEvent(new Event("change"));

document.getElementById("subCategory").addEventListener("change", function () {
  let subcategoryId = this.value;
  if (subcategoryId) {
  }
});



