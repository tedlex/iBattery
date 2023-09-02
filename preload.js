const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  processData: (days, stepSize) => ipcRenderer.send('process-data', days, stepSize),
  onProcessedData: (callback) => {
    ipcRenderer.on('data-processed', (event, data, isNewFile) => callback(data, isNewFile));
  },
  initializeData: () => ipcRenderer.send('initialize-data'),
  onDataInitialized: (callback) => {
    ipcRenderer.on('data-initialized', (event, chartParams) => callback(chartParams));
  },
  refresh: () => ipcRenderer.send('refresh'),
  updateDays: (days) => ipcRenderer.send('update-days', days),
  onDaysUpdated: (callback) => {
    ipcRenderer.on('days-updated', (event, range) => callback(range));
  },
  updateStep: (stepSize) => ipcRenderer.send('update-step', stepSize),
  onStepUpdated: (callback) => {
    ipcRenderer.on('step-updated', (event, newConsumptionData) => callback(newConsumptionData));
  },
  selectFile: () => ipcRenderer.send('select-file'),
  processDaysData: () => ipcRenderer.send('process-days-data'),
  onProcessedDaysData: (callback) => {
    ipcRenderer.on('processed-days-data', (event, processedResults) => callback(processedResults));
  }
});