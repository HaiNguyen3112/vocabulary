// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0ZkLfoIY9weAN8R7k9cltlW37puYyJgE",
  authDomain: "vocabularyproject-ab9b6.firebaseapp.com",
  projectId: "vocabularyproject-ab9b6",
  storageBucket: "vocabularyproject-ab9b6.appspot.com",
  messagingSenderId: "929483916519",
  appId: "1:929483916519:web:899b5ebfe5a1d4b26f8e42",
  measurementId: "G-598061WN6Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const storage = getStorage(app);
const db = getFirestore(app);
export { db, storage };
