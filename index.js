
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

const STATE_CREATED = "A game has been created"
const STATE_WAITING = "waiting for all players to join" //waiting for other 2 players to show up
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
                // "balls": 20, //
                "clients":[],
                gameBoard: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                gameState: STATE_CREATED,
                gameTime: 0,
                
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
            game.gameState = STATE_WAITING
            if (game.clients.length >= 3) 
            {
                //sorry max players reach
                return;
            }
            const color =  {"0": "tomato", "1": "lime", "2": "cornflowerblue"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })
            const payLoad = {
                "method": "join",
                "game": game
            }
            //start the game
            if (game.clients.length === 3) {
                // payLoad.method = 'countdown'
                game.gameState = STATE_READY;
                setTimeout(()=> {
                    game.gameState = STATE_PLAYING //GAME STARTS AFTER 3 SECONDS
                    updateGameState(game)
                }, 3000)
                
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
            // const score = result.score

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
    const payLoad = {
        "method": "update",
        "game": game,
    }
    
    game.clients.forEach(c=> {
        clients[c.clientId].connection.send(JSON.stringify(payLoad))
    })
    //check the game.gameTime!!! if its > 1000 x 60 the game is over
    if (game.gameState === STATE_PLAYING) {
        game.gameTime += 1000;
        if (game.gameTime >= 30500) {
            game.gameState = STATE_OVER
            endGame(game)
            return
        }
    }
    
    setTimeout(() => {
        updateGameState(game)
    }, 1000);
    
}    
function endGame(game) {
   //display game is over to all clients of the game
    const payLoad = {
        "method": "gameover",
        "game": game,
        "score": 0
    }

    game.clients.forEach(c=> {
        clients[c.clientId].connection.send(JSON.stringify(payLoad))
    })
    
    
    if (game.gameState = STATE_OVER) {
        //save  how many times each color appears on the board and return the largest
        
        return
    }
    
}

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();