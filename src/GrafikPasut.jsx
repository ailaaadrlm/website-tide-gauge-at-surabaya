import React from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, AreaChart,
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';

export default function GrafikPasut({ chartData, obsOnlyData, z0 }) {
  return (
    <>
      <div className="chart-box">
        <div className="chart-header">
          <h2>1. Perbandingan Tinggi Muka Air: Observasi vs Prediksi (UTC)</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gabungan Data Sensor & Model Least Square</span>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="labelWaktu" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={35} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={['auto', 'auto']} unit=" m" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={z0} stroke="#d97706" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="prediksi" name="Prediksi Harmonik (m)" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="observasi" name="Observasi Real-Time (m)" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} connectNulls={true} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-two-charts">
        <div className="chart-box" style={{ marginBottom: 0 }}>
          <div className="chart-header">
            <h2>2. Grafik Observasi Real-Time (Sensor JSN-SR04T)</h2>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Live Data (UTC)</span>
          </div>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <LineChart data={obsOnlyData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="labelWaktu" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit=" m" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }} />
                <Line type="monotone" dataKey="observasi" name="Tinggi Air Aktual (m)" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box" style={{ marginBottom: 0 }}>
          <div className="chart-header">
            <h2>3. Grafik Prakiraan / Prediksi Pasang Surut</h2>
            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>Model Harmonik (UTC)</span>
          </div>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="labelWaktu" stroke="#64748b" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} unit=" m" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 8 }} />
                <ReferenceLine y={z0} stroke="#d97706" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="prediksi" name="Prediksi Ketinggian Air (m)" stroke="#0284c7" strokeWidth={2.5} fill="#0284c7" fillOpacity={0.18} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
