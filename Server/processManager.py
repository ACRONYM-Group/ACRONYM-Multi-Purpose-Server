import ACELib
import json
import time
import sys; 
print(sys.executable)

import psutil

conn = ACELib.Connection("192.168.1.142")

conn.initConnection()

if conn.loginServer("Jordan", "admin"):
    print("Login Good")
else:
    print("Login Failed")

processes = {
    "31415":{
        "name":"AMPS", 
        "PID":"Server Totals", 
        "CPUHistory":[
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ], 
        "RAMHistory":[
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
    },
    "231415": {
        "name":"Minecraft", 
        "PID":"12345", 
        "CPUHistory":[
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ], 
        "RAMHistory":[
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
    }
}

#conn.setData("processInfo", json.dumps(processes))
data = "681269724982989j849yu848947897897984984984894156ui4rgfdgtijyioerhroeutiuerytreuytuiretertretregdfgdfHggfsdfsdfd89RH123EN1!O2NEION2N    nosnIOFJNODNSF9842-3NOIR34OINRO34RJ0-9SMDF0V@$@#$(*&#*(!$#(*(!nJDUNSFKDSL"
data = json.dumps(processes)
conn.sendEncrypted(json.dumps({"CMDType":"setData", "name":"processInfo", "value": data}), "__CMD__")

i = 0
while True:
    print("Looping")
    time.sleep(1)


    PIDs = psutil.pids()
    print(len(PIDs))
    i = 0

    processes["31415"]["CPUHistory"].pop(0)
    processes["31415"]["CPUHistory"].insert(len(processes["31415"]["CPUHistory"]), psutil.cpu_percent(interval=1))
    processes["31415"]["RAMHistory"].pop(0)
    processes["31415"]["RAMHistory"].insert(len(processes["31415"]["RAMHistory"]), psutil.virtual_memory()[2])

    PIDS = psutil.pids()

    PIDToCheck = 0
    while i < len(PIDS):
        if psutil.pid_exists(PIDS[i]):
            if psutil.Process(PIDS[i]).name() == "python.exe":
                print(PIDS[i])
                print(psutil.Process(PIDS[i]))
                PIDToCheck = PIDS[i]
        i += 1

    if PIDToCheck != 0:
        processes["231415"]["CPUHistory"].pop(0)
        processes["231415"]["CPUHistory"].insert(len(processes["231415"]["CPUHistory"]), psutil.Process(PIDToCheck).cpu_percent())
        processes["231415"]["RAMHistory"].pop(0)
        processes["231415"]["RAMHistory"].insert(len(processes["231415"]["RAMHistory"]), psutil.Process(PIDToCheck).memory_percent())
        processes["231415"]["RAMCurrent"] = psutil.Process(PIDToCheck).memory_info().rss

    data = json.dumps(processes)
    conn.sendEncrypted(json.dumps({"CMDType":"setData", "name":"processInfo", "value": data}), "__CMD__")

    i = i + 1
    conn.sendEncrypted(json.dumps({"CMDType":"setData", "name":"data", "value": [i, psutil.virtual_memory()[2]/100]} ), "__CMD__")
