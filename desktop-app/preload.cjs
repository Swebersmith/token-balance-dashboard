const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  getBalances: () => ipcRenderer.invoke('balances:get'),
  refreshBalances: () => ipcRenderer.invoke('balances:refresh'),
  saveProvider: (provider) => ipcRenderer.invoke('provider:save', provider),
  addManualProvider: (provider) => ipcRenderer.invoke('provider:add-manual', provider),
  addWebProvider: (provider) => ipcRenderer.invoke('provider:add-web', provider),
  deleteProvider: (id) => ipcRenderer.invoke('provider:delete', id),
  openProvider: (id, page) => ipcRenderer.invoke('provider:open', id, page),
  onBalancesUpdated: (callback) => ipcRenderer.on('balances-updated', (_, state) => callback(state)),
})
