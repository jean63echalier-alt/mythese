export const metadata = { title: "Contact — Mythese" };

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6">Contact</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Une question, une suggestion, un bug ?
      </p>
      <p className="mt-4">
        <a
          className="text-[var(--color-burgundy)] underline"
          href="mailto:bonjour@mythese.com"
        >
          bonjour@mythese.com
        </a>
      </p>
    </div>
  );
}
