currentFileSystemDirectory = "";

function openFile() {
    console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
}

function navigateToPage(buttonID) {
    ipcRenderer.send('requestPage', buttonID.substring(3));
}

function generateDeleteButton() {
    return '<div id="FileDeleteButton" class="FileDeleteButton">Delete</div><br>'
}

function uploadFile() {
    ipcRenderer.send('requestPacketSend', 'ping');
}

function openFolder(FolderID) {
    FolderPath = FolderID.substring(3);
    ipcRenderer.send('requestDirectory', currentFileSystemDirectory + FolderPath);
}

function openPath(FolderPath) {
    ipcRenderer.send('requestDirectory', FolderPath);
}

function goBackDir() {
    console.log("Going up a directory.");
    console.log("Current Dir " + currentFileSystemDirectory);
    newDir = removeLastDirectoryPartOf(currentFileSystemDirectory);
    console.log("Going to " + newDir);
    openPath(newDir);
}

function removeLastDirectoryPartOf(the_url){
    if (the_url[the_url.length - 1] == "/") {
        the_url = the_url.slice(0,-1);
        var the_arr = the_url.split('/');
        console.log(the_arr);
        the_arr[the_arr.length - 1] = null;
        console.log(the_arr);
        strToReturn = the_arr.join('/');
        return(strToReturn);
    } else {
        var the_arr = the_url.split('/');
        console.log(the_arr);
        the_arr[the_arr.length - 1] = null;
        console.log(the_arr);
        strToReturn = the_arr.join('/');
        return(strToReturn);
    }
}

ipcRenderer.on('FileList', (event, arg) => {
    dataRec = JSON.parse(arg);
    filesInDirectory = dataRec.files;
    currentFileSystemDirectory = dataRec.currentDir; 
    
    text = '';
    totalFileSize = 0;
    totalNumberOfFiles = 0;
    totalNumberOfFolders = 0;
    for (i = 0; i < filesInDirectory.length; i++) { 
        if (filesInDirectory[i]["name"].includes(".")) {
        } else {
            text += "<div id='DIR" + filesInDirectory[i]["name"] + "' class='fileListItem' onclick='openFolder(this.id)'>📁 - " + filesInDirectory[i]["name"] + "</div>" + generateDeleteButton() + "<br>";
            totalFileSize += filesInDirectory[i]["size"];
            totalNumberOfFolders += 1;
        }
        
    }

    for (i = 0; i < filesInDirectory.length; i++) { 
        if (filesInDirectory[i]["name"].includes(".")) {
            text += "<div id='FIL" + filesInDirectory[i]["name"] + "' class='fileListItem'>📰 - " + filesInDirectory[i]["name"] + " (" + Math.round(filesInDirectory[i]["size"] * 10)/10 + "MB)</div> " + generateDeleteButton() + "<br>";
            totalFileSize += filesInDirectory[i]["size"];
            totalNumberOfFiles += 1;
        }
        
    }

    text += "";
    document.getElementById("FilesList").innerHTML = text;
    document.getElementById("dirDisplayPara").innerHTML = currentFileSystemDirectory;
    document.getElementById("TotalFileSize").innerHTML = '<div id="TotalFileSize"> Current Dir Size: ' + Math.round(totalFileSize * 10)/10 + ' MB<br>Files in Parent Dir: ' + Math.round(totalNumberOfFiles * 10)/10 + '<br>Folders in Parent Dir: ' + Math.round(totalNumberOfFolders * 10)/10 + '</div>';
})

ipcRenderer.send('requestFiles', 'ping')

   