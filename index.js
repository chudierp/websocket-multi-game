
const http = require("http");
const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))

app.listen(9091, ()=> console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};
const STATE_WAITING = "waiting for all players to join"; //waiting for other 2 players to show up
const STATE_READY = "ready to play" //gettting ready to start the game
const STATE_PLAYING = "game is taking place" //the game has started
const STATE_OVER = "the game has ended" //the game is complete

const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        console.log(result)
        //I have received a message from the client
        //a user want to create a new game
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20, //
                "clients":[],
                gameState: STATE_WAITING,
                gameTime: 0
            }
            const payLoad = {
                "method": "create",
                "game" : games[gameId]
            }
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }
        //a client want to join
        if (result.method === "join") {

            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            if (game.clients.length >= 3) 
            {
                //sorry max players reach
                return;
            }
            const color =  {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })
            //start the game
            if (game.clients.length === 3) {
                game.gameState = STATE_READY;
                setTimeout(()=> {
                    updateGameState(game)
                }, 3000)
                
            }
            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people have joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const ballId = result.ballId; //
            const color = result.color;

            let state = games[gameId].state;
            if (!state)
                state = {}
            state[ballId] = color; //
            games[gameId].state = state; 
        }
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
function updateGameState(game) {
    // for (const g of Object.keys(games)) {
    //     const game = games[g]
    //     const payLoad = {
    //         "method": "update",
    //         "game": game
    //     }

    //     game.clients.forEach(c=> {
    //         clients[c.clientId].connection.send(JSON.stringify(payLoad))
    //     })
    
        // if (game.gameState === STATE_PLAYING) {
        //     game.gameTime += 500;
        //     if (game.gameTime >= 30000) {
        //         endGame(game)
        //         return
        //     }
        //     setTimeout(updateGameState, 500);
        // }
    // }
    // setTimeout(updateGameState, 500);
    game.gameTime += 500
    const payLoad = {
        "method": "update",
        "game": game,
    }

    game.clients.forEach(c=> {
        clients[c.clientId].connection.send(JSON.stringify(payLoad))
    })
    setTimeout(() => {
        updateGameState(game)
    }, 500);
    
}
    // game.clients.forEach(c=> {
    //     clients[c.clientId].connection.send(JSON.stringify(payLoad))
    // })
    // console.log(game)
    


function endGame(game) {
    game.gameState = STATE_OVER
    //display game is over to all clients of the game
}

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();