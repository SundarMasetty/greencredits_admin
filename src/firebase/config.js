
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
	  apiKey: "AIzaSyDU8mZUQHrXG3xb99s6wo_wHOSXfaDRMKY",
	  authDomain: "employeelogin-cc037.firebaseapp.com",
	  projectId: "employeelogin-cc037",
	  storageBucket: "employeelogin-cc037.firebasestorage.app",
	  messagingSenderId: "182105393508",
	  appId: "1:182105393508:web:eee26aea9d87c35ac9d271",
	  measurementId: "G-38TDF13XQH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

