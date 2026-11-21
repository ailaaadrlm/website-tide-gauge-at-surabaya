export default async function handler(req, res) {
  const { tinggi, sumber } = req.query;

  if (!tinggi || isNaN(parseFloat(tinggi))) {
    return res.status(400).send("Error: Masukkan parameter ?tinggi=1.85");
  }

  const tinggiAir = parseFloat(tinggi);
  const sumberData = sumber || "kalimas_syahbandar";

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/rest/v1/data_pasut`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      tinggi_air: tinggiAir,
      sumber: sumberData
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    return res.status(500).send(`Gagal simpan (${response.status}): ${errText}`);
  }

  return res.status(200).send(`OK: Tinggi air ${tinggiAir} m berhasil masuk ke dashboard!`);
}
