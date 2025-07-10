let players = {};
let score = [0, 0];
let sets = [0, 0];
let currentGame = [0, 0];
let pauseActive = false;
let pauseInterval;
let pauseTime = 90;
let matchConfig = {};
let history = JSON.parse(localStorage.getItem("matchHistory") || "[]");

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");

    if (id === "history") renderHistory();
    if (id === "stats") renderStats();
    if (id === "profile") renderProfile();
}

function startMatch() {
    players = {
        1: { name: document.getElementById("p1Name").value, country: flag(document.getElementById("p1Country").value), wins: 0 },
        2: { name: document.getElementById("p2Name").value, country: flag(document.getElementById("p2Country").value), wins: 0 }
    };
    matchConfig = {
        sets: parseInt(document.getElementById("numSets").value),
        gamesPerSet: parseInt(document.getElementById("gamesPerSet").value),
        advantage: document.getElementById("advantage").value === "true",
        matchType: document.getElementById("matchType").value,
    };
    pauseTime = parseInt(document.getElementById("pauseDuration").value);

    score = [0, 0];
    sets = [0, 0];
    currentGame = [0, 0];

    document.getElementById("scoreP1").innerText = "0";
    document.getElementById("scoreP2").innerText = "0";
    document.getElementById("matchTitle").innerText = `${players[1].name} (${players[1].country}) vs ${players[2].name} (${players[2].country})`;

    showScreen("match");
}

function flag(code) {
    return code.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

function point(playerIndex) {
    const opponent = playerIndex === 1 ? 2 : 1;
    const scores = ["0", "15", "30", "40"];
    let sc1 = score[0];
    let sc2 = score[1];

    if (!matchConfig.advantage && matchConfig.matchType === "double") matchConfig.advantage = false;

    if (sc1 === 3 && sc2 < 3 && playerIndex === 1) winGame(1);
    else if (sc2 === 3 && sc1 < 3 && playerIndex === 2) winGame(2);
    else if (sc1 === 3 && sc2 === 3) {
        if (!matchConfig.advantage) {
            winGame(playerIndex);
        } else {
            if (score[playerIndex - 1] === 4) winGame(playerIndex);
            else if (score[opponent - 1] === 4) {
                score[opponent - 1] = 3;
                score[playerIndex - 1] = 3;
            } else {
                score[playerIndex - 1]++;
            }
        }
    } else {
        score[playerIndex - 1]++;
    }

    updateScore();
}

function winGame(winner) {
    currentGame[winner - 1]++;
    score = [0, 0];

    if (currentGame[winner - 1] >= matchConfig.gamesPerSet) {
        sets[winner - 1]++;
        currentGame = [0, 0];

        if (sets[winner - 1] >= matchConfig.sets) {
            endMatch(winner);
            return;
        }
    }

    updateScore();
}

function updateScore() {
    const labels = ["0", "15", "30", "40", "Advantage"];
    document.getElementById("scoreP1").innerText = labels[score[0]] || "Jeu";
    document.getElementById("scoreP2").innerText = labels[score[1]] || "Jeu";
}

function togglePause() {
    const timerDiv = document.getElementById("pauseTimer");
    const scoreboard = document.getElementById("scoreboard");
    const sound = document.getElementById("bipSound");

    if (!pauseActive) {
        let time = pauseTime;
        timerDiv.innerText = `⏱️ Pause : ${time}s`;
        timerDiv.classList.remove("hidden");
        scoreboard.style.position = "absolute";
        scoreboard.style.top = "10px";
        scoreboard.style.right = "10px";
        pauseInterval = setInterval(() => {
            time--;
            timerDiv.innerText = `⏱️ Pause : ${time}s`;
            if (time <= 0) {
                clearInterval(pauseInterval);
                timerDiv.classList.add("hidden");
                scoreboard.style.position = "static";
                sound.play();
                pauseActive = false;
            }
        }, 1000);
        pauseActive = true;
    }
}

function endMatch(winner = null) {
    if (winner) {
        alert(`Victoire de ${players[winner].name} !`);
        players[winner].wins++;
        history.push({
            winner: players[winner].name,
            loser: players[winner === 1 ? 2 : 1].name,
            date: new Date().toLocaleString()
        });
        localStorage.setItem("matchHistory", JSON.stringify(history));
    }
    showScreen("menu");
}

function renderHistory() {
    const ul = document.getElementById("historyList");
    ul.innerHTML = "";
    history.slice().reverse().forEach(h => {
        const li = document.createElement("li");
        li.innerText = `${h.date} - ${h.winner} a battu ${h.loser}`;
        ul.appendChild(li);
    });
}

function renderStats() {
    let total = players[1].wins + players[2].wins;
    document.getElementById("statsContent").innerText = total === 0
        ? "Aucune donnée encore."
        : `${players[1].name}: ${players[1].wins} victoires\n${players[2].name}: ${players[2].wins} victoires`;
}

function renderProfile() {
    document.getElementById("profileInfo").innerText = `${players[1].name} (${players[1].country}) - Surface préférée: Dur`;
}
