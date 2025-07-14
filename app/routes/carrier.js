// app/routes/carrier.js

import { json } from '@remix-run/node';
import { fetchDPDLockers } from "../helpers/fetchDPDLockers";

export async function action({ request }) {
  console.log("🔥 /carrier action reached");

  let rawText = "";
  let body = undefined;

  try {
    rawText = await request.text();
    console.log("📨 Raw POST body:", rawText);

    if (rawText.trim().length > 0) {
      try {
        body = JSON.parse(rawText);
        console.log("🎯 Parsed Shopify Carrier Request Body:", JSON.stringify(body, null, 2));
      } catch (parseError) {
        console.error("❌ Could not parse JSON body:", parseError);
        return json({ error: "Invalid JSON sent to carrier" }, { status: 400 });
      }
    } else {
      console.warn("⚠️ Empty request body!");
      return json({ error: "No request body sent to carrier" }, { status: 400 });
    }

    const destination = body.rate?.destination || {};
    const address1 = destination.address1 || '';
    const city = destination.city || '';
    const postalCode = destination.zip || destination.postal_code || "";
    const fullAddress = `${address1}, ${city}`.trim();

    const totalCents = body.rate?.total_price || 0;
    const totalEuros = totalCents / 100;
    const items = Array.isArray(body.rate?.items) ? body.rate.items : [];
    const totalWeightGrams = items.reduce((sum, item) => sum + (item.grams || 0), 0);
    const totalWeightKg = totalWeightGrams / 1000;

    console.log("📍 Address:", fullAddress || 'No address');
    console.log("💰 Cart total (EUR):", totalEuros.toFixed(2));
    console.log("⚖️ Total weight (kg):", totalWeightKg.toFixed(2));

    if (totalWeightKg > 15) {
      return json({ rates: [] });
    }

    let lockers = [];
    try {
      lockers = await fetchDPDLockers({ street: address1, postalCode, city });
    } catch (err) {
      console.error("Failed to fetch lockers:", err);
      return json({ rates: [] });
    }

    // --- SORT BY CLOSEST DISTANCE ---
    lockers = Array.isArray(lockers)
      ? lockers.slice().sort((a, b) => {
          // fallback to a high number if distance missing
          const distA = Number(a.distance || a.address?.distance || Infinity);
          const distB = Number(b.distance || b.address?.distance || Infinity);
          return distA - distB;
        })
      : lockers;

    const shippingCost = totalEuros > 100 ? 0 : 299;
    const rates = Array.isArray(lockers)
      ? lockers.slice(0, 5).map((locker, i) => {
          let distanceStr = "";
          const rawDistance = locker.distance || locker.address?.distance;
          if (rawDistance && !isNaN(Number(rawDistance))) {
            distanceStr = ` • ${(Number(rawDistance) / 1000).toFixed(1)} km`;
          }
          return {
            service_name: `📦 DPD Pickup: ${locker.name || locker.company || "Locker"}`,
            service_code: `dpd_${locker.id || i}`,
            total_price: shippingCost,
            currency: "EUR",
            description:
              `${locker.address?.street || locker.street || ""}, ` +
              `${locker.address?.city || locker.city || ""} ` +
              `${locker.address?.postalCode || locker.postcode || ""}` +
              distanceStr,
          };
        })
      : [
          {
            service_name: "📦 DPD Pickup Point (Fallback)",
            service_code: "dpd_fixed_test",
            total_price: shippingCost,
            currency: "EUR",
            description: "No lockers found",
          }
        ];

    return json({ rates });
  } catch (err) {
    console.error("❌ Top-level carrier error:", err);
    return json({ error: "Failed to handle carrier request" }, { status: 500 });
  }
}