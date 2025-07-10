let currentMatch = null;
let profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
let history = JSON.parse(localStorage.getItem("matchHistory") || "[]");
let timerInterval = null;
let pauseTimeout = null;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "profile") renderProfiles();
  if (id === "history") renderHistory();
  if (id === "stats") renderStats();
  if (id === "home") updateHome();
}

// ---------------------------- PROFILS ----------------------------

function createProfile() {
  const name = document.getElementById("newProfileName").value.trim();
  const country = document.getElementById("newProfileCountry").value.trim().toUpperCase();
  const surface = document.getElementById("newProfileSurface").value;

  if (!name || !country) return alert("Champs obligatoires !");
  profiles[name] = profiles[name] || { wins: 0, losses: 0, timePlayed: 0, surface };
  profiles[name].country = country;
  profiles[name].surface = surface;

  localStorage.setItem("profiles", JSON.stringify(profiles));
  renderProfiles();
  updateProfileSelectors();
}

function renderProfiles() {
  const ul = document.getElementById("profileList");
  ul.innerHTML = "";
  for (const name in profiles) {
    const p = profiles[name];
    const li = document.createElement("li");
    li.textContent = `${name} (${p.country}) - ${p.surface} | ${p.wins}V-${p.losses}D`;
    ul.appendChild(li);
  }
}

function updateProfileSelectors() {
  const sel1 = document.getElementById("profile1Select");
  const sel2 = document.getElementById("profile2Select");
  sel1.innerHTML = "";
  sel2.innerHTML = "";
  for (const name in profiles) {
    [sel1, sel2].forEach(sel => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name} (${profiles[name].country})`;
      sel.appendChild(opt);
    });
  }
}

// ---------------------------- MATCH ----------------------------

function startMatch() {
  const p1Name = document.getElementById("profile1Select").value;
  const p2Name = document.getElementById("profile2Select").value;
  const sets = +document.getElementById("numSets").value;
  const gamesPerSet = +document.getElementById("gamesPerSet").value;
  const advantage = document.getElementById("advantage").value === "true";
  const type = document.getElementById("matchType").value;
  const pauseDuration = +document.getElementById("pauseDuration").value;

  if (!p1Name || !p2Name) return alert("Sélectionne deux profils");

  currentMatch = {
    p1: { name: p1Name, score: 0, games: 0, sets: 0 },
    p2: { name: p2Name, score: 0, games: 0, sets: 0 },
    setsToWin: sets,
    gamesToWin: gamesPerSet,
    advantage,
    type,
    pauseDuration,
    timer: 0
  };

  document.getElementById("matchTitle").textContent = `${p1Name} vs ${p2Name}`;
  updateScoreDisplay();
  matchStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  showScreen("match");
}

function updateTimer() {
  if (!currentMatch) return;
  currentMatch.timer++;
  const minutes = String(Math.floor(currentMatch.timer / 60)).padStart(2, "0");
  const seconds = String(currentMatch.timer % 60).padStart(2, "0");
  document.getElementById("matchTimer").textContent = `⏱️ ${minutes}:${seconds}`;
}

function point(player) {
  const p = player === 1 ? currentMatch.p1 : currentMatch.p2;
  const o = player === 1 ? currentMatch.p2 : currentMatch.p1;

  const scoreOrder = ["0", "15", "30", "40", "A"];
  let ps = p.score, os = o.score;

  if (ps === "A") {
    winGame(player);
  } else if (ps === "40" && os !== "40") {
    winGame(player);
  } else if (ps === "40" && os === "40") {
    if (currentMatch.advantage) {
      p.score = "A";
    } else {
      winGame(player);
    }
  } else if (ps === undefined) {
    p.score = "15";
  } else {
    const idx = scoreOrder.indexOf(ps);
    p.score = scoreOrder[idx + 1] || "40";
  }

  updateScoreDisplay();
}

function winGame(player) {
  const p = player === 1 ? currentMatch.p1 : currentMatch.p2;
  const o = player === 1 ? currentMatch.p2 : currentMatch.p1;

  p.games++;
  p.score = o.score = 0;

  if (p.games >= currentMatch.gamesToWin && (p.games - o.games) >= 2) {
    p.sets++;
    currentMatch.p1.games = currentMatch.p2.games = 0;
  }

  if (p.sets >= currentMatch.setsToWin) {
    endMatch(player);
    return;
  }

  updateScoreDisplay();
}

function updateScoreDisplay() {
  document.getElementById("p1Name").textContent = currentMatch.p1.name;
  document.getElementById("p2Name").textContent = currentMatch.p2.name;
  document.getElementById("scoreP1").textContent = currentMatch.p1.score || "0";
  document.getElementById("scoreP2").textContent = currentMatch.p2.score || "0";
  document.getElementById("p1Games").textContent = currentMatch.p1.games;
  document.getElementById("p2Games").textContent = currentMatch.p2.games;
  document.getElementById("p1Sets").textContent = currentMatch.p1.sets;
  document.getElementById("p2Sets").textContent = currentMatch.p2.sets;
  document.getElementById("p1Surface").textContent = profiles[currentMatch.p1.name].surface;
  document.getElementById("p2Surface").textContent = profiles[currentMatch.p2.name].surface;
}

// ---------------------------- PAUSE ----------------------------

function togglePause() {
  const pauseEl = document.getElementById("pauseTimer");
  pauseEl.classList.remove("hidden");
  const matchDiv = document.getElementById("fullScoreboard");
  matchDiv.style.opacity = "0.2";

  let remaining = currentMatch.pauseDuration;
  pauseEl.textContent = `⏸️ Pause : ${remaining}s`;

  pauseTimeout = setInterval(() => {
    remaining--;
    pauseEl.textContent = `⏸️ Pause : ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(pauseTimeout);
      pauseEl.classList.add("hidden");
      matchDiv.style.opacity = "1";
      document.getElementById("bipSound").play();
    }
  }, 1000);
}

// ---------------------------- FIN DE MATCH ----------------------------

function endMatch(winnerIndex = null) {
  clearInterval(timerInterval);
  if (!winnerIndex) {
    showScreen("home");
    return;
  }

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

  const popup = document.getElementById("winnerPopup");
  popup.innerText = `🏆 Victoire de ${winner.name} !`;
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
    showScreen("home");
  }, 3000);
}

// ---------------------------- STATS / HISTORIQUE / ACCUEIL ----------------------------

function renderHistory() {
  const ul = document.getElementById("historyList");
  ul.innerHTML = "";
  history.slice().reverse().forEach(match => {
    const li = document.createElement("li");
    li.textContent = `${match.date} : ${match.winner} bat ${match.loser} (${formatTime(match.duration)})`;
    ul.appendChild(li);
  });
}

function renderStats() {
  const div = document.getElementById("statsContent");
  div.innerHTML = "";
  for (const name in profiles) {
    const p = profiles[name];
    const el = document.createElement("div");
    el.textContent = `${name} – V:${p.wins} D:${p.losses} – Temps: ${formatTime(p.timePlayed || 0)}`;
    div.appendChild(el);
  }
}

function updateHome() {
  const info = document.getElementById("liveMatchInfo");
  const last = document.getElementById("lastMatchResult");
  if (currentMatch) {
    info.textContent = `${currentMatch.p1.name} ${currentMatch.p1.sets}-${currentMatch.p2.sets} ${currentMatch.p2.name}`;
  } else {
    info.textContent = "Aucun match en cours";
  }

  const lastMatch = history[history.length - 1];
  if (lastMatch) {
    last.textContent = `${lastMatch.winner} bat ${lastMatch.loser} (${formatTime(lastMatch.duration)})`;
  } else {
    last.textContent = "Aucun match encore joué";
  }

  const quickStats = document.getElementById("quickStats");
  quickStats.innerHTML = "";
  for (const name in profiles) {
    const p = profiles[name];
    quickStats.innerHTML += `<div>${name}: ${p.wins}V / ${p.losses}D</div>`;
  }
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  updateProfileSelectors();
  showScreen("home");
});
