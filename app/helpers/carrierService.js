// app/helpers/carrierService.js

export async function registerCarrierService({ session, callbackUrl }) {
  const urlToUse = callbackUrl || process.env.CARRIER_CALLBACK_URL;
  if (!urlToUse) {
    throw new Error("Carrier registration failed: callbackUrl is required (either as argument or in .env)");
  }
  const url = `https://${session.shop}/admin/api/2024-01/carrier_services.json`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": session.accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      carrier_service: {
        name: "ParcelsBaltic Parcel Pickup",
        callback_url: urlToUse,
        service_discovery: true
      }
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error("Failed to register carrier: " + error);
  }
  return response.json();
}

export async function listCarrierServices({ session }) {
  const url = `https://${session.shop}/admin/api/2024-01/carrier_services.json`;
  const response = await fetch(url, {
    headers: { "X-Shopify-Access-Token": session.accessToken }
  });
  return response.json();
}

export async function deleteCarrierService({ session, carrierServiceId }) {
  const url = `https://${session.shop}/admin/api/2024-01/carrier_services/${carrierServiceId}.json`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "X-Shopify-Access-Token": session.accessToken }
  });
  return response.ok;
}