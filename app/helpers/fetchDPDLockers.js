// app/helpers/fetchDPDLockers.js

export async function fetchDPDLockers({ street, postalCode, city }) {
  const params = new URLSearchParams({
    countryCode: "LV",
    street: street || "",
    postalCode: postalCode || "",
    city: city || "",
    radius: "50000",
    limit: "10"
  });

  const url = `${process.env.DPD_API_BASE_URL}?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.DPD_API_KEY}`
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('DPD API error:', errorText);
    throw new Error(`DPD API error: ${errorText}`);
  }

  const text = await res.text();
  try {
    const lockers = JSON.parse(text);
    return lockers; // Your DPD API likely returns an array, adjust as needed
  } catch (e) {
    console.error('Failed to parse DPD JSON:', e);
    throw new Error(`Invalid DPD response: ${text}`);
  }
}