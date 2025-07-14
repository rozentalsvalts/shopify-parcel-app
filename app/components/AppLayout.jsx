import { AppProvider } from "@shopify/polaris";
import * as polaris from "@shopify/polaris";
const { Stack, Card, Tabs, Page, FormLayout, TextField, Button, Checkbox, Text, Divider } = polaris;
import { useLocation, useNavigate } from "@remix-run/react";
import enTranslations from "@shopify/polaris/locales/en.json";

// Define your tabs without query params
const rawTabs = [
  { id: "dashboard", content: "Dashboard", to: "/app" },
  { id: "settings", content: "Settings", to: "/app/settings" },
];

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Get ALL query params (not just host)
  const searchParams = new URLSearchParams(location.search);
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  // Create a query string to forward all important params
  const queryString = [];
  if (host) queryString.push(`host=${encodeURIComponent(host)}`);
  if (shop) queryString.push(`shop=${encodeURIComponent(shop)}`);
  const query = queryString.length ? `?${queryString.join("&")}` : "";

  // Add query string to each tab URL
  const tabs = rawTabs.map(tab => ({
    ...tab,
    to: `${tab.to}${query}`,
  }));

  // --- Improved matching: Normalize path (removes trailing slash), match by pathname only
  const normalize = str => str.replace(/\/+$/, "");
  const currentBase = normalize(location.pathname);

  const selected = tabs.findIndex(tab => {
    const tabBase = normalize(tab.to.split("?")[0]);
    return currentBase === tabBase;
  });

  return (
    <AppProvider i18n={enTranslations}>
        <Tabs
          tabs={tabs}
          selected={selected === -1 ? 0 : selected}
          onSelect={index => {
            // Always navigate (even if on same path, to update query)
            if (location.pathname + location.search !== tabs[index].to) {
              navigate(tabs[index].to);
            } else {
              // Force reload if needed (edge case)
              window.location.href = tabs[index].to;
            }
          }}
        />
        <div style={{ marginTop: 32 }}>{children}</div>
    </AppProvider>
  );
}   