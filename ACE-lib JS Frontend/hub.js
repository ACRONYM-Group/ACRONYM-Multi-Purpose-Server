nodeRequire('./renderer.js');
var statusCardJSFiles = [];

function includeHTML() {
    var z, i, elmnt, file, xhttp;
    /* Loop through a collection of all HTML elements: */
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
      elmnt = z[i];
      /*search for elements with a certain atrribute:*/
      file = elmnt.getAttribute("w3-include-html");
      if (file) {
        /* Make an HTTP request using the attribute value as the file name: */
        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4) {
            if (this.status == 200) {elmnt.innerHTML = this.responseText;}
            if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
            /* Remove the attribute, and call this function once more: */
            elmnt.removeAttribute("w3-include-html");
            includeHTML();
          }
        } 
        xhttp.open("GET", file, true);
        xhttp.send();
        /* Exit the function: */
        return;
      }
    }
  }

function initialLoad() {
    ipcRenderer.send('requestProgramStatusCards', "Ping");
}

function drawCards(data) {
    var cardTextToAdd = "";
    for (var i = 0; i < data.length; i++) {
        cardTextToAdd += data[i]
    }
    document.getElementById("CardArea").innerHTML = cardTextToAdd;
}

function openPackManager() {
    ipcRenderer.send('openPackManager', "Ping");
}

function openNotificationCenter() {
    ipcRenderer.send('openNotificationCenter', "Ping");
}

function disconnectFromAmps() {
    ipcRenderer.send('disconnectFromAmps', "Ping");
}

function findStatusCardID(name) {
    for (var s = 0; s < statusCardJSFiles.length; s++) {
        if (statusCardJSFiles[s]["constructed"].name != undefined) {
            if (statusCardJSFiles[s]["constructed"].name == name) {
                return s;
            }
        }
    }
}

initialLoad()

ipcRenderer.on('programStatusCards', (event, arg) => {
    if (arg["subbedStatusCards"] != undefined) {
        if (arg["subbedStatusCards"].length > 0) {
            for (var i = 0; i < arg["subbedStatusCards"].length; i++) {
                document.getElementById("CardArea").innerHTML += "<div w3-include-html='" + arg["statusCardInstallDir"] + arg["subbedStatusCards"][i] + ".html'></div>";
            }

            includeHTML();
            
            for (var i = 0; i < arg["subbedStatusCards"].length; i++) {
                statusCardJSFiles[i] = {};
                statusCardJSFiles[i]["require"] = nodeRequire(arg["statusCardInstallDir"] + arg["subbedStatusCards"][i] + ".js");
                statusCardJSFiles[i]["constructed"] = new statusCardJSFiles[i]["require"](ipcRenderer);
            }

            function runInit(s) {
                statusCardJSFiles[s]["constructed"].init();
                if (s+1 < statusCardJSFiles.length) {
                    runInit(s+1); 
                }
            }
            setTimeout(function() {
                runInit(0);
                
            }, 2000);

            function runLoop(s) {
                if (statusCardJSFiles[s]["constructed"].loop != undefined) {
                    statusCardJSFiles[s]["constructed"].loop();
                }
                if (s+1 < statusCardJSFiles.length) {
                    runLoop(s+1); 
                }
            }
            setInterval(function() {
                runLoop(0);
                
            }, 1000);
        }
    }
})