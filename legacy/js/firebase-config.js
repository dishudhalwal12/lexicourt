import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    setPersistence
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBCnaC7Q8EcASXbd3LYb5ycE7twOGVJeOI",
    authDomain: "krishna-e9c59.firebaseapp.com",
    projectId: "krishna-e9c59",
    storageBucket: "krishna-e9c59.firebasestorage.app",
    messagingSenderId: "1048468387337",
    appId: "1:1048468387337:web:cef07d3ea8e6f14ab02ad8",
    measurementId: "G-TV12E0T55G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Unable to enable local auth persistence:", error);
});
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
