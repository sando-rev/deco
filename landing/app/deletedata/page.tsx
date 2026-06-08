import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gegevens verwijderen — Deco",
  description:
    "Verzoek tot verwijdering van je account en persoonsgegevens in de Deco-app. Verwijder direct via de app of via e-mail.",
  alternates: {
    canonical: "https://decotraining.com/deletedata",
  },
  openGraph: {
    title: "Gegevens verwijderen — Deco",
    description:
      "Verzoek tot verwijdering van je account en persoonsgegevens in de Deco-app. Verwijder direct via de app of via e-mail.",
    url: "https://decotraining.com/deletedata",
    type: "website",
    images: [
      {
        url: "https://decotraining.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gegevens verwijderen — Deco",
    description:
      "Verzoek tot verwijdering van je account en persoonsgegevens in de Deco-app.",
    images: ["https://decotraining.com/og-image.png"],
  },
};

export default function DeleteDataPage() {
  return (
    <div className="min-h-screen bg-deco-bg text-deco-text">
      <div className="mx-auto max-w-3xl px-6 py-16" style={{ fontFamily: "Inter, sans-serif" }}>
        <a
          href="/"
          className="mb-8 inline-block text-sm text-[#1B6B4A] hover:underline"
        >
          &larr; Terug naar home
        </a>

        <h1 className="mb-2 text-3xl font-bold text-[#0F4A32]">
          Gegevens verwijderen
        </h1>
        <p className="mb-1 text-lg text-[#1B6B4A] font-semibold">
          Deco – Hockey Ontwikkelcoaching-app
        </p>
        <p className="mb-2 text-sm text-gray-500">
          Ontwikkelaar: HockeyMentaal &nbsp;|&nbsp; hockeymentaal@gmail.com
        </p>
        <p className="mb-10 text-sm text-gray-500">
          Bijgewerkt: 12-03-2026
        </p>

        <p className="mb-10 text-gray-700 leading-relaxed">
          Op deze pagina leggen we uit hoe je jouw Deco-account en alle
          bijbehorende persoonsgegevens kunt laten verwijderen. Je hebt twee
          opties: rechtstreeks via de app of via e-mail. Verwijdering is
          permanent — na verwijdering bewaren wij geen enkele gegevens van jou.
        </p>

        {/* Deletion options */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-[#0F4A32]">
            Hoe verwijder je jouw account?
          </h2>

          {/* Option 1 */}
          <div className="mb-6 rounded-xl border border-[#1B6B4A]/20 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B6B4A] text-sm font-bold text-white">
                1
              </span>
              <h3 className="text-lg font-semibold text-[#0F4A32]">
                Via de app (direct)
              </h3>
            </div>
            <p className="mb-4 text-gray-600 text-sm leading-relaxed">
              De snelste manier. Jouw account en gegevens worden{" "}
              <strong>onmiddellijk en permanent</strong> verwijderd zodra je dit
              bevestigt.
            </p>
            <ol className="space-y-2 text-gray-700 text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B6B4A]/10 text-xs font-semibold text-[#1B6B4A]">
                  1
                </span>
                <span>
                  Open de Deco-app en ga naar{" "}
                  <strong>Instellingen</strong> (tandwiel-icoon rechtsboven in
                  je profiel).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B6B4A]/10 text-xs font-semibold text-[#1B6B4A]">
                  2
                </span>
                <span>Scroll helemaal naar beneden in het instellingenmenu.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B6B4A]/10 text-xs font-semibold text-[#1B6B4A]">
                  3
                </span>
                <span>
                  Tik op{" "}
                  <strong className="text-red-600">&ldquo;Account verwijderen&rdquo;</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B6B4A]/10 text-xs font-semibold text-[#1B6B4A]">
                  4
                </span>
                <span>
                  Bevestig het verwijderverzoek in het pop-upvenster. Je account
                  en alle bijbehorende gegevens worden direct gewist.
                </span>
              </li>
            </ol>
          </div>

          {/* Option 2 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B6B4A] text-sm font-bold text-white">
                2
              </span>
              <h3 className="text-lg font-semibold text-[#0F4A32]">
                Via e-mail (binnen 30 dagen)
              </h3>
            </div>
            <p className="mb-4 text-gray-600 text-sm leading-relaxed">
              Heb je geen toegang meer tot de app of lukt het niet via de app?
              Stuur ons dan een e-mail. Wij verwerken jouw verzoek{" "}
              <strong>binnen 30 dagen</strong> en bevestigen de verwijdering per
              e-mail.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
              <p>
                <span className="font-semibold">Aan:</span>{" "}
                <a
                  href="mailto:hockeymentaal@gmail.com?subject=Verwijder%20mijn%20account"
                  className="text-[#1B6B4A] underline"
                >
                  hockeymentaal@gmail.com
                </a>
              </p>
              <p>
                <span className="font-semibold">Onderwerp:</span>{" "}
                <span className="font-mono bg-white border border-gray-200 rounded px-2 py-0.5">
                  Verwijder mijn account
                </span>
              </p>
              <p>
                <span className="font-semibold">Vermeld in het bericht:</span>{" "}
                het e-mailadres waarmee je geregistreerd bent in de Deco-app.
              </p>
            </div>
          </div>
        </section>

        {/* What gets deleted */}
        <Section title="Welke gegevens worden verwijderd?">
          <p>
            Bij verwijdering van jouw account worden <strong>alle</strong>{" "}
            onderstaande gegevens volledig en permanent gewist uit onze systemen.
            Er blijft geen enkele kopie bewaard.
          </p>
          <ul>
            <li>
              <strong>Profielgegevens:</strong> naam, e-mailadres en alle
              accountinformatie
            </li>
            <li>
              <strong>Vaardigheden en scores:</strong> alle
              hockeyvaardigheidsinformatie en beoordelingen
            </li>
            <li>
              <strong>Doelstellingen en AI-feedback:</strong> persoonlijke doelen,
              voortgang en ontvangen AI-analyses
            </li>
            <li>
              <strong>Zelfreflecties:</strong> alle ingevoerde
              trainings- en wedstrijdreflecties
            </li>
            <li>
              <strong>Achievements en XP:</strong> behaalde prestaties,
              ervarings&shy;punten en ranglijst&shy;gegevens
            </li>
            <li>
              <strong>Teamlidmaatschappen:</strong> koppeling met teams en
              coachrelaties
            </li>
            <li>
              <strong>Trainingsschema&rsquo;s:</strong> persoonlijke en teamtrainingsgegevens
            </li>
            <li>
              <strong>Push&shy;notificatietokens:</strong> apparaattokens die
              werden gebruikt voor het versturen van meldingen
            </li>
          </ul>
        </Section>

        {/* Timing and permanence */}
        <Section title="Tijdlijn en onomkeerbaarheid">
          <ul>
            <li>
              <strong>Via de app:</strong> verwijdering is{" "}
              <strong>onmiddellijk</strong> — zodra je bevestigt, zijn je
              gegevens weg.
            </li>
            <li>
              <strong>Via e-mail:</strong> verwijdering vindt plaats{" "}
              <strong>binnen 30 dagen</strong> na ontvangst van jouw verzoek.
              Je ontvangt een bevestigingsmail wanneer de verwijdering voltooid
              is.
            </li>
            <li>
              Verwijdering is <strong>onomkeerbaar</strong>. Na verwijdering
              kunnen wij jouw gegevens niet meer herstellen.
            </li>
            <li>
              Na verwijdering worden <strong>geen gegevens bewaard</strong> —
              ook niet in back-ups of archieven.
            </li>
          </ul>
          <p>
            Zorg er daarom voor dat je eventuele informatie die je wilt bewaren
            (zoals trainingsnotities) eerst zelf noteert voordat je jouw account
            verwijdert.
          </p>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <p>
            Heb je vragen over de verwijdering van jouw gegevens of kom je er
            niet uit? Neem dan contact op:
          </p>
          <ul>
            <li>HockeyMentaal — ontwikkelaar van Deco</li>
            <li>
              E-mail:{" "}
              <a
                href="mailto:hockeymentaal@gmail.com"
                className="text-[#1B6B4A] underline"
              >
                hockeymentaal@gmail.com
              </a>
            </li>
            <li>Adres: Laan van Nieuw Oost Indië 261A, Den Haag, Nederland</li>
          </ul>
          <p>
            Zie ook ons{" "}
            <a href="/privacy" className="text-[#1B6B4A] underline">
              privacybeleid
            </a>{" "}
            voor meer informatie over hoe we omgaan met jouw persoonsgegevens.
          </p>
        </Section>

        <p className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          &copy; 2026 Deco – Hockey Ontwikkelingscoach-app. Alle rechten voorbehouden.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold text-[#0F4A32]">{title}</h2>
      <div className="space-y-3 text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
