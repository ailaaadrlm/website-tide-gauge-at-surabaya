import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { Waves, Activity, Compass, Radio, Send, Clock, Database } from 'lucide-react';
import harmonikData from './harmonik_surabaya.json';
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
        .limit(100);

      if (error) {
        setDbStatus(`Error DB: ${error.message}`);
      } else {
        setDbStatus('Supabase Realtime Aktif');
        setObsData(data.map((row) => ({
          timestamp: new Date(row.waktu_utc).getTime(),
          observasi: Number(row.tinggi_air)
        })));
      }
    }

    fetchInitialData();

    const channel = supabase
      .channel('pasut-kalimas-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'data_pasut' }, (payload) => {
        const newRow = payload.new;
        setObsData((prev) => [
          ...prev.slice(-99),
          { timestamp: new Date(newRow.waktu_utc).getTime(), observasi: Number(newRow.tinggi_air) }
        ]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function kirimSimulasiKeSupabase() {
    if (!supabase || sending) return;
    setSending(true);
    try {
      const slot15m = Math.floor(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000);
      const lastTime = obsData.length > 0 ? obsData[obsData.length - 1].timestamp : slot15m - 15 * 60 * 1000;
      const targetTime = lastTime >= slot15m ? lastTime + 15 * 60 * 1000 : slot15m;
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

  const chartData = useMemo(() => {
    const anchor = obsData.length > 0 ? obsData[obsData.length - 1].timestamp : Math.floor(nowUtc / (15 * 60 * 1000)) * (15 * 60 * 1000);
    const startMs = anchor - 12 * 3600 * 1000;
    const endMs = anchor + 36 * 3600 * 1000;
    const stepMs = 15 * 60 * 1000;

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
    <div className="container">
      <div className="header">
        <div className="header-title">
          <h1><Waves size={28} /> Tide Gauge Surabaya — Muara Sungai Kalimas</h1>
          <p>Stasiun Syahbandar Tanjung Perak • Pemantauan Real-Time & Prediksi Harmonik Least Square</p>
        </div>
        <div className="badge-group">
          <span className="badge">
            <Database size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {dbStatus}
          </span>
          <span className="badge">
            <Clock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {new Date(nowUtc).toUTCString().replace('GMT', 'UTC')}
          </span>
          <button className="btn-sim" onClick={kirimSimulasiKeSupabase} disabled={sending}>
            <Send size={16} />
            {sending ? 'Mengirim...' : 'Tes Kirim Data GSM (15m)'}
          </button>
        </div>
      </div>

      <div className="grid-cards">
        <div className="card">
          <div className="card-label"><Activity size={16} color="#38bdf8" /> Tinggi Muka Air Terkini</div>
          <div className="card-value">{latestObs ? `${latestObs.observasi.toFixed(3)} m` : '--'}</div>
          <div className="card-sub">{latestObs ? `Update: ${formatUTC(latestObs.timestamp)} UTC` : 'Klik "Tes Kirim Data GSM"'}</div>
        </div>
        <div className="card">
          <div className="card-label"><Radio size={16} color="#34d399" /> Status Pergerakan Air</div>
          <div className="card-value" style={{ fontSize: '1.45rem', marginTop: 4 }}>{trend}</div>
          <div className="card-sub">Interval Sensor JSN-SR04T: 15 Menit</div>
        </div>
        <div className="card">
          <div className="card-label"><Waves size={16} color="#fbbf24" /> Duduk Tengah (Z₀ / MSL)</div>
          <div className="card-value">{harmonikData.Z0.toFixed(3)} m</div>
          <div className="card-sub">Referensi Model Harmonik IOC Surabaya</div>
        </div>
        <div className="card">
          <div className="card-label"><Compass size={16} color="#a78bfa" /> Bilangan Formzahl (F)</div>
          <div className="card-value">{harmonikData.formzahl.toFixed(3)}</div>
          <div className="card-sub">{tipePasut}</div>
        </div>
      </div>

      <div className="chart-box">
        <div className="chart-header">
          <h2>Grafik Tinggi Muka Air: Observasi Real-Time vs Prediksi Harmonik (UTC)</h2>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Resolusi: 15 Menit • Harmonic Least Square</span>
        </div>
        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="labelWaktu" stroke="#94a3b8" tick={{ fontSize: 11 }} minTickGap={35} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} unit=" m" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: 8 }} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={harmonikData.Z0} stroke="#fbbf24" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="prediksi" name="Prediksi Harmonik (Least Square)" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" fill="#38bdf8" fillOpacity={0.12} dot={false} />
              <Line type="monotone" dataKey="observasi" name="Observasi Sensor JSN-SR04T (m)" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} connectNulls={true} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TabelKonstanta data={harmonikData.constituents} />
    </div>
  );
}
