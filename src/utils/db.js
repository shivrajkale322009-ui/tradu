import { db as firestore, storage } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, where, or } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const TRADES_COLLECTION = 'trades';
const USERS_COLLECTION = 'users';
const JOURNALS_COLLECTION = 'journals';
const JOURNAL_ACCESS_COLLECTION = 'journalAccess';
const BACKTESTS_COLLECTION = 'backtests';
const BACKTEST_TRADES_COLLECTION = 'backtestTrades';
const SESSION_CAPTURES_COLLECTION = 'sessionCaptures';

/**
 * Fetches user-specific metadata and workstation preferences.
 * @param {string} userId - The unique Firebase authentication ID.
 */
export const getUserProfile = async (userId) => {
  if (!firestore || !userId) return null;
  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    let profileData = { 
      favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      activeJournalId: userId,
      fontSize: 14
    };
    if (docSnap.exists()) {
      profileData = { ...profileData, ...docSnap.data() };
      profileData.activeJournalId = profileData.activeJournalId || userId;
      profileData.fontSize = profileData.fontSize || 14;
    }
    
    let activeJournalRole = 'owner';
    try {
      const q = query(collection(firestore, 'journalAccess'), where('journalId', '==', profileData.activeJournalId), where('userId', '==', userId));
      const accessSnap = await getDocs(q);
      if (!accessSnap.empty) {
        activeJournalRole = accessSnap.docs[0].data().role;
      }
    } catch(e) {}
    
    profileData.activeJournalRole = activeJournalRole;
    return profileData;
  } catch (err) {
    console.error('Error getting user profile', err);
    return { 
      favouritePairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      activeJournalId: userId,
      activeJournalRole: 'owner'
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

export const getTrades = async (journalId, limitCount = 0) => {
  if (!firestore || !journalId) return [];
  try {
    // Parallel fetch for journalId and userId tags
    const q1 = query(collection(firestore, TRADES_COLLECTION), where('journalId', '==', journalId));
    const q2 = query(collection(firestore, TRADES_COLLECTION), where('userId', '==', journalId));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    // Fast deduplication using Map
    const tradeMap = new Map();
    [...snap1.docs, ...snap2.docs].forEach(docSnap => {
      if (!tradeMap.has(docSnap.id)) {
        tradeMap.set(docSnap.id, { 
          id: docSnap.id, 
          ...docSnap.data(), 
          image: docSnap.data().imageUrl 
        });
      }
    });

    const data = Array.from(tradeMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return limitCount > 0 ? data.slice(0, limitCount) : data;
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
    // For dashboard recovery, we only need the most recent data to provide context
    // The full archive can be fetched on demand in the Records page
    const q = query(collection(firestore, TRADES_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      image: doc.data().imageUrl
    })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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

// --- Google Drive Style Journal Functions ---

export const createNewJournal = async (userId, name = "EMA", userEmail = "", customId = null) => {
  if (!firestore || !userId) return null;
  const journalData = {
    name,
    ownerId: userId,
    createdAt: new Date().toISOString()
  };
  
  let docRefId;
  if (customId) {
    await setDoc(doc(firestore, JOURNALS_COLLECTION, customId), journalData);
    docRefId = customId;
  } else {
    const docRef = await addDoc(collection(firestore, JOURNALS_COLLECTION), journalData);
    docRefId = docRef.id;
  }
  
  await addDoc(collection(firestore, JOURNAL_ACCESS_COLLECTION), {
    journalId: docRefId,
    userId,
    email: userEmail,
    role: 'owner',
    username: userEmail ? userEmail.split('@')[0] : 'Trader'
  });

  return { id: docRefId, ...journalData, role: 'owner' };
};

export const getMyJournals = async (userId) => {
  if (!firestore || !userId) return [];
  const q = query(collection(firestore, JOURNAL_ACCESS_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  const accesses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const journals = await Promise.all(accesses.map(async (acc) => {
    const jRef = doc(firestore, JOURNALS_COLLECTION, acc.journalId);
    const jSnap = await getDoc(jRef);
    if (jSnap.exists()) {
      return { ...jSnap.data(), id: jSnap.id, role: acc.role, accessId: acc.id };
    }
    return null;
  }));
  return journals.filter(j => j !== null).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const shareJournalWithUser = async (journalId, targetEmail, role = 'viewer') => {
  const userQ = query(collection(firestore, USERS_COLLECTION), where('email', '==', targetEmail));
  const userSnap = await getDocs(userQ);
  if (userSnap.empty) throw new Error("USER_NOT_FOUND");
  
  const targetUser = userSnap.docs[0];
  const targetUserId = targetUser.id;
  const targetUserData = targetUser.data();
  
  const accessQ = query(collection(firestore, JOURNAL_ACCESS_COLLECTION), where('journalId', '==', journalId), where('userId', '==', targetUserId));
  const accessSnap = await getDocs(accessQ);
  if (!accessSnap.empty) throw new Error("USER_ALREADY_HAS_ACCESS");
  
  await addDoc(collection(firestore, JOURNAL_ACCESS_COLLECTION), {
    journalId,
    userId: targetUserId,
    email: targetUserData.email,
    username: targetUserData.displayName || targetUserData.email.split('@')[0],
    role
  });
};

export const getJournalAccessList = async (journalId) => {
  const accessQ = query(collection(firestore, JOURNAL_ACCESS_COLLECTION), where('journalId', '==', journalId));
  const accessSnap = await getDocs(accessQ);
  return accessSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateJournalAccessRole = async (accessId, newRole) => {
  await setDoc(doc(firestore, JOURNAL_ACCESS_COLLECTION, accessId), { role: newRole }, { merge: true });
};

export const removeJournalAccess = async (accessId) => {
  await deleteDoc(doc(firestore, JOURNAL_ACCESS_COLLECTION, accessId));
};

export const renameJournal = async (journalId, newName) => {
  await setDoc(doc(firestore, JOURNALS_COLLECTION, journalId), { name: newName }, { merge: true });
};

// --- Backtest System Functions ---

export const createBacktest = async (userId, backtestData) => {
  if (!firestore || !userId) return null;
  const newBacktest = {
    ...backtestData,
    userId,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    tradesCount: 0,
    netPnl: 0,
    winRate: 0
  };
  const docRef = await addDoc(collection(firestore, BACKTESTS_COLLECTION), newBacktest);
  return { id: docRef.id, ...newBacktest };
};

export const getBacktests = async (userId) => {
  if (!firestore || !userId) return [];
  try {
    const q = query(collection(firestore, BACKTESTS_COLLECTION), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error getting backtests', err);
    return [];
  }
};

export const deleteBacktest = async (backtestId) => {
  if (!firestore || !backtestId) return;
  try {
    // Delete the backtest doc
    await deleteDoc(doc(firestore, BACKTESTS_COLLECTION, backtestId));
    
    // Also delete all trades associated with this backtest
    const q = query(collection(firestore, BACKTEST_TRADES_COLLECTION), where('backtestId', '==', backtestId));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(d => deleteDoc(doc(firestore, BACKTEST_TRADES_COLLECTION, d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error('Error deleting backtest', err);
  }
};

export const saveBacktestTrade = async (backtestId, tradeData) => {
  if (!firestore || !backtestId) return null;
  const newTrade = {
    ...tradeData,
    backtestId,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(firestore, BACKTEST_TRADES_COLLECTION), newTrade);
  
  // Update backtest statistics
  await updateBacktestStats(backtestId);
  
  return { id: docRef.id, ...newTrade };
};

export const getBacktestTrades = async (backtestId) => {
  if (!firestore || !backtestId) return [];
  try {
    const q = query(collection(firestore, BACKTEST_TRADES_COLLECTION), where('backtestId', '==', backtestId), orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error getting backtest trades', err);
    return [];
  }
};

export const updateBacktestStats = async (backtestId) => {
  const trades = await getBacktestTrades(backtestId);
  const totalTrades = trades.length;
  if (totalTrades === 0) return;

  const wins = trades.filter(t => Number(t.pnl) > 0).length;
  const netPnl = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
  const winRate = (wins / totalTrades) * 100;

  await setDoc(doc(firestore, BACKTESTS_COLLECTION, backtestId), {
    tradesCount: totalTrades,
    netPnl,
    winRate,
    lastActivity: new Date().toISOString()
  }, { merge: true });
};


export const getBacktestById = async (backtestId) => {
  if (!firestore || !backtestId) return null;
  const docRef = doc(firestore, BACKTESTS_COLLECTION, backtestId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// --- Session Capture Functions ---

export const saveSessionCapture = async (userId, sessionData) => {
  if (!firestore || !userId) return null;
  const newSession = {
    ...sessionData,
    userId,
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  };
  const docRef = await addDoc(collection(firestore, SESSION_CAPTURES_COLLECTION), newSession);
  return { id: docRef.id, ...newSession };
};

export const getSessionCaptures = async (userId) => {
  if (!firestore || !userId) return [];
  try {
    const q = query(collection(firestore, SESSION_CAPTURES_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort manually to avoid composite index requirement
    return data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error('Error getting session captures', err);
    return [];
  }
};

export const deleteSessionCapture = async (id) => {
  if (!firestore || !id) return;
  try {
    await deleteDoc(doc(firestore, SESSION_CAPTURES_COLLECTION, id));
  } catch (err) {
    console.error('Error deleting session capture', err);
  }
};
