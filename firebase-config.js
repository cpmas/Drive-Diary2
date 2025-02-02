// firebase-config.js
// Replace these config values with your own Firebase project configuration.
const firebaseConfig = {
    apiKey: "AIzaSyDOhFkhk3DY1b5QjerhaQdbMMjuise6zB0",
    authDomain: "drivediary-9a260.firebaseapp.com",
    projectId: "drivediary-9a260",
    storageBucket: "drivediary-9a260.appspot.com",
    messagingSenderId: "453410387222",
    appId: "1:453410387222:web:f285e8b2930d3eacc80c37"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  