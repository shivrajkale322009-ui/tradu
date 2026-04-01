import { useState, useEffect } from 'react';
import { getTrades, deleteTrade } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Records() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTrades();
    } else {
      navigate('/');
    }
  }, [currentUser]);

  const loadTrades = async () => {
    setLoading(true);
    const data = await getTrades(currentUser.uid);
    setTrades(data);
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteTrade(id);
      loadTrades();
    }
  };

  const filteredTrades = trades.filter(t => 
    t.pair?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.strategy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.date?.includes(searchTerm)
  );

  if (loading) return <div className="page-container loading">Accessing Records...</div>;

  return (
    <div className="page-container">
      <header className="header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" className="icon-btn">
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ margin: 0, flex: 1 }}>Trade Archives</h1>
      </header>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by pair, strategy, or date..." 
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </div>

      <div className="glass-panel">
        <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Full History Record</span>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{filteredTrades.length} entries</span>
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="sci-fi-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Strategy</th>
                <th>P/L</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTrades.map(trade => (
                  <motion.tr 
                    key={trade.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(`/trade/${trade.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ color: 'var(--text-muted)' }}>{trade.date}</td>
                    <td style={{ fontWeight: 600 }}>{trade.pair}</td>
                    <td><span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.65rem' }}>{trade.type?.toUpperCase()}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{trade.strategy || '-'}</td>
                    <td className={Number(trade.pnl) >= 0 ? 'glow-text-success' : 'glow-text-danger'}>
                      {Number(trade.pnl) >= 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)}
                    </td>
                    <td>
                      <button className="icon-btn text-muted hover-danger" onClick={(e) => handleDelete(trade.id, e)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredTrades.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No trade records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
