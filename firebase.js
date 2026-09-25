// ============================================================
// CLAY DNA
// Firebase 공통 설정
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    getFunctions
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";


// ============================================================
// Firebase 설정
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyDEtOI_079ay9q_g1biT6vKPcf7G4a5NQs",

    authDomain: "clay-dna.firebaseapp.com",

    projectId: "clay-dna",

    storageBucket: "clay-dna.firebasestorage.app",

    messagingSenderId: "456070145020",

    appId: "1:456070145020:web:2bcfc864817e2efa728879",

    measurementId: "G-30DNQX0P85"

};


// ============================================================
// Firebase 초기화
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);


// ============================================================
// 서비스
// ============================================================

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

const functions = getFunctions(
    firebaseApp,
    "asia-northeast3"
);


// ============================================================
// Export
// ============================================================

export {
    firebaseApp,
    auth,
    db,
    functions
};
