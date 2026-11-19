import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function BannerPeringatan({
  tinggiAir,
  batasSiaga,
  batasBahaya,
  setBatasSiaga,
  setBatasBahaya
}) {
  const isBahaya = tinggiAir !== null && tinggiAir >= batasBahaya;
  const isSiaga = tinggiAir !== null && tinggiAir >= batasSiaga && tinggiAir < batasBahaya;

  const bg = isBahaya ? '#fee2e2' : isSiaga ? '#fef3c7' : '#dcfce7';
  const border = isBahaya ? '#ef4444' : isSiaga ? '#f59e0b' : '#22c55e';
  const color = isBahaya ? '#991b1b' : isSiaga ? '#92400e' : '#166534';

  return (
    <div style={{
      backgroundColor: bg,
      border: `1.5px solid ${border}`,
      color: color,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 20,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isBahaya ? <ShieldAlert size={26} /> : isSiaga ? <AlertTriangle size={26} /> : <CheckCircle size={26} />}
        <div>
          <strong style={{ fontSize: '0.98rem', display: 'block' }}>
            {tinggiAir === null
              ? 'STATUS SIAGA: MENUNGGU DATA SENSOR'
              : isBahaya
              ? `PERINGATAN BAHAYA! Tinggi Air (${tinggiAir.toFixed(3)} m) Melampaui Batas Kritis (${batasBahaya} m)`
              : isSiaga
              ? `STATUS WASPADA / SIAGA: Tinggi Air (${tinggiAir.toFixed(3)} m) Mendekati Batas Bahaya`
              : `STATUS AMAN: Tinggi Muka Air Normal (${tinggiAir.toFixed(3)} m)`}
          </strong>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            Pemantauan Dini Potensi Banjir Rob & Luapan Sungai Kalimas (Tanjung Perak)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
        <label>
          Siaga (m):{' '}
          <input
            type="number"
            step="0.1"
            value={batasSiaga}
            onChange={(e) => setBatasSiaga(Number(e.target.value))}
            style={{ width: 65, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>
        <label>
          Bahaya (m):{' '}
          <input
            type="number"
            step="0.1"
            value={batasBahaya}
            onChange={(e) => setBatasBahaya(Number(e.target.value))}
            style={{ width: 65, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>
      </div>
    </div>
  );
}
