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

document.addEventListener("DOMContentLoaded", function () {
  let mainRadio = document.getElementById("main_radio");
  let addSub = document.getElementById("add_sub");
  let addMain = document.getElementById("add_main");

  mainRadio.addEventListener("change", function () {
    if (mainRadio.checked) {
      addSub.style.display = "block";
      addMain.style.display = "none";
    }
  });

  let subRadio = document.getElementById("sub_radio");
  subRadio.addEventListener("change", function () {
    if (subRadio.checked) {
      addSub.style.display = "none";
      addMain.style.display = "block";
    }
  });

  let categoryForm = document.getElementById("category_form");
categoryForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission
  
  let subsTextarea = document.getElementById("subs");
  let subsValue = subsTextarea.value.trim();
  
  if (subsValue !== "") {
    let subsArray = subsValue.split(",");
    console.log(subsArray); // Optional: Log the array to the console for verification
    
    // Set the value of a hidden input field to the JSON string representation of the array
    document.getElementById("subcategories_input").value = JSON.stringify(subsArray);
  }
  
  // Submit the form
  categoryForm.submit();
});

});

