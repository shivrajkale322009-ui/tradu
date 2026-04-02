import ccxt
import pandas as pd
import mplfinance as mpf
from datetime import datetime, timedelta
import os
import json

# 👉 DATASET: Sample trade sessions for backend demo
# In production, this can be loaded from a JSON file or Firestore dump
TRADES_DATASET = [
    {
        "id": 1,
        "symbol": "BTC/USDT",
        "type": "BUY",
        "openTime": "2024-04-02 10:00:00",
        "closeTime": "2024-04-02 14:00:00",
        "lots": 0.5,
        "profit": 450.50
    },
    {
        "id": 2,
        "symbol": "ETH/USDT",
        "type": "SELL",
        "openTime": "2024-04-01 15:30:00",
        "closeTime": "2024-04-01 18:45:00",
        "lots": 2.0,
        "profit": -120.25
    }
]

def generate_trade_chart(trade, index):
    symbol = trade['symbol']
    # 👉 STEP 1: SELECT TRADE & EXTRACT DATA
    # ccxt standard symbol mapping
    exchange_symbol = symbol.replace("/", "")
    
    open_dt = datetime.strptime(trade['openTime'], "%Y-%m-%d %H:%M:%S")
    close_dt = datetime.strptime(trade['closeTime'], "%Y-%m-%d %H:%M:%S")
    
    # Range: 50 candles before open, 50 candles after close
    start_dt = open_dt - timedelta(hours=4)
    end_dt = close_dt + timedelta(hours=4)
    
    print(f"HUD: Processing Trade #{index} [{symbol}]...")
    
    # 👉 STEP 2: FETCH MARKET DATA (Binance via CCXT)
    exchange = ccxt.binance()
    
    try:
        # Fetch OHLCV (15m timeframe)
        since = int(start_dt.timestamp() * 1000)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe='15m', since=since, limit=200)
        
        if not ohlcv:
            print(f"ERROR: No candle data found for {symbol}")
            return

        # 👉 STEP 3: PREPARE DATA (Pandas DataFrame)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        
        # 👉 STEP 4 & 5: GENERATE CANDLESTICK CHART & HIGHLIGHT TRADE
        # Visual Styling: Dark Matrix Theme
        colors = mpf.make_marketcolors(up='#00ff66', down='#ff3366', inherit=True)
        style = mpf.make_mpf_style(marketcolors=colors, gridstyle='dashed', facecolor='#0a0a0a', edgecolor='#333', 
                                  figcolor='#0a0a0a', fontcolor='#fff', gridcolor='#222')

        # Highlight lines and shade logic
        # Vertical lines for Open/Close
        vlines = [open_dt, close_dt]
        vcolors = ['#00f3ff' if trade['type'] == 'BUY' else '#ff3366']
        
        # Save filename: trade_<index>_<symbol>.png
        safe_symbol = exchange_symbol.replace("/", "_")
        filename = f"trade_{index}_{safe_symbol}.png"
        save_path = os.path.join("charts", filename)
        
        # 👉 STEP 6: SAVE SCREENSHOT
        print(f"HUD: Generating chart for {symbol} | Type: {trade['type']}")
        
        mpf.plot(df, type='candle', style=style, 
                 title=f"\nCORE_AUDIT: {symbol} ({trade['type']}) | PROFIT: ${trade['profit']}",
                 ylabel='Price (USDT)',
                 vlines=dict(vlines=vlines, colors='#00f3ff', linewidths=2, alpha=0.5),
                 savefig=dict(fname=save_path, dpi=150, bbox_inches='tight'),
                 show_nontrading=False,
                 tight_layout=True)
        
        print(f"SUCCESS: Chart saved to {save_path}\n")

    except Exception as e:
        print(f"CRITICAL_FAILURE: {str(e)}")

def main():
    # 👉 OPTIONAL: LOOP ALL TRADES
    if not os.path.exists("charts"):
        os.makedirs("charts")
        
    print("TERMINAL: Chart Generation Engine v5.2 Initialized.\n")
    for i, trade in enumerate(TRADES_DATASET, 1):
        generate_trade_chart(trade, i)
    print("TERMINAL: All session visualizations completed.\n")

if __name__ == "__main__":
    main()
