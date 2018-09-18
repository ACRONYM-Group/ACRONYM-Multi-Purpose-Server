const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var seedrandom = require('seedrandom');
var fs = require('fs');
  
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win
  let loginWin
  
  function openIndexPage() {
    
    }

  function createLoginWindow () {
    // Create the browser window.
    loginWin = new BrowserWindow({width: 400, height: 600, frame: false})
    // Open the DevTools.
    //loginWin.webContents.openDevTools()

    loginWin.loadFile('login.html')

    ipcMain.on('loginButtonPressed', (event, arg) => {
        console.log(arg)
        loginWin.loadFile('index.html')
        loginWin.setSize(1280, 600)
        loginWin.center()

    })

    ipcMain.on('requestFiles', (event, arg) => {
      console.log("User Requested File Directory Data")

      var path = "z:/AcroFTP/";
 
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        event.sender.send('FileList', JSON.stringify(items))
      });

  })

    loginWin.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        loginWin = null

      })
    
  }

  function createMainWindow() {
    win = new BrowserWindow({width: 1280, height: 600, frame: false})
  
    // and load the index.html of the app.
    win.loadFile('index.html')
    
  
    // Open the DevTools.
    //win.webContents.openDevTools()
  
    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
    })
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createLoginWindow)
  
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createLoginWindow()
    }
  })
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.





  /*dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        console.log("No file selected");
        return;
    }

    fs.readFile(filepath, 'utf-8', (err, data) => {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
            return;
        }

        // Change how to handle the file content
        console.log("The file content is : " + data);
    });
    
});*/
