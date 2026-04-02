import { db as firestore, storage } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const TRADES_COLLECTION = 'trades';
const USERS_COLLECTION = 'users';

export const getUserProfile = async (userId) => {
  if (!firestore || !userId) return null;
  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] }; // default profile
  } catch (err) {
    console.error('Error getting user profile', err);
    return { favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] };
  }
};

export const updateUserProfile = async (userId, data) => {
  if (!firestore || !userId) return;
  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.error('Error updating user profile', err);
  }
};

export const saveTrade = async (trade, userId) => {
  if (!firestore) {
    alert("Firebase is not configured! Please see .env.local.example");
    return null;
  }
  if (!userId) throw new Error("User must be logged in to save trade!");
  try {
    const { image, ...tradeDataWithoutImage } = trade;
    
    const newTrade = {
      ...tradeDataWithoutImage,
      imageUrl: image || null, // Store base64 string directly
      userId,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    const docRef = await addDoc(collection(firestore, TRADES_COLLECTION), newTrade);
    return { ...newTrade, id: docRef.id };
  } catch (err) {
    if (err.message && err.message.includes('Missing or insufficient permissions')) {
      alert("Error saving trade: Please set up your Firestore rules to allow writes.");
    }
    console.error('Error saving trade to Firebase', err);
    throw err;
  }
};

export const getTrades = async (userId) => {
  if (!firestore) return [];
  if (!userId) return [];
  try {
    const q = query(
      collection(firestore, TRADES_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      image: doc.data().imageUrl
    }));

    // Sort locally by timestamp descending to avoid requiring a composite index in Firestore
    return docs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Error getting trades from Firebase', err);
    return [];
  }
};

export const getTradeById = async (id) => {
  if (!firestore) return null;
  try {
    const docRef = doc(firestore, TRADES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        id: docSnap.id, 
        ...docSnap.data(),
        image: docSnap.data().imageUrl 
      };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (err) {
    console.error('Error getting trade from Firebase', err);
    return null;
  }
};

export const updateTrade = async (id, data) => {
  if (!firestore || !id) return;
  try {
    const docRef = doc(firestore, TRADES_COLLECTION, id);
    const { id: _, userId: __, createdAt: ___, ...updateData } = data;
    if (updateData.image) {
      updateData.imageUrl = updateData.image;
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.error('Error updating trade in Firebase', err);
    throw err;
  }
};

export const deleteTrade = async (id) => {
  if (!firestore) return;
  try {
    await deleteDoc(doc(firestore, TRADES_COLLECTION, id));
  } catch (err) {
    console.error('Error deleting trade from Firebase', err);
  }
};
