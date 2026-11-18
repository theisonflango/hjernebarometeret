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

const PRICES: Record<string, string> = {
  single: Deno.env.get("STRIPE_PRICE_SINGLE") || "price_SINGLE_PLACEHOLDER",
  pack4: Deno.env.get("STRIPE_PRICE_PACK4") || "price_PACK4_PLACEHOLDER",
  unlimited: Deno.env.get("STRIPE_PRICE_UNLIMITED") || "price_UNLIMITED_PLACEHOLDER",
};

const AMOUNTS: Record<string, number> = {
  single: 4900,
  pack4: 9900,
  unlimited: 8900,
};

const VALID_PRODUCTS = ["single", "pack4", "unlimited"];
const VALID_TESTS = ["iq", "adhd", "autisme", "personlighed", "stress", "eq", "karriere", "ocd"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // F-01 pause: every product on this endpoint sells access to reports under review.
  const reportSalesPaused = true;
  if (reportSalesPaused) {
    return new Response(
      JSON.stringify({ error: "REPORT_SALES_PAUSED", message: "Rapportsalget er på pause." }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { product_type, test_type, user_id, user_email, success_url, cancel_url, withdrawal_consent } = body;

    if (!VALID_PRODUCTS.includes(product_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid product_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (test_type && !VALID_TESTS.includes(test_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid test_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Right-of-withdrawal consent is mandatory before a digital-content purchase.
    // The client sends a boolean flag; the SERVER stamps the authoritative time
    // (avoids client-clock-skew failures and makes the record trustworthy).
    if (withdrawal_consent !== true) {
      return new Response(
        JSON.stringify({ error: "Consent to immediate delivery is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const consentIso = new Date().toISOString();

    if ((product_type === "pack4" || product_type === "unlimited") && !user_id) {
      return new Response(
        JSON.stringify({ error: "Login required for this product" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonymous_token = !user_id ? crypto.randomUUID() : null;

    let finalSuccessUrl = success_url || "https://hjernebarometeret.dk";
    const sep = finalSuccessUrl.includes("?") ? "&" : "?";
    finalSuccessUrl += `${sep}payment=success&session_id={CHECKOUT_SESSION_ID}`;
    if (anonymous_token) {
      finalSuccessUrl += `&token=${anonymous_token}`;
    }

    const sessionParams: any = {
      mode: product_type === "unlimited" ? "subscription" : "payment",
      line_items: [{ price: PRICES[product_type], quantity: 1 }],
      success_url: finalSuccessUrl,
      cancel_url: cancel_url || "https://hjernebarometeret.dk",
      metadata: {
        product_type,
        test_type: test_type || "",
        user_id: user_id || "",
        anonymous_token: anonymous_token || "",
        withdrawal_consent_at: consentIso,
      },
      locale: "da",
    };

    if (user_email) {
      sessionParams.customer_email = user_email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabaseAdmin.from("orders").insert({
      user_id: user_id || null,
      email: user_email || null,
      stripe_checkout_session_id: session.id,
      product_type,
      test_type: test_type || null,
      amount_dkk: AMOUNTS[product_type],
      status: "pending",
      withdrawal_consent_at: consentIso,
    });

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        anonymous_token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Create checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
