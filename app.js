let currentMatch = null;
let profiles = JSON.parse(localStorage.getItem("profiles") || "{}");
let history = JSON.parse(localStorage.getItem("matchHistory") || "[]");
let videos = JSON.parse(localStorage.getItem("sharedVideos") || "[]");
let timerInterval = null;
let pauseTimeout = null;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "profile") renderProfiles();
  if (id === "history") renderHistory();
  if (id === "stats") renderStats();
  if (id === "home") updateHome();
  if (id === "videos") renderVideos();
}

// PROFILS
function createProfile() {
  const name = document.getElementById("newProfileName").value.trim();
  const country = document.getElementById("newProfileCountry").value.trim().toUpperCase();
  const surface = document.getElementById("newProfileSurface").value;

  if (!name || !country) return alert("Champs obligatoires !");
  profiles[name] = profiles[name] || {
    wins: 0, losses: 0, timePlayed: 0, surface,
    aces: 0, doubles: 0
  };
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

// VIDÉOS
function addVideo() {
  const url = document.getElementById("videoUrl").value.trim();
  if (!url) return alert("Lien invalide");
  videos.push(url);
  localStorage.setItem("sharedVideos", JSON.stringify(videos));
  renderVideos();
  document.getElementById("videoUrl").value = "";
}

function renderVideos() {
  const div = document.getElementById("videoList");
  div.innerHTML = "";
  videos.slice().reverse().forEach(link => {
    let el;
    if (link.includes("youtube") || link.includes("youtu.be")) {
      const embed = link.replace("watch?v=", "embed/");
      el = `<iframe src="${embed}" allowfullscreen></iframe>`;
    } else if (link.endsWith(".mp4")) {
      el = `<video controls src="${link}"></video>`;
    } else {
      el = `<a href="${link}" target="_blank">${link}</a>`;
    }
    div.innerHTML += el;
  });
}
function startMatch() {
  const p1Name = document.getElementById("profile1Select").value;
  const p2Name = document.getElementById("profile2Select").value;
  const sets = +document.getElementById("numSets").value;
  const gamesPerSet = +document.getElementById("gamesPerSet").value;
  const advantage = document.getElementById("advantage").value === "true";
  const type = document.getElementById("matchType").value;
  const pauseDuration = +document.getElementById("pauseDuration").value;

  if (!p1Name || !p2Name) return alert("Choisis deux profils");

  currentMatch = {
    p1: { name: p1Name, score: 0, games: 0, sets: 0 },
    p2: { name: p2Name, score: 0, games: 0, sets: 0 },
    setsToWin: sets,
    gamesToWin: gamesPerSet,
    advantage,
    type,
    pauseDuration,
    server: 1,
    timer: 0
  };

  document.getElementById("matchTitle").textContent = `${p1Name} vs ${p2Name}`;
  matchStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  updateScoreDisplay();
  showScreen("match");
}

function updateTimer() {
  if (!currentMatch) return;
  currentMatch.timer++;
  const minutes = String(Math.floor(currentMatch.timer / 60)).padStart(2, "0");
  const seconds = String(currentMatch.timer % 60).padStart(2, "0");
  document.getElementById("matchTimer").textContent = `⏱️ ${minutes}:${seconds}`;
}

function speak(text) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  synth.speak(utterance);
}

function togglePause() {
  const pauseEl = document.getElementById("pauseTimer");
  pauseEl.classList.remove("hidden");
  const matchDiv = document.getElementById("fullScoreboard");
  matchDiv.style.opacity = "0.3";

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

function point(player) {
  const p = player === 1 ? currentMatch.p1 : currentMatch.p2;
  const o = player === 1 ? currentMatch.p2 : currentMatch.p1;

  const scoreOrder = ["0", "15", "30", "40", "A"];
  let ps = p.score || "0", os = o.score || "0";

  if (ps === "A") {
    winGame(player);
    return;
  }

  if (ps === "40" && os !== "40") {
    winGame(player);
    return;
  }

  if (ps === "40" && os === "40") {
    if (currentMatch.advantage) {
      p.score = "A";
    } else {
      winGame(player);
    }
  } else {
    const idx = scoreOrder.indexOf(ps);
    p.score = scoreOrder[idx + 1] || "40";
  }

  speak(`${p.name} : ${p.score}`);
  updateScoreDisplay();
}

function winGame(player) {
  const p = player === 1 ? currentMatch.p1 : currentMatch.p2;
  const o = player === 1 ? currentMatch.p2 : currentMatch.p1;

  p.games++;
  p.score = o.score = 0;
  currentMatch.server = currentMatch.server === 1 ? 2 : 1;

  if (p.games >= currentMatch.gamesToWin && p.games - o.games >= 2) {
    p.sets++;
    currentMatch.p1.games = currentMatch.p2.games = 0;
    speak(`Jeu, set pour ${p.name}`);
  } else {
    speak(`Jeu ${p.name}`);
  }

  if (p.sets >= currentMatch.setsToWin) {
    endMatch(player);
    return;
  }

  updateScoreDisplay();
}

function updateScoreDisplay() {
  const p1 = currentMatch.p1, p2 = currentMatch.p2;
  document.getElementById("p1Name").textContent = p1.name;
  document.getElementById("p2Name").textContent = p2.name;
  document.getElementById("scoreP1").textContent = p1.score || "0";
  document.getElementById("scoreP2").textContent = p2.score || "0";
  document.getElementById("p1Games").textContent = p1.games;
  document.getElementById("p2Games").textContent = p2.games;
  document.getElementById("p1Sets").textContent = p1.sets;
  document.getElementById("p2Sets").textContent = p2.sets;
  document.getElementById("p1Surface").textContent = profiles[p1.name].surface;
  document.getElementById("p2Surface").textContent = profiles[p2.name].surface;

  document.getElementById("serveP1").textContent = currentMatch.server === 1 ? "🎾" : "";
  document.getElementById("serveP2").textContent = currentMatch.server === 2 ? "🎾" : "";
}
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
    const winRate = p.wins + p.losses > 0 ? Math.round(100 * p.wins / (p.wins + p.losses)) : 0;
    const el = document.createElement("div");
    el.innerHTML = `<strong>${name}</strong> | V:${p.wins} D:${p.losses} (${winRate}%)<br/>
      Temps total : ${formatTime(p.timePlayed || 0)}<br/>
      Surface : ${p.surface}`;
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

// INIT
window.addEventListener("DOMContentLoaded", () => {
  updateProfileSelectors();
  showScreen("home");
});
