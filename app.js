/*

Possible new features:
-Allow clients to change their username in the middle of a chat session.
-Try adding buttons to the page to make pre-loaded sounds play at a distance. A little "ding" to wake up sleeping clients?
-Try to save the messages in the memory on the server so that the list of the latest messages can be displayed when we connect. You can save information in the memory as we learnt try to couple Node.js with a MySQL, MongoDB, redis, etc. database.


-update win message for X
-show win pattern for observers

*/

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Blocks HTML characters (security equivalent to htmlentities in PHP)
    fs = require('fs');

/* Game variables */
var usersArray = [],
    numUsers = 0, //track the number of users connected
    activePlayers = [],
    currentTurn = 1,
    currentMap = [],
    gameOver = false;


/*
Needs to: display past winners -> X or O, and their username
  sort by date descending

*/
var scoreBoard = [];
var winPatterns = [
    0b111000000, 0b000111000, 0b000000111, // Rows
    0b100100100, 0b010010010, 0b001001001, // Columns
    0b100010001, 0b001010100 //Diagonals
];

/* Constants */
var X = 1, O = -1, BLANK = 0;

/* Function declarations */
function removeFromArray(arr, target) {
    var x, L = arr.length, targetIndex;

    if ((targetIndex = arr.indexOf(target)) !== -1) {
        arr.splice(targetIndex, 1);
    }

    return arr;
}

function checkWin(player) {
    let playerMapBitMask = 0;

    for (let i = 0, len = currentMap.length; i < len; i++) {
        playerMapBitMask <<= 1;
        if (currentMap[i] === player) {
            playerMapBitMask += 1;
        }
    }

    for (let i = 0; i < winPatterns.length; i++) {
        if ((playerMapBitMask & winPatterns[i]) === winPatterns[i]) {
            return winPatterns[i];
        }
    }

    return 0;
}


/* NodeJS Server setup */

// Load our assets in the public folder
app.use(express.static("public"));

// For our io.sockets connections
io.sockets.on('connection', function (socket, username) {

    // New session has been started
    socket.on('begin new session', function (username) {

        socket.emit('init new session', {
            numUsers: numUsers,
            usersArray: usersArray
        });
    });

    // When a new player has joined
    socket.on('player has joined', function (data) {
        //console.log("Player has joined: " + data.currentPlayer + "with map: " + data.map);
        var msg = "",
            currentPlayer = 0,
            sessionId = socket.id,
            gameFull = false;

        if (activePlayers.length >= 2) {
            msg = "Sorry, game is full!";
            gameFull = true;
        }
        else if (activePlayers.length < 1) {
            currentPlayer = X; //first player is always X
            msg = "Player X has joined";
            currentMap = data.map; //save X's first turn
            activePlayers.push({ currentPlayer, sessionId });
        } else {
            currentPlayer = O;
            msg = "Player O has joined";
            activePlayers.push({ currentPlayer, sessionId });
        }

        socket.emit('player has joined', {
            activePlayers: activePlayers,
            currentPlayer: currentPlayer,
            currentTurn: currentTurn,
            map: currentMap,
            gameFull: gameFull,
            msg: msg
        });
    });

    socket.on('player made a move', function (data) {
        currentTurn = data.currentPlayer * -1;
        currentMap = data.map;

        var winCheck = checkWin(data.currentPlayer);

        if (winCheck > 0) {
            socket.emit('you have won', {
                winCheck: winCheck
            });

            scoreBoard.push({ player: (data.currentPlayer === X ? 'X' : 'O'), sessionId: socket.id });
            //console.log(scoreBoard);
        }

        socket.broadcast.emit('update board', {
            currentPlayer: data.currentPlayer,
            map: currentMap,
            currentTurn: currentTurn,
            winCheck: winCheck
        });
    });

    // When the username is received. it's stored as a session variable and informs the other people
    socket.on('client joined', function (username) {
        username = ent.encode(username);
        //console.log("The socket id '" + socket.id + "' will become '" + username + "'");
        socket.username = username;
        ++numUsers;
        usersArray.push(username);

        //For a single login
        socket.emit('login', {
            numUsers: numUsers,
            usersArray: usersArray
        });

        socket.broadcast.emit('client joined', {
            username: socket.username,
            numUsers: numUsers,
            usersArray: usersArray
        });
    });

    // When a message is received, the client's username is retrieved and sent to the other people
    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.broadcast.emit('message', { username: socket.username, message: message });
    });

    // When the user disconnects
    socket.on('disconnect', function () {

        if (activePlayers.length > 1) { //only care if there is two active players 
            if (socket.id === activePlayers[0].sessionId) {
                console.log("Player X has left!");
            } else if (socket.id === activePlayers[1].sessionId) {
                console.log("Player O has left!");
            }
        }


        if (typeof socket.username === "undefined" || socket.username.trim() === "") {
            return;
        }

        --numUsers;
        removeFromArray(usersArray, socket.username);


        // echo globally that this client has left
        socket.broadcast.emit('client left', {
            username: socket.username,
            numUsers: numUsers,
            usersArray: usersArray
        });
    });
});

//Listen on port 8080
server.listen(8080);
