import React from 'react';

export default function TabelKonstanta({ data }) {
  return (
    <div className="table-box">
      <h2 style={{ fontSize: '1.1rem', color: '#e2e8f0' }}>
        Konstanta Harmonik Pasang Surut Surabaya (Least Square)
      </h2>
      <table>
        <thead>
          <tr>
            <th>Konstanta</th>
            <th>Kecepatan Sudut</th>
            <th>Koefisien A</th>
            <th>Koefisien B</th>
            <th>Amplitudo H</th>
            <th>Fase g</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>{item.name}</td>
              <td>{item.omega_deg_per_hour.toFixed(6)}</td>
              <td>{item.A.toFixed(4)}</td>
              <td>{item.B.toFixed(4)}</td>
              <td style={{ fontWeight: 'bold', color: '#34d399' }}>{item.H.toFixed(4)}</td>
              <td>{item.g.toFixed(2)} deg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
