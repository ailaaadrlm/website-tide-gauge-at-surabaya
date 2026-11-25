import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Waves, Activity, Compass, Radio, Send, Clock, Database } from 'lucide-react';
import harmonikData from './harmonik_surabaya.json';
import BannerPeringatan from './BannerPeringatan';
import GrafikPasut from './GrafikPasut';
import TabelHistori from './TabelHistori';
import TabelKonstanta from './TabelKonstanta';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function hitungPrediksiHarmonik(targetTimeMs, model) {
  const t0Ms = new Date(model.t0_utc).getTime();
  const tHours = (targetTimeMs - t0Ms) / (1000 * 3600);
  let tinggi = model.Z0;
  for (const c of model.constituents) {
    const omegaRad = (c.omega_deg_per_hour * Math.PI) / 180;
    tinggi += c.A * Math.cos(omegaRad * tHours) + c.B * Math.sin(omegaRad * tHours);
  }
  return Number(tinggi.toFixed(3));
}

function formatUTC(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default function App() {
  const [nowUtc, setNowUtc] = useState(() => Date.now());
  const [obsData, setObsData] = useState([]);
  const [dbStatus, setDbStatus] = useState('Menghubungkan Supabase...');
  const [sending, setSending] = useState(false);
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
        .limit(1000); // ~7 hari data per 10 menit (7 x 144 = 1008)

      if (error) {
        setDbStatus(`Error DB: ${error.message}`);
      } else {
        setDbStatus('Supabase Realtime Aktif');
        setObsData(data.map((row) => {
          const ts = new Date(row.waktu_utc).getTime();
          return {
            timestamp: ts,
            waktu_utc: row.waktu_utc,
            observasi: Number(row.tinggi_air),
            prediksi: hitungPrediksiHarmonik(ts, harmonikData),
            sumber: row.sumber || 'sensor_kalimas'
          };
        }));
      }
    }

    fetchInitialData();

    const channel = supabase
      .channel('pasut-kalimas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'data_pasut' }, (payload) => {
        const newRow = payload.new;
        const ts = new Date(newRow.waktu_utc).getTime();
        setObsData((prev) => [
          ...prev.slice(-999),
          {
            timestamp: ts,
            waktu_utc: newRow.waktu_utc,
            observasi: Number(newRow.tinggi_air),
            prediksi: hitungPrediksiHarmonik(ts, harmonikData),
            sumber: newRow.sumber || 'sensor_kalimas'
          }
        ]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function kirimSimulasiKeSupabase() {
    if (!supabase || sending) return;
    setSending(true);
    try {
      const stepMs = 10 * 60 * 1000;
      const slot10m = Math.floor(Date.now() / stepMs) * stepMs;
      const lastTime = obsData.length > 0 ? obsData[obsData.length - 1].timestamp : slot10m - stepMs;
      const targetTime = lastTime >= slot10m ? lastTime + stepMs : slot10m;
      const pred = hitungPrediksiHarmonik(targetTime, harmonikData);
      const nilaiSensor = Number((pred + (Math.random() - 0.5) * 0.06).toFixed(3));

      await supabase.from('data_pasut').insert([{
        waktu_utc: new Date(targetTime).toISOString(),
        tinggi_air: nilaiSensor,
        sumber: 'simulasi_gsm_2g'
      }]);
    } finally {
      setSending(false);
    }
  }

  // Resolusi grafik 10 menit (12 jam ke belakang s/d 36 jam ke depan)
  const chartData = useMemo(() => {
    const stepMs = 10 * 60 * 1000;
    const anchor = obsData.length > 0 ? obsData[obsData.length - 1].timestamp : Math.floor(nowUtc / stepMs) * stepMs;
    const startMs = anchor - 12 * 3600 * 1000;
    const endMs = anchor + 36 * 3600 * 1000;

    const obsMap = new Map();
    for (const d of obsData) {
      obsMap.set(Math.round(d.timestamp / stepMs) * stepMs, d.observasi);
    }

    const points = [];
    for (let t = startMs; t <= endMs; t += stepMs) {
      points.push({
        labelWaktu: formatUTC(t),
        prediksi: hitungPrediksiHarmonik(t, harmonikData),
        observasi: obsMap.has(t) ? obsMap.get(t) : null
      });
    }
    return points;
  }, [obsData, nowUtc]);

  const obsOnlyData = useMemo(() => obsData.map((d) => ({
    labelWaktu: formatUTC(d.timestamp),
    observasi: d.observasi
  })), [obsData]);

  const latestObs = obsData.length > 0 ? obsData[obsData.length - 1] : null;
  const prevObs = obsData.length > 1 ? obsData[obsData.length - 2] : null;
  const trend = latestObs && prevObs
    ? latestObs.observasi > prevObs.observasi ? 'Pasang (Naik) ▲' : 'Surut (Turun) ▼'
    : 'Menunggu Data';

  const tipePasut =
    harmonikData.formzahl <= 0.25 ? 'Harian Ganda (Semidiurnal)' :
    harmonikData.formzahl <= 1.5 ? 'Campuran Condong Ganda' :
    harmonikData.formzahl <= 3.0 ? 'Campuran Condong Tunggal' : 'Harian Tunggal (Diurnal)';

  return (
    <div>
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="header-title">
            <h1><Waves size={26} /> Stasiun Pasang Surut Surabaya — Muara Sungai Kalimas</h1>
            <p>Syahbandar Tanjung Perak • Pemantauan Water Level Real-Time & Prediksi Harmonik (UTC)</p>
          </div>
          <div className="badge-group">
            <span className="badge"><Database size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{dbStatus}</span>
            <span className="badge"><Clock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{new Date(nowUtc).toUTCString().replace('GMT', 'UTC')}</span>
            <button className="btn-sim" onClick={kirimSimulasiKeSupabase} disabled={sending}>
              <Send size={15} />{sending ? 'Mengirim...' : 'Tes Kirim Data GSM (10m)'}
            </button>
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
            <div className="card-sub">{latestObs ? `Update: ${formatUTC(latestObs.timestamp)} UTC` : 'Klik "Tes Kirim Data GSM"'}</div>
          </div>
          <div className="card">
            <div className="card-label"><Radio size={15} color="#059669" /> Status Pergerakan Air</div>
            <div className="card-value" style={{ fontSize: '1.4rem', marginTop: 4 }}>{trend}</div>
            <div className="card-sub">Interval Sensor JSN-SR04T: 10 Menit</div>
          </div>
          <div className="card">
            <div className="card-label"><Waves size={15} color="#d97706" /> Duduk Tengah (Z₀ / MSL)</div>
            <div className="card-value">{harmonikData.Z0.toFixed(3)} m</div>
            <div className="card-sub">Referensi Model Harmonik Surabaya</div>
          </div>
          <div className="card">
            <div className="card-label"><Compass size={15} color="#7c3aed" /> Bilangan Formzahl (F)</div>
            <div className="card-value">{harmonikData.formzahl.toFixed(3)}</div>
            <div className="card-sub">{tipePasut}</div>
          </div>
        </div>

        <GrafikPasut chartData={chartData} obsOnlyData={obsOnlyData} z0={harmonikData.Z0} batasBahaya={batasBahaya} />
        <TabelHistori data={obsData} />
        <TabelKonstanta data={harmonikData.constituents} />
      </main>
    </div>
  );
}
