import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error("stripe webhook signature", e);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const type = session.metadata?.type as "one_shot" | "subscription" | undefined;
      const projectId = session.metadata?.project_id || null;
      if (!userId || !type) break;

      if (session.customer) {
        await admin
          .from("profiles")
          .update({ stripe_customer_id: session.customer as string })
          .eq("user_id", userId);
      }

      if (type === "one_shot") {
        const unlockedUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        await admin.from("payments").insert({
          user_id: userId,
          project_id: projectId,
          type: "one_shot",
          status: "active",
          stripe_session_id: session.id,
          unlocked_until: unlockedUntil,
        });
      } else {
        await admin.from("payments").insert({
          user_id: userId,
          project_id: null,
          type: "subscription",
          status: "active",
          stripe_session_id: session.id,
          stripe_subscription_id: session.subscription as string,
        });
        await admin.from("profiles").update({ subscription_status: "active" }).eq("user_id", userId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" || subscription.status === "trialing" ? "active" : "canceled";

      await admin
        .from("payments")
        .update({ status })
        .eq("stripe_subscription_id", subscription.id);

      const { data: payment } = await admin
        .from("payments")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();
      if (payment?.user_id) {
        await admin.from("profiles").update({ subscription_status: status }).eq("user_id", payment.user_id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
