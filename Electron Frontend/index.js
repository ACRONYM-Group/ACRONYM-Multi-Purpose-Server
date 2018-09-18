require('./renderer.js')
        const {ipcRenderer} = require('electron')

        function generateDeleteButton() {
            return '<div id="FileDeleteButton" class="FileDeleteButton">Delete</div><br>'
        }

        ipcRenderer.on('FileList', (event, arg) => {
            filesInDirectory = JSON.parse(arg)
            
            text = ''
            totalFileSize = 0;
            totalNumberOfFiles = 0;
            totalNumberOfFolders = 0;
            for (i = 0; i < filesInDirectory.length; i++) { 
                if (filesInDirectory[i]["name"].includes(".")) {
                } else {
                    text += "<div class='fileListItem'>📁 - " + filesInDirectory[i]["name"] + " (" + filesInDirectory[i]["size"] + "MB)</div> " + generateDeleteButton() + "<br>";
                    totalFileSize += filesInDirectory[i]["size"];
                    totalNumberOfFolders += 1;
                }
                
            }

            for (i = 0; i < filesInDirectory.length; i++) { 
                if (filesInDirectory[i]["name"].includes(".")) {
                    text += "<div class='fileListItem'>📰 - " + filesInDirectory[i]["name"] + " (" + Math.round(filesInDirectory[i]["size"] * 10)/10 + "MB)</div> " + generateDeleteButton() + "<br>";
                    totalFileSize += filesInDirectory[i]["size"];
                    totalNumberOfFiles += 1;
                }
                
            }

            text += "";
            document.getElementById("FilesList").innerHTML = text;
            document.getElementById("TotalFileSize").innerHTML = '<div id="TotalFileSize"> Disk Usage: ' + Math.round(totalFileSize * 10)/10 + ' MB<br>Files in Parent Dir: ' + Math.round(totalNumberOfFiles * 10)/10 + '<br>Folders in Parent Dir: ' + Math.round(totalNumberOfFolders * 10)/10 + '</div>';
            console.log(text);
        })

        ipcRenderer.send('requestFiles', 'ping')

   