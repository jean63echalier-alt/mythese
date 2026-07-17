import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICES } from "@/lib/stripe";

const Body = z.object({
  type: z.enum(["one_shot", "subscription"]),
  projectId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  if (payload.type === "one_shot" && !payload.projectId) {
    return NextResponse.json({ error: "projectId requis pour un déblocage one-shot" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://mythese.com";
  const returnPath =
    payload.type === "one_shot" ? `/app/projects/${payload.projectId}` : "/app";

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const session = await stripe().checkout.sessions.create({
    mode: payload.type === "one_shot" ? "payment" : "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (user.email ?? undefined),
    client_reference_id: user.id,
    line_items: [
      {
        price: payload.type === "one_shot" ? PRICES.oneShot : PRICES.subscription,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      type: payload.type,
      project_id: payload.projectId ?? "",
    },
    success_url: `${base}${returnPath}?checkout=success`,
    cancel_url: `${base}${returnPath}?checkout=cancel`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Session Stripe sans URL" }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
