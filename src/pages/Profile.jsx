import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile, updateUserProfile } from '../utils/db';
import { LogOut, ArrowLeft, Plus, Trash2, Shield, Settings, User, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [favouritePairs, setFavouritePairs] = useState(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
  const [strategies, setStrategies] = useState(['Breakout', 'Scalping', 'Momentum']);
  const [newPair, setNewPair] = useState('');
  const [newStrategy, setNewStrategy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    } else {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const loadProfile = async () => {
    setLoading(true);
    const profile = await getUserProfile(currentUser.uid);
    if (profile) {
      if (profile.favouritePairs) setFavouritePairs(profile.favouritePairs);
      if (profile.strategies) setStrategies(profile.strategies);
    }
    setLoading(false);
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

      <div className="profile-section" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ position: 'relative' }}>
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <User size={40} />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{currentUser.displayName || 'Trader Account'}</h2>
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
    </div>
  );
}
