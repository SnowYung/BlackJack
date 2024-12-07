const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let deck = [];
let players = {};
let currentPlayer = 1;

function buildDeck() {
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const types = ["C", "D", "H", "S"];
    deck = [];
    for (let type of types) {
        for (let value of values) {
            deck.push(`${value}-${type}`);
        }
    }
}

function shuffleDeck() {
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(player) {
    const card = deck.pop();
    const value = getValue(card);
    const ace = checkAce(card);

    player.cards.push(card);
    player.sum += value;
    player.aceCount += ace;

    player.sum = reduceAce(player.sum, player.aceCount);
}

function getValue(card) {
    const value = card.split("-")[0];
    return isNaN(value) ? (value === "A" ? 11 : 10) : parseInt(value);
}

function checkAce(card) {
    return card.startsWith("A") ? 1 : 0;
}

function reduceAce(sum, aceCount) {
    while (sum > 21 && aceCount > 0) {
        sum -= 10;
        aceCount--;
    }
    return sum;
}

function sendGameState() {
    io.emit("game_state", {
        players,
        currentPlayer,
    });
}

function checkWinner() {
    const player1 = players["player1"];
    const player2 = players["player2"];

    if (player1.sum > 21) return "Player 2 Wins!";
    if (player2.sum > 21) return "Player 1 Wins!";
    if (player1.sum > player2.sum) return "Player 1 Wins!";
    if (player2.sum > player1.sum) return "Player 2 Wins!";
    return "It's a Tie!";
}

function initializePlayer(id) {
    return { id, sum: 0, aceCount: 0, cards: [], wantsToRestart: false };
}

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("set_name", (data) => {
        socket.data.name = data.name;
        if (!players["player1"]) {
            players["player1"] = initializePlayer(socket.id);
            socket.emit("player_assignment", { player: 1 });
            io.emit("sys_c_connect", { name: data.name });
        } else if (!players["player2"]) {
            players["player2"] = initializePlayer(socket.id);
            socket.emit("player_assignment", { player: 2 });
            io.emit("sys_c_connect", { name: data.name });

            if (Object.keys(players).length === 2) {
                startGame();
            }
        } else {
            socket.emit("player_assignment", { player: 0 });
        }
    });

    socket.on("hit", () => {
        const player = currentPlayer === 1 ? players["player1"] : players["player2"];
        if (socket.id === player.id) {
            drawCard(player);
            if (player.sum > 21) {
                currentPlayer = currentPlayer === 1 ? 2 : 1;
            }
            sendGameState();
        }
    });

    socket.on("stay", () => {
        const player = currentPlayer === 1 ? players["player1"] : players["player2"];
        if (socket.id === player.id) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            if (currentPlayer === 1 && players["player2"].sum > 0) {
                io.emit("game_over", {
                    result: checkWinner(),
                    player1: players["player1"],
                    player2: players["player2"]
                });
                io.emit("show_restart_button");
            } else {
                sendGameState();
            }
        }
    });

    socket.on("restart_game", () => {
        const player = Object.values(players).find(p => p.id === socket.id);
        if (player) {
            player.wantsToRestart = true;
            if (Object.values(players).every(p => p.wantsToRestart)) {
                resetGame();
                startGame();
            }
        }
    });

    socket.on("message", (data) => {
        io.emit("message", { name: socket.data.name, message: data.message });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (socket.data.name) {
            io.emit("sys_c_disconnect", { name: socket.data.name });
            resetAllPlayers();
            io.emit("request_name_reset");
            resetGame();
        }
    });
});

function startGame() {
    buildDeck();
    shuffleDeck();
    drawCard(players["player1"]);
    drawCard(players["player1"]);
    drawCard(players["player2"]);
    drawCard(players["player2"]);
    io.emit("game_start", { playerNames: [players["player1"].id, players["player2"].id] });
    sendGameState();
}

function resetGame() {
    for (let player of Object.values(players)) {
        player.wantsToRestart = false;
        player.sum = 0;
        player.aceCount = 0;
        player.cards = [];
    }
    currentPlayer = 1;
    deck = [];
}

function resetAllPlayers() {
    for (let key in players) {
        delete players[key];
    }
}

http.listen(60000, () => {
    console.log("Server listening on port 60000");
});