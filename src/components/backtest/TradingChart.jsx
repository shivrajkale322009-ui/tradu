import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const TradingChart = forwardRef(({ symbol, timeframe, isReplayMode, onCrosshairMove }, ref) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();

  useImperativeHandle(ref, () => ({
    updateData: (data) => {
      if (seriesRef.current) {
        seriesRef.current.setData(data);
      }
    },
    appendCandle: (candle) => {
      if (seriesRef.current) {
        seriesRef.current.update(candle);
      }
    },
    addMarker: (marker) => {
        if (seriesRef.current) {
            const currentMarkers = seriesRef.current.getMarkers() || [];
            seriesRef.current.setMarkers([...currentMarkers, marker]);
        }
    },
    clearMarkers: () => {
        if (seriesRef.current) seriesRef.current.setMarkers([]);
    }
  }));

  useEffect(() => {
    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.2)',
          timeVisible: true,
          secondsVisible: false,
      },
      crosshair: {
          mode: 1, // Normal crosshair
      }
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#00ff66',
      downColor: '#ff3366',
      borderVisible: false,
      wickUpColor: '#00ff66',
      wickDownColor: '#ff3366',
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current.remove();
    };
  }, []);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
});

export default TradingChart;
