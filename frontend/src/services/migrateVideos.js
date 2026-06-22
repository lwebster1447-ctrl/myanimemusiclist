// frontend/src/services/migrateVideos.js
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase.js";
import { searchSongs } from "./api.js";

export async function migrateVideoUrls(uid) {
  try {
    console.log('🔄 Starting video URL migration for user:', uid);
    
    const savedSongsRef = collection(db, "users", uid, "savedSongs");
    const snapshot = await getDocs(savedSongsRef);
    
    let updated = 0;
    let failed = 0;
    
    for (const docSnap of snapshot.docs) {
      const song = docSnap.data();
      
      // Skip if already has videoUrl
      if (song.videoUrl) {
        console.log(`✅ ${song.title} already has videoUrl`);
        continue;
      }
      
      try {
        // Search for the song by title and anime
        const searchQuery = `${song.title} ${song.anime}`.trim();
        console.log(`🔍 Searching for: ${searchQuery}`);
        
        const results = await searchSongs(searchQuery);
        
        // Find matching song in results
        let foundSong = null;
        if (results.themes) {
          foundSong = results.themes.find(t => 
            t.title.toLowerCase() === song.title.toLowerCase() && 
            t.anime?.toLowerCase() === song.anime?.toLowerCase()
          );
        }
        
        if (foundSong && foundSong.videoUrl) {
          // Update the document with videoUrl
          await updateDoc(doc(db, "users", uid, "savedSongs", docSnap.id), {
            videoUrl: foundSong.videoUrl
          });
          updated++;
          console.log(`✅ Updated: ${song.title} with videoUrl`);
        } else {
          console.log(`❌ No video found for: ${song.title}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error migrating ${song.title}:`, error);
        failed++;
      }
    }
    
    console.log(`🎉 Migration complete! Updated: ${updated}, Failed: ${failed}`);
    return { updated, failed };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}