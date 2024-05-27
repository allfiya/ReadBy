// ADMIN DASHBOARD SIDE MENU EXPANSION

const hamBurger = document.getElementById("toggle-btn");

hamBurger.addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("expand");
});



$.ajax({
  url: "/admin/monthly-order-counts",
  method: "GET",
  success: function (monthlyData) {
    const labels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const data = {
      labels: labels,
      datasets: [
        {
          label: "Sales",
          data: monthlyData,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };

    const lineChartCanvas = $("#lineChart");

    const lineChart = new Chart(lineChartCanvas, {
      type: "line",
      data: data,
    });
  },
  error: function (error) {
    console.error("Error fetching monthly order counts:", error);
  },
});

$.ajax({
  url: "/admin/order-status-counts",
  method: "GET",
  success: function (data) {
    const labels = ["Cancelled", "Failed", "Paid", "Refunded"];
    const chartData = [
      data["cancelled"] || 0,
      data["failed"] || 0,
      data["paid"] || 0,
      data["refunded"] || 0,
    ];
    const backgroundColors = [
      "rgb(54, 162, 235)", // Grey
      "rgb(255, 99, 132)", // Red
      "rgb(75, 192, 192)", // Green
      "rgb(153, 102, 255)", // Violet
    ];

    const doughnutData = {
      labels: labels,
      datasets: [
        {
          label: "Order Payment Status",
          data: chartData,
          backgroundColor: backgroundColors,
          hoverOffset: 4,
        },
      ],
    };

    const doughnutCanvas = $("#doughnutChart");

    const doughnutChart = new Chart(doughnutCanvas, {
      type: "doughnut",
      data: doughnutData,
    });
  },
  error: function (error) {
    console.error("Error fetching order status counts:", error);
  },
});

$.ajax({
  url: '/admin/popular-formats',
  method: 'GET',
  success: function (data) {

    const chartCanvas = $('#popularFormatChartCanvas');

    const chartData = {
      labels: data.map(item => item.label),
      datasets: [{
        label: 'Number of Orders',
        data: data.map(item => item.numberOfOrders),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    const chart = new Chart(chartCanvas, {
      type: 'bar',
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },
  error: function (error) {
    console.error('Error fetching data:', error);
  }
});
