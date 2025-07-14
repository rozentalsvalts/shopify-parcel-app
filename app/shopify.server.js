import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./db.server";
console.log("🎯 shopify.server.js LOADED!");

// Replace with your current public tunnel URL
const CARRIER_CALLBACK_URL = "https://harley-hotel-cd-intend.trycloudflare.com/carrier";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    // Optional: Add webhooks if needed for shipping events
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),

  afterAuth: async ({ session, admin }) => {
  console.log("🔔 afterAuth called!");
  console.log(`🔔 Session shop: ${session.shop}`);
  console.log(`🔔 Session accessToken: ${session.accessToken ? 'REDACTED' : 'MISSING'}`);
  console.log(`🔔 Carrier Callback URL: ${CARRIER_CALLBACK_URL}`);

  try {
    // 1. Query all deliveryCarrierServices
    const queryResult = await admin.graphql(
      `#graphql
        {
          deliveryCarrierServices(first: 50) {
            edges {
              node {
                id
                name
                callbackUrl
                active
              }
            }
          }
        }
      `
    );
    const existing = queryResult?.body?.data?.deliveryCarrierServices?.edges?.find(
      edge => edge.node.name === "ParcelsBaltic Parcel Pickup"
    );
    if (existing) {
      console.log("⚠️ Carrier already registered:", existing.node);
      return; // Carrier exists; skip creation
    }

    // 2. If not found, create it
    const result = await admin.graphql(
      `#graphql
      mutation CreateDeliveryCarrierService($input: DeliveryCarrierServiceInput!) {
        deliveryCarrierServiceCreate(input: $input) {
          carrierService {
            id
            name
            active
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        input: {
          name: "ParcelsBaltic Parcel Pickup",
          callbackUrl: CARRIER_CALLBACK_URL,
          serviceDiscovery: true,
          format: "json",
        },
      }
    );

    // 3. Handle errors and log result
    const creationData = result?.body?.data?.deliveryCarrierServiceCreate;
    if (creationData?.userErrors?.length) {
      console.error("❌ User errors:", creationData.userErrors);
    } else if (creationData?.carrierService) {
      console.log("✅ CarrierService registered:", creationData.carrierService);
    } else {
      console.warn("⚠️ Unexpected response from carrier creation:", creationData);
    }
  } catch (err) {
    console.error("❌ Error in afterAuth carrier registration:", err);
    if (err.response) {
      try {
        const errorBody = await err.response.json();
        console.error("❌ Error details:", errorBody);
      } catch (e) {
        console.error("❌ Raw error:", await err.response.text());
      }
    }
  }
},
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;