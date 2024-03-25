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

$(document).ready(function() {
    $('.sliderForm').on('click', '.toggle-slider', function(event) {
        event.preventDefault();
        var sliderForm = $(this).closest('.sliderForm');
        var sliderId = $(this).data('id');
        var isActive = $(this).hasClass('btn-success');

        $.ajax({
            url: '/admin/manage/sliders',
            type: 'POST',
            data: { sliderId: sliderId, isActive: isActive },
            success: function(response) {
                if (isActive) {
                    sliderForm.find('.status_btn').removeClass('btn-success').addClass('btn-danger').text('Inactive');
                } else {
                    sliderForm.find('.status_btn').removeClass('btn-danger').addClass('btn-success').text('Active');
                }
            },
            error: function(xhr, status, error) {
                console.error(error);
            }
        });
    });
});



