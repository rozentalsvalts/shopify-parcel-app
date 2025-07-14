import { authenticate } from "../../../shopify.server";
import db from "../../../db.server"; // or your own storage logic

export const action = async ({ request }) => {
  // Verify and parse the webhook payload
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Payload:", payload);

  // Optionally store/update scopes in your DB
  if (session) {
    await db.session.update({
      where: { id: session.id },
      data: { scope: payload.current?.toString() },
    });
  }

  return new Response();
};