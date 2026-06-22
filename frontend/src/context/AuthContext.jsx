// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmailVerified(firebaseUser.emailVerified);
        
        if (!firebaseUser.emailVerified && firebaseUser.providerData[0]?.providerId !== "google.com") {
          setShowVerificationMessage(true);
          setVerificationEmail(firebaseUser.email);
          await firebaseSignOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        setShowVerificationMessage(false);
        setVerificationEmail("");
        
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Ensure all required fields exist
            if (!userData.following) userData.following = [];
            if (!userData.followers) userData.followers = [];
            if (!userData.photoURL) userData.photoURL = null;
            setUserProfile(userData);
          } else {
            console.log('📝 No profile found, creating one...');
            const newProfile = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              photoURL: null,
              bio: "",
              createdAt: serverTimestamp(),
              followers: [],
              following: [],
              favoriteSongs: []
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
            console.log('✅ Auto-created profile');
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signUpWithEmail(email, password, username) {
    console.log('🔍 Signing up with email...');
    try {
      const usernameTaken = await checkUsernameTaken(username);
      if (usernameTaken) {
        throw new Error("Username already taken. Please choose another.");
      }
      
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User created:', cred.user.uid);
      
      if (username) {
        await updateProfile(cred.user, { displayName: username });
      }
      
      const newProfile = {
        uid: cred.user.uid,
        username: username.trim(),
        email: cred.user.email,
        photoURL: null,
        bio: "",
        createdAt: serverTimestamp(),
        followers: [],
        following: [],
        favoriteSongs: []
      };
      
      await setDoc(doc(db, "users", cred.user.uid), newProfile);
      console.log('✅ Profile created');
      
      try {
        await sendEmailVerification(cred.user);
        console.log('✅ Verification email sent');
      } catch (emailError) {
        console.warn('⚠️ Could not send verification email:', emailError.message);
      }
      
      setShowVerificationMessage(true);
      setVerificationEmail(cred.user.email);
      
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      
      return cred.user;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }

  async function signInWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      if (!cred.user.emailVerified) {
        setShowVerificationMessage(true);
        setVerificationEmail(cred.user.email);
        await firebaseSignOut(auth);
        setUser(null);
        throw new Error("Please verify your email before signing in.");
      }
      
      setUser(cred.user);
      setEmailVerified(cred.user.emailVerified);
      setShowVerificationMessage(false);
      setVerificationEmail("");
      return cred.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
      
      if (signInMethods.includes("password") && signInMethods.includes("google.com")) {
        setUser(user);
        setEmailVerified(true);
        return user;
      } else if (signInMethods.includes("password") && !signInMethods.includes("google.com")) {
        await firebaseSignOut(auth);
        throw new Error("An account with this email already exists. Please sign in with email/password first.");
      }
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const newProfile = {
          uid: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          bio: "",
          createdAt: serverTimestamp(),
          followers: [],
          following: [],
          favoriteSongs: []
        };
        await setDoc(doc(db, "users", user.uid), newProfile);
      } else {
        const userData = userDoc.data();
        // Ensure all required fields exist
        if (!userData.following || !userData.followers || !userData.photoURL) {
          const updates = {};
          if (!userData.following) updates.following = [];
          if (!userData.followers) updates.followers = [];
          if (!userData.photoURL) updates.photoURL = null;
          await updateDoc(doc(db, "users", user.uid), updates);
        }
      }
      
      setUser(user);
      setEmailVerified(true);
      setShowVerificationMessage(false);
      setVerificationEmail("");
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setEmailVerified(false);
    setShowVerificationMessage(false);
    setVerificationEmail("");
  }

  async function sendVerificationEmail() {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setShowVerificationMessage(true);
      setVerificationEmail(user.email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Failed to send password reset:', error);
      throw error;
    }
  }

  async function reloadUser() {
    if (!user) return;
    await user.reload();
    const reloadedUser = auth.currentUser;
    setEmailVerified(reloadedUser?.emailVerified || false);
    return reloadedUser;
  }

  async function updateUserProfile(updates) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates);
    setUserProfile(prev => ({ ...prev, ...updates }));
  }

  async function updateProfilePhoto(photoURL) {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL });
      setUserProfile(prev => ({ ...prev, photoURL }));
      return true;
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw error;
    }
  }

  async function checkUsernameTaken(username) {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const allUsers = querySnapshot.docs.map(doc => doc.data());
    const usernameLower = username.toLowerCase().trim();
    return allUsers.some(user => 
      user.username && user.username.toLowerCase() === usernameLower
    );
  }

  async function toggleFollow(targetUserId) {
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }
    if (targetUserId === user.uid) {
      console.error('❌ Cannot follow yourself');
      return;
    }
    
    try {
      console.log('🔄 Toggle follow for user:', targetUserId);
      console.log('Current user ID:', user.uid);
      
      const userRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", targetUserId);
      
      // Get fresh user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Ensure following array exists
      if (!userData.following) {
        console.log('📝 Creating following array for user');
        await updateDoc(userRef, { following: [] });
        userData.following = [];
      }
      
      // Ensure target user has followers array
      const targetDoc = await getDoc(targetRef);
      const targetData = targetDoc.data();
      if (!targetData.followers) {
        console.log('📝 Creating followers array for target user');
        await updateDoc(targetRef, { followers: [] });
        targetData.followers = [];
      }
      
      const isFollowing = userData.following.includes(targetUserId) || false;
      console.log('Is currently following:', isFollowing);
      
      if (isFollowing) {
        console.log('📉 Unfollowing user:', targetUserId);
        await updateDoc(userRef, { following: arrayRemove(targetUserId) });
        await updateDoc(targetRef, { followers: arrayRemove(user.uid) });
        
        // Update local state
        setUserProfile(prev => {
          if (!prev) return prev;
          const updatedFollowing = (prev.following || []).filter(id => id !== targetUserId);
          return { ...prev, following: updatedFollowing };
        });
        
        console.log('✅ Unfollowed successfully');
      } else {
        console.log('📈 Following user:', targetUserId);
        await updateDoc(userRef, { following: arrayUnion(targetUserId) });
        await updateDoc(targetRef, { followers: arrayUnion(user.uid) });
        
        // Update local state
        setUserProfile(prev => {
          if (!prev) return prev;
          const updatedFollowing = [...(prev.following || []), targetUserId];
          return { ...prev, following: updatedFollowing };
        });
        
        console.log('✅ Followed successfully');
      }
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
      throw error;
    }
  }

  async function searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const allUsers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure all required fields exist
      if (!data.following) data.following = [];
      if (!data.followers) data.followers = [];
      if (!data.photoURL) data.photoURL = null;
      return data;
    });
    const searchLower = searchTerm.toLowerCase();
    return allUsers.filter(user => 
      user.username && user.username.toLowerCase().includes(searchLower)
    );
  }

  async function getUserByUsername(username) {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const allUsers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure all required fields exist
      if (!data.following) data.following = [];
      if (!data.followers) data.followers = [];
      if (!data.photoURL) data.photoURL = null;
      return data;
    });
    const searchLower = username.toLowerCase();
    return allUsers.find(user => 
      user.username && user.username.toLowerCase() === searchLower
    ) || null;
  }

  async function getUserById(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Ensure all required fields exist
      if (!userData.following) userData.following = [];
      if (!userData.followers) userData.followers = [];
      if (!userData.photoURL) userData.photoURL = null;
      return userData;
    }
    return null;
  }

  async function toggleFavoriteSong(song, rating = null) {
    if (!user) return;
    
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    let currentFavorites = userData?.favoriteSongs || [];
    const existingIndex = currentFavorites.findIndex(s => s.songId === song.id);
    let newFavorites = [...currentFavorites];
    
    if (existingIndex >= 0) {
      newFavorites.splice(existingIndex, 1);
      console.log('🗑️ Removed from favorites:', song.title);
    } else {
      if (newFavorites.length >= 10) {
        throw new Error("You can only have 10 favorite songs");
      }
      
      const newFavorite = {
        songId: song.id || 'unknown',
        title: song.title || 'Unknown Title',
        anime: song.anime || 'Unknown Anime',
        artist: song.artist || 'Unknown Artist',
        videoUrl: song.videoUrl || null,
        type: song.type || 'OP',
        imageUrl: null,
        rating: rating || null,
        ratedAt: new Date().toISOString()
      };
      
      console.log('⭐ Adding to favorites:', song.title, 'Rating:', rating);
      newFavorites.push(newFavorite);
      
      // ALSO SAVE TO SAVEDSONGS IF NOT ALREADY THERE
      try {
        const savedSongsRef = collection(db, "users", user.uid, "savedSongs");
        const songDoc = await getDoc(doc(savedSongsRef, song.id));
        if (!songDoc.exists()) {
          await setDoc(doc(savedSongsRef, song.id), {
            title: song.title || 'Unknown Title',
            anime: song.anime || 'Unknown Anime',
            artist: song.artist || 'Unknown Artist',
            type: song.type || 'OP',
            source: song.source || 'animethemes',
            videoUrl: song.videoUrl || null,
            rating: rating || 0,
            addedAt: serverTimestamp()
          });
          console.log('✅ Also saved to savedSongs');
        }
      } catch (saveError) {
        console.warn('Could not save to savedSongs:', saveError.message);
      }
    }
    
    await updateDoc(userRef, { favoriteSongs: newFavorites });
    setUserProfile(prev => {
      if (!prev) return { ...userData, favoriteSongs: newFavorites };
      return { ...prev, favoriteSongs: newFavorites };
    });
    
    console.log('✅ Favorites updated. Total:', newFavorites.length);
  }

  const value = {
    user,
    userProfile,
    loading,
    emailVerified,
    showVerificationMessage,
    verificationEmail,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    sendVerificationEmail,
    resetPassword,
    reloadUser,
    updateUserProfile,
    updateProfilePhoto,
    checkUsernameTaken,
    toggleFollow,
    searchUsers,
    getUserByUsername,
    getUserById,
    toggleFavoriteSong
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}