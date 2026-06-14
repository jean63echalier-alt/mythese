import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, emailWaitlistConfirm, emailAdminNotify } from "@/lib/resend";

const Body = z.object({
  email: z.string().email().max(200),
  level: z.string().max(20).optional(),
  topic: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").upsert(
    {
      email: payload.email.toLowerCase(),
      level: payload.level ?? null,
      topic: payload.topic?.trim() || null,
      user_agent: req.headers.get("user-agent") ?? null,
    },
    { onConflict: "email", ignoreDuplicates: false },
  );

  if (error) {
    console.error("waitlist insert error", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 },
    );
  }

  // Send confirmation email (best-effort, don't block)
  sendEmail(emailWaitlistConfirm({ email: payload.email })).catch((e) =>
    console.error("waitlist email send error", e),
  );

  // Notify admin of new signup (best-effort, don't block)
  sendEmail(
    emailAdminNotify({
      subject: "Nouvelle inscription waitlist",
      lines: [
        ["Email", payload.email],
        ["Niveau", payload.level ?? "-"],
        ["Sujet", payload.topic ?? "-"],
      ],
    }),
  ).catch((e) => console.error("waitlist admin notify error", e));

  return NextResponse.json({ ok: true });
}
