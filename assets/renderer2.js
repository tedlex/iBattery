window.electron.onProcessedDaysData((data) => {
    const ctx = document.getElementById("workingTimeChart").getContext("2d");
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [
                {
                    label: 'Working Hours',
                    data: data.workingTime,
                    backgroundColor: 'rgba(46, 208, 110, 0.5)',
                    borderColor: 'rgba(46, 208, 110, 0.1)'
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Daily Working Time'
                }
            }
        }
    });
    const ctx2 = document.getElementById("consumptionRateChart").getContext("2d");
    chart = new Chart(ctx2, {
        type: 'bar',
        data: {
            datasets: [
                {
                    label: 'Consumption Rate',
                    data: data.consumptionRate,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)'
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Consumption Rate %/h'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Average Daily Consumption Rate'
                }
            }
        },

    });
});

document.addEventListener("DOMContentLoaded", function () {
    const minuteButton = document.getElementById("minuteButton");

    minuteButton.addEventListener("click", function () {
        const url = this.getAttribute("data-href");
        if (url) {
            window.location.href = url;
        }
    });
});


window.electron.processDaysData();