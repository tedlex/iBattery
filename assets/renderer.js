const stepSizeInput = document.getElementById("stepSize");
const daysInput = document.getElementById("days");
const refreshButton = document.getElementById("refresh");
const fileButton = document.getElementById("csvFile");

let chart;
let dataInitialized = false;
let chartParams = {};

document.addEventListener("DOMContentLoaded", function () {
  const dayButton = document.getElementById("dayButton");

  dayButton.addEventListener("click", function () {
    const url = this.getAttribute("data-href");
    if (url) {
      window.location.href = url;
    }
  });
});

window.electron.onDataInitialized((pms) => {
  dataInitialized = true;
  //console.log("Chart params received: ", pms);
  chartParams = pms;
  stepSizeInput.value = pms.stepSize;
  if (stepSizeInput.value == "101") {
    stepSizeInput.value = "11";
  }
  daysInput.value = pms.days;
  window.electron.processData(chartParams.days, chartParams.stepSize);
});

window.electron.initializeData();

window.electron.onProcessedData((results, isNewFile) => {
  console.log("Chart data received")
  //console.log(results)

  if (!chart) {
    const ctx = document.getElementById("batteryChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: makeDatasets(results),
      },
      options: getOptions(results.range),
    });
  } else if (isNewFile) {
    chart.destroy();
    const ctx = document.getElementById("batteryChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: makeDatasets(results),
      },
      options: getOptions(results.range),
    });
  } else {
    updateDatasets(results);
    chart.update();
  }
});

window.electron.onStepUpdated((newConsumptionData) => {
  updateStep(newConsumptionData);
  chart.update();
});

window.electron.onDaysUpdated((range) => {
  updateDays(range);
  chart.update();
});

refreshButton.addEventListener("click", function () {
  window.electron.refresh();
});

stepSizeInput.addEventListener("input", function () {
  if (!dataInitialized) return;
  let newStepSize = parseInt(this.value);
  if (newStepSize === 11) {
    newStepSize = 101;
  }
  chartParams.stepSize = newStepSize;
  window.electron.updateStep(chartParams.stepSize);
});

daysInput.addEventListener("input", function () {
  if (!dataInitialized) return;
  const newDays = this.value;
  chartParams.days = parseInt(newDays);
  window.electron.updateDays(chartParams.days);
});

fileButton.addEventListener("click", function () {
  window.electron.selectFile();
});


//window.electron.readCsv(4);
const xScale = (range) => {
  return {
    type: "time",
    min: range[0],
    max: range[1],
    time: {
      displayFormats: {
        hour: "HH",
      },
    },
    ticks: {
      autoSkip: true,
      maxTicksLimit: 25,
      maxRotation: 0,
    },
  };
}

const getOptions = (range) => {
  return {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: false,
        text: "Battery",
      },
      legend: {
        display: false,
        labels: {
          filter: function (item, chart) {
            return !item.text.includes('Rate');
          }
        }
      },
      tooltip: {
        filter: function (tooltipItem) {
          return tooltipItem.datasetIndex === 0;
        }
      }
    },
    scales: {
      x: xScale(range),
      y: {
        type: "linear",
        display: true,
        position: "left",
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Remaining %",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        min: 0,
        max: 25,
        title: {
          display: true,
          text: "Consumption Rate %/h",
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
    },
  }
}

const makeDatasets = (results) => {
  const datasets = [{
    label: "Percentage",
    data: results.data1,
    yAxisID: "y",
    fill: false,
    pointRadius: 1.5,
    backgroundColor: "rgba(113, 176, 241, 0.8)",
    borderColor: "rgba(77, 152, 231, 0.6)",
  },
  {
    label: "V",
    data: results.dayLines,
    yAxisID: "y",
    fill: false,
    backgroundColor: "rgba(147, 147, 147, 0.5)",
    borderColor: "rgba(147, 147, 147, 1)",
    borderWidth: 1,
    pointStyle: false,
  },
  {
    label: "Charging",
    data: results.chargingData,
    yAxisID: "y",
    fill: false,
    backgroundColor: "rgba(46, 208, 110, 0.8)",
    borderColor: "rgba(46, 208, 110, 0.8)",
    pointStyle: false,
    borderWidth: 4,
    pointRadius: 0.5,
  },
  ];
  for (let i = 0; i < results.consumptionData.length; i++) {
    datasets.push({
      label: "Consumption Rate",
      data: results.consumptionData[i],
      yAxisID: "y1",
      fill: true,
      pointStyle: false,
      showLine: false,
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    });
  }
  return datasets;
}

const updateDays = (range) => {
  chart.options.scales.x = xScale(range);
}

const updateStep = (newConsumptionData) => {
  for (let i = 0; i < newConsumptionData.length; i++) {
    chart.data.datasets[i + 3].data = newConsumptionData[i];
  }
}

const updateDatasets = (results) => {
  chart.data.datasets[0].data = results.data1;
  chart.options.scales.x = xScale(results.range);
  // update datasets about segments with new data
  for (let i = 0; i < results.consumptionData.length; i++) {
    chart.data.datasets[i + 3].data = results.consumptionData[i];
  }
}