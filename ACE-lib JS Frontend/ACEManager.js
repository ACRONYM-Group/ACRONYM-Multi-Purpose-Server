class ACE {
    createNewACE() {

        const spawn = require('child_process').spawn; 
        const command = 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/launch.bat';
        const parameters = [];
        
        const child = spawn(command, parameters, {cwd: 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/'});
        
        this.requiredACEs.push({type:"generalPurpose"});
    }

    constructor(type, responseClass) {
        this.responseClass = responseClass;
        this.type = type;
        this.requiredACEs = [];
        this.ownedACEs = [];
        this.ownedACEsData = {};
        this.randomID = Math.floor(Math.random()*5000)*Date.now();
        this.username = "NOTLOGGEDIN";
        this.ipc = require('node-ipc');

        this.ipc.config.id = 'world';
        this.ipc.config.retry = 1500;
        this.ipc.config.silent = true;
        console.log("Creating Node IPC Server");
        this.ipc.serve(() => this.ipc.server.on('command', (message, socket) => {
            if (message["type"] == "connectionRequest") {
                if (this.requiredACEs.length > 0) {
                    this.ipc.server.emit(socket, "connectionResponse", {target:message["ID"], hostID:this.randomID, role:this.requiredACEs[0]["type"]});
                }
            }
        
            if (message["type"] == "connectionAccepted" && message["target"] == this.randomID) {
                console.log("Connected to ACE");
                this.ownedACEs.push(message["ID"]);
                this.ownedACEsData[message["ID"]] = {type:this.requiredACEs[0]["type"], socket:socket};
                this.requiredACEs.shift();
            }

            if (this.ownedACEs.indexOf(message["ID"]) != -1 && message["target"] == this.randomID) {
                if (message["type"] == "heartbeat") {
                  this.ipc.server.emit(socket, "heartbeat", {target:message["ID"]});
                } 
                
                else if (message["type"] == "rawMessage") {
                  console.log(message["data"]);
                  this.ipc.server.emit(socket, "message", {target:message["ID"], data:"Hello ACE!"});
                } 
                
                else if (message["type"] == "loginResult") {
                    this.responseClass.loginResult(message);
                }

                else {
                    this.responseClass.genericHandler(message);
                }
            }
        }));
        this.ipc.server.start();

        this.createNewACE();
    }

    login(username, password, computer) {
        this.username = username

        var dataToSend = {username:username, password:password, computerName:computer};
        this.send("login", dataToSend);
    }

    send(channel, data, ACEID) {
        if (ACEID == undefined) {
            ACEID = 0;
        }
        ACEID = this.ownedACEs[ACEID];
        
        data["target"] = ACEID;
        console.log(channel);
        console.log(data);
        this.ipc.server.emit(this.ownedACEsData[ACEID]["socket"], channel, data);

    }

    sendCommand(data, ACEID) {
        if (ACEID == undefined) {
            ACEID = 0;
        }

        this.send("proxyCommand", {command:data})
    }

}

module.exports = ACE;