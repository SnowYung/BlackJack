const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = {
    deck: [],
    playerSums: [0, 0],
    playerAceCounts: [0, 0],
    currentPlayer: 0,
    gameOver: false,
};

server.on('connection', socket => {
    if (players.length < 2) {
        players.push(socket);
        socket.send(JSON.stringify({ message: 'Waiting for another player...' }));

        // 當有兩個玩家時，開始遊戲
        if (players.length === 2) {
            startGame();
        }
    } else {
        socket.send(JSON.stringify({ message: 'Game is full!' }));
        socket.close();
    }

    socket.on('message', message => {
        const data = JSON.parse(message);
        handlePlayerAction(data, socket);
    });

    socket.on('close', () => {
        players = players.filter(player => player !== socket);
        resetGame();
    });
});

function startGame() {
    gameState.deck = buildDeck();
    dealInitialCards();
    broadcastGameState();
}

function dealInitialCards() {
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < players.length; j++) {
            let card = gameState.deck.pop();
            gameState.playerSums[j] += getValue(card);
            gameState.playerAceCounts[j] += checkAce(card);
        }
    }
}

function handlePlayerAction(data, socket) {
    const playerIndex = players.indexOf(socket);
    if (playerIndex !== gameState.currentPlayer || gameState.gameOver) return;

    if (data.action === 'hit') {
        if (gameState.deck.length === 0) {
            console.error('Deck is empty!');
            return;
        }
        let card = gameState.deck.pop();
        gameState.playerSums[playerIndex] += getValue(card);
        gameState.playerAceCounts[playerIndex] += checkAce(card);

        // 檢查玩家是否爆掉
        if (reduceAce(gameState.playerSums[playerIndex], gameState.playerAceCounts[playerIndex]) > 21) {
            gameState.gameOver = true;
            broadcastGameState();
            players.forEach(player => {
                player.send(JSON.stringify({ message: 'You Lose!', playerIndex }));
            });
            return;
        }
    } else if (data.action === 'stay') {
        // 如果當前玩家選擇停牌，則切換到下一個玩家
        gameState.currentPlayer = (gameState.currentPlayer + 1) % 2;
        // 檢查是否所有玩家都已經選擇停牌
        if (gameState.playerSums.every((sum, index) => index !== gameState.currentPlayer)) {
            gameState.gameOver = true;
            broadcastGameState();
            determineWinner();
            return;
        }
    }

    broadcastGameState();
}

function determineWinner() {
    const results = players.map((_, index) => {
        const playerSum = reduceAce(gameState.playerSums[index], gameState.playerAceCounts[index]);
        if (playerSum > 21) return 'You Lose!';
        if (playerSum === 21) return 'You Win!';
        return 'Game Over!';
    });

    players.forEach((player, index) => {
        player.send(JSON.stringify({ message: 'Game Over', result: results[index] }));
    });

    resetGame();
}

function resetGame() {
    gameState = {
        deck: [],
        playerSums: [0, 0],
        playerAceCounts: [0, 0],
        currentPlayer: 0,
        gameOver: false,
    };
}

function broadcastGameState() {
    players.forEach((player, index) => {
        player.send(JSON.stringify({
            message: 'Game Update',
            playerSum: gameState.playerSums[index],
            currentPlayer: gameState.currentPlayer,
        }));
    });
}

function buildDeck() {
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const types = ["C", "D", "H", "S"];
    let deck = [];

    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < values.length; j++) {
            deck.push(values[j] + "-" + types[i]);
        }
    }
    return shuffleDeck(deck);
}

function shuffleDeck(deck) {
    for (let i = 0; i < deck.length; i++) {
        const j = Math.floor(Math.random() * deck.length);
        const temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    return deck;
}

function getValue(card) {
    const data = card.split("-");
    const value = data[0];

    if (isNaN(value)) {
        if (value === "A") return 11;
        return 10;
    }
    return parseInt(value);
}

function checkAce(card) {
    return card[0] === "A" ? 1 : 0;
}

function reduceAce(playerSum, playerAceCount) {
    while (playerSum > 21 && playerAceCount > 0) {
        playerSum -= 10;
        playerAceCount -= 1;
    }
    return playerSum;
}