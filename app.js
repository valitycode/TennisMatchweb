// Tennis Match Social - App JS
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXdiQUOoesoL6ZpysU_C1IMTKmwW-h8ZU",
  authDomain: "tennismatchsocial.firebaseapp.com",
  projectId: "tennismatchsocial",
  storageBucket: "tennismatchsocial.firebasestorage.app",
  messagingSenderId: "395364748818",
  appId: "1:395364748818:web:8826342c2a48b9181252cb",
  measurementId: "G-10CRCCVLRC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const screens = ["authScreen", "homeScreen", "videoScreen", "profileScreen", "matchScreen"];
function showScreen(id) {
  screens.forEach(s => document.getElementById(s).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

onAuthStateChanged(auth, async user => {
  if (user) {
    document.getElementById("userEmail").innerText = user.email;
    await loadProfile(user.uid);
    await loadVideos();
    showScreen("homeScreen");
  } else {
    showScreen("authScreen");
  }
});

async function login() {
  const email = document.getElementById("authEmail").value;
  const pass = document.getElementById("authPassword").value;
  await signInWithEmailAndPassword(auth, email, pass);
}

async function register() {
  const email = document.getElementById("authEmail").value;
  const pass = document.getElementById("authPassword").value;
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  await setDoc(doc(db, "users", userCred.user.uid), {
    email,
    surface: "Dur",
    wins: 0,
    losses: 0,
    timePlayed: 0,
    created: serverTimestamp()
  });
}

function logout() {
  signOut(auth);
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const user = snap.data();
    document.getElementById("userName").innerText = "Nom : " + user.email;
    document.getElementById("userSurface").innerText = "Surface : " + user.surface;
    document.getElementById("userStats").innerText = `Victoires: ${user.wins}, DÃ©faites: ${user.losses}, Temps: ${user.timePlayed} sec`;
  }
}

async function addVideo(e) {
  e.preventDefault();
  const link = document.getElementById("videoLink").value.trim();
  if (!link) return;
  await addDoc(collection(db, "videos"), {
    link,
    owner: auth.currentUser.uid,
    created: serverTimestamp()
  });
  document.getElementById("videoLink").value = "";
  await loadVideos();
}

async function loadVideos() {
  const q = query(collection(db, "videos"), orderBy("created", "desc"));
  const snap = await getDocs(q);
  const feed = document.getElementById("videoFeed");
  feed.innerHTML = "";
  snap.forEach(doc => {
    const data = doc.data();
    let el;
    if (data.link.includes("youtube") || data.link.includes("youtu.be")) {
      const embed = data.link.replace("watch?v=", "embed/");
      el = `<iframe src="${embed}" frameborder="0" allowfullscreen></iframe>`;
    } else {
      el = `<a href="${data.link}" target="_blank">${data.link}</a>`;
    }
    feed.innerHTML += `<div>${el}</div>`;
  });
}

// Match logique (simplifiÃ©e)
let currentMatch = {
  p1: { name: "Joueur 1", sets: 0, games: 0, points: 0 },
  p2: { name: "Joueur 2", sets: 0, games: 0, points: 0 }
};

function point(player) {
  const p = player === 1 ? currentMatch.p1 : currentMatch.p2;
  p.points++;
  updateMatchUI();
}

function updateMatchUI() {
  document.getElementById("p1Name").innerText = currentMatch.p1.name;
  document.getElementById("p2Name").innerText = currentMatch.p2.name;
  document.getElementById("p1Sets").innerText = currentMatch.p1.sets;
  document.getElementById("p2Sets").innerText = currentMatch.p2.sets;
  document.getElementById("p1Games").innerText = currentMatch.p1.games;
  document.getElementById("p2Games").innerText = currentMatch.p2.games;
  document.getElementById("scoreP1").innerText = currentMatch.p1.points;
  document.getElementById("scoreP2").innerText = currentMatch.p2.points;
}

function togglePause() {
  const timer = document.getElementById("matchTimer");
  timer.innerText = "â¸ Pause 90s...";
  setTimeout(() => {
    timer.innerText = "â±ï¸ Reprise";
    document.getElementById("bipSound").play();
  }, 90000);
}
