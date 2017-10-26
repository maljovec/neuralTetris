var BLOCK_SIZE = 20;
var WIDTH = 10;
var HEIGHT = 22;
var HIDDEN_ROWS = 2;
var PIECES = ['i','j','l','o','s','t','z']

var CYAN   = '#5cb3ff';
var RED    = '#e41a1c';
var BLUE   = '#377eb8';
var GREEN  = '#4daf4a';
var PURPLE = '#984ea3';
var ORANGE = '#ff7f00';
var YELLOW = '#ffff33';
var GREY   = '#999999';
var WHITE = '#dee2f8';
var BG_COLOR = '#313440';

var colors = new Map();
colors['i'] = CYAN;
colors['j'] = BLUE;
colors['l'] = ORANGE;
colors['o'] = YELLOW;
colors['s'] = GREEN;
colors['t'] = PURPLE;
colors['z'] = RED;
colors['g'] = BG_COLOR;

var KEY = {
    SPACE: 32,
     LEFT: 37,
       UP: 38,
    RIGHT: 39,
     DOWN: 40,
        X: 88,
        Z: 90
  };

//FROM: https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeBlendConvert(p, from, to) {
    if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
    if(!this.sbcRip)this.sbcRip=(d)=>{
        let l=d.length,RGB=new Object();
        if(l>9){
            d=d.split(",");
            if(d.length<3||d.length>4)return null;//ErrorCheck
            RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
        }else{
            if(l==8||l==6||l<4)return null; //ErrorCheck
            if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
            d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
        }
        return RGB;}
    var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=this.sbcRip(from),t=this.sbcRip(to);
    if(!f||!t)return null; //ErrorCheck
    if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
    else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(arrayIn) {
    var arrayOut = arrayIn.slice();
    var currentIndex = arrayOut.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = arrayOut[currentIndex];
      arrayOut[currentIndex] = arrayOut[randomIndex];
      arrayOut[randomIndex] = temporaryValue;
    }
    return arrayOut;
}

function drawMonomino(letter, x, y, canvas, width = BLOCK_SIZE, height = BLOCK_SIZE) {
    if (letter == ' ') { return }
    var context = canvas.getContext("2d");
    color = colors[letter.toLowerCase()];

    var gradient = context.createRadialGradient(x+width/2., y+height/2., 0, x+width/2., y+height/2., BLOCK_SIZE);
    gradient.addColorStop(0, color);
    // gradient.addColorStop(1, WHITE);
    gradient.addColorStop(1, BG_COLOR);

    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);

    context.strokeStyle = '#dee2f8';
    if (letter.toUpperCase() == letter) {
        context.lineWidth   = 2;
        context.strokeStyle = shadeBlendConvert(0.5, color, '#000000');
    }
    else {
        context.lineWidth   = 2;
        context.strokeStyle = shadeBlendConvert(0.75, color, WHITE);
        // context.strokeStyle = shadeBlendConvert(0.5, color, '#000000');
    }
    // context.strokeRect(x+context.lineWidth, y+context.lineWidth, width-2*context.lineWidth, height-2*context.lineWidth);
    context.strokeRect(x+1, y+1, width-2, height-2);
}

class Tetromino {
    
    constructor(xs, ys, letter) {
        this.xs = xs;
        this.ys = ys;
        this.rotation = 0;
        this.letter = letter;
    }

    drawGhost(canvas, board, width=BLOCK_SIZE, height=BLOCK_SIZE) {
        var yOffset = 1;
        while (!this.collision(board, 0, yOffset)) {
            yOffset += 1;
        }
        yOffset -= 1;
        for (var i = 0; i < 4; i++) {
            drawMonomino('g', this.xs[i]*width, (this.ys[i]+yOffset-HIDDEN_ROWS)*height, canvas, width, height);
        }
    }

    draw(canvas, flash=false, width=BLOCK_SIZE, height=BLOCK_SIZE){
        for (var i = 0; i < 4; i++) {
            if (flash) {
                drawMonomino(this.letter.toUpperCase(), this.xs[i]*width, (this.ys[i]-HIDDEN_ROWS)*height, canvas, width, height);
            }
            else {
                drawMonomino(this.letter, this.xs[i]*width, (this.ys[i]-HIDDEN_ROWS)*height, canvas, width, height);
            }
        }
    }

    drawFixed(canvas, x=0, y=0, width=BLOCK_SIZE, height=BLOCK_SIZE) {
        var xOffset = -Math.min(...this.xs) + x;
        var yOffset = -Math.min(...this.ys) + y;
        for (var i = 0; i < 4; i++) {
            drawMonomino(this.letter, (xOffset + this.xs[i])*width, (yOffset + this.ys[i])*height, canvas, width, height);
        }
    }

    translate(x, y){
        for (var i = 0; i < 4; i++) {
            this.xs[i] += x;
            this.ys[i] += y;
        }
    }

    rotate(board, CW = true) {
        if (CW) {
            this.rotation += 1;
            if (this.rotation > 3) { this.rotation = 0; }
        }
        else {
            this.rotation -= 1;
            if (this.rotation < 0) { this.rotation = 3; }
        }
        
        //// Here a specific tetromino should specify its actual rotation
    }

    checkValidRotation(board, CW=true) {
        if (this.collision(board)) {
            if (!(this.collision(board,0, -1) ) ) {
                this.translate(0,-1);
            }
            else if (!(this.collision(board,-1, 0) ) ) {
                this.translate(-1,0);
            }
            else if (!(this.collision(board,1, 0) ) ) {
                this.translate(1,0);
            }
            else {
                // Our rotation failed, restore the original state
                this.rotate(board, !(CW));
            }
        }
    }

    collision(board, x=0, y=0) {
        for (var i = 0; i < 4; i++) {
            if (this.xs[i]+x < 0 || this.xs[i]+x >= WIDTH
                || this.ys[i]+y < 0 || this.ys[i]+y >= HEIGHT
                || board[this.ys[i]+y][this.xs[i]+x] != ' ') {
                return true;
            }
        }
        return false;
    }

    lock(board) {
        this.letter = this.letter.toUpperCase();
        for (var i = 0; i < 4; i++) {
            var col = this.xs[i];
            var row = this.ys[i];
            board[row][col] = this.letter;
        }
    }
}

class I_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-2, y=0) {
        var Xs = [x, x+1, x+2, x+3];
        var Ys = [y, y, y, y];
        super(Xs, Ys, 'i');
    }

    checkValidRotation(board, CW=true) {
        if (this.collision(board)) {
            if (!(this.collision(board,0, -1) ) ) {
                this.translate(0,-1);
            }
            else if (!(this.collision(board,-1, 0) ) ) {
                this.translate(-1,0);
            }
            else if (!(this.collision(board,1, 0) ) ) {
                this.translate(1,0);
            }
            else if (!(this.collision(board,2, 0) ) ) {
                this.translate(2,0);
            }
            else if (!(this.collision(board,-2, 0) ) ) {
                this.translate(-2,0);
            }
            else {
                // Our rotation failed, restore the original state
                this.rotate(board, !(CW));
            }
        }
    }
    
    rotate(board, CW = true) {
        super.rotate(board, CW);
        switch(this.rotation) {
            case 0:
                if (CW) {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] += 2;    this.ys[3] += 2;
                }
                else {
                    this.xs[0] -= 2;    this.ys[0] += 2;
                    this.xs[1] -= 1;    this.ys[1] += 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                break;
            case 1:
                if (CW) {
                    this.xs[0] += 2;    this.ys[0] -= 2;
                    this.xs[1] += 1;    this.ys[1] -= 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                else {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] += 2;    this.ys[3] += 2;
                }
                break;
            case 2:
                if (CW) {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] -= 2;    this.ys[3] -= 2;
                }
                else {
                    this.xs[0] += 2;    this.ys[0] -= 2;
                    this.xs[1] += 1;    this.ys[1] -= 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                break;
            case 3:
                if (CW) {
                    this.xs[0] -= 2;    this.ys[0] += 2;
                    this.xs[1] -= 1;    this.ys[1] += 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                else {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] -= 2;    this.ys[3] -= 2;
                }
                break;
        }

        this.checkValidRotation(board, CW);
    }
}

class J_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-2, y=0) {
        var Xs = [x, x, x+1, x+2];
        var Ys = [y, y+1, y+1, y+1];
        super(Xs, Ys, 'j');
    }

    // TODO
    rotate(board, CW = true) {
        super.rotate(board, CW);

        switch(this.rotation) {
            case 0:
                if (CW) {
                                        this.ys[0] -= 2;
                    this.xs[1] -= 1;    this.ys[1] -= 1;
                    this.xs[3] += 1;    this.ys[3] += 1;
                }
                else {
                    this.xs[0] -= 2;
                    this.xs[1] -= 1;    this.ys[1] += 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                break;
            case 1:
                if (CW) {
                    this.xs[0] += 2;
                    this.xs[1] += 1;    this.ys[1] -= 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                else {
                    this.ys[0] -= 2;
                    this.xs[1] -= 1;    this.ys[1] -= 1;
                    this.xs[3] += 1;    this.ys[3] += 1;
                }
                break;
            case 2:
                if (CW) {
                                        this.ys[0] += 2;
                    this.xs[1] += 1;    this.ys[1] += 1;
                    this.xs[3] -= 1;    this.ys[3] -= 1;
                }
                else {
                    this.xs[0] += 2;
                    this.xs[1] += 1;    this.ys[1] -= 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                break;
            case 3:
                if (CW) {
                    this.xs[0] -= 2;
                    this.xs[1] -= 1;    this.ys[1] += 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                else {
                    this.ys[0] += 2;
                    this.xs[1] += 1;    this.ys[1] += 1;
                    this.xs[3] -= 1;    this.ys[3] -= 1;
                }
                break;
        }

        this.checkValidRotation(board, CW);
    }
}

class L_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-2, y=0) {
        var Xs = [x, x+1, x+2, x+2];
        var Ys = [y+1, y+1, y+1, y];
        super(Xs, Ys, 'l');
    }

    rotate(board, CW = true) {
        super.rotate(board, CW);

        switch(this.rotation) {
            case 0:
                if (CW) {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] += 2;
                }
                else {
                    this.xs[0] -= 1;    this.ys[0] += 1;
                    this.xs[2] += 1;    this.ys[2] -= 1;
                                        this.ys[3] -= 2;
                }
                break;
            case 1:
                if (CW) {
                    this.xs[0] += 1;    this.ys[0] -= 1;
                    this.xs[2] -= 1;    this.ys[2] += 1;
                                        this.ys[3] += 2;
                }
                else {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] += 2;
                }
                break;
            case 2:
                if (CW) {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] -= 2;
                }
                else {
                    this.xs[0] += 1;    this.ys[0] -= 1;
                    this.xs[2] -= 1;    this.ys[2] += 1;
                                        this.ys[3] += 2;
                }
                break;
            case 3:
                if (CW) {
                    this.xs[0] -= 1;    this.ys[0] += 1;
                    this.xs[2] += 1;    this.ys[2] -= 1;
                                        this.ys[3] -= 2;
                }
                else {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] -= 2;
                }
                break;
        }

        this.checkValidRotation(board, CW);
    }
}

class O_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-1, y=0) {
        var Xs = [x, x+1, x, x+1];
        var Ys = [y, y, y+1, y+1];
        super(Xs, Ys, 'o');
    }
    // There is no rotation on the square block
    rotate(board, CW = true) { }
}

class S_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-2, y=0) {
        var Xs = [x, x+1, x+1, x+2];
        var Ys = [y+1, y+1, y, y];
        super(Xs, Ys, 's');
    }

    rotate(board, CW = true) {
        super.rotate(board, CW);
        if (this.rotation % 2) {
            this.xs[0] += 1;    this.ys[0] += 1;
            this.xs[2] -= 1;    this.ys[2] += 1;
            this.xs[3] -= 2;
        }
        else {
            this.xs[0] -= 1;    this.ys[0] -= 1;
            this.xs[2] += 1;    this.ys[2] -= 1;
            this.xs[3] += 2;
        }

        //TODO: Follow SRS guidelines, this should move up on rotation state 2
        if(this.rotation == 2) {
            this.translate(0,-1);
        }
        else if (Math.abs(this.rotation - 2) == 1) {
            this.translate(0,1);
        }

        this.checkValidRotation(board, CW);
    }
}

class T_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-1, y=0) {
        var Xs = [x, x+1, x+1, x+2];
        var Ys = [y+1, y+1, y, y+1];
        super(Xs, Ys, 't');
    }

    rotate(board, CW = true) {
        super.rotate(board, CW);

        switch(this.rotation) {
            case 0:
                if (CW) {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] -= 1;
                    this.xs[3] += 1;    this.ys[3] += 1;
                }
                else {
                    this.xs[0] -= 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                break;
            case 1:
                if (CW) {
                    this.xs[0] += 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                else {
                    this.xs[0] -= 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] -= 1;
                    this.xs[3] += 1;    this.ys[3] += 1;
                }
                break;
            case 2:
                if (CW) {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] += 1;
                    this.xs[3] -= 1;    this.ys[3] -= 1;
                }
                else {
                    this.xs[0] += 1;    this.ys[0] -= 1;
                    this.xs[2] += 1;    this.ys[2] += 1;
                    this.xs[3] -= 1;    this.ys[3] += 1;
                }
                break;
            case 3:
                if (CW) {
                    this.xs[0] -= 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] -= 1;
                    this.xs[3] += 1;    this.ys[3] -= 1;
                }
                else {
                    this.xs[0] += 1;    this.ys[0] += 1;
                    this.xs[2] -= 1;    this.ys[2] += 1;
                    this.xs[3] -= 1;    this.ys[3] -= 1;
                }
                break;
        }

        this.checkValidRotation(board, CW);
    }
}

class Z_Tetromino extends Tetromino {
    constructor(x=WIDTH/2-1, y=0) {
        var Xs = [x, x+1, x+1, x+2];
        var Ys = [y, y, y+1, y+1];
        super(Xs, Ys, 'z');
    }

    //TODO: Follow SRS guidelines, this should move up on rotation state 2
    rotate(board, CW = true) {
        super.rotate(board, CW);
        if (this.rotation % 2) {
            this.xs[0] += 2;
            this.xs[1] += 1;    this.ys[1] += 1;
            this.xs[3] -= 1;    this.ys[3] += 1;
        }
        else {
            this.xs[0] -= 2;
            this.xs[1] -= 1;    this.ys[1] -= 1;
            this.xs[3] += 1;    this.ys[3] -= 1;
        }

        //TODO: Follow SRS guidelines, this should move up on rotation state 2
        if(this.rotation == 2) {
            this.translate(0,-1);
        }
        else if (Math.abs(this.rotation - 2) == 1) {
            this.translate(0,1);
        }

        this.checkValidRotation(board, CW);
    }
}

class Game {

    constructor(canvas, userId=1, gameId=null, ai=false) {
        this.canvas = canvas;

        // For now, hard code the user to be me while I debug this thing.
        this.userId = userId;
        
        // The game's id will be based on when it started.
        if (gameId) {
            this.gameId = gameId;
            this.automated = true;
        }
        else {
            var now = new Date();
            var my_epoch = new Date(2017, 9, 8, 0, 0, 0, 0);
            this.gameId = now.getTime() - my_epoch.getTime();
            this.automated = false;
        }
        Math.seedrandom(this.gameId);

        this.alive = true;
        this.active = true;
        this.gridOn = true;
        this.ghostOn = true;
        this.ready = false;
        this.ai = ai;

        if (this.ai) {
            this.automated = true;
        }

        // Ticks per animation frame for the line clears
        this.clearPeriod = 20; //14;

        // Ticks before processing the next user input
        this.cooldownPeriod = 7;

        // Ticks before locking a piece and the time to
        // animate its setting
        this.setPeriod = 20;

        // The rate of speed increase per level
        this.periodStep = 2;

        this.comboCounter = 0;

        // Ticks per row before the tetromino drops again
        // At its slowest, it will replicate a set period
        this.currentPeriod = this.setPeriod;

        // The game timers
        this.ticks = 0;
        this.moveTimer = this.currentPeriod;
        this.cooldownTimer = this.cooldownPeriod;

        this.setTimer = -1;
        this.lastInput = '';
        this.inputs = new Array();
        this.ticksRequested = new Set();

        // Stores the lines that need to be animated
        // and subsequently wiped
        this.linesCleared = new Set();

        this.board = Array(HEIGHT);
        for (var row = 0; row < HEIGHT; row++){
            this.board[row] = Array(WIDTH);
            for (var col = 0; col < WIDTH; col++){
                this.board[row][col] = ' ';
            }
        }

        // Like in the NES version, we will show
        // how many of each piece the user has played
        this.statistics = {};
        for (var i in PIECES) {
            this.statistics[PIECES[i]] = 0;
        }

        // The order of the first seven pieces, this
        // appears to be a common algorithm in Tetris
        // to ensure that there are no "dry spells"
        // TODO: add more algorithms for piece selection
        this.pieceOrder = shuffle(PIECES);
        
        // Get the first and second piece, so we can
        // show them on the display
        this.current = this.getNext();
        this.statistics[this.current.letter] += 1;
        this.next = this.getNext();

        // Self-explanatory parts displayed to the user
        this.score = 0;
        this.level = (this.setPeriod - this.currentPeriod) / this.periodStep;
        this.lines = 0;

        // User input states, the switches are items that when held down will
        // not execute continuously
        this.input = {CW   : false,
                      CCW  : false,
                      left : false,
                      right: false,
                      down : false,
                      up   : false,
                      pause: false,
                      pauseSwitch: false,
                      cwSwitch: false,
                      ccwSwitch: false};

        this.url = 'ws://localhost:8888/';
        this.websocket = new WebSocket(this.url);
        var gameInstance = this;

        this.websocket.onopen = function() {
            console.log('Connection established');
            if (gameInstance.automated) {
                if (!gameInstance.ai) {
                    this.send('Replaying');
                    this.send(gameInstance.userId);
                    this.send(gameInstance.gameId);
                    // console.log('Replaying',gameInstance.userId, gameInstance.gameId);
                }
                else {
                    // As with life as we know it, eventually, the AI will take
                    // over
                    this.send('Playing');
                    this.send(gameInstance.userId);
                    // console.log('Playing', gameInstance.userId);
                }
            }
            else {
                this.send('Recording');
                // console.log('Recording');
            }
            gameInstance.ready = true;
        }

        this.websocket.onclose = function(e) {
            console.log('WebSocket closed');
        }

        this.websocket.onmessage = function(e) {
            var tokens = e.data.split(',');
            var tick = parseInt(tokens[0]);
            var userInput = parseInt(tokens[1]);
            console.log('Message received:', tick, userInput);
            gameInstance.inputs.push(userInput);
            gameInstance.ticksRequested.delete(tick);
            gameInstance.ready = true;
        }

        this.websocket.onerror = function(e) {
            console.log('error');
        }
    }

    getNext() {
        // return new J_Tetromino();
        if (this.pieceOrder.length == 0) {
            this.pieceOrder = shuffle(PIECES);
        }
        var letter = this.pieceOrder.pop();
        switch(letter) {
            case 'i':
                return new I_Tetromino();
            case 'j':
                return new J_Tetromino();
            case 'l':
                return new L_Tetromino();
            case 'o':
                return new O_Tetromino();
            case 's':
                return new S_Tetromino();
            case 't':
                return new T_Tetromino();
            case 'z':
                return new Z_Tetromino();
        }
    }

    lineCheck(ys) {
        for (var i in ys) {
            var row = ys[i];
            var fullLine = true;
            for (var col = 0; col < WIDTH; col++) {
                if (this.board[row][col] == ' ') {
                    fullLine = false;
                    break;
                }
            }
            if (fullLine) {
                this.linesCleared.add(row);
                this.clearTimer = this.clearPeriod;
            }
        }

        var newLines = this.linesCleared.size;
        if (newLines > 0){
            this.lines += newLines;
            switch(newLines) {
                case 1:
                    this.score += 100*(this.level+1);
                    break;
                case 2:
                    this.score += 300*(this.level+1);
                    break;
                case 3:
                    this.score += 500*(this.level+1);
                    break;
                case 4:
                    this.score += 800*(this.level+1);
                    break;
            }

            if (this.comboCounter) {
                this.score += 50*this.comboCounter*this.level;
            }
            
            if ( this.lines - 10*(this.level+1) >= 0 ) {
                this.currentPeriod -= this.periodStep;
                if (this.currentPeriod < 0) {
                    this.currentPeriod = 0;
                }
                this.level = (this.setPeriod - this.currentPeriod) / this.periodStep;
                this.moveTimer = this.currentPeriod;
            }
            return true;
        }
        return false;
    }

    lockPiece() {
        this.current.lock(this.board);
        
        var lineClear = this.lineCheck(this.current.ys);
        if (lineClear) {
            this.comboCounter++;
        }
        else {
            this.comboCounter = 0;
        }

        this.current = this.next;
        this.statistics[this.current.letter] += 1;
        this.next = this.getNext();
        if ( this.current.collision(this.board, 0, 0) ) {
            this.alive = false;
            if (this.automated && !this.ai) {
                this.websocket.send(-1);
                // console.log(-1);
            }
            else {
                this.websocket.send([this.userId, this.gameId, -1]);
                // console.log(this.userId, this.gameId, -1);
            }
        }
    }

    setPiece() {
        this.setTimer = this.setPeriod;
    }

    update() {

        // Wait for the web socket to be established with the server
        if (!this.ready) {
            return
        }

        // Always check if the game is paused, the user should
        // always be able to pause the game mid-animation or
        // whatever
        if (this.input.pause && !this.input.pauseSwitch) {
            this.active = !this.active;
            this.input.pauseSwitch = true;
        }
        else if (!this.input.pause) {
            this.input.pauseSwitch = false;
        }

        // If the game is paused we should avoid doing any
        // updates
        if ( !this.active ) {
            return
        }

        // If the line clear animation is active then ignore user input
        // and do not update the moveTimer, do similarly with the piece
        // setting animation
        if (this.clearTimer >= 0) {
            this.clearTimer--;

            // Wait until the last iteration to remove the items,
            // so that the drawing method does not get confused
            if (this.clearTimer == 0) {
                // Javascript is a broken language because I have to do crap
                // like this to avoid sorting numbers lexicographically
                // See here: https://stackoverflow.com/questions/21019902
                var sortedLines = [...(this.linesCleared)].sort(function(a,b){return a-b});
                for (let clearedLine of sortedLines) {
                    for (var row = clearedLine; row > 0; row--)
                    {
                        for (var col = 0; col < WIDTH; col++) {
                            this.board[row][col] = this.board[row-1][col];
                        }
                    }
                    for (var col = 0; col < WIDTH; col++) {
                        this.board[0][col] = ' ';
                    }
                }
                this.linesCleared = new Set();
            }
        }
        else if (this.setTimer >= 0) {
            // This is the setting animation code
            this.setTimer--;

            if (this.setTimer == 0) {
                this.lockPiece();
            }
        }
        else {
            // Process input and then process the piece falling, this
            // gives the player the benefit of the doubt
            var userInput = this.processInput();

            // If we are reading input from a websocket, it may be that it is
            // not ready yet, in that case, we do not want to advance the game
            // state, so let's return now to prevent that, and hopefully the
            // next pass will have the information ready
            if (!this.ready) {
                return
            }

            if (this.moveTimer > 0) {
                this.moveTimer--;
            }
            else{
                if (this.current.collision(this.board, 0, 1)) {
                    // If the user is currently trying to do something
                    // give them the benefit of the doubt and attempt
                    // to finish their move
                    if (!userInput) {
                        this.setPiece();
                    }
                }
                else {
                    this.current.translate(0, 1);
                }
                // If the next move will cause a collision, then give
                // the user a longer delay
                if (this.current.collision(this.board, 0, 1)) {
                    this.moveTimer = this.setPeriod;
                }
                else {
                    this.moveTimer = this.currentPeriod;
                }
            }

            // This conditional is the only time we will increment the
            // number of ticks (and consequently the only time we will store
            // game telemetry data for AI training purposes, but this will
            // be accomplished in the process input function for clarity).
            this.ticks += 1;
        }
    }

    processInput(){
        if (this.automated) {
            return this.processReplayInput();
        }
        else {
            return this.processUserInput();
        }
    }

    processReplayInput() {
        if (!this.ticksRequested.has(this.ticks)) {
            if (this.ai) {
                this.sendState();
            }
            else { 
                this.websocket.send(this.ticks);
                // console.log(this.ticks);   
            }
            this.ticksRequested.add(this.ticks);
        }
        if (this.inputs.length == 0) {
            this.ready = false;
            return false;
        }
        var inputCode = this.inputs.shift();
        var userInput = this.decodeInput(inputCode);

        var inputAccepted = false;

        //Move left or right
        if (userInput.indexOf('left') >= 0 && !this.current.collision(this.board, -1, 0)) {
            this.current.translate(-1,0);
            inputAccepted = true;
        }
        else if (userInput.indexOf('right') >= 0 && !this.current.collision(this.board, 1, 0)) {
            this.current.translate(1,0);
            inputAccepted = true;
        }
        
        if (userInput.indexOf('down') >= 0 ) {
            this.moveTimer == 0;
            if (this.current.collision(this.board, 0, 1)) {
                this.setPiece();
            }
            else {
                this.current.translate(0, 1);
            }
            this.moveTimer = this.currentPeriod;
        }

        //Turn block CW or CCW
        if (userInput.indexOf('CCW') >= 0) {
            this.current.rotate(this.board, false);
            inputAccepted = true;
        }
        else if (userInput.indexOf('CW') >= 0) {
            this.current.rotate(this.board, true);
            inputAccepted = true;
        }

        return inputAccepted;
    }

    processUserInput() {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= 1;
        }

        // We will always write the status if it is the first tick of a new
        // board state, otherwise we will only write the status if a user input
        // has been generated. Technically, this may possibly send data one
        // extra time, due to the possibility of the moveTimer being set to the
        // setPeriod (which is >= currentPeriod), but this should not cause
        // excessive overhead. Mostly, I am being lazy and not storing when the
        // actual first tick of a new move is happening.
        var firstTick = (this.moveTimer == this.currentPeriod || this.moveTimer == this.setPeriod);
        var thisInput = '';

        // Let's first figure out which inputs to process, so we can send the
        // board state away (without modifying the board), and then we will
        // update the state of the game

        if (this.input.left && !this.current.collision(this.board, -1, 0)) {
            if (!(this.lastInput.startsWith('left') && this.cooldownTimer > 0)) {
                thisInput = 'left';
            }
        }
        else if (this.input.right && !this.current.collision(this.board, 1, 0)) {
            if (!(this.lastInput.startsWith('right') && this.cooldownTimer > 0)) {
                thisInput = 'right';
            }
        }
        else {
            thisInput = '';
        }

        if (this.input.down) {
            thisInput += 'down';
        }

        //Turn block CW or CCW
        if (this.input.CW && !(this.input.cwSwitch)) {
            thisInput += 'CW';
        }
        else if (this.input.CCW && !(this.input.ccwSwitch)) {
            thisInput += 'CCW';
        }

        // Even if we did not generate an input, we still want to capture 
        // the new board state if we generated an input last tick, this will
        // aid in regenerating the missing ticks between as the board should be
        // assumed static until the next state is sent
        firstTick = (firstTick || this.lastInput);

        if (thisInput.length > 0 || firstTick) {
            this.sendState(thisInput);
        }

        //Move left or right
        if (this.input.left && !this.current.collision(this.board, -1, 0)) {
            if (!(this.lastInput.startsWith('left') && this.cooldownTimer > 0)) {
                this.current.translate(-1,0);
                this.cooldownTimer = this.cooldownPeriod;
            }
            else {
                // We don't want to record an input here to save on traffic but,
                // in order for the timer to work correctly, we need to store
                // this in the "lastInput"
                thisInput = 'left' + thisInput;
            }
        }
        else if (this.input.right && !this.current.collision(this.board, 1, 0)) {
            if (!(this.lastInput.startsWith('right') && this.cooldownTimer > 0)) {
                this.current.translate(1,0);
                this.cooldownTimer = this.cooldownPeriod;
            }
            else {
                // We don't want to record an input here to save on traffic but,
                // in order for the timer to work correctly, we need to store
                // this in the "lastInput"
                thisInput = 'right' + thisInput;
            }
        }
        
        if (this.input.down) {
            this.moveTimer == 0;
            if (this.current.collision(this.board, 0, 1)) {
                this.setPiece();
            }
            else {
                this.current.translate(0, 1);
            }
            this.moveTimer = this.currentPeriod;
            this.score += 1;
        }

        //Turn block CW or CCW
        if (this.input.CW) {
            this.input.ccwSwitch = false;
            if (!(this.input.cwSwitch)) {
                this.input.cwSwitch = true;
                this.current.rotate(this.board, true);
            }
        }
        else if (this.input.CCW) {
            this.input.cwSwitch = false;
            if (!(this.input.ccwSwitch)) {
                this.input.ccwSwitch = true;
                this.current.rotate(this.board, false);
            }
        }
        else {
            this.input.cwSwitch = false;
            this.input.ccwSwitch = false;
        }

        this.lastInput = thisInput;
        return (thisInput.length > 0);
    }

    sendState(userInput='') {
        var boardState = new Array(WIDTH*HEIGHT);
        var pieceState = new Array(PIECES.length);
        // Flatten the board
        for (var row = 0; row < HEIGHT; row++){
            for (var col = 0; col < WIDTH; col++){
                if (this.board[row][col] != ' ') {
                    boardState[WIDTH*row+col] = '1';
                }
                else {
                    boardState[WIDTH*row+col] = '0';
                }
            }
        }
        // Include the current piece on the board state
        for (var i = 0; i < 4; i++) {
            boardState[this.current.ys[i]*WIDTH + this.current.xs[i]] = '1';
        }
        // The piece statistics will be ordered, so we can put them in a flat
        // array for faster communication
        for (var i in PIECES) {
            pieceState[i] = this.statistics[PIECES[i]];
        }

        var lastInput = this.encodeInput(userInput);

        // Roughly < 600 bytes of data per transaction
        // console.log('Sending state');
        this.websocket.send([this.userId, this.gameId, this.ticks, boardState, this.current.letter, this.next.letter, this.currentPeriod, pieceState, this.lines, this.score, lastInput]);
    }

    encodeInput(userInput) {
        var encodedData = 0;
        // Can be any combination of left/right/none + down/none + Cw/CCW/none
        // So, we need to uniquely encode each of these, the
        // safest way is to have each encode a trit since there 
        // are at most 3 options for each item, thus:
        // left/right/none = 3^0
        // CCW/CW/none = 3^1
        // down/none = 3^2

        //e.g.,
        // none/none/none = 0+0+0 = 0
        // left/none/none = 1+0+0 = 1
        // right/none/none = 2+0+0 = 2
        
        // none/CCW/none = 0+3+0 = 3
        // left/CCW/none = 1+3+0 = 4
        // right/CCW/none = 2+3+0 = 5
        
        // none/CW/none = 0+6+0 = 6
        // left/CW/none = 1+6+0 = 7
        // right/CW/none = 2+6+0 = 8
        
        // none/none/down = 0+0+9 = 9
        // left/none/down = 1+0+9 = 10
        // right/none/down = 2+0+9 = 11
        
        // none/CCW/down = 0+3+9 = 12
        // left/CCW/down = 1+3+9 = 13
        // right/CCW/down = 2+3+9 = 14
        
        // none/CW/down = 0+6+9 = 15
        // left/CW/down = 1+6+9 = 16
        // right/CW/down = 2+6+9 = 17
        if (userInput.indexOf('left') >= 0) {
            encodedData += 1;
        }
        else if (userInput.indexOf('right') >= 0) {
            encodedData += 2;
        }

        // Note, order here is important as CW is a substring of CCW
        if (userInput.indexOf('CCW') >= 0) {
            encodedData += 3;
        }
        else if (userInput.indexOf('CW') >= 0) {
            encodedData += 6;
        }

        if (userInput.indexOf('down') >= 0) {
            encodedData += 9;
        }
        return encodedData;
    }

    decodeInput(encodedData) {
        var userInput = '';
        // Can be any combination of left/right/none + down/none + Cw/CCW/none
        // So, we need to uniquely encode each of these, the
        // safest way is to have each encode a trit since there 
        // are at most 3 options for each item, thus:
        // left/right/none = 3^0
        // CCW/CW/none = 3^1
        // down/none = 3^2
        if (Math.floor(encodedData / 9) == 1) {
            encodedData -= 9;
            userInput = 'down';
        }

        if (Math.floor(encodedData / 3) == 2) {
            encodedData -= 6;
            userInput = 'CW' + userInput;
        }
        else if (Math.floor(encodedData / 3) == 1) {
            encodedData -= 3;
            userInput = 'CCW' + userInput;
        }

        if (encodedData == 2) {
            userInput = 'right' + userInput;
        }
        else if (encodedData == 1) {
            userInput = 'left' + userInput;
        }

        return userInput;
    }

    setBoard(board) {
        this.board = board;
    }

    drawGrid() {
        var context = this.canvas.getContext('2d');
        context.lineWidth   = 1;
        context.strokeStyle = shadeBlendConvert(0.25, BG_COLOR, WHITE);;
        for (var row = 0; row < HEIGHT-HIDDEN_ROWS; row++){
            context.beginPath();
            context.moveTo(0,row*BLOCK_SIZE);
            context.lineTo(WIDTH*BLOCK_SIZE,row*BLOCK_SIZE);
            context.stroke();
        }
        for (var col = 0; col < WIDTH; col++){
            context.beginPath();
            context.moveTo(col*BLOCK_SIZE,0);
            context.lineTo(col*BLOCK_SIZE,HEIGHT*BLOCK_SIZE);
            context.stroke();
        }
    }

    draw() {
        var context = this.canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (this.alive && this.active) {
            if (this.gridOn) {
                this.drawGrid();   
            }
            for (var row = HIDDEN_ROWS; row < HEIGHT; row++){
                for (var col = 0; col < WIDTH; col++){
                    drawMonomino(this.board[row][col], col*BLOCK_SIZE, (row-HIDDEN_ROWS)*BLOCK_SIZE, this.canvas, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
            if (this.ghostOn) {
                this.current.drawGhost(this.canvas, this.board);
            }
            this.current.draw(this.canvas, this.setTimer % 4 < 2 && this.setTimer > 0);
    
            if (this.clearTimer > 0) {
                var distanceFromCenter = 1 - (this.clearTimer-1)/this.clearPeriod;
                var x = WIDTH/2*(1 - distanceFromCenter);
                var width = WIDTH*distanceFromCenter;
    
                context.fillStyle = WHITE;
                for (let y of this.linesCleared) {
                    context.fillRect(x*BLOCK_SIZE, (y-HIDDEN_ROWS)*BLOCK_SIZE, width*BLOCK_SIZE, BLOCK_SIZE);
                }
            } 
        }
        else if(this.alive) {
            context.fillStyle = WHITE;
            context.fillRect((WIDTH/2-2)*BLOCK_SIZE, (1/3*HEIGHT)*BLOCK_SIZE, BLOCK_SIZE, (1/3*HEIGHT-1)*BLOCK_SIZE);
            context.fillRect((WIDTH/2+1)*BLOCK_SIZE, (1/3*HEIGHT)*BLOCK_SIZE, BLOCK_SIZE, (1/3*HEIGHT-1)*BLOCK_SIZE);
        }
        else {
            for (var row = HIDDEN_ROWS; row < HEIGHT; row++){
                for (var col = 0; col < WIDTH; col++){
                    drawMonomino(this.board[row][col], col*BLOCK_SIZE, (row-HIDDEN_ROWS)*BLOCK_SIZE, this.canvas, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
            context.fillStyle = WHITE;
            context.font = "36px Impact"
            context.fillText("Game Over",BLOCK_SIZE,(HEIGHT/2)*BLOCK_SIZE);
        }
    }
}