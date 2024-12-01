// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlHutMqr-6ydKeFV240_iDVOP2q9-KzQs",
  authDomain: "whatsappclone-d5a6d.firebaseapp.com",
  databaseURL: "https://whatsappclone-d5a6d-default-rtdb.firebaseio.com",
  projectId: "whatsappclone-d5a6d",
  storageBucket: "whatsappclone-d5a6d.firebasestorage.app",
  messagingSenderId: "69433115785",
  appId: "1:69433115785:web:d91067fbef0484938ef258",
  measurementId: "G-7YWTX4HXZ5",
};
// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;