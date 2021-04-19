var HOST = "localhost";
class Replay extends Game {
  constructor(canvas, userId = 0, gameId = null) {
    super(canvas, userId, gameId);

    this.alive = true;
    this.ready = false;

    this.canvas = canvas;
    this.userId = userId;
    this.gameId = gameId;

    this.board = Array(HEIGHT);
    for (var row = 0; row < HEIGHT; row++) {
      this.board[row] = Array(WIDTH);
      for (var col = 0; col < WIDTH; col++) {
        this.board[row][col] = " ";
      }
    }

    // The game timers
    this.ticks = 0;

    // Like in the NES version, we will show
    // how many of each piece the user has played
    this.statistics = {};
    for (var i in PIECES) {
      this.statistics[PIECES[i]] = 0;
    }

    // Self-explanatory parts displayed to the user
    this.score = 0;
    this.level = (this.setPeriod - this.currentPeriod) / this.periodStep;
    this.lines = 0;

    this.states = [];

    this.url = "ws://" + HOST + ":5987/";
    this.websocket.close();
    this.websocket = new WebSocket(this.url);
    var gameInstance = this;

    this.websocket.onopen = function () {
      console.log("Connection established");
      this.send("Full State");
      this.send(gameInstance.userId);
      this.send(gameInstance.gameId);
      gameInstance.ready = false;
    };

    this.websocket.onclose = function (e) {
      console.log("WebSocket closed");
      gameInstance.ready = true;
    };

    this.websocket.onmessage = function (e) {
      var tokens = e.data.split(",");

      var gameState = [];
      var counter = 0;

      var ticks = tokens[counter++];

      gameState["board"] = Array(HEIGHT);
      for (var row = 0; row < HEIGHT; row++) {
        gameState["board"][row] = Array(WIDTH);
        for (var col = 0; col < WIDTH; col++) {
          gameState["board"][row][col] = tokens[counter++];
        }
      }

      gameState["currentPiece"] = tokens[counter++];
      gameState["nextPiece"] = tokens[counter++];
      gameState["iCount"] = parseInt(tokens[counter++]);
      gameState["jCount"] = parseInt(tokens[counter++]);
      gameState["lCount"] = parseInt(tokens[counter++]);
      gameState["oCount"] = parseInt(tokens[counter++]);
      gameState["sCount"] = parseInt(tokens[counter++]);
      gameState["tCount"] = parseInt(tokens[counter++]);
      gameState["zCount"] = parseInt(tokens[counter++]);
      gameState["lines"] = parseInt(tokens[counter++]);
      gameState["score"] = parseInt(tokens[counter++]);
      console.log(ticks);
      gameInstance.states[ticks] = gameState;
    };

    this.websocket.onerror = function (e) {
      console.log("error");
    };
  }

  update() {
    if (this.ready) {
      var sTicks = this.ticks.toString();
      if (sTicks in this.states) {
        this.setBoard(this.states[sTicks]["board"]);
        this.score = this.states[sTicks]["score"];
        this.lines = this.states[sTicks]["lines"];
        this.level = Math.floor(this.lines / 10);
        this.statistics["i"] = this.states[sTicks]["iCount"];
        this.statistics["j"] = this.states[sTicks]["jCount"];
        this.statistics["l"] = this.states[sTicks]["lCount"];
        this.statistics["o"] = this.states[sTicks]["oCount"];
        this.statistics["s"] = this.states[sTicks]["sCount"];
        this.statistics["t"] = this.states[sTicks]["tCount"];
        this.statistics["z"] = this.states[sTicks]["zCount"];
        switch (this.states[sTicks]["nextPience"]) {
          case "i":
            this.next = new I_Tetromino();
            break;
          case "j":
            this.next = new J_Tetromino();
            break;
          case "l":
            this.next = new L_Tetromino();
            break;
          case "o":
            this.next = new O_Tetromino();
            break;
          case "s":
            this.next = new S_Tetromino();
            break;
          case "t":
            this.next = new T_Tetromino();
            break;
          case "z":
            this.next = new Z_Tetromino();
            break;
        }
        delete this.states[sTicks];
      }

      if (this.states.length == 0) {
        this.alive = false;
      }

      this.ticks += 1;
    }
  }

  draw() {
    var context = this.canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.drawGrid();
    for (var row = HIDDEN_ROWS; row < HEIGHT; row++) {
      for (var col = 0; col < WIDTH; col++) {
        drawMonomino(
          this.board[row][col],
          col * BLOCK_SIZE,
          (row - HIDDEN_ROWS) * BLOCK_SIZE,
          this.canvas,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    }
  }
}
