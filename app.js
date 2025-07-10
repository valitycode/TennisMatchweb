let profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
let history = JSON.parse(localStorage.getItem("matchHistory") || "[]");

let currentMatch = {
    p1: null,
    p2: null,
    score: [0, 0],
    games: [0, 0],
    sets: [0, 0],
    config: {},
    timer: 0,
    interval: null
};

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    if (id === "profile") updateProfileList();
    if (id === "history") renderHistory();
    if (id === "stats") renderStats();
}

function createProfile() {
    const name = document.getElementById("newProfileName").value.trim();
    if (!name) return alert("Nom obligatoire");
    profiles[name] = {
        name,
        country: document.getElementById("newProfileCountry").value.toUpperCase(),
        surface: document.getElementById("newProfileSurface").value,
        wins: 0,
        losses: 0,
        timePlayed: 0
    };
    localStorage.setItem("profiles", JSON.stringify(profiles));
    updateProfileList();
    updateProfileSelectors();
}

function updateProfileList() {
    const ul = document.getElementById("profileList");
    ul.innerHTML = "";
    for (let key in profiles) {
        const p = profiles[key];
        const li = document.createElement("li");
        li.innerText = `${p.name} (${p.country}) - Surface: ${p.surface}, ${p.wins}V / ${p.losses}D, ${Math.floor(p.timePlayed / 60)}min`;
        ul.appendChild(li);
    }
}

function updateProfileSelectors() {
    const sel1 = document.getElementById("profile1Select");
    const sel2 = document.getElementById("profile2Select");
    sel1.innerHTML = sel2.innerHTML = "";
    for (let key in profiles) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.innerText = key;
        sel1.appendChild(opt.cloneNode(true));
        sel2.appendChild(opt.cloneNode(true));
    }
}

function startMatch() {
    const p1Key = document.getElementById("profile1Select").value;
    const p2Key = document.getElementById("profile2Select").value;
    if (!profiles[p1Key] || !profiles[p2Key]) return alert("Sélectionne deux profils");

    currentMatch.p1 = profiles[p1Key];
    currentMatch.p2 = profiles[p2Key];
    currentMatch.score = [0, 0];
    currentMatch.games = [0, 0];
    currentMatch.sets = [0, 0];
    currentMatch.timer = 0;
    clearInterval(currentMatch.interval);

    currentMatch.config = {
        setsToWin: parseInt(document.getElementById("numSets").value),
        gamesPerSet: parseInt(document.getElementById("gamesPerSet").value),
        advantage: document.getElementById("advantage").value === "true",
        matchType: document.getElementById("matchType").value,
        pauseDuration: parseInt(document.getElementById("pauseDuration").value)
    };

    document.getElementById("matchTitle").innerText =
        `${currentMatch.p1.name} (${flag(currentMatch.p1.country)}) vs ${currentMatch.p2.name} (${flag(currentMatch.p2.country)})`;

    document.getElementById("p1Name").innerText = currentMatch.p1.name;
    document.getElementById("p2Name").innerText = currentMatch.p2.name;

    updateScoreDisplay();
    showScreen("match");
    startChrono();
}

function flag(code) {
    return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));
}

function updateScoreDisplay() {
    const labels = ["0", "15", "30", "40", "Adv"];
    const [s1, s2] = currentMatch.score;
    const [g1, g2] = currentMatch.games;
    const [t1, t2] = currentMatch.sets;

    document.getElementById("scoreP1").innerText = labels[s1] || "Jeu";
    document.getElementById("scoreP2").innerText = labels[s2] || "Jeu";
    document.getElementById("p1Games").innerText = g1;
    document.getElementById("p2Games").innerText = g2;
    document.getElementById("p1Sets").innerText = t1;
    document.getElementById("p2Sets").innerText = t2;
}

function point(playerIndex) {
    const opponent = playerIndex === 1 ? 1 : 0;
    const p = playerIndex - 1;
    const o = opponent;

    const [s1, s2] = currentMatch.score;

    // Win outright
    if (currentMatch.score[p] === 3 && currentMatch.score[o] < 3) {
        winGame(playerIndex);
        return;
    }

    // Deuce / Advantage logic
    if (s1 >= 3 && s2 >= 3) {
        if (!currentMatch.config.advantage || currentMatch.config.matchType === "double") {
            winGame(playerIndex);
            return;
        }

        if (currentMatch.score[p] === 4) {
            winGame(playerIndex);
        } else if (currentMatch.score[o] === 4) {
            currentMatch.score[o] = 3;
        } else {
            currentMatch.score[p]++;
        }
    } else {
        currentMatch.score[p]++;
    }

    updateScoreDisplay();
}

function winGame(playerIndex) {
    const p = playerIndex - 1;
    currentMatch.games[p]++;
    currentMatch.score = [0, 0];

    if (currentMatch.games[p] >= currentMatch.config.gamesPerSet) {
        currentMatch.sets[p]++;
        currentMatch.games = [0, 0];

        if (currentMatch.sets[p] >= currentMatch.config.setsToWin) {
            endMatch(playerIndex);
            return;
        }
    }

    updateScoreDisplay();
}

function togglePause() {
    const timerDiv = document.getElementById("pauseTimer");
    const scoreboard = document.getElementById("fullScoreboard");
    const sound = document.getElementById("bipSound");

    let time = currentMatch.config.pauseDuration;
    timerDiv.innerText = `⏸ Pause : ${time}s`;
    timerDiv.classList.remove("hidden");
    scoreboard.style.position = "absolute";
    scoreboard.style.top = "10px";
    scoreboard.style.right = "10px";

    const pauseInterval = setInterval(() => {
        time--;
        timerDiv.innerText = `⏸ Pause : ${time}s`;
        if (time <= 0) {
            clearInterval(pauseInterval);
            timerDiv.classList.add("hidden");
            scoreboard.style.position = "static";
            sound.play();
        }
    }, 1000);
}

function startChrono() {
    const timerDiv = document.getElementById("matchTimer");
    currentMatch.interval = setInterval(() => {
        currentMatch.timer++;
        const min = String(Math.floor(currentMatch.timer / 60)).padStart(2, "0");
        const sec = String(currentMatch.timer % 60).padStart(2, "0");
        timerDiv.innerText = `⏱️ ${min}:${sec}`;
    }, 1000);
}

function endMatch(winnerIndex = null) {
    clearInterval(currentMatch.interval);
    if (winnerIndex !== null) {
        const winner = winnerIndex === 1 ? currentMatch.p1 : currentMatch.p2;
        const loser = winnerIndex === 1 ? currentMatch.p2 : currentMatch.p1;

        profiles[winner.name].wins++;
        profiles[loser.name].losses++;
        profiles[winner.name].timePlayed += currentMatch.timer;
        profiles[loser.name].timePlayed += currentMatch.timer;

        history.push({
            date: new Date().toLocaleString(),
            winner: winner.name,
            loser: loser.name,
            duration: currentMatch.timer
        });

        localStorage.setItem("profiles", JSON.stringify(profiles));
        localStorage.setItem("matchHistory", JSON.stringify(history));

        alert(`🏆 Victoire de ${winner.name} !`);
    }

    showScreen("menu");
}

function renderHistory() {
    const ul = document.getElementById("historyList");
    ul.innerHTML = "";
    history.slice().reverse().forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item.date} – ${item.winner} a battu ${item.loser} (${Math.floor(item.duration / 60)}min)`;
        ul.appendChild(li);
    });
}

function renderStats() {
    const div = document.getElementById("statsContent");
    div.innerHTML = "";
    for (let key in profiles) {
        const p = profiles[key];
        const ratio = p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0;
        const line = document.createElement("p");
        line.innerText = `${p.name} – ${p.wins}V / ${p.losses}D – ${ratio}% – ${Math.floor(p.timePlayed / 60)}min`;
        div.appendChild(line);
    }
}
