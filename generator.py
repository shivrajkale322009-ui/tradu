import ccxt
import pandas as pd
import mplfinance as mpf
from datetime import datetime, timedelta
import os
import json
import pytz

# 👉 TERMINAL SETTINGS: IST System Profile
TIMEZONE_IST = pytz.timezone('Asia/Kolkata')
TIMEZONE_UTC = pytz.utc

def load_trades():
    with open('dataset.json', 'r') as f:
        return json.load(f)

def generate_chart(trade, index):
    symbol = trade['symbol']
    # 👉 DATA HUB: ccxt standard symbol mapping
    exchange_symbol = symbol.replace("/", "")
    
    # Input assumed to be IST (User Local Time)
    ist_open = TIMEZONE_IST.localize(datetime.strptime(trade['openTime'], "%Y-%m-%d %H:%M:%S"))
    ist_close = TIMEZONE_IST.localize(datetime.strptime(trade['closeTime'], "%Y-%m-%d %H:%M:%S"))
    
    # ⚠️ FIX: UTC conversion for market fetch
    utc_open = ist_open.astimezone(TIMEZONE_UTC)
    
    # Range: Increase candle depth to 300 to avoid "No data for filter"
    start_dt = utc_open - timedelta(hours=6) # ~24 candles of 15m
    
    print(f"HUD: Generating Chart #{index} | Symbol: {symbol} | Type: {trade['type']}")
    
    exchange = ccxt.binance()
    
    try:
        # 👉 STEP 2 & 3: FETCH & PREPARE
        # Increase limit to 300 as requested
        since = int(start_dt.timestamp() * 1000)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe='15m', since=since, limit=300)
        
        if not ohlcv:
            print(f"ERROR: Market data stream failed for {symbol}")
            return

        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        
        # ⚠️ FIX: Timezone Alignment (UTC -> IST)
        df.index = df.index.tz_localize('UTC').tz_convert('Asia/Kolkata')
        
        # 👉 STEP 4 & 5: VISUAL AUDIT & HIGHLIGHT
        colors = mpf.make_marketcolors(up='#00ff66', down='#ff3366', inherit=True)
        style = mpf.make_mpf_style(marketcolors=colors, gridstyle='dashed', facecolor='#0a0a0a', edgecolor='#333', 
                                  figcolor='#0a0a0a', fontcolor='#fff', gridcolor='#222')

        vlines = [ist_open, ist_close]
        
        # Filename logic: trade_<index>_<symbol>.png
        safe_symbol = exchange_symbol.replace("/", "")
        filename = f"trade_{index}_{safe_symbol}.png"
        save_path = os.path.join("charts", filename)
        
        # 👉 STEP 6: SAVE SCREENSHOT
        mpf.plot(df, type='candle', style=style, 
                 title=f"\nELITE_AUDIT: {symbol} ({trade['type']}) | P/L: ${trade['profit']} (IST)",
                 ylabel='Price (USDT)',
                 vlines=dict(vlines=vlines, colors='#00f3ff', linewidths=2, alpha=0.5),
                 savefig=dict(fname=save_path, dpi=150, bbox_inches='tight'),
                 show_nontrading=False,
                 tight_layout=True)
        
        print(f"SUCCESS: Tactical Visualization saved to {save_path}\n")

    except Exception as e:
        print(f"CRITICAL_FAILURE: {str(e)}")

def main():
    if not os.path.exists("charts"):
        os.makedirs("charts")
        
    print("TERMINAL: Performance Chart Screenshot Engine v5.3 Initialized.")
    print(" HUD: Timezone Profile = Asia/Kolkata (IST)\n")
    
    trades = load_trades()
    for i, trade in enumerate(trades, 1):
        generate_chart(trade, i)
        
    print("TERMINAL: All session visualizations completed successfully.\n")

if __name__ == "__main__":
    main()
