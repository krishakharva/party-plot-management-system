import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANYhqDIzu6Q0_km8BwRAHjWWFHND5i2dI",
  authDomain: "party-plot-management.firebaseapp.com",
  databaseURL: "https://party-plot-management-default-rtdb.firebaseio.com",
  projectId: "party-plot-management",
  storageBucket: "party-plot-management.firebasestorage.app",
  messagingSenderId: "826064215536",
  appId: "1:826064215536:web:d600fc92be70bb270c9135",
  measurementId: "G-PPNZVDHZ9N"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
