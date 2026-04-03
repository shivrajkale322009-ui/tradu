import ccxt
import pandas as pd
import mplfinance as mpf
from datetime import datetime, timedelta
import os
import json

# 👉 SYSTEM_CONFIG: Terminal Settings
CHARTS_DIR = os.path.join(os.path.dirname(__file__), "..", "charts")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "dataset.json")

def load_trades_from_json():
    """Loads dataset from the root project directory."""
    if not os.path.exists(DATASET_PATH):
        print(f"CRITICAL: Dataset not found at {DATASET_PATH}")
        return []
    with open(DATASET_PATH, 'r') as f:
        return json.load(f)

def normalize_symbol(symbol):
    """Translates MetaTrader symbols (BTCUSDm) to CCXT/Binance format (BTC/USDT)."""
    s = symbol.upper().replace("USD", "/USDT")
    
    # Remove common MetaTrader suffixes
    for suffix in ["M", "+", ".", "PRO", "FX"]:
        if s.endswith(suffix):
            s = s[:-len(suffix)]
            
    # Hard mappings for specialized assets
    mapping = {
        "USOIL/USDT": "BRENTUSDT", # Binance Futures symbol
        "XAU/USDT": "BTC/USDT",    # Fallback for gold
        "BTC/USDT": "BTC/USDT",
        "ETH/USDT": "ETH/USDT"
    }
    
    # Ensure it ends with /USDT if not present
    if not "/" in s:
        s = f"{s}/USDT"
        
    return mapping.get(s, s)

def generate_trade_chart(trade, index):
    raw_symbol = trade['symbol']
    symbol = normalize_symbol(raw_symbol)
    
    # 👉 STEP 1: SELECT TRADE & EXTRACT DATA
    exchange_symbol = symbol.replace("/", "")
    
    try:
        # Support both ' ' and 'T' separators in timestamps
        ots = trade['openTime'].replace('T', ' ').split('.')[0]
        cts = trade['closeTime'].replace('T', ' ').split('.')[0]
        open_dt = datetime.strptime(ots, "%Y-%m-%d %H:%M:%S")
        close_dt = datetime.strptime(cts, "%Y-%m-%d %H:%M:%S")
    except Exception as e:
        print(f"HUD_WARNING: Date parsing failed for {raw_symbol}. Attempting ISO fallback...")
        open_dt = datetime.fromisoformat(trade['openTime'].replace('Z', '+00:00'))
        close_dt = datetime.fromisoformat(trade['closeTime'].replace('Z', '+00:00'))
    
    # Range: 100 candles before open, 100 candles after close for context
    start_dt = open_dt - timedelta(hours=10)
    end_dt = close_dt + timedelta(hours=10)
    
    print(f"HUD: Synchronizing Data for Session #{index} [{symbol}]...")
    
    # 👉 STEP 2: FETCH MARKET DATA (Binance via CCXT)
    exchange = ccxt.binance({
        'enableRateLimit': True,
    })
    
    try:
        # Fetch OHLCV (15m timeframe for detail)
        since = int(start_dt.timestamp() * 1000)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe='15m', since=since, limit=300)
        
        if not ohlcv:
            print(f"ERROR: No candle data found for {symbol}")
            return

        # 👉 STEP 3: PREPARE DATA (Pandas DataFrame)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        
        # 👉 CALCULATE INDICATORS (EMA 9, 15, & 50)
        df['ema9'] = df['close'].ewm(span=9, adjust=False).mean()
        df['ema15'] = df['close'].ewm(span=15, adjust=False).mean()
        df['ema50'] = df['close'].ewm(span=50, adjust=False).mean()

        # 👉 STEP 4 & 5: GENERATE CANDLESTICK CHART & HIGHLIGHT TRADE
        # Visual Styling: Deep Dark Cyber-Theme
        colors = mpf.make_marketcolors(up='#00f3ff', down='#ff3366', edge='inherit', wick='inherit', volume='in')
        style = mpf.make_mpf_style(marketcolors=colors, gridstyle='solid', facecolor='#050a19', edgecolor='#1a2035', 
                                  figcolor='#050a19', gridcolor='#0f172a', rc={'font.family': 'monospace', 'text.color': '#8892b0'})

        # Add Moving Average plots
        adps = [
            mpf.make_addplot(df['ema9'], color='#00f3ff', width=0.7, alpha=0.8),
            mpf.make_addplot(df['ema15'], color='#ec4899', width=0.7, alpha=0.6), # Hot Pink
            mpf.make_addplot(df['ema50'], color='#f59e0b', width=1.0, alpha=0.4)  # Amber
        ]

        # Highlight lines and shade logic
        # Vertical lines for Open/Close
        vlines = [open_dt, close_dt]
        
        # Save filename: session_<id>_<symbol>.png
        safe_symbol = exchange_symbol.replace("/", "_")
        filename = f"session_{trade.get('id', index)}_{safe_symbol}.png"
        save_path = os.path.join(CHARTS_DIR, filename)
        
        # 👉 STEP 6: SAVE VISUAL EVIDENCE
        print(f"HUD: Finalizing Visualization for {symbol} | Result: ${trade['profit']}")
        
        mpf.plot(df, type='candle', style=style, addplot=adps,
                 title=f"\nSESSION_AUDIT: #{trade.get('id', index)} | {symbol} ({trade['type']})",
                 ylabel='Price_USDT',
                 vlines=dict(vlines=vlines, colors='#94a3b8', linewidths=1.5, alpha=0.3, linestyle='--'),
                 savefig=dict(fname=save_path, dpi=180, bbox_inches='tight'),
                 show_nontrading=False,
                 tight_layout=True)
        
        print(f"SUCCESS: Visual Evidence Stored at {save_path}\n")

    except Exception as e:
        print(f"CRITICAL_FAILURE in Session Visualization: {str(e)}")

def main():
    if not os.path.exists(CHARTS_DIR):
        os.makedirs(CHARTS_DIR)
        
    print("TERMINAL: Visual Data Generator v6.0 [TRADU ENGINE] Initialized.\n")
    
    trades = load_trades_from_json()
    if not trades:
        print("TERMINAL: Empty dataset detected. Aborting feed.")
        return

    for i, trade in enumerate(trades, 1):
        generate_trade_chart(trade, i)
        
    print(f"TERMINAL: {len(trades)} session visualizations integrated into archive.\n")

if __name__ == "__main__":
    main()

