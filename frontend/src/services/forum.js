// frontend/src/services/forum.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Create a forum post (uses backend for censorship)
export async function createForumPost(uid, username, photoURL, songTitle, animeName, content) {
  try {
    const response = await fetch(`${API_URL}/api/forum/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, username, photoURL, songTitle, animeName, content }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create forum post");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating forum post:", error);
    throw error;
  }
}

// Subscribe to forum posts by user ID (real-time)
export function subscribeToForumPostsByUser(uid, callback) {
  console.log("🔴 Subscribing to forum posts for user:", uid);
  const forumRef = collection(db, "forums");
  const q = query(forumRef, where("uid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📊 Found ${posts.length} forum posts for user ${uid}`);
    callback(posts);
  }, (error) => {
    console.error("Error subscribing to user forum posts:", error);
  });
}

// Subscribe to all forum posts (real-time)
export function subscribeToAllForumPosts(callback) {
  const forumRef = collection(db, "forums");
  const q = query(forumRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  }, (error) => {
    console.error("Error subscribing to forum posts:", error);
  });
}

// Get all forum posts (one-time)
export async function getAllForumPosts() {
  try {
    const forumRef = collection(db, "forums");
    const q = query(forumRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    throw error;
  }
}

// Get forum posts by user ID (one-time)
export async function getForumPostsByUser(uid) {
  try {
    const forumRef = collection(db, "forums");
    const q = query(forumRef, where("uid", "==", uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user forum posts:", error);
    throw error;
  }
}

// Search forum posts by song title or anime name
export async function searchForumPosts(searchTerm) {
  try {
    const forumRef = collection(db, "forums");
    const q = query(forumRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const searchLower = searchTerm.toLowerCase().trim();
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(post => 
        post.songTitle?.toLowerCase().includes(searchLower) ||
        post.animeName?.toLowerCase().includes(searchLower)
      );
    
    return results;
  } catch (error) {
    console.error("Error searching forum posts:", error);
    throw error;
  }
}

// Get a single forum post by ID
export async function getForumPost(postId) {
  try {
    const docRef = doc(db, "forums", postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching forum post:", error);
    throw error;
  }
}

// Update a forum post (uses backend for censorship)
export async function updateForumPost(postId, content) {
  try {
    const response = await fetch(`${API_URL}/api/forum/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update forum post");
    }
    
    return true;
  } catch (error) {
    console.error("Error updating forum post:", error);
    throw error;
  }
}

// Delete a forum post (and all its comments)
export async function deleteForumPost(postId) {
  try {
    // Delete the post
    await deleteDoc(doc(db, "forums", postId));
    
    // Delete all comments subcollection
    const commentsRef = collection(db, "forums", postId, "comments");
    const commentsSnapshot = await getDocs(commentsRef);
    const deletePromises = commentsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error("Error deleting forum post:", error);
    throw error;
  }
}

// Like a forum post
export async function likeForumPost(postId, uid) {
  try {
    const docRef = doc(db, "forums", postId);
    await updateDoc(docRef, {
      likes: arrayUnion(uid),
    });
    return true;
  } catch (error) {
    console.error("Error liking forum post:", error);
    throw error;
  }
}

// Unlike a forum post
export async function unlikeForumPost(postId, uid) {
  try {
    const docRef = doc(db, "forums", postId);
    await updateDoc(docRef, {
      likes: arrayRemove(uid),
    });
    return true;
  } catch (error) {
    console.error("Error unliking forum post:", error);
    throw error;
  }
}

// Comments
export async function addComment(postId, uid, username, photoURL, content) {
  try {
    const response = await fetch(`${API_URL}/api/forum/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, username, photoURL, content }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add comment");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

// Get comments for a forum post
export async function getComments(postId) {
  try {
    const commentsRef = collection(db, "forums", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(postId, commentId) {
  try {
    await deleteDoc(doc(db, "forums", postId, "comments", commentId));
    
    // Update comment count on post
    const postRef = doc(db, "forums", postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const currentCount = postDoc.data().commentCount || 0;
      await updateDoc(postRef, { commentCount: Math.max(0, currentCount - 1) });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// Like a comment
export async function likeComment(postId, commentId, uid) {
  try {
    const docRef = doc(db, "forums", postId, "comments", commentId);
    await updateDoc(docRef, {
      likes: arrayUnion(uid),
    });
    return true;
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

// Unlike a comment
export async function unlikeComment(postId, commentId, uid) {
  try {
    const docRef = doc(db, "forums", postId, "comments", commentId);
    await updateDoc(docRef, {
      likes: arrayRemove(uid),
    });
    return true;
  } catch (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
}