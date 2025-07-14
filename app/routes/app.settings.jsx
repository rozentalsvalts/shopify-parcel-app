// app/routes/app.settings.jsx
import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import {
  BlockStack,
  Card,
  Page,
  FormLayout,
  TextField,
  Button,
  Checkbox,
  Text,
  Divider
} from "@shopify/polaris";

import {
  registerCarrierService,
  listCarrierServices,
  deleteCarrierService
} from "../helpers/carrierService";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// --- SERVER CODE ---
export async function loader({ request }) {
  await authenticate.admin(request);
  const settings = await prisma.settings.findFirst();
  console.log("Loaded settings from DB:", settings);
  return json({
    settings: settings || {
      maxDistance: 50000,
      apiKey: "",
      dpdEnabled: true,
      dpdDefaultPrice: 2.99,
      dpdFreeFrom: 100,
      dpdMaxWeight: 15,
      dpdRadius: 50000,
      dpdMaxPoints: 5,
    },
    apiKey: process.env.SHOPIFY_API_KEY || ""
  });
}

export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get("_action");

  // Only get session when needed
  let session = null;
  if (
    actionType === "register_carrier" ||
    actionType === "remove_parcelsbaltic_carriers"
  ) {
    const auth = await authenticate.admin(request);
    session = auth.session;
    if (!session) {
      return json({ error: "Missing session" }, { status: 401 });
    }
  }

  try {
    if (actionType === "register_carrier") {
      await registerCarrierService({ session });
      return json({ carrierRegistered: true });
    }
    if (actionType === "remove_parcelsbaltic_carriers") {
      const res = await listCarrierServices({ session });
      let removed = 0;
      if (res.carrier_services) {
        for (const carrier of res.carrier_services) {
          if (carrier.name === "ParcelsBaltic Parcel Pickup") {
            await deleteCarrierService({ session, carrierServiceId: carrier.id });
            removed++;
          }
        }
      }
      return json({ carriersRemoved: removed });
    }

    // Save DPD settings: (no session required)
    const dpdEnabled = formData.get("dpdEnabled") === "on";
    const apiKey = formData.get("apiKey") || "";
    const maxDistance = Number(formData.get("maxDistance")) || 50000;
    const dpdDefaultPrice = Number(formData.get("dpdDefaultPrice")) || 2.99;
    const dpdFreeFrom = Number(formData.get("dpdFreeFrom")) || 100;
    const dpdMaxWeight = Number(formData.get("dpdMaxWeight")) || 15;
    const dpdRadius = Number(formData.get("dpdRadius")) || 50000;
    const dpdMaxPoints = Number(formData.get("dpdMaxPoints")) || 5;

    await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        maxDistance,
        apiKey,
        dpdEnabled,
        dpdDefaultPrice,
        dpdFreeFrom,
        dpdMaxWeight,
        dpdRadius,
        dpdMaxPoints,
      },
      create: {
        id: 1,
        maxDistance,
        apiKey,
        dpdEnabled,
        dpdDefaultPrice,
        dpdFreeFrom,
        dpdMaxWeight,
        dpdRadius,
        dpdMaxPoints,
      },
    });

    return json({
      success: true,
      settings: {
        maxDistance,
        apiKey,
        dpdEnabled,
        dpdDefaultPrice,
        dpdFreeFrom,
        dpdMaxWeight,
        dpdRadius,
        dpdMaxPoints,
      },
    });
  } catch (e) {
    return json({ error: e.message || String(e) }, { status: 500 });
  }
}

// --- CLIENT CODE (COMPONENT) ---
export default function AppSettings() {
  const { settings } = useLoaderData();
  const actionData = useActionData();

  const [dpdEnabled, setDpdEnabled] = React.useState(settings.dpdEnabled ?? true);
  const [apiKey, setApiKey] = React.useState(settings.apiKey);
  const [dpdDefaultPrice, setDpdDefaultPrice] = React.useState(settings.dpdDefaultPrice ?? 2.99);
  const [dpdFreeFrom, setDpdFreeFrom] = React.useState(settings.dpdFreeFrom ?? 100);
  const [dpdMaxWeight, setDpdMaxWeight] = React.useState(settings.dpdMaxWeight ?? 15);
  const [dpdRadius, setDpdRadius] = React.useState(settings.dpdRadius ?? 50000);
  const [dpdMaxPoints, setDpdMaxPoints] = React.useState(settings.dpdMaxPoints ?? 5);

  const parcelProvidersSection = (
    <Card title="Enabled Parcel Providers" sectioned>
      <Form method="post">
        <FormLayout>
          <label>
  <input type="checkbox" name="dpdEnabled" checked={dpdEnabled} onChange={e => setDpdEnabled(e.target.checked)} />
  Enable DPD
</label>
          {dpdEnabled && (
            <BlockStack>
              <TextField
                label="DPD API Key"
                name="apiKey"
                value={apiKey}
                onChange={setApiKey}
                type="password"
                autoComplete="off"
              />
              <BlockStack spacing="loose">
                <TextField
                  label="Default Price (€)"
                  name="dpdDefaultPrice"
                  value={String(dpdDefaultPrice)}
                  onChange={setDpdDefaultPrice}
                  type="number"
                  min={0}
                  step={0.01}
                />
                <TextField
                  label="Free Shipping From (€)"
                  name="dpdFreeFrom"
                  value={String(dpdFreeFrom)}
                  onChange={setDpdFreeFrom}
                  type="number"
                  min={0}
                  step={0.01}
                />
              </BlockStack>
              <BlockStack spacing="loose">
                <TextField
                  label="Max Weight (kg)"
                  name="dpdMaxWeight"
                  value={String(dpdMaxWeight)}
                  onChange={setDpdMaxWeight}
                  type="number"
                  min={1}
                  max={50}
                />
                <TextField
                  label="Radius (meters)"
                  name="dpdRadius"
                  value={String(dpdRadius)}
                  onChange={setDpdRadius}
                  type="number"
                  min={1000}
                  max={100000}
                />
                <TextField
                  label="Max Parcel Points"
                  name="dpdMaxPoints"
                  value={String(dpdMaxPoints)}
                  onChange={setDpdMaxPoints}
                  type="number"
                  min={1}
                  max={20}
                />
              </BlockStack>
            </BlockStack>
          )}
          <Button submit primary>
            Save DPD Settings
          </Button>
          {actionData?.success && !actionData?.carrierRegistered && !actionData?.carriersRemoved && (
            <Text color="success">✅ Settings saved!</Text>
          )}
          {actionData?.error && <Text color="critical">{actionData.error}</Text>}
        </FormLayout>
      </Form>
      <Divider />
      <BlockStack spacing="tight">
        <Checkbox label="Omniva (Coming soon)" checked={false} disabled />
        <Checkbox label="Venipak (Coming soon)" checked={false} disabled />
        <Checkbox label="Latvijas Pasts (Coming soon)" checked={false} disabled />
      </BlockStack>
    </Card>
  );

  const generalSettingsSection = (
    <Card title="General Settings (coming soon)" sectioned>
      <Text color="subdued">General app options will appear here in the future.</Text>
    </Card>
  );

  const carrierManagementSection = (
    <Card title="Carrier Management" sectioned>
      <Form method="post">
        <input type="hidden" name="_action" value="register_carrier" />
        <Button submit>Register Carrier Service</Button>
        {actionData?.carrierRegistered && (
          <Text color="success">✅ Carrier service registered!</Text>
        )}
        {actionData?.error && !actionData?.success && (
          <Text color="critical">{actionData.error}</Text>
        )}
      </Form>
      <Form method="post" style={{ marginTop: 10 }}>
        <input type="hidden" name="_action" value="remove_parcelsbaltic_carriers" />
        <Button destructive submit>
          Remove All ParcelsBaltic Carriers
        </Button>
        {actionData?.carriersRemoved > 0 && (
          <Text color="success">
            ✅ Removed {actionData.carriersRemoved} carrier(s)!
          </Text>
        )}
        {actionData?.error && !actionData?.success && (
          <Text color="critical">{actionData.error}</Text>
        )}
      </Form>
    </Card>
  );

  return (
    <Page title="DPD Locker App Settings">
      {parcelProvidersSection}
      <div style={{ marginTop: 24 }} />
      {generalSettingsSection}
      <div style={{ marginTop: 24 }} />
      {carrierManagementSection}
    </Page>
  );
}