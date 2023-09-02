const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const { processing, truncateData, updateConsumptionData, processingDays } = require("./utils/process_results.js");
const Store = require('electron-store');
const { dialog } = require('electron');
const { getRange } = require("./utils/time.js");

const store = new Store();
console.log("store path: ", store.path);
let truncatedData = [];
let chartParams = {};

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: `${__dirname}/assets/icon.icns`,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Is recommended for security purposes
    },
  });

  win.loadFile("index.html");
}

async function showOpenDialog(event) {
  // Show file picker dialog
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePaths.length > 0) {
    const csvFilePath = filePaths[0];
    //console.log("csvFilePath: ", csvFilePath);
    if (!checkFile(csvFilePath)) {
      dialog.showErrorBox('Invalid file', 'Please select a valid csv file with date, percentage, charging included in header');
    } else {
      store.set('csvFilePath', csvFilePath);
      //console.log("csvFilePath saved");
      readFile(event, (rawData) => {
        truncatedData = truncateData(rawData, 7);
        const processedResults = processing(truncatedData, chartParams.days, chartParams.stepSize);
        //console.log("processed data size: ", processedResults.data1.length)
        event.sender.send("data-processed", processedResults, true);
      });
    }
  }
}

ipcMain.on("select-file", (event) => {
  //console.log("receive select-file");
  showOpenDialog(event);
});

const checkFile = (csvFilePath) => {
  if (!csvFilePath) {
    return false;
  }
  if (!fs.existsSync(csvFilePath)) {
    return false;
  }
  // it's a csv file with at least date, percentage, charging included in header
  const firstLine = fs.readFileSync(csvFilePath).toString().split('\n')[0];
  const headers = firstLine.split(',');
  if (!headers.includes('date') || !headers.includes('percentage') || !headers.includes('charging')) {
    return false;
  }
  return true;
}

const readFile = (event, callback) => {
  const csvFilePath = store.get('csvFilePath');
  //console.log("Read csvFilePath: ", csvFilePath);
  if (!checkFile(csvFilePath)) {
    showOpenDialog(event);
    callback([]);
  } else {
    const rawData = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => rawData.push(data))
      .on("end", () => {
        callback(rawData);
      });
  }
}

ipcMain.on("initialize-data", (event) => {
  console.log("receive initialize-data");
  chartParams = store.get('chartParams');
  if (!chartParams) {
    console.log("chartParams not found");
    chartParams = { days: 3, stepSize: 10 };
    store.set('chartParams', chartParams);
  } else {
    console.log("chartParams found", chartParams);
  }
  readFile(event, (rawData) => {
    truncatedData = truncateData(rawData, 7);
    event.sender.send("data-initialized", chartParams);
  });
});

ipcMain.on("process-data", (event, days, stepSize) => {
  //console.log("receive process-data; days: ", days, "stepSize: ", stepSize);
  chartParams.days = days;
  chartParams.stepSize = stepSize;
  store.set('chartParams', chartParams);
  const processedResults = processing(truncatedData, days, stepSize);
  event.sender.send("data-processed", processedResults, false);
});

ipcMain.on("process-days-data", (event) => {
  readFile(event, (rawData) => {
    const daysData = truncateData(rawData, 30);
    const processedResults = processingDays(daysData);
    event.sender.send("processed-days-data", processedResults);
  });
});

ipcMain.on("update-days", (event, days) => {
  chartParams.days = days;
  store.set('chartParams', chartParams);
  const range = getRange(days);
  event.sender.send("days-updated", range);
});

ipcMain.on("update-step", (event, stepSize) => {
  chartParams.stepSize = stepSize;
  store.set('chartParams', chartParams);
  const newConsumptionData = updateConsumptionData(truncatedData, stepSize);
  event.sender.send("step-updated", newConsumptionData);
});


ipcMain.on("refresh", (event) => {
  console.log("receive refresh");
  readFile(event, (rawData) => {
    truncatedData = truncateData(rawData, 7);
    const processedResults = processing(truncatedData, chartParams.days, chartParams.stepSize);
    event.sender.send("data-processed", processedResults, false);
  });
});



app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  store.set('chartParams', chartParams);
  console.log('save set')
  app.quit();
});
