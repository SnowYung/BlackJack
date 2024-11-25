const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    const playerName = prompt("Enter your name:");
    socket.send(JSON.stringify({ name: playerName }));
    console.log('Connected to server');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);
    updateGameUI(data);
};

function updateGameUI(data) {
    document.getElementById('your-sum').innerText = data.playerSum || '';
    document.getElementById('results').innerText = data.message || '';

    if (data.message === 'Game Over') {
        document.getElementById('hit').disabled = true;
        document.getElementById('stay').disabled = true;
    }
}

function hit() {
    socket.send(JSON.stringify({ action: 'hit' }));
}

function stay() {
    socket.send(JSON.stringify({ action: 'stay' }));
}