import { Resend } from "resend";

let _client: Resend | null = null;
export function resend() {
  if (!_client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Mythese <bonjour@mythese.com>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  // En dev, si pas de DNS Resend prêt, on log et on simule succès
  if (!process.env.RESEND_API_KEY) {
    console.warn("[resend] no key — skipping send", opts.to, opts.subject);
    return { id: "dev-skip" };
  }
  try {
    const { data, error } = await resend().emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[resend] error", error);
      return { id: null, error };
    }
    return { id: data?.id ?? null };
  } catch (e) {
    console.error("[resend] exception", e);
    return { id: null, error: e };
  }
}

export function emailWaitlistConfirm(opts: { email: string }) {
  return {
    to: opts.email,
    subject: "Bienvenue sur la waitlist Mythese",
    html: `
<div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 28px; color: #7b1f1f; margin: 0 0 16px;">Mythèse</h1>
  <p>Bonjour,</p>
  <p>Merci d'avoir rejoint la waitlist Mythese.</p>
  <p>Tu fais partie des premiers à découvrir le coach IA qui structure les mémoires de recherche — sans jamais rédiger à ta place.</p>
  <p><strong>Le raisonnement, c'est toi.</strong></p>
  <p style="border-left: 3px solid #7b1f1f; padding-left: 14px; color: #4a4a4a; font-style: italic;">
    Sources peer-reviewed via OpenAlex (250M papers).<br/>
    Méthodologie française stricte.<br/>
    Watermark anti-fraude sur chaque suggestion.
  </p>
  <p>On t'écrit quand le MVP est prêt à tester.</p>
  <p>— L'équipe Mythese</p>
  <hr style="border: none; border-top: 1px solid #e5e1d8; margin: 24px 0;" />
  <p style="font-size: 12px; color: #767676;">© 2026 Mythese. Tu reçois cet email parce que tu t'es inscrit sur mythese.com.</p>
</div>`,
    text: `Bienvenue sur la waitlist Mythese.\n\nLe coach IA qui structure ton mémoire de recherche, sans jamais rédiger à ta place.\n\nOn t'écrit quand le MVP est prêt à tester.\n\n— L'équipe Mythese`,
  };
}

export function emailInvitation(opts: {
  email: string;
  inviterName: string;
  projectTitle: string;
  role: "author" | "director" | "reader";
  inviteUrl: string;
}) {
  const roleFr = { author: "auteur", director: "directeur", reader: "lecteur" }[
    opts.role
  ];
  return {
    to: opts.email,
    subject: `${opts.inviterName} t'invite sur le projet "${opts.projectTitle}" — Mythese`,
    html: `
<div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 28px; color: #7b1f1f; margin: 0 0 16px;">Mythèse</h1>
  <p><strong>${escapeHtml(opts.inviterName)}</strong> t'invite à rejoindre son projet de recherche en tant que <strong>${roleFr}</strong>.</p>
  <h2 style="font-size: 22px; margin: 20px 0 8px;">${escapeHtml(opts.projectTitle)}</h2>
  <p style="margin: 24px 0;">
    <a href="${opts.inviteUrl}" style="background: #7b1f1f; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
      Rejoindre le projet
    </a>
  </p>
  <p style="font-size: 13px; color: #767676;">Si le bouton ne fonctionne pas, copie ce lien : ${opts.inviteUrl}</p>
  <hr style="border: none; border-top: 1px solid #e5e1d8; margin: 24px 0;" />
  <p style="font-size: 12px; color: #767676;">© 2026 Mythese.</p>
</div>`,
    text: `${opts.inviterName} t'invite sur le projet "${opts.projectTitle}" en tant que ${roleFr}.\n\nRejoindre : ${opts.inviteUrl}`,
  };
}

export const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || "jean63.echalier@gmail.com";

export function emailAdminNotify(opts: {
  subject: string;
  lines: Array<[string, string]>;
}) {
  const rows = opts.lines
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px;color:#767676;">${escapeHtml(k)}</td><td style="padding:4px 12px;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return {
    to: ADMIN_EMAIL,
    subject: `[Mythese] ${opts.subject}`,
    html: `
<div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
  <h1 style="font-size: 22px; color: #7b1f1f; margin: 0 0 16px;">${escapeHtml(opts.subject)}</h1>
  <table style="border-collapse: collapse;">${rows}</table>
</div>`,
    text: `${opts.subject}\n\n${opts.lines.map(([k, v]) => `${k}: ${v}`).join("\n")}`,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
