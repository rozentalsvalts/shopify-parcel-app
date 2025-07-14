import { json } from "@remix-run/node";

export async function action({ request }) {
  try {
    const body = await request.json();
    const { street, postalCode, city } = body;

    const params = new URLSearchParams({
      countryCode: "LV",
      street,
      postalCode: postalCode,
      city,
      radius: "50000",
      limit: "10"
    });

    const url = `${process.env.DPD_API_BASE_URL}?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.DPD_API_KEY}` // <-- Add 'Bearer ' prefix
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('DPD API error:', errorText);
      return json({ error: "DPD API error", details: errorText }, { status: 500 });
    }

const text = await res.text();
console.log('DPD response:', text);
try {
  const lockers = JSON.parse(text);
  return json({ lockers });
} catch (e) {
  console.error('Failed to parse DPD JSON:', e);
  return json({ error: 'Invalid DPD response', details: text }, { status: 500 });
}

  } catch (err) {
  console.error("DPD fetch error:", err, err.stack);
  return json({ error: "Something went wrong", details: String(err) }, { status: 500 });
}
}