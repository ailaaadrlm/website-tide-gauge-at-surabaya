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
      callbacks: {
        title: (items) => (items.length > 0 ? `${items[0].label} UTC` : '')
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
        autoSkip: false,
        font: { size: 11 },
        callback: function(val) {
          const label = this.getLabelForValue(val);
          if (!label) return null;
          // Tampilkan label pada kelipatan 3 jam agar rapi seperti BIG dan tidak bertumpuk
          const jamBulat = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
          return jamBulat.some((j) => label.endsWith(j)) ? label : null;
        }
      },
      grid: { color: '#f1f5f9' }
    },
    y: {
      ticks: { callback: (v) => `${v} m`, font: { size: 11 } },
      grid: { color: '#e2e8f0' }
    }
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
        borderWidth: 2,
        pointRadius: 2.5,
        spanGaps: true,
        tension: 0
      },
      {
        label: 'Prediksi Harmonik (m)',
        data: chartData.map((d) => d.prediksi),
        borderColor: '#f97316',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
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
      borderWidth: 2,
      pointRadius: 3,
      tension: 0
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
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2
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
          <h2>1. Perbandingan Tinggi Muka Air: Observasi Real-Time vs Prediksi (UTC)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Resolusi Data: 10 Menit • Pinch / Scroll untuk Zoom</span>
            <button style={btnResetStyle} onClick={() => chart1Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <Line ref={chart1Ref} data={dataGabungan} options={baseZoomOptions} />
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-header">
          <h2>2. Grafik Observasi Real-Time — Sensor JSN-SR04T (UTC)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Rata-Rata per 10 Menit</span>
            <button style={btnResetStyle} onClick={() => chart2Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <Line ref={chart2Ref} data={dataObs} options={baseZoomOptions} />
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-header">
          <h2>3. Grafik Prakiraan / Prediksi Pasang Surut Harmonik (UTC)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Model Least Square Surabaya</span>
            <button style={btnResetStyle} onClick={() => chart3Ref.current?.resetZoom()}>Reset Zoom</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <Line ref={chart3Ref} data={dataPrediksi} options={baseZoomOptions} />
        </div>
      </div>
    </>
  );
}
