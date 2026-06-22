// frontend/test-signup.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Hardcode the Firebase config for testing
const firebaseConfig = {
  apiKey: "AIzaSyB3kDHDXVq0tk4zOQvVAy5uQ03nbP6mPvg",
  authDomain: "myanimusiclist-7f120.firebaseapp.com",
  projectId: "myanimusiclist-7f120",
  storageBucket: "myanimusiclist-7f120.firebasestorage.app",
  messagingSenderId: "835459309005",
  appId: "1:835459309005:web:58e297f3884e13ad64f884"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testSignup() {
  try {
    // Generate a unique email with timestamp
    const email = "testuser" + Date.now() + "@example.com";
    const password = "Test123456";
    const username = "TestUser";
    
    console.log("🔍 Creating user with email:", email);
    console.log("🔍 This may take a few seconds...");
    
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ User created successfully!");
    console.log("📝 User UID:", cred.user.uid);
    
    console.log("🔍 Creating profile in Firestore...");
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      username: username,
      email: email,
      bio: "",
      createdAt: new Date().toISOString(),
      followers: [],
      following: [],
      favoriteSongs: []
    });
    console.log("✅ Profile created successfully!");
    console.log("🎉 Signup test passed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testSignup();