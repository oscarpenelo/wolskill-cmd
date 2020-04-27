// Modules to control application life and create native browser window

//const URWS = require("universal-reconnecting-websocket")

var WSCLIENT = require('ws-reconnect');

var macaddress = require('macaddress');
const argv = require('yargs').argv

const url = "wss://3rbp1kul8g.execute-api.eu-west-1.amazonaws.com/prod";
var awsid = ""
var license = ""
let pingTimeout




// shutdown.js

// Require child_process
var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback) {
    exec('shutdown now', function(error, stdout, stderr) {
        callback(stdout);
    });
}


if (argv.amzid && argv.license) {
    awsid = argv.amzid
    license = argv.license
    console.log("AMAZON ID: " + awsid)
    console.log("LICENSE: " + license)
} else {
    console.log("[ERROR] NO AMAZON ID OR LICENSE. Run with --amzid <AMAZON ID> --license <LICENSE>")
    process.exit()
}



var ws =new WSCLIENT(url + "?awsid=" + awsid + "&license=" + license)

ws.on('connect', () => {
    var send = JSON.stringify({
        "awsid": awsid,
        "license": license
    })
    console.log("CONNECTED")


    clearTimeout(this.sendping);
    macaddress.all(function(err, all) {
                    console.log(JSON.stringify(all))

        ws.send(JSON.stringify(all));
    });
    this.sendping = setTimeout(() => {

        macaddress.all(function(err, all) {
            console.log(JSON.stringify(all))
            ws.send(JSON.stringify(all));
        });
    }, 30000);
    heartbeat();
});
ws.on('message',  data => {
    var mess = JSON.parse(data);
    console.log("MESSAGE: "+ data)
    if (mess.value == "pong") {

        heartbeat();
        clearTimeout(this.sendping);

        this.sendping = setTimeout(() => {
            macaddress.all(function(err, all) {
                            console.log(JSON.stringify(all))

                ws.send(JSON.stringify(all));
            });
        }, 30000);
    } else {
        macaddress.all(function(err, all) {
            for (var interface in all) {
                var mac = all[interface]["mac"].toUpperCase()
                mac = mac.split(':').join('-')
                console.log(mac)
                if (mess.value == mac) {
                    console.log("SHUTDOWN")
                    // Reboot computer
                    shutdown(function(output) {
                        console.log(output);
                    });
                }
            }
        });
    }
});


ws.on('error', () => {
console.log("ERROR")
ws.connect(url + "?awsid=" + awsid + "&license=" + license)


});



ws.on('reconnect', () => {
    heartbeat();
    clearTimeout(this.sendping);
    this.sendping = setTimeout(() => {
        macaddress.all(function(err, all) {
                        console.log(JSON.stringify(all))

            ws.send(JSON.stringify(all));
        });
    }, 30000);
    console.log('reconnected')
});
/*
ws.on('close', function clear() {
    console.log('close')

  //  clearTimeout(pingTimeout);
})
*/
function heartbeat() {
    
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(() => {

console.log("TIMEOUT")
ws.emit("connect");
        }, 40000);
    
}


ws.on("destroyed",function(){
    console.log("destroyed");
});
ws.start()
/*
ws.on('disconnect', () => {

    console.log('DISCONNECTED')
})
*/
//ws.connect()