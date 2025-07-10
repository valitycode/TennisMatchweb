
let scores = { '1': 0, '2': 0 };
const values = ['0', '15', '30', '40', 'Avantage', 'Jeu'];

function startMatch() {
    const p1 = document.getElementById('player1').value;
    const p2 = document.getElementById('player2').value;
    const n1 = document.getElementById('nat1').value.toUpperCase();
    const n2 = document.getElementById('nat2').value.toUpperCase();
    document.getElementById('names').innerText = `${p1} (${flag(n1)}) vs ${p2} (${flag(n2)})`;
    document.getElementById('config').style.display = 'none';
    document.getElementById('score').style.display = 'block';
}

function point(player) {
    scores[player]++;
    if (scores[player] >= values.length) scores[player] = 0;
    document.getElementById('score' + player).innerText = values[scores[player]];
}

function flag(code) {
    return code.replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}
