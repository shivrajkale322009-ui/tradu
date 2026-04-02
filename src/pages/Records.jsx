import { useState, useEffect } from 'react';
import { getTrades, deleteTrade } from '../utils/db';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, Clock, Search, Maximize2, Minimize2, Download, X, Filter } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export default function Records() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Asset", "Type", "Strategy", "P/L"];
    const rows = filteredTrades.map(t => [t.date, t.time, t.pair, t.type, t.strategy, t.pnl]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trade_records_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isExpanded]);

  const filteredTrades = trades.filter(t => 
    t.pair?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.strategy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.date?.includes(searchTerm) ||
    t.time?.includes(searchTerm)
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

      <LayoutGroup>
        <motion.div 
          layoutId="record-panel"
          className="glass-panel" 
          style={{ position: 'relative' }}
          onDoubleClick={() => setIsExpanded(true)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', paddingBottom: 0 }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Full History Record</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="icon-btn text-muted" title="Export CSV" onClick={exportToCSV}>
                <Download size={18} />
              </button>
              <button 
                className="icon-btn text-muted" 
                title="Expand View"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', padding: '1.25rem' }}>
            <TradeTable 
              trades={filteredTrades} 
              onDelete={handleDelete} 
              onNavigate={navigate}
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              layoutId="record-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: '#050a19', zIndex: 9999,
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ 
                padding: '1.5rem 2rem', 
                borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.1rem' }}>TERMINAL_ARCHIVE</h1>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingTop: '0.3rem' }}>
                    {filteredTrades.length} ENTRIES COLLECTED
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={exportToCSV}>
                    <Download size={18} /> EXPORT_CSV
                  </button>
                  <button className="icon-btn" onClick={() => setIsExpanded(false)}>
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                  <TradeTable 
                    isExpanded={true}
                    trades={filteredTrades}
                    onDelete={handleDelete}
                    onNavigate={navigate}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

const TradeTable = ({ trades, onDelete, onNavigate, isExpanded }) => (
  <table className={`sci-fi-table ${isExpanded ? 'expanded-mode' : ''}`}>
    <thead style={{ position: isExpanded ? 'sticky' : 'static', top: 0, zIndex: 10 }}>
      <tr>
        <th>Date / Time</th>
        <th>Asset Pair</th>
        <th>Type</th>
        <th>Strategy</th>
        <th style={{ textAlign: 'right' }}>P&L Performance</th>
        <th style={{ textAlign: 'center' }}>Action</th>
      </tr>
    </thead>
    <tbody>
      <AnimatePresence mode="popLayout">
        {trades.map((trade, idx) => (
          <motion.tr 
            key={trade.id} 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: idx * 0.02 }}
            onClick={() => onNavigate(`/trade/${trade.id}`)}
            style={{ 
              cursor: 'pointer',
              borderLeft: idx === 0 && isExpanded ? '3px solid var(--primary)' : 'none'
            }}
            className="row-glow"
          >
            <td style={{ color: 'var(--text-muted)', fontSize: isExpanded ? '0.9rem' : '0.8rem', padding: isExpanded ? '1.5rem 1rem' : '1rem' }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>{trade.date}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{trade.time}</div>
            </td>
            <td>
              <div style={{ fontSize: isExpanded ? '1.1rem' : '1rem', fontWeight: 700, color: 'var(--primary)' }}>{trade.pair}</div>
            </td>
            <td>
              <span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>
                {trade.type?.toUpperCase()}
              </span>
            </td>
            <td style={{ fontSize: '0.85rem' }}>{trade.strategy || 'NO_STRATEGY'}</td>
            <td style={{ textAlign: 'right' }}>
              <div className={`${Number(trade.pnl) >= 0 ? 'glow-text-success' : 'glow-text-danger'}`} style={{ fontSize: isExpanded ? '1.2rem' : '1rem', fontWeight: 700 }}>
                {Number(trade.pnl) >= 0 ? '▲' : '▼'} {Number(trade.pnl) >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl)).toFixed(2)}
              </div>
            </td>
            <td style={{ textAlign: 'center' }}>
              <button 
                className="icon-btn text-muted hover-danger" 
                onClick={(e) => onDelete(trade.id, e)}
                style={{ padding: '0.5rem' }}
              >
                <Trash2 size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </AnimatePresence>
    </tbody>
  </table>
);
