// app/routes/app.jsx
import { Outlet } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import AppLayout from "../components/AppLayout";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // 👇 Authenticate and get session (change here)
  const { session } = await authenticate.admin(request);
  console.log("Granted scopes:", session.scope); // <--- Add this log

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  // If missing Shopify context, force Shopify to re-embed the app
  if (!shop || !host) {
    // NOTE: Replace the fallback shop with your own dev shop if needed!
    return redirect(
      `/auth/login?shop=${shop || "YOUR-DEV-SHOP.myshopify.com"}`
    );
  }

  // Optionally, return apiKey/host to Outlet as context if you need it
  return null;
};

export default function AppRoot() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}