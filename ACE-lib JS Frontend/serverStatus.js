nodeRequire('./renderer.js');

processes = {
    /*31415:{
        name:"Minecraft.exe", 
        PID:"31415", 
        CPUHistory:[
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                28, 29, 30, 31, 31, 32, 32, 32, 32, 32,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                76, 75, 12, 89, 88, 89, 87, 85, 88, 88,
                88, 88, 33, 33, 33, 33, 33, 33, 33, 33
            ], 
        RAMHistory:[
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
                28, 29, 30, 31, 31, 32, 32, 32, 32, 32,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
                76, 75, 12, 89, 88, 89, 87, 85, 88, 88,
                88, 88, 33, 33, 33, 33, 33, 33, 33, 33
            ]
    }*/
};


function createProcessHTML(processInfo) {

    HTD = "<div id='PID" + processInfo["PID"] +  "' class='processDisplay'>";
    HTD +=  "<h3>" + processInfo["name"] + " <br> " + processInfo["PID"] +"</h3><br>";
    HTD +=  "<div class='processCPUDisplay'>";
    HTD +=      "<canvas id='"+ processInfo["PID"] + "CPUCanvas' width='120' height='25' style='margin-right:10px; margin-left:0px; padding-left:0px;'></canvas>";
    HTD +=  "</div>"; 
    HTD +=  "<div class='processRAMDisplay'>";
    HTD +=      "<canvas id='" + processInfo["PID"] + "RAMCanvas' width='120' height='25' style='margin-right:10px; margin-left:0px;'></canvas>";
    HTD +=  "</div>";
    HTD += "</div>";

    document.getElementById("bodyGroup").innerHTML += HTD;
}

function drawCPUandRAM(processInfo) {
    var CPUCanvasName = processInfo["PID"] + "CPUCanvas";
    var c = document.getElementById(CPUCanvasName);
    var ctx = c.getContext("2d");

    ctx.strokeStyle="#0000FF";

    for (var i = 0; i < processInfo["CPUHistory"].length; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 25);
        ctx.lineTo(i, 25-processInfo["CPUHistory"][i]*0.25);
        ctx.stroke();
    }


    var RAMCanvasName = processInfo["PID"] + "RAMCanvas";
    var c = document.getElementById(RAMCanvasName);
    var ctx = c.getContext("2d");

    ctx.strokeStyle="#00FF00";

    for (var i = 0; i < processInfo["RAMHistory"].length; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 25);
        ctx.lineTo(i, 25-processInfo["RAMHistory"][i]*0.25);
        ctx.stroke();
    }
}

function clearDisplays(processInfo) {
    var CPUCanvasName = processInfo["PID"] + "CPUCanvas";
    var c = document.getElementById(CPUCanvasName);
    var ctx = c.getContext("2d");
    ctx.fillStyle="#FFFFFF";
    ctx.clearRect(0, 0, c.width, c.height);

    var RAMCanvasName = processInfo["PID"] + "RAMCanvas";
    var c = document.getElementById(RAMCanvasName);
    var ctx = c.getContext("2d");
    ctx.fillStyle="#FFFFFF";
    ctx.clearRect(0, 0, c.width, c.height);
    
}

function updateProcesses(processUpdates) {
    for (var i = 0; i < processUpdates.length; i++) {
        processes[processUpdates[i]["PID"]]["CPUHistory"].shift();
        processes[processUpdates[i]["PID"]]["RAMHistory"].shift();

        processes[processUpdates[i]["PID"]]["CPUHistory"].push(processUpdates[i]["CPUValue"]);
        processes[processUpdates[i]["PID"]]["RAMHistory"].push(processUpdates[i]["RAMValue"]);

        clearDisplays({PID:processUpdates[i]["PID"]});

        drawCPUandRAM(processes[processUpdates[i]["PID"]]);
    }
}

//createProcessHTML(processes[31415]);
//drawCPUandRAM(processes[31415]);

ipcRenderer.on('dataUpdate', (event, arg) => {
    console.log(arg["data"]);
    document.getElementById("bodyGroup").innerHTML = "";
    if (arg["key"] == "processInfo") {
        processesReceived = JSON.parse(arg["data"]);
        processes = processesReceived;        

        for (var PID in processesReceived) {
            createProcessHTML(processesReceived[PID]);
            drawCPUandRAM(processesReceived[PID]);
        }
    }
});

setInterval(function() {
    //updateProcesses([{PID:31415, CPUValue:47, RAMValue:47}]);
    ipcRenderer.send('getData', "processInfo");

}, 1000);
