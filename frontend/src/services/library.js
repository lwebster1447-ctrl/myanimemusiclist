import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";

function savedSongsRef(uid) {
  return collection(db, "users", uid, "savedSongs");
}

function userProfileRef(uid) {
  return doc(db, "users", uid);
}

export function subscribeSavedSongs(uid, callback) {
  const q = query(savedSongsRef(uid), orderBy("addedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function saveSong(uid, song) {
  await setDoc(doc(savedSongsRef(uid), song.id), {
    title: song.title,
    anime: song.anime || null,
    artist: song.artist,
    type: song.type,
    source: song.source,
    videoUrl: song.videoUrl || null,
    rating: 0,
    addedAt: serverTimestamp(),
  });
}

export async function removeSong(uid, songId) {
  // Remove from savedSongs
  await deleteDoc(doc(savedSongsRef(uid), songId));
  
  // Also remove from favorites if it's there
  try {
    const userDocRef = userProfileRef(uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const favoriteSongs = userData.favoriteSongs || [];
      
      // Check if this song is in favorites
      const hasSong = favoriteSongs.some(fav => fav.songId === songId);
      
      if (hasSong) {
        // Remove the song from favorites
        const updatedFavorites = favoriteSongs.filter(fav => fav.songId !== songId);
        await updateDoc(userDocRef, {
          favoriteSongs: updatedFavorites
        });
        console.log(`✅ Removed song ${songId} from favorites`);
      }
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    // Don't throw - the song was already removed from savedSongs
  }
}

export async function setRating(uid, songId, rating) {
  console.log('🔴 setRating called - uid:', uid, 'songId:', songId, 'rating:', rating);
  const docRef = doc(savedSongsRef(uid), songId);
  await updateDoc(docRef, { rating });
  console.log('✅ Rating saved to savedSongs!');
}