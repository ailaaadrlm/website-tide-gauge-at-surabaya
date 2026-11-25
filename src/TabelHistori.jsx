import React from 'react';
import { Download, Table } from 'lucide-react';

export default function TabelHistori({ data }) {
  const dataTerbaru = [...data].reverse();

  function unduhCSV() {
    if (data.length === 0) return;

    const header = 'Time (UTC),tinggi_air_m,prediksi_m,selisih_m,sumber\n';
    const rows = data
      .map((row) => {
        const selisih = (row.observasi - row.prediksi).toFixed(3);
        return `${row.waktu_utc},${row.observasi.toFixed(3)},${row.prediksi.toFixed(3)},${selisih},${row.sumber}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `histori_pasut_kalimas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="table-box" style={{ marginBottom: 20 }}>
      <div className="chart-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Table size={18} color="#0284c7" />
          Histori Data Observasi Sensor ({data.length} Rekaman)
        </h2>
        <button
          onClick={unduhCSV}
          disabled={data.length === 0}
          style={{
            background: data.length === 0 ? '#cbd5e1' : '#059669',
            color: '#ffffff',
            border: 'none',
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Download size={15} />
          Download CSV (Input Prediksi)
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu (UTC)</th>
              <th>Observasi Sensor (m)</th>
              <th>Prediksi Harmonik (m)</th>
              <th>Selisih / Residu (m)</th>
              <th>Sumber Data</th>
            </tr>
          </thead>
          <tbody>
            {dataTerbaru.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                  Belum ada data observasi tersimpan di database.
                </td>
              </tr>
            ) : (
              dataTerbaru.map((row, idx) => {
                const selisih = row.observasi - row.prediksi;
                return (
                  <tr key={row.timestamp + '-' + idx}>
                    <td>{dataTerbaru.length - idx}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.waktu_utc.replace('T', ' ').slice(0, 19)} UTC</td>
                    <td style={{ fontWeight: 'bold', color: '#059669' }}>{row.observasi.toFixed(3)} m</td>
                    <td style={{ color: '#0284c7' }}>{row.prediksi.toFixed(3)} m</td>
                    <td style={{ color: Math.abs(selisih) > 0.3 ? '#dc2626' : '#475569' }}>
                      {selisih >= 0 ? `+${selisih.toFixed(3)}` : selisih.toFixed(3)} m
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.sumber}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
