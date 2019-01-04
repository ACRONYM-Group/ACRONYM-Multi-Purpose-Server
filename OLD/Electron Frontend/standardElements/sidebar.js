const si = require('systeminformation');
var canvas = document.getElementById("SystemResourcesMonitorCanvas");
var ctx = canvas.getContext("2d");

function convertPercentToRadianCoords(input) {
    var RadiansToDraw = input * 2;
    if (RadiansToDraw <= 1.5) {
       var output = 1.5 - RadiansToDraw;
    } else {
        var output = 2 - (RadiansToDraw - 1.5);
    }
    return [output, input];
}

function drawCPUArc(data) {
    ctx.clearRect(0, 0, canvas.width/2, canvas.height);
    ctx.beginPath();
    ctx.arc(60,75,50,1.5*Math.PI,data[0]*Math.PI, true);
    ctx.lineWidth=10;
    if (data[1] >= 0.75) {
        ctx.strokeStyle="red";
    } else {
        ctx.strokeStyle="blue";
    }
    ctx.stroke();

    ctx.font = "30px Arial";
    ctx.fillText(Math.floor((data[1]*100)) + "%",32,84);
    ctx.font = "15px Arial";
    ctx.fillText("CPU Usage",19,150);
}

function drawMemUsage(data) {
    ctx.clearRect(canvas.width/2, 0, canvas.width/2, canvas.height);
    ctx.fillStyle = "#cecece";
    ctx.fillRect(175,20,50,100);
    ctx.fillStyle = "green";
    ctx.fillRect(175,20+(100-data),50,data);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.fillText("Mem Usage",160,150);
}

function drawCPUGraph() {
    var CPULoad = 0;
    si.currentLoad(function(data) {
        CPULoad = data.currentload;
        //console.log(CPULoad);
        drawCPUArc(convertPercentToRadianCoords(CPULoad/100));
    });

    si.mem(function(data) {
        //console.log(data);
        memoryUsage = data.used/data.total;
        drawMemUsage(memoryUsage*100);
        
    });
}

setInterval(drawCPUGraph, 500);


