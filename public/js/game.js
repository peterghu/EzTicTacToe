"use strict";

/* Constants */
let PLAYER_BLANK = 0, PLAYER_X = 1, PLAYER_O = -1,
    SINGLE_PLAYER = 1, TWO_PLAYER = 2, AWAITING_MODE = 0,
    OUTCOME_TIE = 5, OUTCOME_X = 6, OUTCOME_O = 7;

let colorWinLight = 'rgba(177, 250, 214, 0.3)',
    colorWinDark = 'rgba(177, 250, 214, 0.8)';

/* HTML elements */
let canvas = document.getElementById("game_canvas"),
    ctx = canvas.getContext('2d'),
    msg = document.getElementById("game_message"),
    textStatus = document.getElementById("game_status"),
    textScoreboard = $("#scoreboard");


var gameModule = function () {

    let cellSize = 100,
        map = [
            0, 0, 0,
            0, 0, 0,
            0, 0, 0],
        winPatterns = [
            0b111000000, 0b000111000, 0b000000111, // Rows
            0b100100100, 0b010010010, 0b001001001, // Columns
            0b100010001, 0b001010100 //Diagonals
        ],
        mouse = {
            x: -1,
            y: -1
        },
        currentPlayer = PLAYER_X,
        currentTurn = PLAYER_X,
        isActivePlayer = false,
        gameOver = false,
        gameFull = false,
        winCells = [];


    var canvasDrawId;
    var gameMode = AWAITING_MODE;
    var activePlayers = [];
    var scoreBoard = [];

    var rectSingle = {
        x: 55,
        y: 95,
        width: 200,
        height: 50
    };

    var rectDouble = {
        x: 55,
        y: 166,
        width: 200,
        height: 50
    };

    canvas.width = canvas.height = 3 * cellSize;


    /* Add in event listeners */
    canvas.addEventListener('mouseout', function () {
        mouse.x = mouse.y = -1;
    });

    canvas.addEventListener('mousemove', function (e) {
        let x = e.pageX - canvas.offsetLeft,
            y = e.pageY - canvas.offsetTop;

        mouse.x = x;
        mouse.y = y;

    });

    canvas.addEventListener('click', function (e) {

        switch (gameMode) {
            case SINGLE_PLAYER:
                /* placeholder */
                break;
            case TWO_PLAYER:
                play(getCellByCoords(mouse.x, mouse.y));
                break;
            default:
                pickGameMode();
        }
    });



    /* Function definitions */
    function msgDisplayTurn() {
        msg.textContent = ((currentTurn === PLAYER_X) ? 'X' : 'O') + "'s turn.";
    }

    function getCurrentPlayer() { return currentPlayer; }
    function setCurrentPlayer(x) { currentPlayer = x; }

    function getGameOverStatus() { return gameOver; }
    function setGameOverStatus(x) { gameOver = x; }

    function getIsActivePlayer() { return isActivePlayer; }
    function setIsActivePlayer(x) { isActivePlayer = x; }

    function getGameFull() { return gameFull; }
    function setGameFull(x) { gameFull = x; }

    function addActivePlayer(x) {
        activePlayers.push(x);
    }

    function removeActivePlayer(x) {
        //activePlayers.();
    }

    function play(cell) {
        if (gameOver || !isActivePlayer) return;

        if (currentTurn !== currentPlayer) {
            return;
        }

        if (map[cell] !== PLAYER_BLANK) {
            msg.textContent = 'Position taken.';
            return;
        }

        map[cell] = currentPlayer;

        //Emit to server and update canvas for all clients
        socket.emit("player made a move", {
            currentPlayer: currentPlayer,
            map: map
        });

        /* No empty cells available, game is a tie */
        if (map.indexOf(PLAYER_BLANK) === -1) {
            gameOver = true;
            msg.textContent = "Tie!";
            return;
        }

        currentTurn *= -1;
        msgDisplayTurn();
    }

    /* This function has to do 4 things:
    -update the winning pattern array to display on the board
    -update the text status
    -set game to gameOver state
    -update the score board
    */
    function showWin(winCheck, winningTurn, scoreBoard) {
        let bit = 1;
        for (let i = map.length - 1; i >= 0; i--) {

            if ((bit & winCheck) === bit) {
                winCells.push(i);
            }
            bit <<= 1;
        }

        msg.textContent = ((winningTurn === PLAYER_X) ? 'X' : 'O') + " wins!";
        gameOver = true;

        updateScoreBoard(scoreBoard);
    }

    function updateScoreBoard(newScoreBoard) {
        scoreBoard = newScoreBoard;
        textScoreboard.empty();

        for (let i = 0; i < scoreBoard.length; i++) {
            textScoreboard.prepend('<p><strong>Player ' + scoreBoard[i].player + '</strong> with User ID: "' + scoreBoard[i].sessionId + '" at ' + scoreBoard[i].playedOn + '</p>');
        }
    }

    /* Canvas drawing functions */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMouseHighlight();
        drawWinHighlight();
        drawBoard();
        drawFillBoard();

        canvasDrawId = requestAnimationFrame(draw);
    }

    function drawBoard() {
        ctx.strokeStyle = '#2e2d37';
        ctx.lineWidth = 10;

        ctx.beginPath();
        ctx.moveTo(cellSize, 0);
        ctx.lineTo(cellSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cellSize * 2, 0);
        ctx.lineTo(cellSize * 2, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, cellSize);
        ctx.lineTo(canvas.width, cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, cellSize * 2);
        ctx.lineTo(canvas.width, cellSize * 2);
        ctx.stroke();
    }

    function drawFillBoard() {
        ctx.strokeStyle = '#2e2d37';
        ctx.lineWidth = 5;

        for (let i = 0, len = map.length; i < len; i++) {
            let coords = getCellCoords(i);

            ctx.save();

            //translate to the center of each cell
            ctx.translate(coords.x + cellSize / 2, coords.y + cellSize / 2);

            if (map[i] === PLAYER_X) {
                drawX();
            } else if (map[i] === PLAYER_O) {
                drawO();
            }

            ctx.restore();
        }
    }

    function drawStartGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(rectSingle.x, rectSingle.y, rectSingle.width, rectSingle.height);
        ctx.fillStyle = 'rgba(225,225,225,0.5)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.rect(rectDouble.x, rectDouble.y, rectDouble.width, rectDouble.height);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = 1;
        ctx.font = "20px Arial";
        ctx.strokeText("Chose game mode: ", 15, 60);
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Singleplayer", 70, 130);
        ctx.fillText("Two Player", 70, 200);

        drawMouseBtnHighlight();

        canvasDrawId = requestAnimationFrame(drawStartGame);
    }


    /* Reset the canvas and clear variables */
    function drawResetGame() {
        if (canvasDrawId !== undefined)
            cancelAnimationFrame(canvasDrawId);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        map = [
            0, 0, 0,
            0, 0, 0,
            0, 0, 0];
        winCells = [];
        gameOver = false; //gameFull 
        currentTurn = PLAYER_X;
        msgDisplayTurn();
        textStatus.textContent = "Game has been reset";
        draw();
    }

    function updateTurnAndMap(turn, newMap) {
        map = newMap;
        currentTurn = turn;
       // drawFillBoard();
    }

    function pickGameMode() {

        if (isMouseOn() === SINGLE_PLAYER) {
            msg.textContent = "Singleplayer selected. Sorry this option is not available yet!";
            currentPlayer = PLAYER_X;
            //gameMode = SINGLE_PLAYER;
        }
        else if (isMouseOn() === TWO_PLAYER) {
            msg.textContent = "Two player selected!";
            gameMode = TWO_PLAYER;
            cancelAnimationFrame(canvasDrawId);
            drawResetGame();
            joinTwoPlayerMode();
        }
        else {
            msg.textContent = "No mode selected";
            gameMode = AWAITING_MODE;
        }
    }

    function joinTwoPlayerMode() {
        socket.emit("player has joined", {
            map: map
        });
    }

    function isMouseOn() {
        let mode = AWAITING_MODE,
            x = mouse.x,
            y = mouse.y;

        if (x >= rectSingle.x && x <= (rectSingle.x + rectSingle.width) && y >= rectSingle.y && y <= (rectSingle.y + rectSingle.height)) {
            mode = SINGLE_PLAYER;
        }
        else if (x >= rectDouble.x && x <= (rectDouble.x + rectDouble.width) && y >= rectDouble.y && y <= (rectDouble.y + rectDouble.height)) {
            mode = TWO_PLAYER;
        }

        return mode;
    }

    function drawMouseBtnHighlight() {
        if (gameMode !== AWAITING_MODE) return;

        ctx.fillStyle = colorWinLight;

        if (isMouseOn() === SINGLE_PLAYER) {
            ctx.fillRect(rectSingle.x, rectSingle.y, rectSingle.width, rectSingle.height);
        }
        else if (isMouseOn() === TWO_PLAYER) {
            ctx.fillRect(rectDouble.x, rectDouble.y, rectDouble.width, rectDouble.height);
        }
    }


    function drawMouseHighlight() {
        if (gameOver) return;
        if (!isActivePlayer) return;

        let cellNum = getCellByCoords(mouse.x, mouse.y),
            cellCoords = getCellCoords(cellNum);

        if (map[cellNum] === PLAYER_BLANK) {

            ctx.fillStyle = colorWinLight;
            ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);

            ctx.save();
            ctx.strokeStyle = colorWinDark; //darker filler
            ctx.translate(cellCoords.x + cellSize / 2, cellCoords.y + cellSize / 2);

            if (currentPlayer === PLAYER_X) {
                drawX();
            }
            else {
                drawO();
            }

            ctx.restore();

        } else {
            ctx.fillStyle = colorWinLight;
            ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);

        }
    }

    function drawWinHighlight() {
        if (gameOver) {
            ctx.fillStyle = colorWinLight;

            winCells.forEach(function (i) {
                let cellCoords = getCellCoords(i);
                ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);
            });
        }
    }

    function drawX() {
        ctx.beginPath();
        ctx.moveTo(-cellSize / 3, -cellSize / 3);
        ctx.lineTo(cellSize / 3, cellSize / 3);
        ctx.moveTo(cellSize / 3, -cellSize / 3);
        ctx.lineTo(-cellSize / 3, cellSize / 3);
        ctx.stroke();
    }

    function drawO() {
        ctx.beginPath();
        ctx.arc(0, 0, cellSize / 3, 0, Math.PI * 2);
        ctx.stroke();
    }


    //get coords of the top left of each cell using the cell #
    function getCellCoords(cell) {
        let x = (cell % 3) * cellSize,
            y = Math.floor(cell / 3) * cellSize;

        return {
            'x': x,
            'y': y
        };
    }

    //get the cell # using x, y coordinates
    function getCellByCoords(x, y) {
        return (Math.floor((x / cellSize) % 3) + Math.floor(y / cellSize) * 3);
    }


    return {
        startGame: drawStartGame,
        displayTurn: msgDisplayTurn,
        showWin: showWin,
        updateTurnAndMap: updateTurnAndMap,
        resetGame: drawResetGame,
        updateScoreBoard: updateScoreBoard,
        getCurrentPlayer: getCurrentPlayer,
        setCurrentPlayer: setCurrentPlayer,
        getGameOverStatus: getGameOverStatus,
        setGameOverStatus: setGameOverStatus,
        setGameFull: setGameFull,
        getGameFull: getGameFull,
        getIsActivePlayer: getIsActivePlayer,
        setIsActivePlayer: setIsActivePlayer,
        addActivePlayer: addActivePlayer,
        removeActivePlayer: removeActivePlayer
    };
}();


/* Initialize the game */
gameModule.startGame();


/* 
*
* Server actions
*
*/
socket.on('update board', function (data) {

    gameModule.updateTurnAndMap(data.currentTurn, data.map);
    gameModule.displayTurn();

    if (data.gameResult === OUTCOME_TIE) {
        gameModule.setGameOverStatus(true);
        msg.textContent = data.msg;
    } else if (data.gameResult === OUTCOME_X || data.gameResult === OUTCOME_O) {
        gameModule.showWin(data.winCheck, data.currentTurn * -1, data.scoreBoard);
    }
});

socket.on('player has joined', function (data) {

    /* Update the canvas and game data */
    gameModule.updateTurnAndMap(data.currentTurn, data.map);

    //msg.textContent = data.msg;
    gameModule.setGameFull(data.gameFull);

    if (gameModule.getGameFull()) {
        gameModule.setIsActivePlayer(false);
        textStatus.textContent = "Spectator Mode";

        if (data.gameResult === OUTCOME_TIE) {
            gameModule.setGameOverStatus(true);
            msg.textContent = "Tie game";
        } else if (data.gameResult === OUTCOME_X || data.gameResult === OUTCOME_O) {
            gameModule.showWin(data.winningPattern, data.currentTurn * -1, data.scoreBoard);
        }

        return;
    }

    if (data.currentPlayer === PLAYER_X) {
        gameModule.setCurrentPlayer(PLAYER_X); //first player is always X
        textStatus.textContent = "You are Player X";
    } else {
        gameModule.setCurrentPlayer(PLAYER_O);
        textStatus.textContent = "You are Player O";
    }

    gameModule.addActivePlayer(data.currentPlayer);
    gameModule.setIsActivePlayer(true);

});

socket.on('you have won', function (data) {

    if (data.winCheck !== 0) {
        gameModule.showWin(data.winCheck, data.winningTurn, data.scoreBoard);
    }
});

socket.on('reset board', function (data) {
    //if reset is unilateral

    //if reset is bilateral
    gameModule.resetGame();
});


/* On click events */
$("#game_clear").click(function () {

    if (gameModule.getIsActivePlayer()) {
        gameModule.resetGame();

        socket.emit("player requests reset", {
            currentPlayer: gameModule.getCurrentPlayer()
        });
    } else {
        msg.textContent = "Sorry, only players can reset the game.";
    }
});

$("#game_start").click(function () {
    /* Placeholder */
});
