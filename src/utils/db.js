import { db as firestore, storage } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, where, or } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const TRADES_COLLECTION = 'trades';
const USERS_COLLECTION = 'users';
const JOURNALS_COLLECTION = 'journals';

/**
 * Fetches user-specific metadata and workstation preferences.
 * @param {string} userId - The unique Firebase authentication ID.
 */
export const getUserProfile = async (userId) => {
  if (!firestore || !userId) return null;
  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        ...data, 
        activeJournalId: data.activeJournalId || userId // fallback to private journal
      };
    }
    return { 
      favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      activeJournalId: userId
    }; 
  } catch (err) {
    console.error('Error getting user profile', err);
    return { 
      favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      activeJournalId: userId
    };
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

// --- Shared Cockpit Operations ---

export const createSharedJournal = async (userId) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const journalData = {
    ownerId: userId,
    code,
    members: [userId],
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(firestore, JOURNALS_COLLECTION), journalData);
  await updateUserProfile(userId, { activeJournalId: docRef.id, hostedJournalId: docRef.id, journalCode: code });
  return { id: docRef.id, code };
};

export const joinSharedJournal = async (userId, code) => {
  const q = query(collection(firestore, JOURNALS_COLLECTION), where('code', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) throw new Error("INVALID_SESSION_CODE");
  
  const journalDoc = querySnapshot.docs[0];
  const journalId = journalDoc.id;
  
  await updateUserProfile(userId, { activeJournalId: journalId });
  return journalId;
};

export const leaveSharedJournal = async (userId) => {
  await updateUserProfile(userId, { activeJournalId: userId });
};


export const saveTrade = async (trade, userId, journalId) => {
  if (!firestore) return null;
  const targetJournalId = journalId || userId;
  try {
    const { image, tradeNo, ...tradeDataWithoutImage } = trade;
    
    const newTrade = {
      ...tradeDataWithoutImage,
      imageUrl: image || null,
      userId, // who recorded it
      journalId: targetJournalId, // where it belongs
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    const docRef = await addDoc(collection(firestore, TRADES_COLLECTION), newTrade);
    // Note: In shared journals, we rely on local count or global journal count logic.
    return { ...newTrade, id: docRef.id };
  } catch (err) {
    if (err.message && err.message.includes('Missing or insufficient permissions')) {
      alert("Error saving trade: Please set up your Firestore rules to allow writes.");
    }
    console.error('Error saving trade to Firebase', err);
    throw err;
  }
};

export const getTrades = async (journalId) => {
  if (!firestore || !journalId) return [];
  try {
    const q = query(
      collection(firestore, TRADES_COLLECTION),
      or(
        where('journalId', '==', journalId),
        where('userId', '==', journalId)
      )
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
    const { id: _, userId: __, createdAt: ___, tradeNo: ____, ...updateData } = data;
    if (updateData.image) {
      updateData.imageUrl = updateData.image;
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.error('Error updating trade in Firebase', err);
    throw err;
  }
};

export const recoverySweep = async (userId) => {
  if (!firestore || !userId) return [];
  try {
    // This query ignores journals and finds EVERYTHING owned by this UID
    const q = query(collection(firestore, TRADES_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      image: doc.data().imageUrl
    }));
  } catch (err) {
    console.error('CRITICAL_RECOVERY_FAILURE', err);
    return [];
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
