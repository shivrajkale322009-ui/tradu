import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../utils/db';
import { User, LogOut, Shield, ChevronDown } from 'lucide-react';

export default function ProfileDropdown() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      // Try cache first
      const cached = sessionStorage.getItem('profile_dropdown_cache');
      if (cached) {
        try {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < 120000) { // 2 min cache
            setProfile(data);
          }
        } catch {}
      }
      // Fetch fresh
      getUserProfile(currentUser.uid).then(p => {
        if (p) {
          setProfile(p);
          sessionStorage.setItem('profile_dropdown_cache', JSON.stringify({ data: p, ts: Date.now() }));
        }
      });
    }
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, []);

  if (!currentUser) return null;

  const displayName = profile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Trader';
  const photoURL = profile?.photoURL || currentUser.photoURL;
  const email = currentUser.email;

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    sessionStorage.clear();
    await logout();
    navigate('/');
  };

  return (
    <div className="profile-dropdown-wrapper" ref={dropdownRef}>
      {/* Avatar Trigger */}
      <button 
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        <div className="profile-avatar-ring">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-fallback">
              <User size={18} />
            </div>
          )}
        </div>
        <ChevronDown 
          size={12} 
          className="profile-chevron"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          {/* User Info Header */}
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
              {photoURL ? (
                <img src={photoURL} alt={displayName} />
              ) : (
                <div className="profile-avatar-fallback" style={{ width: '100%', height: '100%' }}>
                  <User size={22} />
                </div>
              )}
            </div>
            <div className="profile-dropdown-info">
              <div className="profile-dropdown-name">{displayName}</div>
              {email && <div className="profile-dropdown-email">{email}</div>}
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <button className="profile-dropdown-item" onClick={() => handleNavigate('/profile')}>
            <Shield size={16} />
            <span>Account Settings</span>
          </button>

          <div className="profile-dropdown-divider" />

          <button className="profile-dropdown-item profile-dropdown-danger" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          {/* Version Footer */}
          <div className="profile-dropdown-footer">
            v2.4 · ENCRYPTED_SESSION
          </div>
        </div>
      )}
    </div>
  );
}
