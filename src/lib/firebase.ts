// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDdRgeC6ZWKJ5GjRre_uAcnzz7_e5r_OzE",
    authDomain: "gamezone-pro-d6dce.firebaseapp.com",
    projectId: "gamezone-pro-d6dce",
    storageBucket: "gamezone-pro-d6dce.appspot.com",
    messagingSenderId: "884343179769",
    appId: "1:884343179769:web:7ae90b2ce3f81b6e13d528",
    measurementId: "G-XZN6LE87DS"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}


export { app, analytics };
