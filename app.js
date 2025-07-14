// ✅ Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXdiQUOoesoL6ZpysU_C1IMTKmwW-h8ZU",
  authDomain: "tennismatchsocial.firebaseapp.com",
  projectId: "tennismatchsocial",
  storageBucket: "tennismatchsocial.appspot.com",
  messagingSenderId: "395364748818",
  appId: "1:395364748818:web:8826342c2a48b9181252cb",
  measurementId: "G-10CRCCVLRC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Afficher un écran
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ✅ Afficher / cacher le loader
function showLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.toggle("hidden", !show);
}

// ✅ Login
function login() {
  const email = document.getElementById("authEmail").value;
  const pass = document.getElementById("authPassword").value;
  showLoader(true);
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      showLoader(false);
    })
    .catch(err => {
      showLoader(false);
      showError(err.message);
    });
}

// ✅ Register
function register() {
  const email = document.getElementById("authEmail").value;
  const pass = document.getElementById("authPassword").value;
  showLoader(true);
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      showLoader(false);
    })
    .catch(err => {
      showLoader(false);
      showError(err.message);
    });
}

// ✅ Déconnexion
function logout() {
  auth.signOut();
}

// ✅ Affichage erreur
function showError(msg) {
  const div = document.getElementById("errorMsg");
  div.innerText = msg;
  div.classList.remove("hidden");
  setTimeout(() => div.classList.add("hidden"), 5000);
}

// ✅ Auth listener
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
    loadProfile(user.uid);
    loadVideos();
    showScreen("homeScreen");
  } else {
    showScreen("authScreen");
  }
});

// ✅ Charger vidéos
function loadVideos() {
  const feed = document.getElementById("videoFeed");
  feed.innerHTML = "";
  db.collection("videos").orderBy("date", "desc").limit(20).get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const url = doc.data().url;
        const div = document.createElement("div");
        div.className = "video-item";
        div.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
        feed.appendChild(div);
      });
    });
}

// ✅ Ajouter une vidéo
function addVideo(e) {
  e.preventDefault();
  const url = document.getElementById("videoLink").value;
  if (!url) return;
  db.collection("videos").add({
    url: url,
    date: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("videoLink").value = "";
    loadVideos();
  });
}

// ✅ Charger le profil
function loadProfile(uid) {
  db.collection("users").doc(uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById("userName").textContent = "Nom : " + (data.name || "Inconnu");
      document.getElementById("userSurface").textContent = "Surface préférée : " + (data.surface || "—");
      document.getElementById("userStats").textContent = data.stats || "Pas encore de stats.";
    }
  });
}
