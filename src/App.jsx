import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Waves, Activity, ArrowUpCircle, ArrowDownCircle, Radio, Clock, Database } from 'lucide-react';
import BannerPeringatan from './BannerPeringatan';
import GrafikPasut from './GrafikPasut';
import TabelHistori from './TabelHistori';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function formatUTC(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default function App() {
  const [nowUtc, setNowUtc] = useState(() => Date.now());
  const [obsData, setObsData] = useState([]);
  const [dbStatus, setDbStatus] = useState('Menghubungkan Supabase...');
  const [batasSiaga, setBatasSiaga] = useState(2.5);
  const [batasBahaya, setBatasBahaya] = useState(3.2);

  useEffect(() => {
    const timer = setInterval(() => setNowUtc(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDbStatus('Kunci .env belum terbaca');
      return;
    }

    async function fetchInitialData() {
      const { data, error } = await supabase
        .from('data_pasut')
        .select('*')
        .order('waktu_utc', { ascending: true })
        .limit(1000);

      if (error) {
        setDbStatus(`Error DB: ${error.message}`);
      } else {
        setDbStatus('Supabase Realtime Aktif');
        setObsData(data.map((row) => ({
          timestamp: new Date(row.waktu_utc).getTime(),
          waktu_utc: row.waktu_utc,
          observasi: Number(row.tinggi_air),
          sumber: row.sumber || 'kalimas_sim800l'
        })));
      }
    }

    fetchInitialData();

    const channel = supabase
      .channel('pasut-kalimas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'data_pasut' }, (payload) => {
        const newRow = payload.new;
        setObsData((prev) => [
          ...prev.slice(-999),
          {
            timestamp: new Date(newRow.waktu_utc).getTime(),
            waktu_utc: newRow.waktu_utc,
            observasi: Number(newRow.tinggi_air),
            sumber: newRow.sumber || 'kalimas_sim800l'
          }
        ]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const obsOnlyData = useMemo(() => {
    const stepMs = 10 * 60 * 1000;
    const uniqueMap = new Map();
    for (const d of obsData) {
      const slot = Math.round(d.timestamp / stepMs) * stepMs;
      uniqueMap.set(slot, d.observasi);
    }
    return Array.from(uniqueMap.entries())
      .sort((a, b) => a.at(0) - b.at(0))
      .map(([ts, val]) => ({
        labelWaktu: formatUTC(ts),
        observasi: val
      }));
  }, [obsData]);

  const latestObs = obsData.length > 0 ? obsData[obsData.length - 1] : null;
  const prevObs = obsData.length > 1 ? obsData[obsData.length - 2] : null;
  const trend = latestObs && prevObs
    ? latestObs.observasi > prevObs.observasi ? 'Pasang (Naik) ▲' : 'Surut (Turun) ▼'
    : 'Menunggu Data';

  const maxObs = obsData.length > 0 ? Math.max(...obsData.map((d) => d.observasi)) : null;
  const minObs = obsData.length > 0 ? Math.min(...obsData.map((d) => d.observasi)) : null;

  return (
    <div>
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="header-title">
            <h1><Waves size={26} /> Stasiun Pasang Surut Surabaya — Muara Sungai Kalimas</h1>
            <p>Syahbandar Tanjung Perak • Sistem Pemantauan Tinggi Muka Air Real-Time (UTC)</p>
          </div>
          <div className="badge-group">
            <span className="badge"><Database size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{dbStatus}</span>
            <span className="badge"><Clock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{new Date(nowUtc).toUTCString().replace('GMT', 'UTC')}</span>
          </div>
        </div>
      </header>

      <main className="container">
        <BannerPeringatan
          tinggiAir={latestObs ? latestObs.observasi : null}
          batasSiaga={batasSiaga}
          batasBahaya={batasBahaya}
          setBatasSiaga={setBatasSiaga}
          setBatasBahaya={setBatasBahaya}
        />

        <div className="grid-cards">
          <div className="card">
            <div className="card-label"><Activity size={15} color="#0284c7" /> Tinggi Muka Air Terkini</div>
            <div className="card-value">{latestObs ? `${latestObs.observasi.toFixed(3)} m` : '--'}</div>
            <div className="card-sub">{latestObs ? `Update: ${formatUTC(latestObs.timestamp)} UTC` : 'Menunggu kiriman alat'}</div>
          </div>
          <div className="card">
            <div className="card-label"><Radio size={15} color="#059669" /> Status Pergerakan Air</div>
            <div className="card-value" style={{ fontSize: '1.4rem', marginTop: 4 }}>{trend}</div>
            <div className="card-sub">Interval Sensor JSN-SR04T: 10 Menit</div>
          </div>
          <div className="card">
            <div className="card-label"><ArrowUpCircle size={15} color="#d97706" /> Pasang Tertinggi (Terekam)</div>
            <div className="card-value">{maxObs !== null ? `${maxObs.toFixed(3)} m` : '--'}</div>
            <div className="card-sub">Nilai maksimum observasi</div>
          </div>
          <div className="card">
            <div className="card-label"><ArrowDownCircle size={15} color="#7c3aed" /> Surut Terendah (Terekam)</div>
            <div className="card-value">{minObs !== null ? `${minObs.toFixed(3)} m` : '--'}</div>
            <div className="card-sub">Nilai minimum observasi</div>
          </div>
        </div>

        <GrafikPasut obsOnlyData={obsOnlyData} batasSiaga={batasSiaga} batasBahaya={batasBahaya} />
        <TabelHistori data={obsData} />
      </main>
    </div>
  );
}
