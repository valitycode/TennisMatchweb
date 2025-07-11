// ✅ Initialisation Firebase (sans import)
const firebaseConfig = {
  apiKey: "AIzaSyAXdiQUOoesoL6ZpysU_C1IMTKmwW-h8ZU",
  authDomain: "tennismatchsocial.firebaseapp.com",
  projectId: "tennismatchsocial",
  storageBucket: "tennismatchsocial.appspot.com",
  messagingSenderId: "395364748818",
  appId: "1:395364748818:web:8826342c2a48b9181252cb",
  measurementId: "G-10CRCCVLRC"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  document.getElementById('errorMsg').innerText = "Erreur Firebase : " + e.message;
  document.getElementById('errorMsg').classList.remove("hidden");
}

const db = firebase.firestore();
const auth = firebase.auth();
let userId = null;

// 🔐 Authentification
auth.onAuthStateChanged(user => {
  if (user) {
    userId = user.uid;
    showScreen("homeScreen");
    document.getElementById("userEmail").innerText = user.email;
    loadProfile();
    loadVideos();
  } else {
    showScreen("authScreen");
  }
});

function login() {
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  auth.signInWithEmailAndPassword(email, password).catch(err => {
    alert("Erreur connexion : " + err.message);
  });
}

function register() {
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  auth.createUserWithEmailAndPassword(email, password).catch(err => {
    alert("Erreur création : " + err.message);
  });
}

function logout() {
  auth.signOut();
}

// 📺 Vidéos (TikTok/YouTube)
function addVideo(e) {
  e.preventDefault();
  const url = document.getElementById("videoLink").value;
  if (!url) return;
  db.collection("videos").add({
    url,
    uid: userId,
    date: new Date()
  });
  document.getElementById("videoLink").value = "";
  loadVideos();
}

function loadVideos() {
  db.collection("videos").orderBy("date", "desc").onSnapshot(snapshot => {
    const feed = document.getElementById("videoFeed");
    feed.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const container = document.createElement("div");
      container.className = "videoCard";
      container.innerHTML = `
        <iframe src="${data.url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>
      `;
      feed.appendChild(container);
    });
  });
}

// 👤 Profil
function loadProfile() {
  db.collection("users").doc(userId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("userName").innerText = "Nom : " + (data.name || "—");
      document.getElementById("userSurface").innerText = "Surface préférée : " + (data.surface || "—");
      document.getElementById("userStats").innerText = data.stats || "Aucune stat encore.";
      document.getElementById("userPhoto").src = data.photo || "https://via.placeholder.com/100";
    }
  });
}

// 🎾 Match (scoring)
let matchState = {
  p1: 0,
  p2: 0,
  games1: 0,
  games2: 0,
  sets1: 0,
  sets2: 0,
  paused: false,
  timerStart: null
};

function point(player) {
  if (matchState.paused) return;
  if (player === 1) matchState.p1++;
  else matchState.p2++;

  // Simple scoring
  if (matchState.p1 >= 4 && matchState.p1 - matchState.p2 >= 2) {
    matchState.games1++;
    matchState.p1 = 0;
    matchState.p2 = 0;
  } else if (matchState.p2 >= 4 && matchState.p2 - matchState.p1 >= 2) {
    matchState.games2++;
    matchState.p1 = 0;
    matchState.p2 = 0;
  }

  if (matchState.games1 >= 6 && matchState.games1 - matchState.games2 >= 2) {
    matchState.sets1++;
    matchState.games1 = 0;
    matchState.games2 = 0;
  } else if (matchState.games2 >= 6 && matchState.games2 - matchState.games1 >= 2) {
    matchState.sets2++;
    matchState.games1 = 0;
    matchState.games2 = 0;
  }

  updateMatchUI();
}

function updateMatchUI() {
  document.getElementById("p1Name").innerText = "Joueur 1";
  document.getElementById("p2Name").innerText = "Joueur 2";
  document.getElementById("scoreP1").innerText = convertScore(matchState.p1);
  document.getElementById("scoreP2").innerText = convertScore(matchState.p2);
  document.getElementById("p1Games").innerText = matchState.games1;
  document.getElementById("p2Games").innerText = matchState.games2;
  document.getElementById("p1Sets").innerText = matchState.sets1;
  document.getElementById("p2Sets").innerText = matchState.sets2;
}

function convertScore(score) {
  return ["0", "15", "30", "40", "AV"][score] || "AV";
}

// 🕒 Pause
function togglePause() {
  const paused = !matchState.paused;
  matchState.paused = paused;
  const bip = document.getElementById("bipSound");

  if (paused) {
    document.getElementById("matchTimer").innerText = "Pause : 90 sec";
    let countdown = 90;
    const interval = setInterval(() => {
      countdown--;
      document.getElementById("matchTimer").innerText = "Pause : " + countdown + " sec";
      if (countdown === 0) {
        clearInterval(interval);
        bip.play();
        matchState.paused = false;
        document.getElementById("matchTimer").innerText = "Reprise";
        setTimeout(() => {
          document.getElementById("matchTimer").innerText = "";
        }, 2000);
      }
    }, 1000);
  } else {
    document.getElementById("matchTimer").innerText = "";
  }
}

// 🌐 Navigation
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}
