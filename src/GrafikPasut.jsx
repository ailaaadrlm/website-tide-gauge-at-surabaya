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
    x: { ticks: { maxTicksLimit: 10, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
    y: { ticks: { callback: (v) => `${v} m`, font: { size: 11 } }, grid: { color: '#e2e8f0' } }
  }
};

export default function GrafikPasut({ chartData, obsOnlyData, z0, batasBahaya }) {
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);

  const labelsAll = chartData.map((d) => d.labelWaktu);
  const garisPutus = new Array(6, 4);

  const dataGabungan = {
    labels: labelsAll,
    datasets: [
      {
        label: 'Observasi Real-Time (m)',
        data: chartData.map((d) => d.observasi),
        borderColor: '#059669',
        backgroundColor: '#059669',
        borderWidth: 2.5,
        pointRadius: 3.5,
        spanGaps: true,
        tension: 0.25
      },
      {
        label: 'Prediksi Harmonik (m)',
        data: chartData.map((d) => d.prediksi),
        borderColor: '#f97316',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35
      },
      {
        label: `MSL / Z0 (${z0.toFixed(2)} m)`,
        data: labelsAll.map(() => z0),
        borderColor: '#d97706',
        borderDash: garisPutus,
        borderWidth: 1.5,
        pointRadius: 0
      },
      ...(batasBahaya ? [{
        label: `Batas Bahaya (${batasBahaya} m)`,
        data: labelsAll.map(() => batasBahaya),
        borderColor: '#ef4444',
        borderDash: garisPutus,
        borderWidth: 1.5,
        pointRadius: 0
      }] : [])
    ]
  };

  const dataObs = {
    labels: obsOnlyData.map((d) => d.labelWaktu),
    datasets: [{
      label: 'Tinggi Air Aktual JSN-SR04T (m)',
      data: obsOnlyData.map((d) => d.observasi),
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
      fill: true,
      borderWidth: 2.5,
      pointRadius: 4,
      tension: 0.25
    }]
  };

  const dataPrediksi = {
    labels: labelsAll,
    datasets: [{
      label: 'Prediksi Pasang Surut (m)',
      data: chartData.map((d) => d.prediksi),
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.18)',
      fill: true,
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0.35
    }]
  };

  const btnResetStyle = {
    background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155',
    padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
  };

  return (
    <>
      <div className="chart-box">
        <div className="chart-header">
          <h2>1. Perbandingan Tinggi Muka Air: Observasi vs Prediksi (UTC)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Pinch / Scroll untuk Zoom • Geser untuk Pan</span>
            <button style={btnResetStyle} onClick={() => chart1Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 330 }}>
          <Line ref={chart1Ref} data={dataGabungan} options={baseZoomOptions} />
        </div>
      </div>

      <div className="grid-two-charts">
        <div className="chart-box" style={{ marginBottom: 0 }}>
          <div className="chart-header">
            <h2>2. Grafik Observasi Real-Time (Sensor JSN-SR04T)</h2>
            <button style={btnResetStyle} onClick={() => chart2Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
          <div style={{ width: '100%', height: 270 }}>
            <Line ref={chart2Ref} data={dataObs} options={baseZoomOptions} />
          </div>
        </div>

        <div className="chart-box" style={{ marginBottom: 0 }}>
          <div className="chart-header">
            <h2>3. Grafik Prakiraan / Prediksi Pasang Surut</h2>
            <button style={btnResetStyle} onClick={() => chart3Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
          <div style={{ width: '100%', height: 270 }}>
            <Line ref={chart3Ref} data={dataPrediksi} options={baseZoomOptions} />
          </div>
        </div>
      </div>
    </>
  );
}
