import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile, updateUserProfile, saveTrade, createSharedJournal, joinSharedJournal, leaveSharedJournal, recoverySweep } from '../utils/db';
import { LogOut, ArrowLeft, Plus, Trash2, Shield, Settings, User, Palette, Camera, Check, X, Edit2, Database, Users, Share2, Activity, Link as LinkIcon, Copy } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Momentum']);
  const [fontSize, setFontSize] = useState(16);
  const [capital, setCapital] = useState(0);
  const [favouritePairs, setFavouritePairs] = useState([]);
  const [newPair, setNewPair] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationData, setMigrationData] = useState('');
  const [migrationStatus, setMigrationStatus] = useState('');
  const [newStrategy, setNewStrategy] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [activeJournalId, setActiveJournalId] = useState('');
  const [hostedJournalCode, setHostedJournalCode] = useState('');

  useEffect(() => {
    if (fontSize) {
      document.documentElement.style.setProperty('--font-base', `${fontSize}px`);
    }
  }, [fontSize]);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
      // Handle auto-join from shared link
      const joinParam = searchParams.get('join');
      if (joinParam) {
        handleJoinSync(joinParam);
      }
    } else {
      navigate('/');
    }
  }, [currentUser, navigate, searchParams]);

  const loadProfile = async () => {
    setLoading(true);
    const profile = await getUserProfile(currentUser.uid);
    if (profile) {
      if (profile.favouritePairs) setFavouritePairs(profile.favouritePairs);
      if (profile.strategies) setStrategies(profile.strategies);
      if (profile.fontSize) setFontSize(profile.fontSize);
      if (profile.capital) setCapital(profile.capital);
      setActiveJournalId(profile.activeJournalId || currentUser.uid);
      setHostedJournalCode(profile.journalCode || '');
      setDisplayName(profile.displayName || currentUser.displayName || '');
      setPhotoURL(profile.photoURL || currentUser.photoURL || '');
    } else {
      setActiveJournalId(currentUser.uid);
      setDisplayName(currentUser.displayName || '');
      setPhotoURL(currentUser.photoURL || '');
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize profile image to 200x200
          const size = 200;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Draw image centered and cropped to square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPhotoURL(dataUrl);
          await updateUserProfile(currentUser.uid, { photoURL: dataUrl });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    await updateUserProfile(currentUser.uid, { displayName: displayName.trim() });
    setIsEditingName(false);
    setIsSaving(false);
  };

  const handleCreateSync = async () => {
    try {
      const { code } = await createSharedJournal(currentUser.uid);
      setHostedJournalCode(code);
      setActiveJournalId(currentUser.uid); // Host is already in their own journal
      alert(`SYNC_CODE_GENERATED: Share this with your co-analyst: ${code}`);
      loadProfile();
    } catch (err) {
      console.error(err);
      alert("COULD_NOT_GENERATE_CODE");
    }
  };

  const handleJoinSync = async (code) => {
    const targetCode = code || joinCode;
    if (!targetCode.trim()) return;
    try {
      setLoading(true);
      await joinSharedJournal(currentUser.uid, targetCode.trim());
      setJoinCode('');
      // Clean up URL if joining from link
      if (code) navigate('/profile', { replace: true });
      alert("SESSION_JOINED: Terminal synchronized with co-analyst.");
      loadProfile();
    } catch (err) {
      console.error(err);
      alert("INVALID_OR_EXPIRED_CODE");
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/profile?join=${hostedJournalCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert("LINK_COPIED: Share this with your co-analyst to auto-sync.");
  };

  const handleDeepRecovery = async () => {
    try {
      setLoading(true);
      setMigrationStatus('SCANNING_VAULT...');
      // 1. Force back to private journal first
      await leaveSharedJournal(currentUser.uid);
      
      // 2. Scan every trade ever made by this user
      const allTrades = await recoverySweep(currentUser.uid);
      
      if (allTrades.length > 0) {
        setMigrationStatus(`RECOVERED_${allTrades.length}_TRADES`);
        alert(`SUCCESS: Found ${allTrades.length} trades in your private vault. Synchronizing terminal...`);
        // Force refresh profile state
        await loadProfile();
        // Redirect to dashboard to see the 309 trades
        navigate('/');
      } else {
        setMigrationStatus('COULD_NOT_LOCATE_JOURNALS');
        alert("CRITICAL: No additional trades found for this UID. Check if you logged in with a different account.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setMigrationStatus('RECOVERY_ERROR');
      setLoading(false);
    }
  };

  const handleLeaveSync = async () => {
    try {
      setLoading(true);
      await leaveSharedJournal(currentUser.uid);
      alert("SESSION_TERMINATED: Returned to private database.");
      loadProfile();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!migrationData.trim()) return alert("PASTE_CSV_REQUIRED");
    if (!window.confirm("INIT_MIGRATION: This will push entries to your database. DO_NOT_REFRESH. Proceed?")) return;

    setIsMigrating(true);
    setMigrationStatus('PARSING_DATA...');

    try {
      const lines = migrationData.trim().split('\n');
      let count = 0;

      for (const line of lines) {
        if (!line.trim() || line.includes('TRADE NO.')) continue;
        
        // Handle tab-separated or space-separated mapping
        const parts = line.split('\t').map(s => s.trim());
        if (parts.length < 6) continue;

        const [openTime, closeTime, type, lots, pair, pnl] = parts;
        
        if (openTime && pair && type) {
          setMigrationStatus(`FEEDING_TRADE: ${++count} / ${lines.length}`);
          
          // Tactical Timezone Correction: IST (UTC+5:30) to ISO (UTC)
          // MT4 format: 2026-04-02 13:41:31
          const normalizedTime = openTime.replace(/-/g, '/');
          const istDate = new Date(`${normalizedTime} GMT+0530`);
          const utcISO = istDate.toISOString(); 
          const [datePart, timePartFull] = utcISO.split('T');
          const timePart = timePartFull.split('.')[0]; // HH:mm:ss

          // Convert closing time if present
          let closingTimeUTC = null;
          if (closeTime) {
            const istClose = new Date(`${closeTime.replace(/-/g, '/')} GMT+0530`);
            closingTimeUTC = istClose.toISOString();
          }

          await saveTrade({
            date: datePart,
            time: timePart,
            closingTime: closingTimeUTC,
            pair: pair.toUpperCase(),
            type: type.toLowerCase(),
            lots: lots || '0.01',
            pnl: parseFloat(pnl) || 0,
            strategy: '',
            emotion: 'neutral',
            quality: 'a1',
            notes: 'MIGRATED_RECORD_IST_SYNCED'
          }, currentUser.uid);
        }
      }

      setMigrationStatus('MIGRATION_SUCCESSFUL');
      
      setMigrationStatus('MIGRATION_SUCCESSFUL');
      alert(`MIGRATION_COMPLETE: ${count} sessions successfully integrated into your archive.`);
      setMigrationData('');
    } catch (err) {
      console.error(err);
      setMigrationStatus('MIGRATION_FAILED: CHECK_CONSOLE');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAddPair = async (e) => {
    e.preventDefault();
    if (!newPair.trim()) return;
    
    // Convert to uppercase and normalize format slightly if needed
    const pairToAdd = newPair.trim().toUpperCase();
    if (favouritePairs.includes(pairToAdd)) {
      setNewPair('');
      return;
    }

    const updatedPairs = [...favouritePairs, pairToAdd];
    setFavouritePairs(updatedPairs);
    setNewPair('');
    await updateUserProfile(currentUser.uid, { favouritePairs: updatedPairs });
  };

  const handleRemovePair = async (pairToRemove) => {
    const updatedPairs = favouritePairs.filter(p => p !== pairToRemove);
    setFavouritePairs(updatedPairs);
    await updateUserProfile(currentUser.uid, { favouritePairs: updatedPairs });
  };

  const handleAddStrategy = async (e) => {
    e.preventDefault();
    if (!newStrategy.trim()) return;
    const sToAdd = newStrategy.trim();
    if (strategies.includes(sToAdd)) {
      setNewStrategy('');
      return;
    }
    const updated = [...strategies, sToAdd];
    setStrategies(updated);
    setNewStrategy('');
    await updateUserProfile(currentUser.uid, { strategies: updated });
  };

  const handleRemoveStrategy = async (sToRemove) => {
    const updated = strategies.filter(s => s !== sToRemove);
    setStrategies(updated);
    await updateUserProfile(currentUser.uid, { strategies: updated });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return <div className="page-container loading">Loading...</div>;
  if (!currentUser) return null;

  return (
    <div className="page-container">
      <header className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} className="icon-btn tooltip-container" title="Back">
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, flex: 1 }}>My Profile</h1>
      </header>

      {/* Shared Cockpit HUD */}
      <div className="glass-panel" style={{ 
        padding: '2rem', 
        marginBottom: '2rem', 
        borderLeft: activeJournalId !== currentUser.uid ? '4px solid var(--secondary)' : '1px solid var(--border)',
        background: activeJournalId !== currentUser.uid ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} className={activeJournalId !== currentUser.uid ? "text-secondary" : "text-muted"} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Shared Cockpit</h2>
          </div>
          {activeJournalId !== currentUser.uid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(0, 240, 255, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              <Activity size={12} /> LIVE_SYNC_ACTIVE
            </div>
          )}
        </div>

        <div className="shared-cockpit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Host Mode */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Host Station</h3>
            {hostedJournalCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.2em', fontFamily: 'monospace', padding: '0.75rem', background: 'rgba(0, 240, 255, 0.05)', textAlign: 'center', borderRadius: '0.5rem', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                  {hostedJournalCode}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyLink} className="btn-primary" style={{ flex: 1, height: '40px', fontSize: '0.75rem', background: 'var(--primary)', borderColor: 'var(--primary)' }}>
                    <Copy size={14} /> COPY_LINK
                  </button>
                  <button onClick={handleCreateSync} className="btn-outline" style={{ flex: 1, height: '40px', fontSize: '0.75rem' }}>
                    <Share2 size={14} /> REGEN
                  </button>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>Partner can join via code or shared link.</p>
              </div>
            ) : (
              <button onClick={handleCreateSync} className="btn-outline" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', height: '45px' }}>
                <Share2 size={16} /> GENERATE_SYNC_CODE
              </button>
            )}
          </div>

          {/* Join Mode */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Join Station</h3>
             {activeJournalId !== currentUser.uid ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                 <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid var(--secondary)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.9rem' }}>CONNECTED</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>TUNED_TO_REMOTE_DATA_STREAM</div>
                 </div>
                 <button onClick={handleLeaveSync} className="btn-outline" style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)', height: '40px' }}>
                   <LogOut size={16} /> DISCONNECT_SESSION
                 </button>
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                 <input 
                   type="text" 
                   placeholder="ENTER_6_DIGIT_CODE" 
                   value={joinCode}
                   onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                   className="input"
                   style={{ textAlign: 'center', letterSpacing: '0.2em', height: '45px' }}
                 />
                 <button onClick={() => handleJoinSync()} disabled={!joinCode} className="btn-primary" style={{ width: '100%', background: 'var(--secondary)', borderColor: 'var(--secondary)', height: '45px' }}>
                   <LinkIcon size={16} /> JOIN_CO-PILOT
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="profile-section glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.5rem', 
        padding: '2rem', 
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            overflow: 'hidden',
            border: '3px solid var(--primary)',
            boxShadow: '0 0 15px var(--primary-glow)',
            position: 'relative'
          }}>
            {photoURL ? (
              <img src={photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: 'var(--surface-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-muted)' 
              }}>
                <User size={48} />
              </div>
            )}
          </div>
          <label 
            htmlFor="profile-photo-upload" 
            className="icon-btn" 
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              backgroundColor: 'var(--primary)', 
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid var(--background)'
            }}
          >
            <Camera size={16} />
          </label>
          <input 
            id="profile-photo-upload" 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
            style={{ display: 'none' }} 
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '300px' }}>
                <input
                  type="text"
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  style={{ padding: '0.25rem 0.75rem', height: '36px' }}
                />
                <button onClick={handleUpdateName} disabled={isSaving} className="icon-btn text-success" title="Save">
                  <Check size={20} />
                </button>
                <button onClick={() => { setIsEditingName(false); loadProfile(); }} className="icon-btn text-muted" title="Cancel">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{displayName || 'Trader Account'}</h2>
                <button onClick={() => setIsEditingName(true)} className="icon-btn" style={{ padding: '0.25rem', opacity: 0.6 }} title="Edit Name">
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <Shield size={14} /> {currentUser.email}
          </p>
          <button onClick={handleLogout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Palette size={20} className="text-primary" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Theme Appearance</h2>
        </div>
        
        <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Select a glassmorphism theme to apply across the app.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { id: 'dark', name: 'Glass Dark', color: '#64748b' },
            { id: 'blue', name: 'Glass Blue', color: '#3b82f6' },
            { id: 'green', name: 'Glass Green', color: '#10b981' },
            { id: 'purple', name: 'Glass Purple', color: '#8b5cf6' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className="glass-panel"
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                borderRadius: '0.75rem',
                border: theme === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
                transition: 'all 0.2s',
                color: 'white'
              }}
            >
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}` }}></div>
              <span style={{ fontWeight: theme === t.id ? '600' : '400' }}>{t.name}</span>
            </button>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Master Font Scale</span>
            <span className="text-primary" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="12" 
            max="24" 
            value={fontSize} 
            onChange={async (e) => {
              const val = parseInt(e.target.value);
              setFontSize(val);
              await updateUserProfile(currentUser.uid, { fontSize: val });
            }}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>Compact</span>
            <span>Default (16px)</span>
            <span>Large</span>
          </div>
        </div>

          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={20} className="text-secondary" /> EMERGENCY_ARCHIVE_RECOVERY
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
               Lost connection to your records? This will sweep your entire cloud database and pull 
               every trade ever logged back into this terminal.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <button 
                 onClick={handleDeepRecovery} 
                 className="btn-outline" 
                 style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)', fontSize: '0.75rem' }}
               >
                  EXECUTE_DEEP_LEVEL_SWEEP
               </button>
               {migrationStatus && (
                 <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--secondary)' }}>
                    {migrationStatus}
                 </span>
               )}
            </div>
          </div>

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '3px solid var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Database size={18} className="text-secondary" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Starting Capital</span>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
            <input 
              type="number" 
              step="any"
              className="input" 
              placeholder="e.g. 10000" 
              value={capital}
              onChange={async (e) => {
                const val = parseFloat(e.target.value) || 0;
                setCapital(val);
                await updateUserProfile(currentUser.uid, { capital: val });
              }}
              style={{ paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}
            />
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            This capital will be used to calculate your overall ROI and account growth performance.
          </p>
        </div>
      </div>

      <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Shield size={20} className="text-primary" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Core Strategies</h2>
        </div>
        
        <p className="subtitle">Manage the strategies that appear in your trade logging menu.</p>

        <form onSubmit={handleAddStrategy} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. Trend Following"
            value={newStrategy}
            onChange={(e) => setNewStrategy(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="pairs-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {strategies.length === 0 ? (
            <div className="empty-state" style={{ padding: '1rem', fontSize: '0.875rem' }}>
              No strategies added yet.
            </div>
          ) : (
            strategies.map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{s}</span>
                <button 
                  onClick={() => handleRemoveStrategy(s)}
                  className="icon-btn text-muted hover-danger"
                  style={{ padding: '0.25rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Settings size={20} className="text-primary" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Favourite Pairs</h2>
        </div>
        
        <p className="subtitle">These pairs will appear in the dropdown when adding a new trade.</p>

        <form onSubmit={handleAddPair} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. BTC/USDT"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value)}
            style={{ flex: 1, textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="pairs-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {favouritePairs.length === 0 ? (
            <div className="empty-state" style={{ padding: '1rem', fontSize: '0.875rem' }}>
              No favourite pairs added yet.
            </div>
          ) : (
            favouritePairs.map(pair => (
              <div key={pair} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 500 }}>{pair}</span>
                <button 
                  onClick={() => handleRemovePair(pair)}
                  className="icon-btn tooltip-container text-muted hover-danger"
                  style={{ padding: '0.25rem' }}
                  title="Remove pair"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '2.5rem', border: '1px solid rgba(255, 51, 102, 0.4)', borderRadius: '1rem', padding: '2rem', background: 'rgba(255, 51, 102, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Palette size={20} className="text-danger" />
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--danger)' }}>Tactical Archive Migration</h2>
        </div>
        
        <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
          PASTE_TAB_DATA: Copy columns directly from your spreadsheet into the terminal.
          <br/>
          <strong>FORMAT:</strong> OpenTime | CloseTime | Type | Lots | Symbol | Profit
        </p>

        <textarea
          className="input"
          placeholder="2026-04-02 13:41:31	2026-04-02 13:45:48	sell	0.01	BTCUSDm	-1.79"
          value={migrationData}
          onChange={(e) => setMigrationData(e.target.value)}
          disabled={isMigrating}
          style={{ height: '200px', width: '100%', marginBottom: '1.5rem', fontSize: '0.8rem', fontFamily: 'monospace', padding: '1rem', whiteSpace: 'pre' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.75rem', color: isMigrating ? 'var(--primary)' : 'var(--text-muted)', fontFamily: 'monospace' }}>
            {migrationStatus || 'READY_FOR_FEED'}
          </div>
          <button 
            onClick={handleMigration} 
            disabled={isMigrating} 
            className="btn-primary" 
            style={{ 
              background: isMigrating ? 'var(--surface-light)' : 'var(--danger)', 
              borderColor: isMigrating ? 'var(--border)' : 'var(--danger)',
              opacity: isMigrating ? 0.7 : 1
            }}
          >
            {isMigrating ? 'FEEDING...' : 'INITIALIZE_FEED'}
          </button>
        </div>
      </div>
    </div>
  );
}
