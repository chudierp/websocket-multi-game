const express = require('express');
const app = express();
const http = require('http');
const websocketServer = require('websocket').server
const server = http.createServer(app);

const clients = {}; 

const wsServer = new websocketServer({
    'httpServer': httpServer
})
wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);
    connection.on('open', () => console.log('opened'))
    connection.on('close', () => console.log('closed'))
    connection.on('message', message => {
        const result = JSON.parse(message.utf8Data)
        console.log(result)
    })
    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))
})
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 


server.listen(3000, () => {
  console.log('listening on *:3000');
});