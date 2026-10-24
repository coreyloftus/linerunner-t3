import Link from "next/link";

export const metadata = {
  title: "Privacy · LineRunner",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-xl space-y-8 px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to LineRunner
        </Link>

        <header className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Privacy
          </h1>
          <p className="font-script text-sm text-muted-foreground">
            Updated 2026-10-24
          </p>
        </header>

        <Section title="What we store">
          <ul className="list-disc space-y-1 pl-5 text-base">
            <li>Your Google email address and name, from sign-in.</li>
            <li>The scripts you add, and your melodies.</li>
            <li>
              Your last spot in the app (show, scene, and character), so it
              opens where you left off.
            </li>
            <li>How many PDF imports you used this month.</li>
          </ul>
          <p className="text-base text-muted-foreground">
            When you import a PDF, we send it to Claude (by Anthropic) to read
            the lines. We don&apos;t keep the PDF. Data is stored in Google
            Firebase, and the app runs on Vercel.
          </p>
        </Section>

        <Section title="Who can see it">
          <ul className="list-disc space-y-1 pl-5 text-base">
            <li>You.</li>
            <li>People you share a show with can see that show.</li>
            <li>
              Corey, who runs LineRunner, can see everything as the admin.
            </li>
          </ul>
          <p className="text-base text-muted-foreground">
            We don&apos;t sell your data or show ads.
          </p>
        </Section>

        <Section title="How to delete it">
          <p className="text-base">
            Open the menu, tap your email, then tap{" "}
            <span className="font-semibold">Delete account</span>. This deletes
            your scripts, melodies, and settings, and removes you from shows
            people shared with you. Shows you shared are deleted too.
          </p>
          <p className="text-base text-muted-foreground">
            Questions? Email{" "}
            <a
              href="mailto:coreyloftus@gmail.com"
              className="underline underline-offset-2"
            >
              coreyloftus@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
