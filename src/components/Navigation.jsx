import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Clock, User, BarChart2, Image as ImageIcon, Activity } from 'lucide-react';

export default function Navigation() {
  return (
    <div className="bottom-nav">
      <div className="desktop-only" style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.1rem' }}>v2.4</div>
      </div>
      
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => (isActive ? 'nav-item active workstation-link' : 'nav-item workstation-link')}>
        <PlusCircle size={18} />
        <span>Log Trade</span>
      </NavLink>

      <NavLink to="/add" className="mobile-log-fab">
        <PlusCircle size={24} />
      </NavLink>
      <NavLink to="/records" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Clock size={18} />
        <span>Archives</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <BarChart2 size={18} />
        <span>Analytics</span>
      </NavLink>
      <NavLink to="/backtest" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Activity size={18} />
        <span>Backtest</span>
      </NavLink>
      <NavLink to="/visuals" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <ImageIcon size={18} />
        <span>Visuals</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <User size={18} />
        <span>Terminal</span>
      </NavLink>
      
      <div className="desktop-only" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        v2.4_HUDSYNC_STABLE<br/>
        ENCRYPTION_ACTIVE
      </div>
    </div>
  );
}
