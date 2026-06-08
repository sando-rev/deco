import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — Deco",
  description:
    "Privacybeleid van Deco, de hockey ontwikkelcoaching-app. Lees hoe wij omgaan met jouw persoonsgegevens.",
  alternates: {
    canonical: "https://decotraining.com/privacy",
  },
  openGraph: {
    title: "Privacybeleid — Deco",
    description:
      "Privacybeleid van Deco, de hockey ontwikkelcoaching-app. Lees hoe wij omgaan met jouw persoonsgegevens.",
    url: "https://decotraining.com/privacy",
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
    title: "Privacybeleid — Deco",
    description:
      "Privacybeleid van Deco, de hockey ontwikkelcoaching-app. Lees hoe wij omgaan met jouw persoonsgegevens.",
    images: ["https://decotraining.com/og-image.png"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-deco-bg text-deco-text">
      <div className="mx-auto max-w-3xl px-6 py-16" style={{ fontFamily: "Inter, sans-serif" }}>
        <a
          href="/"
          className="mb-8 inline-block text-sm text-[#1B6B4A] hover:underline"
        >
          &larr; Terug naar home
        </a>

        <h1 className="mb-2 text-3xl font-bold text-[#0F4A32]">Privacybeleid</h1>
        <p className="mb-1 text-lg text-[#1B6B4A] font-semibold">
          Deco – Hockey Ontwikkelcoaching-app
        </p>
        <p className="mb-10 text-sm text-gray-500">
          Versie 1.0 &nbsp;|&nbsp; Ingangsdatum: 09-03-2026
        </p>

        <Section title="1. Inleiding">
          <p>
            Welkom bij Deco, de app die hockeyers ondersteunt in hun persoonlijke en sportieve
            ontwikkeling. In dit privacybeleid leggen we uit welke persoonsgegevens we verzamelen,
            waarom we dat doen, hoe we deze gegevens beschermen en welke rechten jij (of je
            ouders/voogd) hebt.
          </p>
          <p>
            Dit beleid is van toepassing op alle gebruikers van de Deco-app, zowel op Android
            (Google Play) als op iOS (Apple App Store). Omdat onze app ook toegankelijk is voor
            gebruikers jonger dan 16 jaar, hechten wij bijzonder veel waarde aan de bescherming van
            persoonsgegevens van minderjarigen.
          </p>
          <p>
            Door gebruik te maken van Deco ga je akkoord met dit privacybeleid. Ben je jonger dan 16
            jaar? Dan is toestemming van een ouder of wettelijke voogd vereist.
          </p>
        </Section>

        <Section title="2. Wie zijn wij?">
          <p>
            Deco is ontwikkeld door JS Top Sport voor HockeyMentaal, gevestigd te Laan van Nieuw
            Oost Indië 261A, Den Haag, Nederland. Wij zijn verantwoordelijk voor de verwerking van
            jouw persoonsgegevens zoals beschreven in dit beleid.
          </p>
          <p className="font-semibold mt-4">Contactgegevens:</p>
          <ul>
            <li>E-mail: hockeymentaal@gmail.com</li>
            <li>Website: decotraining.com</li>
          </ul>
        </Section>

        <Section title="3. Welke gegevens verzamelen wij?">
          <p className="font-semibold">3.1 Accountgegevens</p>
          <ul>
            <li>Naam</li>
            <li>E-mailadres</li>
            <li>Leeftijd of geboortedatum (om te bepalen of ouderlijke toestemming nodig is)</li>
            <li>Wachtwoord (versleuteld opgeslagen)</li>
          </ul>

          <p className="font-semibold mt-4">3.2 Prestatiedata</p>
          <ul>
            <li>Trainingsgegevens (zoals type training, duur en intensiteit)</li>
            <li>Wedstrijdscores en statistieken</li>
            <li>Voortgang en ontwikkelingsdoelen</li>
          </ul>

          <p className="font-semibold mt-4">3.3 Zelfreflecties</p>
          <ul>
            <li>Persoonlijke notities en reflecties over trainingen</li>
            <li>Reflecties over wedstrijdprestaties</li>
            <li>Zelfbeoordelingen en inzichten over de eigen ontwikkeling</li>
          </ul>

          <p className="font-semibold mt-4">3.4 Pushmeldingen</p>
          <p>
            Als je toestemming geeft voor pushmeldingen, slaan wij jouw apparaattoken op om je
            meldingen te sturen over trainingsherinneringen en app-updates. Toestemming voor
            pushmeldingen is volledig optioneel en kan op elk moment worden ingetrokken via de
            instellingen van jouw apparaat.
          </p>

          <p className="mt-4">
            Wij verzamelen géén locatiegegevens, betalingsgegevens of andere gevoelige
            persoonsgegevens.
          </p>
        </Section>

        <Section title="4. Waarom verzamelen wij deze gegevens?">
          <p>Wij gebruiken jouw gegevens uitsluitend voor de volgende doeleinden:</p>
          <ul>
            <li>
              <strong>Accountbeheer:</strong> Het aanmaken en beheren van jouw persoonlijke account.
            </li>
            <li>
              <strong>Persoonlijke ontwikkeling:</strong> Het bijhouden van jouw trainingen,
              prestaties en reflecties zodat jij inzicht krijgt in jouw hockeyontwikkeling.
            </li>
            <li>
              <strong>Verbetering van de app:</strong> Geanonimiseerde gebruiksgegevens kunnen
              worden gebruikt om de functionaliteit van Deco te verbeteren.
            </li>
            <li>
              <strong>Communicatie:</strong> Om je te informeren over belangrijke updates of
              wijzigingen in de app.
            </li>
          </ul>
          <p>
            Wij verkopen jouw gegevens nooit aan derden en gebruiken ze niet voor
            advertentiedoeleinden.
          </p>
        </Section>

        <Section title="5. Grondslagen voor gegevensverwerking">
          <p>
            Wij verwerken jouw persoonsgegevens op basis van de volgende wettelijke grondslagen
            (conform de AVG/GDPR):
          </p>
          <ul>
            <li>
              <strong>Toestemming:</strong> Voor gebruikers jonger dan 16 jaar is toestemming van een
              ouder of wettelijke voogd vereist. Toestemming kan te allen tijde worden ingetrokken.
            </li>
            <li>
              <strong>Uitvoering van een overeenkomst:</strong> De verwerking is noodzakelijk voor
              het leveren van de diensten van Deco.
            </li>
            <li>
              <strong>Gerechtvaardigd belang:</strong> Voor het verbeteren van de app op basis van
              geanonimiseerde gegevens.
            </li>
          </ul>
        </Section>

        <Section title="6. Bijzondere bepalingen voor minderjarigen">
          <p>
            Deco is ook toegankelijk voor gebruikers onder de 16 jaar. Wij nemen de bescherming van
            gegevens van minderjarigen zeer serieus:
          </p>
          <ul>
            <li>
              Gebruikers jonger dan 16 jaar dienen toestemming te hebben van een ouder of wettelijke
              voogd om de app te gebruiken.
            </li>
            <li>
              Wij verzamelen bij minderjarigen niet meer gegevens dan strikt noodzakelijk is voor de
              werking van de app.
            </li>
            <li>
              Ouders of voogden kunnen te allen tijde inzage vragen in de gegevens van hun kind, en
              verzoeken om wijziging of verwijdering.
            </li>
            <li>
              Reflecties en prestatiedata van minderjarigen worden niet gedeeld met derden.
            </li>
          </ul>
          <p>
            Als wij ontdekken dat gegevens van een minderjarige zijn verzameld zonder geldige
            toestemming, zullen wij deze zo snel mogelijk verwijderen.
          </p>
        </Section>

        <Section title="7. Hoe delen wij jouw gegevens?">
          <p>
            Deco deelt jouw gegevens niet met derden, behalve in de volgende gevallen:
          </p>
          <ul>
            <li>
              <strong>Databaseopslag — Supabase (EU-regio):</strong> Alle persoonsgegevens worden
              opgeslagen op servers van Supabase, gevestigd binnen de Europese Unie. Supabase
              verwerkt gegevens uitsluitend in opdracht van Deco en conform de AVG.
            </li>
            <li>
              <strong>AI-doelanalyse — Claude by Anthropic:</strong> Wanneer je een doelstelling
              invult en om AI-feedback vraagt, wordt de tekst van dat doel ter analyse verstuurd naar
              Claude, een AI-dienst van Anthropic. Anthropic slaat de verstuurde tekst niet
              permanent op en gebruikt deze niet voor het trainen van modellen. Er worden geen
              andere persoonsgegevens (zoals naam of e-mailadres) meegestuurd. Deze verwerking
              vindt uitsluitend plaats op jouw uitdrukkelijk verzoek.
            </li>
            <li>
              <strong>Wettelijke verplichtingen:</strong> Als wij hiertoe verplicht zijn op grond van
              wet- of regelgeving of een gerechtelijk bevel.
            </li>
          </ul>
          <p>
            Jouw zelfreflecties en prestatiedata zijn strikt persoonlijk en worden nooit gedeeld met
            andere gebruikers of derden zonder jouw uitdrukkelijke toestemming.
          </p>
        </Section>

        <Section title="8. Hoe lang bewaren wij jouw gegevens?">
          <p>
            Wij bewaren jouw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden
            waarvoor ze zijn verzameld:
          </p>
          <ul>
            <li>
              Accountgegevens worden bewaard zolang je een actief account hebt bij Deco.
            </li>
            <li>
              Prestatiedata en zelfreflecties worden bewaard zolang jij dit wenst en in jouw account
              actief houdt.
            </li>
            <li>
              Na verwijdering van jouw account worden jouw gegevens onmiddellijk en permanent
              gewist uit onze systemen. Zie sectie 11 voor meer informatie over accountverwijdering.
            </li>
          </ul>
        </Section>

        <Section title="9. Hoe beveiligen wij jouw gegevens?">
          <p>
            Wij nemen passende technische en organisatorische maatregelen om jouw gegevens te
            beschermen:
          </p>
          <ul>
            <li>Versleutelde opslag van wachtwoorden en gevoelige gegevens (encryptie).</li>
            <li>Beveiligde verbindingen via HTTPS/TLS.</li>
            <li>
              Beperkte toegang tot persoonsgegevens: alleen bevoegde medewerkers hebben toegang.
            </li>
            <li>Regelmatige beveiligingscontroles van onze systemen.</li>
          </ul>
        </Section>

        <Section title="10. Jouw rechten">
          <p>
            Op grond van de Algemene Verordening Gegevensbescherming (AVG) heb jij de volgende
            rechten:
          </p>
          <ul>
            <li>
              <strong>Recht op inzage:</strong> Je kunt opvragen welke gegevens wij van jou hebben
              opgeslagen.
            </li>
            <li>
              <strong>Recht op correctie:</strong> Je kunt onjuiste gegevens laten corrigeren.
            </li>
            <li>
              <strong>Recht op verwijdering:</strong> Je kunt verzoeken om verwijdering van jouw
              gegevens (&lsquo;recht op vergetelheid&rsquo;).
            </li>
            <li>
              <strong>Recht op beperking:</strong> Je kunt verzoeken om beperking van de verwerking
              van jouw gegevens.
            </li>
            <li>
              <strong>Recht op dataportabiliteit:</strong> Je kunt jouw gegevens in een gangbaar
              formaat opvragen.
            </li>
            <li>
              <strong>Recht op bezwaar:</strong> Je kunt bezwaar maken tegen de verwerking van jouw
              gegevens.
            </li>
            <li>
              <strong>Recht om toestemming in te trekken:</strong> Als de verwerking is gebaseerd op
              toestemming, kun je deze te allen tijde intrekken.
            </li>
          </ul>
          <p>
            Wil je gebruikmaken van een van bovenstaande rechten? Neem dan contact met ons op via{" "}
            <a href="mailto:hockeymentaal@gmail.com" className="text-[#1B6B4A] underline">
              hockeymentaal@gmail.com
            </a>
            . Wij reageren binnen 30 dagen op jouw verzoek.
          </p>
          <p>
            Ben je het niet eens met de manier waarop wij jouw gegevens verwerken? Dan heb je het
            recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (AP) via{" "}
            <a
              href="https://www.autoriteitpersoonsgegevens.nl"
              className="text-[#1B6B4A] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.autoriteitpersoonsgegevens.nl
            </a>
            .
          </p>
        </Section>

        <Section title="11. Recht op gegevensverwijdering (AVG Artikel 17)">
          <p>
            Op grond van artikel 17 van de Algemene Verordening Gegevensbescherming (AVG) — het
            recht op vergetelheid — heb je het recht om te verzoeken dat al jouw persoonsgegevens
            volledig worden verwijderd. Deco maakt dit zo eenvoudig mogelijk door accountverwijdering
            rechtstreeks vanuit de app aan te bieden.
          </p>

          <p className="font-semibold mt-4">Account verwijderen via de app</p>
          <p>
            Je kunt jouw account en alle bijbehorende gegevens direct verwijderen via het scherm{" "}
            <strong>Instellingen</strong> in de app. Na bevestiging worden de volgende gegevens
            onmiddellijk en permanent verwijderd:
          </p>
          <ul>
            <li>Profiel- en accountgegevens (naam, e-mailadres, wachtwoord)</li>
            <li>Vaardigheidsinformatie en scores</li>
            <li>Doelstellingen en doelvoortgang</li>
            <li>Zelfreflecties</li>
            <li>Achievements en XP</li>
            <li>Teamlidmaatschappen en gekoppelde coachrelaties</li>
          </ul>

          <p className="font-semibold mt-4">Onmiddellijk en onomkeerbaar</p>
          <p>
            Gegevensverwijdering is <strong>onmiddellijk</strong> en{" "}
            <strong>onomkeerbaar</strong>. Zodra je jouw account verwijdert, kunnen wij de gegevens
            niet meer herstellen. Zorg er daarom voor dat je eventuele gegevens die je wilt bewaren
            eerst exporteert of noteert.
          </p>

          <p className="font-semibold mt-4">Verwijdering via e-mail</p>
          <p>
            Lukt het niet om jouw account via de app te verwijderen, of heb je geen toegang meer
            tot de app? Stuur dan een e-mail naar{" "}
            <a href="mailto:hockeymentaal@gmail.com" className="text-[#1B6B4A] underline">
              hockeymentaal@gmail.com
            </a>{" "}
            met het verzoek om jouw gegevens te verwijderen. Wij verwerken dit verzoek binnen 30
            dagen en bevestigen de verwijdering per e-mail.
          </p>
        </Section>

        <Section title="12. Cookies en tracking">
          <p>
            De Deco-app maakt geen gebruik van cookies of vergelijkbare trackingtechnologieën voor
            advertentiedoeleinden. Functionele opslag (zoals het onthouden van jouw inlogstatus) kan
            worden gebruikt uitsluitend voor de werking van de app.
          </p>
        </Section>

        <Section title="13. Wijzigingen in dit privacybeleid">
          <p>
            Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. Wanneer wij wezenlijke
            wijzigingen aanbrengen, zullen wij jou hiervan op de hoogte stellen via de app of per
            e-mail. Wij raden je aan dit beleid periodiek te raadplegen.
          </p>
          <p>
            De meest recente versie van dit privacybeleid is altijd beschikbaar in de app en op onze
            website.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Heb je vragen over dit privacybeleid of over de manier waarop Deco omgaat met jouw
            persoonsgegevens? Neem dan contact met ons op:
          </p>
          <ul>
            <li>HockeyMentaal</li>
            <li>
              E-mail:{" "}
              <a href="mailto:hockeymentaal@gmail.com" className="text-[#1B6B4A] underline">
                hockeymentaal@gmail.com
              </a>
            </li>
            <li>Adres: Laan van Nieuw Oost Indië 261A, Den Haag</li>
          </ul>
          <p>Wij streven ernaar al jouw vragen binnen 5 werkdagen te beantwoorden.</p>
        </Section>

        <p className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          © 2025 Deco – Hockey Ontwikkelingcoach-app. Alle rechten voorbehouden.
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
