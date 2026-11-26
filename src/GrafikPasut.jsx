import React, { useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, zoomPlugin
);

const baseZoomOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
        tooltip: {
      titleFont: { size: 15, weight: 'bold' },
      bodyFont: { size: 14 },
      padding: 12,
      boxPadding: 6,
      callbacks: {
        title: (items) => {
          const first = items.at(0);
          return first ? `Waktu: ${first.label} UTC` : '';
        }
      }
    },
    zoom: {
      pan: { enabled: true, mode: 'x' },
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'x'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        autoSkipPadding: 28,
        maxTicksLimit: 10,
        font: { size: 11 }
      },
      grid: { color: '#f1f5f9' }
    },
    y: {
      ticks: { callback: (v) => `${v} m`, font: { size: 11 } },
      grid: { color: '#e2e8f0' }
    }
  }
};

export default function GrafikPasut({ obsOnlyData, batasSiaga, batasBahaya }) {
  const chartRef = useRef(null);
  const labels = obsOnlyData.map((d) => d.labelWaktu);
  const garisPutus = new Array(6, 4);

  const dataObs = {
    labels,
    datasets: [
            {
        label: 'Tinggi Muka Air Real-Time JSN-SR04T (m)',
        data: obsOnlyData.map((d) => d.observasi),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.15)',
        fill: true,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#0284c7',
        tension: 0
      },
      ...(batasSiaga ? [{
        label: `Batas Siaga (${batasSiaga} m)`,
        data: labels.map(() => batasSiaga),
        borderColor: '#f59e0b',
        borderDash: garisPutus,
        borderWidth: 1.5,
        pointRadius: 0
      }] : []),
      ...(batasBahaya ? [{
        label: `Batas Bahaya (${batasBahaya} m)`,
        data: labels.map(() => batasBahaya),
        borderColor: '#ef4444',
        borderDash: garisPutus,
        borderWidth: 1.5,
        pointRadius: 0
      }] : [])
    ]
  };

  return (
    <div className="chart-box">
      <div className="chart-header">
        <h2>Grafik Pemantauan Tinggi Muka Air Real-Time — Muara Sungai Kalimas (UTC)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Pinch / Scroll untuk Zoom • Geser untuk Pan</span>
          <button
            onClick={() => chartRef.current?.resetZoom()}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155',
              padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
            }}
          >
            Reset Zoom
          </button>
        </div>
      </div>
      <div style={{ width: '100%', height: 360 }}>
        <Line ref={chartRef} data={dataObs} options={baseZoomOptions} />
      </div>
    </div>
  );
}
