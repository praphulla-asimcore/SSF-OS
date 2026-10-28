'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false, loading: () => <div className="h-80 flex items-center justify-center text-white/30">Loading chart...</div> }) as any;

function fmtIDR(n: number) {
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)}M`;
  return `${sign}Rp ${abs.toFixed(0)}`;
}

export function CashIntelClient() {
  const [scenario, setScenario] = useState('base');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/intelligence/cfo/cash-forecast?scenario=${scenario}`)
      .then((r) => r.json()).then(setData).catch(() => {});
  }, [scenario]);

  const forecast = data?.forecast ?? [];
  const shortfalls = data?.shortfalls ?? [];

  const chartData: any = [{
    x: forecast.map((w: any) => w?.label ?? ''),
    y: forecast.map((w: any) => (w?.closing ?? 0) / 1e9),
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    name: 'Closing Cash',
    line: { color: '#009AFF', width: 3 },
    marker: { size: 6, color: forecast.map((w: any) => (w?.closing ?? 0) < 0 ? '#ef4444' : '#009AFF') },
    hovertemplate: '%{x}: Rp %{y:.1f}B<extra></extra>',
  }, {
    x: forecast.map((w: any) => w?.label ?? ''),
    y: forecast.map((w: any) => (w?.receipts ?? 0) / 1e9),
    type: 'bar' as const,
    name: 'Receipts',
    marker: { color: '#22c55e50' },
    hovertemplate: '%{x}: Rp %{y:.1f}B<extra></extra>',
  }, {
    x: forecast.map((w: any) => w?.label ?? ''),
    y: forecast.map((w: any) => -(w?.payments ?? 0) / 1e9),
    type: 'bar' as const,
    name: 'Payments',
    marker: { color: '#ef444450' },
    hovertemplate: '%{x}: -Rp %{y:.1f}B<extra></extra>',
  }];

  const layout: any = {
    title: false, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', barmode: 'relative',
    xaxis: { color: '#ffffff50', gridcolor: '#ffffff10' },
    yaxis: { title: { text: 'IDR (B)', font: { size: 11, color: '#ffffff50' } }, color: '#ffffff50', gridcolor: '#ffffff10', zeroline: true, zerolinecolor: '#ffffff20' },
    legend: { orientation: 'h' as const, yanchor: 'top' as const, yref: 'container' as const, y: 1, xanchor: 'center' as const, x: 0.5, font: { color: '#ffffff80', size: 11 } },
    margin: { t: 30, b: 40, l: 60, r: 20 },
    hovermode: 'closest' as const, hoverlabel: { bgcolor: '#1a1a2e', font: { size: 12, color: '#fff' } },
  };

  const config: any = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["autoScale2d", "autoscale", "editInChartStudio", "editinchartstudio", "hoverCompareCartesian", "hovercompare", "lasso", "lasso2d", "orbitRotation", "orbitrotation", "pan", "pan2d", "pan3d", "resetSankeyGroup", "resetViewMap", "resetViewMapbox", "resetViews", "resetcameradefault", "resetsankeygroup", "select", "select2d", "sendDataToCloud", "senddatatocloud", "tableRotation", "tablerotation", "toggleHover", "toggleSpikelines", "togglehover", "togglespikelines", "zoom", "zoom2d", "zoom3d", "zoomIn2d", "zoomInGeo", "zoomInMap", "zoomInMapbox", "zoomOut2d", "zoomOutGeo", "zoomOutMap", "zoomOutMapbox", "zoomin", "zoomout"] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#009AFF]" /> Cash Intelligence</h1>
          <p className="text-white/40 text-sm mt-1">13-week rolling cash forecast</p>
        </div>
        <div className="flex items-center gap-3">
          {['base', 'optimistic', 'conservative'].map((s) => (
            <button key={s} onClick={() => setScenario(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${scenario === s ? 'bg-[#009AFF]/20 text-[#009AFF] border border-[#009AFF]/30' : 'text-white/40 hover:text-white/60 border border-white/10'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="text-white/20 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {data?.dataAsOf ? new Date(data.dataAsOf).toLocaleString('en-US', { timeZone: 'UTC' }) : ''}</span>
        </div>
      </div>

      {shortfalls.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-2"><AlertTriangle className="w-5 h-5" /> <span className="font-semibold">Cash Shortfall Alert</span></div>
          <div className="text-sm text-red-300/80">
            {shortfalls.map((s: any) => <span key={s?.week} className="mr-4">{s?.week}: {fmtIDR(s?.closing ?? 0)}</span>)}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
        <div className="h-80">
          <Plot data={chartData} layout={layout} config={config} style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40">
              <th className="text-left py-3 px-3">Week</th>
              <th className="text-right py-3 px-3">Opening</th>
              <th className="text-right py-3 px-3">Receipts</th>
              <th className="text-right py-3 px-3">Payments</th>
              <th className="text-right py-3 px-3">Net Flow</th>
              <th className="text-right py-3 px-3">Closing</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((w: any) => (
              <tr key={w?.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 px-3 text-white font-medium">{w?.label} <span className="text-white/20 text-xs ml-1">{w?.date}</span></td>
                <td className="py-2 px-3 text-right text-white/60">{fmtIDR(w?.opening ?? 0)}</td>
                <td className="py-2 px-3 text-right text-green-400">{fmtIDR(w?.receipts ?? 0)}</td>
                <td className="py-2 px-3 text-right text-red-400">{fmtIDR(w?.payments ?? 0)}</td>
                <td className={`py-2 px-3 text-right ${(w?.netFlow ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtIDR(w?.netFlow ?? 0)}</td>
                <td className={`py-2 px-3 text-right font-medium ${(w?.closing ?? 0) >= 0 ? 'text-white' : 'text-red-400'}`}>{fmtIDR(w?.closing ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
