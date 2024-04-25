import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZ1V-_2tXX6Y506lYswCSt-G0IjLMvktk",
  authDomain: "cloudsecura-31f43.firebaseapp.com",
  projectId: "cloudsecura-31f43",
  storageBucket: "cloudsecura-31f43.appspot.com",
  messagingSenderId: "524881926400",
  appId: "1:524881926400:web:7de1551196160944447be5",
  measurementId: "G-XQEXBXW5Y2"
};


// INITIALISE FIREBASE INSTANCES
export const app = firebase.initializeApp(firebaseConfig);
// if (!firebase.apps.length) {
//   const app = firebase.initializeApp(firebaseConfig);
// } else {
//   const app = firebase.app();
// }
export const auth = firebase.auth();
export const firestore = firebase.firestore();

// FIREBASE AUTH METHODS
const provider = new firebase.auth.GoogleAuthProvider();
export const signInWithGoogle = () => auth.signInWithRedirect(provider);
