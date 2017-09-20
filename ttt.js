"use strict";

let canvas = document.getElementById("ttt"), 
    ctx = canvas.getContext('2d'), 
    msg = document.getElementById("message"),
    cellSize = 100,
    map = [
        0, 0, 0, 
        0, 0, 0, 
        0, 0, 0],
    winPatterns = [
        0b111000000, 0b000111000, 0b000000111, // Rows
        0b100100100, 0b010010010, 0b001001001, // Columns
        0b100010001, 0b001010100, //Diagonals
    ],
    BLANK = 0, X = 1, O = -1, //constants for our map array
    mouse = {
        x: -1,
        y: -1,
    },
    currentPlayer = X,
    gameOver = false,
    winCells = [];

canvas.width= canvas.height = 3 * cellSize;

/* Add in event listeners */
canvas.addEventListener('mouseout', function(){
   mouse.x = mouse.y = -1; 
});

canvas.addEventListener('mousemove', function(e){
   let x = e.pageX - canvas.offsetLeft,
        y = e.pageY - canvas.offsetTop;
    
    mouse.x = x;
    mouse.y = y;
    
    //console.log(getCellByCoords(x, y));
});

canvas.addEventListener('click', function(e){
    play(getCellByCoords(mouse.x, mouse.y));
});

displayTurn();


/* Function definitions */
function displayTurn(){
    msg.textContent = ((currentPlayer == X)? 'X': 'O') + "'s turn.";
}

function play (cell){
    //console.log(map[cell]);
    if (gameOver) return;
    
    if (map[cell]  != BLANK){
        msg.textContent = 'Position taken.';
        return;
    }
    
    map[cell] = currentPlayer;
    
    let winCheck = checkWin(currentPlayer);
    
    if (winCheck != 0){
        gameOver = true;
        msg.textContent = ((currentPlayer == X)? 'X': 'O') + " wins!";
        
        let bit = 1;
        for (let i = map.length - 1; i >= 0; i--){
            
            if ((bit & winCheck) === bit){
                winCells.push(i);
            }
            bit <<= 1;
            
        }

        return;
    }else if (map.indexOf(BLANK) == -1){
        gameOver = true;
        msg.textContent = "Tie!";
        return;
    }
    
    currentPlayer *= -1;
    displayTurn();
}

function checkWin(player){
    let playerMapBitMask = 0;
    
    for (let i = 0; i < map.length; i++){
        playerMapBitMask <<= 1;
        if (map[i] == player){
            playerMapBitMask += 1;
        }
    }
    
    for (let i = 0; i < winPatterns.length; i++){
        if ((playerMapBitMask & winPatterns[i]) == winPatterns[i]){
            return winPatterns[i];
        }
    }
    
    
    return 0;
    //console.log(playerMapBitMask);
}

//this function is being called constantly
function draw () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMouseHighlight();
    drawWinHighlight();
    drawBoard();
    fillBoard();
    
    
    function drawMouseHighlight(){
        if (gameOver) return;
        
        let cellNum = getCellByCoords(mouse.x, mouse.y),
            cellCoords = getCellCoords(cellNum);
        
        if(map[cellNum] == BLANK){

            ctx.fillStyle= 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);

            ctx.save();
            ctx.strokeStyle= 'rgba(255, 255, 255, 0.8)';
            ctx.translate(cellCoords.x + cellSize / 2, cellCoords.y + cellSize / 2);

            if (currentPlayer == X){
                drawX();
            }
            else{
                drawO();
            }

            ctx.restore();
            
        }else{
            ctx.fillStyle= 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);

        }
    }
    
    function drawWinHighlight(){
        if (gameOver){
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            
            winCells.forEach(function(i){
                let cellCoords = getCellCoords(i);
                ctx.fillRect(cellCoords.x, cellCoords.y, cellSize, cellSize);
            });
        }
    }
    
    function drawBoard(){
        ctx.strokeStyle = 'white';
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
        ctx.moveTo(0, cellSize*2);
        ctx.lineTo(canvas.width, cellSize * 2);
        ctx.stroke();
    }
    
    function fillBoard(){
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        
        for (let i=0; i < map.length; i++){
            let coords = getCellCoords(i);
            
            ctx.save();
            
            //translate to the center of each cell
            ctx.translate(coords.x + cellSize / 2, coords.y + cellSize / 2);
            
            if (map[i] == X){
                drawX();
            } else if (map[i] == O){
                drawO();
            }
            
            ctx.restore();
        }
    }
    
    function drawX(){
        ctx.beginPath();
        ctx.moveTo(-cellSize / 3, -cellSize / 3);
        ctx.lineTo(cellSize / 3, cellSize / 3);
        ctx.moveTo(cellSize / 3, -cellSize / 3);
        ctx.lineTo(-cellSize / 3, cellSize / 3);
        ctx.stroke();
    }
    
    function drawO(){
        ctx.beginPath();
        ctx.arc(0, 0, cellSize / 3, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    requestAnimationFrame(draw);
}

//get coords of the top left of each cell using the cell #
function getCellCoords(cell){
    let x = (cell % 3) * cellSize,
        y = Math.floor(cell/3) * cellSize;
    
    return {
        'x': x,
        'y': y
    } 
}

//get the cell # using x, y coordinates
function getCellByCoords(x, y){
    return (Math.floor((x / cellSize) % 3) + Math.floor(y / cellSize) * 3);
}

draw();