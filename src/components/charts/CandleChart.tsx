/** Candlestick chart built on Lightweight Charts (v4 API). */
import { useEffect, useRef } from 'react';
import {
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '../../market/types';

interface Props {
  candles: Candle[];
  height?: number;
  dark?: boolean;
  showLine?: boolean;
  lineValue?: number;
}

export function CandleChart({ candles, height = 380, dark = false, showLine = false, lineValue }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: dark ? '#14181B' : '#FFFFFF' },
        textColor: dark ? '#9AA4AB' : '#5B6670',
        fontFamily: '"IBM Plex Sans", sans-serif',
      },
      grid: {
        vertLines: { color: dark ? '#232A2E' : '#F0F1F3' },
        horzLines: { color: dark ? '#232A2E' : '#F0F1F3' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#FF444F', width: 1, style: 3, labelBackgroundColor: '#FF444F' },
        horzLine: { color: '#FF444F', width: 1, style: 3, labelBackgroundColor: '#FF444F' },
      },
      rightPriceScale: { borderColor: dark ? '#2E363B' : '#E5E7EB' },
      timeScale: { borderColor: dark ? '#2E363B' : '#E5E7EB', timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22A45D',
      downColor: '#FF444F',
      borderUpColor: '#22A45D',
      borderDownColor: '#FF444F',
      wickUpColor: '#22A45D',
      wickDownColor: '#FF444F',
    });
    candleSeriesRef.current = candleSeries;

    const lineSeries = chart.addLineSeries({
      color: '#4BB4B3',
      lineWidth: 2,
      crosshairMarkerVisible: true,
    });
    lineSeriesRef.current = lineSeries;

    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [height, dark]);

  // feed data
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !candles.length) return;
    series.setData(
      candles.map((c) => ({
        time: Math.floor(c.t / 1000) as UTCTimestamp,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      })),
    );
    if (lineSeriesRef.current && showLine && lineValue !== undefined) {
      lineSeriesRef.current.setData(
        candles.map((c) => ({ time: Math.floor(c.t / 1000) as UTCTimestamp, value: lineValue })),
      );
    }
  }, [candles, showLine, lineValue]);

  // live update of the last candle
  useEffect(() => {
    const series = candleSeriesRef.current;
    const last = candles[candles.length - 1];
    if (!series || !last) return;
    series.update({
      time: Math.floor(last.t / 1000) as UTCTimestamp,
      open: last.o,
      high: last.h,
      low: last.l,
      close: last.c,
    });
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

/** Simple sparkline for list rows (pure SVG). */
export function Sparkline({ values, width = 80, height = 28, color = '#22A45D' }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
