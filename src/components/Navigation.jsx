import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Clock, User, BarChart2, Database } from 'lucide-react';

export default function Navigation() {
  return (
    <div className="bottom-nav">
      <div className="desktop-only" style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.2rem', marginBottom: '0.5rem' }}>SYSTEM.v1</div>
        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>ADMIN_CONSOLE</div>
      </div>
      
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => (isActive ? 'nav-item active workstation-link' : 'nav-item workstation-link')}>
        <PlusCircle size={20} />
        <span>Log Trade</span>
      </NavLink>

      <NavLink to="/add" className="mobile-log-fab">
        <PlusCircle size={24} />
      </NavLink>
      <NavLink to="/records" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Clock size={20} />
        <span>Archives</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <BarChart2 size={20} />
        <span>Analytics</span>
      </NavLink>
      <NavLink to="/data" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Database size={20} />
        <span>Data</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <User size={20} />
        <span>Terminal</span>
      </NavLink>
      
      <div className="desktop-only" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        v2.4_HUDSYNC_STABLE<br/>
        ENCRYPTION_ACTIVE
      </div>
    </div>
  );
}
