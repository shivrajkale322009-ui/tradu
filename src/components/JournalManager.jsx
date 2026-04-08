import React, { useState, useEffect } from 'react';
import { Users, Share2, Plus, LogOut, ChevronDown, Check, Settings, Trash2, Edit2, Shield, X } from 'lucide-react';
import { getMyJournals, createNewJournal, shareJournalWithUser, getJournalAccessList, removeJournalAccess, updateJournalAccessRole, renameJournal, updateUserProfile } from '../utils/db';
import { useAuth } from '../context/AuthContext';

export default function JournalManager({ userProfile, onJournalChange }) {
  const { currentUser } = useAuth();
  const [journals, setJournals] = useState([]);
  const [activeJournal, setActiveJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('share'); // 'share', 'manage'
  
  // Share states
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [accessList, setAccessList] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  
  // Rename state
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadJournals();
    }
  }, [currentUser]);

  const loadJournals = async () => {
    setLoading(true);
    try {
      let myJournals = await getMyJournals(currentUser.uid);
      
      const hasLegacy = myJournals.some(j => j.id === currentUser.uid);
      if (!hasLegacy) {
        try {
          const legacyJ = await createNewJournal(currentUser.uid, "Private Vault", currentUser.email, currentUser.uid);
          myJournals.unshift(legacyJ);
        } catch(err) {
          console.error("Failed to map legacy vault", err);
        }
      }

      if (myJournals.length === 0) {
        const newJ = await createNewJournal(currentUser.uid, "EMA", currentUser.email);
        myJournals = [newJ];
      }
      setJournals(myJournals);
      
      // Find active or default
      let active = myJournals.find(j => j.id === userProfile?.activeJournalId);
      if (!active) {
        active = myJournals[0];
        if (userProfile?.activeJournalId !== active.id) {
           await updateUserProfile(currentUser.uid, { activeJournalId: active.id });
        }
      }
      setActiveJournal(active);
      onJournalChange(active);
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSwitch = async (j) => {
    setActiveJournal(j);
    setIsDropdownOpen(false);
    onJournalChange(j);
    await updateUserProfile(currentUser.uid, { activeJournalId: j.id });
  };

  const handleCreate = async () => {
    const name = prompt("Enter new journal name (e.g. EMA):");
    if (!name?.trim()) return;
    const newJ = await createNewJournal(currentUser.uid, name, currentUser.email);
    await loadJournals();
    handleSwitch(newJ);
  };

  const openShareModal = async () => {
    setIsModalOpen(true);
    loadAccessList();
  };

  const loadAccessList = async () => {
    if (!activeJournal) return;
    const list = await getJournalAccessList(activeJournal.id);
    setAccessList(list);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    try {
      setIsSharing(true);
      await shareJournalWithUser(activeJournal.id, shareEmail, shareRole);
      setShareEmail('');
      await loadAccessList();
      alert("Shared successfully!");
    } catch (err) {
      alert(err.message === "USER_NOT_FOUND" ? "User must log in to the app first before you can share with them." : err.message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveAccess = async (accessId) => {
    if (window.confirm("Remove access for this user?")) {
      await removeJournalAccess(accessId);
      await loadAccessList();
      // Wait, if a user removes themselves by some bug, owner can't remove themselves.
      // But we prevent owner from being removed in UI.
    }
  };
  
  const handleRoleChange = async (accessId, newRole) => {
    await updateJournalAccessRole(accessId, newRole);
    await loadAccessList();
  }

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renameJournal(activeJournal.id, newName);
    setNewName('');
    await loadJournals();
  };

  // Roles styling helper
  const roleDisplay = (role) => {
    switch(role) {
      case 'owner': return <span className="badge text-primary" style={{background: 'rgba(0, 240, 255, 0.1)'}}><Shield size={12} style={{marginRight: '0.2rem'}}/> You are Owner</span>;
      case 'editor': return <span className="badge text-secondary" style={{background: 'rgba(255, 51, 102, 0.1)'}}><Edit2 size={12} style={{marginRight: '0.2rem'}}/> You are Editor</span>;
      case 'viewer': return <span className="badge text-muted" style={{background: 'rgba(255,255,255,0.1)'}}>View Only Access</span>;
      default: return null;
    }
  };

  if (loading || !activeJournal) return <div style={{height: '60px', width: '200px', marginBottom: '1rem'}} className="loading"></div>;

  return (
    <div style={{ position: 'relative', zIndex: 50, marginBottom: '1.25rem' }}>
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.75rem', borderTop: '2px solid var(--primary)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trading Space</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeJournal.name} <ChevronDown size={16} className="text-muted" />
              </div>
            </div>
          </div>
          
          <div className="desktop-only" style={{ paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {roleDisplay(activeJournal.role)} 
              </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="mobile-only">
             {roleDisplay(activeJournal.role)}
          </div>
          {activeJournal.role === 'owner' ? (
            <button onClick={openShareModal} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <Share2 size={14} /> <span className="desktop-only" style={{marginLeft: '0.2rem'}}>Share</span>
            </button>
          ) : (
            <button onClick={openShareModal} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <Users size={14} /> <span className="desktop-only" style={{marginLeft: '0.2rem'}}>Shared With</span>
            </button>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setIsDropdownOpen(false)} />
          <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', minWidth: '240px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Spaces</div>
            {journals.map(j => (
              <div 
                key={j.id} 
                onClick={() => handleSwitch(j)}
                style={{
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  cursor: 'pointer',
                  background: activeJournal.id === j.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                className="hover-bg"
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500, color: activeJournal.id === j.id ? 'var(--primary)' : '#fff' }}>{j.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{j.role.toUpperCase()}</span>
                </div>
                {activeJournal.id === j.id && <Check size={16} className="text-primary" />}
              </div>
            ))}
            <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
            <div 
              onClick={handleCreate}
              style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}
              className="hover-bg glow-text-primary"
            >
              <Plus size={16} /> Create New Space
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} className="text-primary" /> {activeJournal.name} Access
              </h2>
              <button className="icon-btn text-muted" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
              <button 
                className={`tab-btn ${activeTab === 'share' ? 'active' : ''}`} 
                onClick={() => setActiveTab('share')}
                style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'share' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'share' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
              >
                Access List
              </button>
              {activeJournal.role === 'owner' && (
                <button 
                  className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`} 
                  onClick={() => {setActiveTab('manage'); setNewName(activeJournal.name);}}
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', color: activeTab === 'manage' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'manage' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  Manage Space
                </button>
              )}
            </div>

            <div style={{ padding: '1.5rem' }}>
              {activeTab === 'share' && (
                <>
                  {activeJournal.role === 'owner' && (
                    <form onSubmit={handleShare} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                      <input 
                        type="email" 
                        placeholder="Invite by email" 
                        value={shareEmail} 
                        onChange={e => setShareEmail(e.target.value)} 
                        className="input" 
                        style={{ flex: 2 }}
                        required
                      />
                      <select value={shareRole} onChange={e => setShareRole(e.target.value)} className="input" style={{ flex: 1, cursor: 'pointer', background: 'rgba(0,0,0,0.5)' }}>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button type="submit" disabled={isSharing} className="btn-primary" style={{ padding: '0 1.2rem', display: 'flex', alignItems: 'center' }}>
                        {isSharing ? '...' : <Plus size={18} />}
                      </button>
                    </form>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Shared With</div>
                    {accessList.map(acc => (
                      <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            {acc.username} {acc.userId === currentUser.uid && <span className="badge bg-primary" style={{fontSize: '0.6rem'}}>You</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {activeJournal.role === 'owner' && acc.role !== 'owner' ? (
                            <>
                              <select 
                                value={acc.role} 
                                onChange={e => handleRoleChange(acc.id, e.target.value)}
                                className="input" style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', width: 'auto', background: 'transparent' }}
                              >
                                <option value="viewer" style={{color: '#000'}}>Viewer</option>
                                <option value="editor" style={{color: '#000'}}>Editor</option>
                              </select>
                              <button onClick={() => handleRemoveAccess(acc.id)} className="icon-btn text-muted hover-danger" style={{ padding: '0.25rem' }}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{acc.role}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'manage' && activeJournal.role === 'owner' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rename Space</label>
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <input 
                         type="text" 
                         value={newName} 
                         onChange={e => setNewName(e.target.value)} 
                         className="input" 
                         style={{ flex: 1 }}
                         placeholder="New name..."
                       />
                       <button onClick={handleRename} className="btn-primary" style={{ padding: '0 1.5rem' }}>Save</button>
                     </div>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
