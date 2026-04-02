import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Clock, User } from 'lucide-react';

export default function Navigation() {
  return (
    <div className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <LayoutDashboard size={24} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <PlusCircle size={24} />
        <span>Add Trade</span>
      </NavLink>
      <NavLink to="/records" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Clock size={24} />
        <span>History</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </div>
  );
}
