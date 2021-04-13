var canvas = document.getElementById("placeholder-Tglyph");
var glyph = new T_Tetromino();
glyph.drawFixed(canvas, 1, 1);

canvas = document.getElementById("placeholder-Sglyph");
glyph = new S_Tetromino();
glyph.drawFixed(canvas, 1, 1);

canvas = document.getElementById("placeholder-Zglyph");
glyph = new Z_Tetromino();
glyph.drawFixed(canvas, 1, 1);

canvas = document.getElementById("placeholder-Iglyph");
glyph = new I_Tetromino();
glyph.drawFixed(canvas, 0, 1);

canvas = document.getElementById("placeholder-Oglyph");
glyph = new O_Tetromino();
glyph.drawFixed(canvas, 2, 1);

canvas = document.getElementById("placeholder-Jglyph");
glyph = new J_Tetromino();
glyph.drawFixed(canvas, 1, 1);

canvas = document.getElementById("placeholder-Lglyph");
glyph = new L_Tetromino();
glyph.drawFixed(canvas, 1, 1);

var canvas = document.getElementById("board");

function gameLoop() {
    if (game.alive) {
        var canvas = document.getElementById("placeholder-next");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (game.next.letter == 'i') {
            game.next.drawFixed(canvas, 0, 0.5);
        }
        else if (game.next.letter == 'o') {
            game.next.drawFixed(canvas, 1, 0.5);
        }
        else {
            game.next.drawFixed(canvas, 0.5, 0.5);
        }

        document.getElementById("placeholder-Icount").innerHTML = game.statistics['i'];
        document.getElementById("placeholder-Jcount").innerHTML = game.statistics['j'];
        document.getElementById("placeholder-Lcount").innerHTML = game.statistics['l'];
        document.getElementById("placeholder-Ocount").innerHTML = game.statistics['o'];
        document.getElementById("placeholder-Scount").innerHTML = game.statistics['s'];
        document.getElementById("placeholder-Tcount").innerHTML = game.statistics['t'];
        document.getElementById("placeholder-Zcount").innerHTML = game.statistics['z'];

        document.getElementById("placeholder-lines").innerHTML = game.lines;
        document.getElementById("placeholder-level").innerHTML = game.level;
        document.getElementById("placeholder-score").innerHTML = game.score;

        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
}