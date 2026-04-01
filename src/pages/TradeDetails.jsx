import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, deleteTrade } from '../utils/db';
import { ArrowLeft, Trash2, Calendar, TrendingUp, TrendingDown, Crosshair, Target, Brain, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrade();
  }, [id]);

  const loadTrade = async () => {
    const data = await getTradeById(id);
    if (!data) {
      navigate('/');
      return;
    }
    setTrade(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      await deleteTrade(id);
      navigate('/');
    }
  };

  if (loading) return <div className="page-container loading">Loading...</div>;

  return (
    <div className="page-container">
      <header className="header flex-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="icon-btn tooltip-container">
            <ArrowLeft size={20} />
            <span className="tooltip">Back</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Trade Details</h1>
        </div>
        {currentUser && trade.userId === currentUser.uid && (
          <button onClick={handleDelete} className="icon-btn text-danger">
            <Trash2 size={20} />
          </button>
        )}
      </header>
      
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="details-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 className="pair-title">{trade.pair}</h2>
            <div className="badges-row" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${(trade.type || 'long') === 'long' ? 'bg-success' : 'bg-danger'}`}>
                {(trade.type || 'long') === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {(trade.type || 'long').toUpperCase()}
              </span>
              <span className="badge bg-muted">
                <Calendar size={14} />
                {trade.date}
              </span>
              {trade.emotion && trade.emotion !== 'neutral' && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)' }}>
                  <Smile size={14} className="text-primary" />
                  {trade.emotion.toUpperCase()}
                </span>
              )}
            </div>
            {trade.strategy && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Brain size={14} />
                <span>Strategy: <strong style={{ color: 'var(--text-primary)' }}>{trade.strategy}</strong></span>
              </div>
            )}
          </div>
          <div className="pnl-massive">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>PnL</span>
            <div className={`pnl-value ${trade.pnl >= 0 ? 'profit' : 'loss'}`}>
              ${Number(trade.pnl).toFixed(2)}
            </div>
          </div>
        </div>



        {trade.notes && (
          <div className="notes-section" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Notes & Lessons</h3>
            <div className="notes-content" style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '1.25rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5
            }}>
              {trade.notes}
            </div>
          </div>
        )}

        {trade.image && (
          <div className="chart-section" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Chart Screenshot</h3>
            <img 
              src={trade.image} 
              alt="Trade Chart" 
              style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
