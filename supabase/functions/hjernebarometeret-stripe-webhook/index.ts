import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { db: { schema: "hjernebarometeret" } }
);

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// ── Order-confirmation email (forbrugeraftaleloven § 13 — durable medium) ──
// Restates what was purchased, the price, and the withdrawal-right waiver the
// customer consented to at checkout. Sent via Resend. Best-effort: a failure
// here is logged, never thrown, so it can NEVER block granting report access.

const TEST_NAMES: Record<string, string> = {
  iq: "IQ-test",
  adhd: "ADHD-screening",
  autisme: "Autisme-test",
  personlighed: "Personlighedstest",
  stress: "Stress & udbrændthed",
  eq: "EQ-test",
  karriere: "Karrieretest",
  ocd: "OCD-screening",
};

function receiptContent(productType: string, testType: string | null) {
  let product = "Rapport";
  let price = "";
  let withdrawal = "";
  let link = "https://hjernebarometeret.dk/rapporter.html";

  if (productType === "single") {
    const name = testType ? (TEST_NAMES[testType] || "rapport") : "rapport";
    product = `Fuld rapport — ${name}`;
    price = "49 kr";
    withdrawal =
      "Du har givet udtrykkeligt samtykke til, at rapporten leveres straks, og anerkendt at din fortrydelsesret dermed bortfalder ved levering (forbrugeraftaleloven § 18, stk. 2, nr. 13).";
    if (testType) link = `https://hjernebarometeret.dk/rapporter/${testType}.html`;
  } else if (productType === "pack4") {
    product = "4 rapport-credits";
    price = "99 kr";
    withdrawal =
      "Du har givet udtrykkeligt samtykke til, at dine rapport-credits stilles til rådighed straks. Fortrydelsesretten for en credit bortfalder, når den er indløst til en rapport (forbrugeraftaleloven § 18, stk. 2, nr. 13); ikke-indløste credits kan fortrydes i 14 dage.";
    link = "https://hjernebarometeret.dk/profil.html";
  } else if (productType === "unlimited") {
    product = "Ubegrænset abonnement";
    price = "89 kr/md";
    withdrawal =
      "Du har givet udtrykkeligt samtykke til, at abonnementet starter straks. Du kan til enhver tid opsige abonnementet med virkning fremadrettet.";
    link = "https://hjernebarometeret.dk/profil.html";
  }
  return { product, price, withdrawal, link };
}

async function sendReceiptEmail(opts: {
  to: string;
  productType: string;
  testType: string | null;
  orderId: string | null;
  sessionId: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log("Receipt email skipped: RESEND_API_KEY not set");
    return;
  }
  if (!opts.to) {
    console.log("Receipt email skipped: no recipient email on session");
    return;
  }

  const from =
    Deno.env.get("RECEIPT_FROM") ||
    "Hjernebarometeret <noreply@hjernebarometeret.dk>";
  const bcc = Deno.env.get("RECEIPT_BCC") || "";
  const { product, price, withdrawal, link } = receiptContent(
    opts.productType,
    opts.testType
  );
  const orderRef = (opts.orderId || opts.sessionId).slice(0, 8).toUpperCase();

  const html =
    `<!doctype html><html lang="da"><body style="margin:0;background:#faf9f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1b1a">` +
    `<div style="max-width:520px;margin:0 auto;padding:32px 24px">` +
    `<div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:24px">☉ Hjernebarometeret</div>` +
    `<h1 style="font-size:22px;margin:0 0 8px">Tak for dit køb</h1>` +
    `<p style="color:#5a5650;margin:0 0 24px">Her er din kvittering og bekræftelse på din bestilling.</p>` +
    `<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8e5e0;border-radius:12px;overflow:hidden">` +
    `<tr><td style="padding:14px 18px;color:#5a5650">Produkt</td><td style="padding:14px 18px;text-align:right;font-weight:600">${product}</td></tr>` +
    `<tr style="border-top:1px solid #e8e5e0"><td style="padding:14px 18px;color:#5a5650">Beløb</td><td style="padding:14px 18px;text-align:right;font-weight:600">${price}</td></tr>` +
    `<tr style="border-top:1px solid #e8e5e0"><td style="padding:14px 18px;color:#5a5650">Ordre-ref.</td><td style="padding:14px 18px;text-align:right;font-weight:600">${orderRef}</td></tr>` +
    `</table>` +
    `<div style="text-align:center;margin:24px 0">` +
    `<a href="${link}" style="display:inline-block;background:#2c5f4b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Åbn din rapport</a>` +
    `</div>` +
    `<p style="font-size:13px;color:#5a5650;background:#f5f2ee;border-radius:10px;padding:14px 16px;margin:0 0 24px">${withdrawal}</p>` +
    `<p style="font-size:13px;color:#8a857e;margin:0 0 4px">Spørgsmål? Skriv til <a href="mailto:support@hjernebarometeret.dk" style="color:#2c5f4b">support@hjernebarometeret.dk</a></p>` +
    `<p style="font-size:12px;color:#b5b0a8;margin:16px 0 0">Hjernebarometeret · CVR 34360642 · hjernebarometeret.dk</p>` +
    `</div></body></html>`;

  const text =
    `Tak for dit køb hos Hjernebarometeret\n\n` +
    `Produkt: ${product}\n` +
    `Beløb: ${price}\n` +
    `Ordre-ref.: ${orderRef}\n\n` +
    `Åbn din rapport: ${link}\n\n` +
    `${withdrawal}\n\n` +
    `Spørgsmål? support@hjernebarometeret.dk\n` +
    `Hjernebarometeret · CVR 34360642`;

  const payload: Record<string, unknown> = {
    from,
    to: [opts.to],
    subject: "Kvittering for dit køb — Hjernebarometeret",
    html,
    text,
  };
  if (bcc) payload.bcc = [bcc];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`Resend send failed: ${res.status} ${errBody}`);
  } else {
    console.log(`Receipt email sent to ${opts.to}`);
  }
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`Received event: ${event.type}`);

  // Idempotency: Stripe delivers events at least once, so the same event.id can
  // arrive more than once. Record it up front; a unique-violation conflict means
  // we have already handled this event — acknowledge and skip (no double grant,
  // no double receipt email).
  const { error: dedupeErr } = await supabaseAdmin
    .from("processed_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });
  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      console.log(`Duplicate event ${event.id} (${event.type}) — already processed, skipping`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Non-conflict error (e.g. transient DB issue): log and continue so we do
    // not drop a real event.
    console.error("Failed to record event id for idempotency:", dedupeErr);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const { product_type, test_type, user_id, anonymous_token } = meta;

        console.log(`Checkout completed: product=${product_type}, test=${test_type}, user=${user_id || 'anonymous'}, session=${session.id}`);

        // Update order status and get order ID
        const { data: updatedOrder, error: orderError } = await supabaseAdmin
          .from("orders")
          .update({
            status: "completed",
            stripe_customer_id: session.customer as string || null,
            stripe_subscription_id: session.subscription as string || null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", session.id)
          .select("id")
          .single();

        if (orderError) {
          console.error("Failed to update order:", orderError);
        }

        const orderId = updatedOrder?.id || null;
        console.log(`Order updated: ${orderId}`);

        // Grant report access for single purchases
        if (test_type) {
          const { error: accessError } = await supabaseAdmin.from("report_access").insert({
            user_id: user_id || null,
            anonymous_token: anonymous_token || null,
            order_id: orderId,
            test_type,
            granted_at: new Date().toISOString(),
            expires_at: null,
          });
          if (accessError) {
            console.error("Failed to create report_access:", accessError);
          } else {
            console.log(`Report access granted: test=${test_type}, user=${user_id || anonymous_token}`);
          }
        }

        // Update user profile based on product type
        if (user_id) {
          if (product_type === "pack4") {
            const { data: profile } = await supabaseAdmin
              .from("user_profiles")
              .select("report_credits")
              .eq("id", user_id)
              .single();

            const currentCredits = profile?.report_credits || 0;

            await supabaseAdmin
              .from("user_profiles")
              .update({
                plan: "pack4",
                report_credits: currentCredits + 4 - (test_type ? 1 : 0),
                updated_at: new Date().toISOString(),
              })
              .eq("id", user_id);

          } else if (product_type === "unlimited") {
            await supabaseAdmin
              .from("user_profiles")
              .update({
                plan: "unlimited",
                stripe_customer_id: session.customer as string || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user_id);

          } else if (product_type === "single") {
            await supabaseAdmin
              .from("user_profiles")
              .update({
                stripe_customer_id: session.customer as string || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user_id);
          }
        }

        // Order-confirmation email (durable medium). Best-effort — must never
        // block the access grant above, so it is isolated in its own try/catch.
        try {
          const recipient =
            (session.customer_details && session.customer_details.email) ||
            (session.customer_email as string) ||
            "";
          await sendReceiptEmail({
            to: recipient,
            productType: product_type,
            testType: test_type || null,
            orderId,
            sessionId: session.id,
          });
        } catch (mailErr) {
          console.error("Receipt email error (non-blocking):", mailErr);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription deleted for customer: ${customerId}`);

        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabaseAdmin
            .from("user_profiles")
            .update({
              plan: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          await supabaseAdmin
            .from("report_access")
            .update({ expires_at: new Date().toISOString() })
            .eq("user_id", profile.id)
            .is("expires_at", null);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status === "past_due" || subscription.status === "unpaid") {
          const customerId = subscription.customer as string;
          console.log(`Subscription past_due/unpaid for customer: ${customerId}`);

          const { data: profile } = await supabaseAdmin
            .from("user_profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            await supabaseAdmin
              .from("user_profiles")
              .update({
                plan: "free",
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    // Processing failed after we claimed the event id — clear it so Stripe's
    // automatic retry can reprocess this event instead of being deduped away.
    await supabaseAdmin
      .from("processed_webhook_events")
      .delete()
      .eq("event_id", event.id);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
