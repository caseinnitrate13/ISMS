const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyD_mMHeWiLoZfK3YDmvOPPT2wjFY5tDetw",
    authDomain: "isms-ac9f5.firebaseapp.com",
    projectId: "isms-ac9f5",
    storageBucket: "isms-ac9f5.appspot.com",
    messagingSenderId: "917337463350",
    appId: "1:917337463350:web:f6326e3737a82d34619697",
    measurementId: "G-LVSY76850D"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase app initialized:', app.name);

if (db) {
    console.log('Firestore is connected!');
} else {
    console.error('Firestore connection failed!');
}

if (storage) console.log('Firebase Storage is connected!');

module.exports = { db, storage };
