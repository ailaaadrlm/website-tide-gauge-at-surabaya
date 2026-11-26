export default async function handler(req, res) {
  let tinggiMeter = null;
  let sumberData = "kalimas_sim800l";

  if (req.method === "POST" && req.body) {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (body.elevasi !== undefined && !isNaN(parseFloat(body.elevasi))) {
      // Konversi otomatis dari cm ke meter
      tinggiMeter = Number((parseFloat(body.elevasi) / 100.0).toFixed(4));
    } else if (body.tinggi !== undefined && !isNaN(parseFloat(body.tinggi))) {
      tinggiMeter = parseFloat(body.tinggi);
    }
    if (body.sumber) sumberData = body.sumber;
  } else {
    const { tinggi, sumber } = req.query;
    if (tinggi && !isNaN(parseFloat(tinggi))) {
      tinggiMeter = parseFloat(tinggi);
    }
    if (sumber) sumberData = sumber;
  }

  if (tinggiMeter === null) {
    return res.status(400).send("Error: Data elevasi/tinggi tidak valid");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/rest/v1/data_pasut`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({ tinggi_air: tinggiMeter, sumber: sumberData })
  });

  if (!response.ok) {
    const errText = await response.text();
    return res.status(500).send(`Gagal simpan (${response.status}): ${errText}`);
  }

  return res.status(200).send(`OK: Elevasi ${tinggiMeter} m berhasil masuk ke dashboard!`);
}
