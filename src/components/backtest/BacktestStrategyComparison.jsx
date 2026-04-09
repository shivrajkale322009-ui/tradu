import { motion } from 'framer-motion';
import { Target, Wallet, BarChart3, Zap, AlertTriangle } from 'lucide-react';

export default function StrategyComparison({ backtests }) {
  if (!backtests || backtests.length < 2) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Select at least two backtests to compare performance metrics side-by-side.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflowX: 'auto' }}>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>METRIC</th>
            {backtests.map(bt => (
              <th key={bt.id} style={{ color: 'var(--primary)' }}>{bt.strategyName.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>WIN_RATE</td>
            {backtests.map(bt => (
              <td key={bt.id} style={{ color: bt.winRate >= 50 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {bt.winRate?.toFixed(1)}%
              </td>
            ))}
          </tr>
          <tr>
            <td>NET_PROFIT</td>
            {backtests.map(bt => (
              <td key={bt.id} style={{ color: bt.netPnl >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {bt.netPnl >= 0 ? '+' : ''}${bt.netPnl?.toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td>TOTAL_TRADES</td>
            {backtests.map(bt => (
              <td key={bt.id}>{bt.tradesCount}</td>
            ))}
          </tr>
          <tr>
            <td>MARKET</td>
            {backtests.map(bt => (
              <td key={bt.id}>{bt.market} / {bt.pair}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <style>{`
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
        }
        .comparison-table th {
          padding: 1.25rem;
          text-align: left;
          background: rgba(255,255,255,0.03);
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          border-right: 1px solid var(--border);
        }
        .comparison-table td {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
          border-right: 1px solid var(--border);
          font-size: 0.9rem;
        }
        .comparison-table td:first-child {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}