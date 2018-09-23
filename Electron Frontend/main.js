const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var seedrandom = require('seedrandom');
var fs = require('fs');
let win
let loginWin
  
function openIndexPage() {
    
}

var net = require('net');

var client = new net.Socket();
client.connect(12345, '192.168.1.11', function() {
  console.log('Connected');
  client.write('Hello, server! Love, Client.');
});

function sendPacket(data) {
  var client = new net.Socket();
  client.connect(12345, '192.168.1.11', function() {
    console.log('Connected');
    client.write(data);
  });
}

client.on('data', function(data) {
  console.log('Received: ' + data);
});

  function createLoginWindow () {
    // Create the browser window.
    loginWin = new BrowserWindow({width: 400, height: 600, frame: false})

    // Open the DevTools.
    loginWin.webContents.openDevTools()

    loginWin.loadFile('login.html')

    ipcMain.on('loginButtonPressed', (event, arg) => {
        console.log(arg)
        sendPacket("User has logged in.")
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
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });
      });


  ipcMain.on('requestPacketSend', (event, arg) => {
    console.log("Window is asking to send packet")
    sendPacket(arg)
    });

  ipcMain.on('requestPage', (event, arg) => {
    if (arg == "ProgramStatus") {
      loginWin.loadFile("template.html");
    } else if (arg == "FileSystem") {
      loginWin.loadFile("index.html");
    }

  });

    ipcMain.on('requestDirectory', (event, arg) => {
      path = arg;
      if (path[path.length-1] == "/") {
        var path = arg;
      } else {
        var path = arg + "/";
      }

      console.log("reading from " + path);
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });
      });



    loginWin.on('closed', () => {
        loginWin = null

      });
    
  }


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


  /*


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
