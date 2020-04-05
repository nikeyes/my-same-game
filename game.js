let gameOptions = {
    gemSize: 80, 
    boardSize: {
        rows: 5,
        cols: 12
    },
    boardOffset: {
        x: 80,
        y: 60
    },
    numDifferentGems: 4,
    minToDestroy: 1
};

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: 0x222222,
        scene: gemGame
    }
    game = new Phaser.Game(gameConfig);
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
}

function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}


class gemGame extends Phaser.Scene{
    constructor(){
        super("GemGame");
    }

    preload ()
    {
        this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
            frameWidth: gameOptions.gemSize,
            frameHeight: gameOptions.gemSize
        });
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    }

    create ()
    {
        this.input.on("pointerdown", this.gemSelect, this);
        this.generateBoard();
        this.createLevel();
        this.score = 0;
        this.scoreText = this.add.bitmapText(20, 20, "font", "ccc", 20);
        this.updateScore(0);
        this.gameText = this.add.bitmapText(game.config.width / 2, game.config.height - 60, "font", "GAEL Y MARTI", 30).setOrigin(0.5, 0.5);
    }

    generateBoard(){
        this.board = [];
        for(let row = 0; row < gameOptions.boardSize.rows; row ++){
            this.board[row] = [];
            for(let col = 0; col < gameOptions.boardSize.cols; col ++){
                let randomValue = Math.floor(Math.random() * gameOptions.numDifferentGems);
                this.board[row][col] = {
                    value: randomValue,
                    isEmpty: false,
                    row: row,
                    column: col
                }
            }
        }
    }

    createLevel(){
        this.gemArray = [];
        for(let row = 0; row < gameOptions.boardSize.rows; row ++){
            this.gemArray[row] = [];
            for(let col = 0; col < gameOptions.boardSize.cols; col ++){
                let gemX = gameOptions.boardOffset.x + gameOptions.gemSize * col + gameOptions.gemSize / 2;
                let gemY = gameOptions.boardOffset.y + gameOptions.gemSize * row + gameOptions.gemSize / 2
                let gem = this.add.sprite(gemX, gemY, "tiles", this.board[row][col].value);  
                this.gemArray[row][col] = gem;
            }
        }
    }

    gemSelect(pointer){
        let row = Math.floor((pointer.y - gameOptions.boardOffset.y) / gameOptions.gemSize);
        let col = Math.floor((pointer.x - gameOptions.boardOffset.x) / gameOptions.gemSize);
        if (this.board[row][col] != null) { 
            this.colorToLookFor = this.board[row][col].value;
            this.floodFillArray = [];
            this.floodFill(row, col);
            if(this.floodFillArray.length >= gameOptions.minToDestroy){
                this.destroyTiles(this.floodFillArray);
                this.fillVerticalHoles();
                this.fillHorizontalHoles();
                this.updateScore(1);
                this.endOfMove();
            }
        }
   }

    // flood fill routine
    // http://www.emanueleferonato.com/2008/06/06/flash-flood-fill-implementation/
    floodFill(row, column){
        if(!this.validPick(row, column) || this.isEmpty(row, column)){
            return;
        }
        if(this.board[row][column].value == this.colorToLookFor && !this.alreadyVisited(row, column)){
            this.floodFillArray.push({
                row: row,
                column: column
            });
            this.floodFill(row + 1, column);
            this.floodFill(row - 1, column);
            this.floodFill(row, column + 1);
            this.floodFill(row, column - 1);
        }
    }

    destroyTiles(gemsToDestroy){
        for(var i = 0; i < gemsToDestroy.length; i++){
             this.gemArray[gemsToDestroy[i].row][gemsToDestroy[i].column].destroy();
             this.board[gemsToDestroy[i].row][gemsToDestroy[i].column] = null;
        }
   }

   fillVerticalHoles(){
        for(var row = gameOptions.boardSize.rows - 2; row >= 0; row--){
            for(var col = 0; col < gameOptions.boardSize.cols; col++){
                if(this.board[row][col] != null){
                    var holesBelow = 0;
                    for(var z = row + 1; z < gameOptions.boardSize.rows; z++){
                            if(this.board[z][col] == null){
                                holesBelow ++;
                            }    
                    }
                    if(holesBelow){  
                            this.moveTile(row, col, row + holesBelow, col)                                                                   
                    }
                }     
            }
        }
    }

    fillHorizontalHoles(){
        for(var col = 0; col < gameOptions.boardSize.cols - 1; col++){
             if(this.gemInColumn(col) == 0){
                  for(var j = col + 1; j < gameOptions.boardSize.cols; j++){
                       if(this.gemInColumn(j) != 0){
                            for(var row = 0; row < gameOptions.boardSize.rows; row++){
                                 if(this.board[row][j] != null){
                                      this.moveTile(row, j, row, col)
                                 }    
                            }
                            break;
                       }     
                  }
             }
        }
   }

   gemInColumn(col){
        var result = 0;
        for(var row = 0; row < gameOptions.boardSize.rows; row++){
            if(this.board[row][col] != null){
                result ++;
            }
        }
        return result;
    }


    moveTile(fromRow, fromCol, toRow, toCol){
        this.gemArray[toRow][toCol] = this.gemArray[fromRow][fromCol];
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        
        this.gemArray[toRow][toCol].x = gameOptions.boardOffset.x + toCol * gameOptions.gemSize + gameOptions.gemSize / 2;
        this.gemArray[toRow][toCol].y = gameOptions.boardOffset.y + toRow * gameOptions.gemSize + gameOptions.gemSize / 2;
        
        this.gemArray[fromRow][fromCol] = null;
        this.board[fromRow][fromCol] = null;
   }

    validPick(row, column){
        return row >= 0 && row < gameOptions.boardSize.rows && column >= 0 && column < gameOptions.boardSize.cols && this.board[row] != undefined && this.board[row][column] != undefined;
    }

    isEmpty(row, column){
        return  this.board[row][column] === null;// || this.board[row][column].isEmpty;
    }

    alreadyVisited(row, column){
        let found = false;
        this.floodFillArray.forEach(function(item){
            if(item.row == row && item.column == column){
                found = true;
            }
        });
        return found;
    }

    updateScore(newScore){
        this.score += newScore;
        this.scoreText.text = "PUNTOS: " + this.score.toString();
    }

    endOfMove(){
        if(!this.stillPlayable(gameOptions.minToDestroy)){
            /*let timedEvent =  this.time.addEvent({
                delay: 7000,
                callbackScope: this,
                callback: function(){
                    this.scene.start("PlayGame");
                }
            });*/

            if(this.nonEmptyItems() == 0){
                this.gameText.text = "Congratulations!!";
            }
            else{
                this.gameText.text = "No more moves!!!";
            }
        }
    }

    stillPlayable(minCombo){
        for(let row = 0; row < gameOptions.boardSize.rows; row ++){
            for(let col = 0; col < gameOptions.boardSize.cols; col ++){
                if(!this.isEmpty(row, col))
                {
                    this.floodFillArray = [];
                    this.floodFill(row, col); 
                    if(this.floodFillArray.length >= minCombo){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    nonEmptyItems(){
        let result = 0;
        for(let i = 0; i < this.board.rows; i ++){
            for(let j = 0; j < this.board.cols; j ++){
                if(!this.isEmpty(i, j) ){
                    result ++;
                }
            }
        }
        return result;
    }


    update ()
    {
    }
}