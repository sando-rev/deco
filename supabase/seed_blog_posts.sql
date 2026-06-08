-- Seed deco.blog_posts with content from static React components.
-- Uses dollar-quoting ($body$...$body$) to avoid escaping issues with single quotes.
-- Safe to re-run: ON CONFLICT (slug) DO NOTHING.

INSERT INTO deco.blog_posts (slug, title, date, excerpt, author, content, published)
VALUES

-- 1. hockey-doelen-stellen (PostHockeyDoelen)
(
  'hockey-doelen-stellen',
  '5 hockey doelen die elke speler aan het begin van het seizoen moet stellen',
  '2026-03-20',
  'Een nieuw seizoen is het perfecte moment om scherp te krijgen waar je als speler naartoe wilt. Ontdek hoe je met de SMART-methode doelen stelt die écht werken.',
  'Deco Team',
  $body$<p>
  Het begin van een nieuw hockeyseizoen is meer dan een verse start op het veld. Het is het
  moment waarop je als speler bewust kunt kiezen welke speler je aan het einde van het seizoen
  wilt zijn. Toch beginnen de meeste spelers zonder duidelijk plan. Ze trainen hard, maar
  groeien niet zo snel als ze zouden kunnen. Het verschil? <strong>Gerichte doelen.</strong>
</p>

<p>
  In dit artikel lees je welke vijf doelen elke hockeyspeler aan het begin van het seizoen
  zou moeten stellen — en hoe je dat op een manier doet die écht werkt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Waarom doelen stellen zo krachtig is
</h2>
<p>
  Onderzoek naar sportprestaties toont consistent aan dat spelers met expliciete doelen
  sneller verbeteren dan spelers die simpelweg &ldquo;hun best doen&rdquo;. Een doel geeft
  richting aan je aandacht, vergroot je motivatie en maakt het makkelijker om vooruitgang te
  zien. Maar dan moeten die doelen wel goed geformuleerd zijn.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  De SMART-methode voor hockey
</h3>
<p>
  Je hebt vast wel eens van SMART gehoord: Specifiek, Meetbaar, Acceptabel, Realistisch en
  Tijdgebonden. Voor hockey voegen we er één dimensie aan toe: het doel moet aansluiten bij
  jouw positie en speelstijl. Een verdediger stelt andere doelen dan een aanvaller.
</p>
<p>
  Een vaag doel: &ldquo;Ik wil beter worden in dribbelen.&rdquo;
  <br />
  Een SMART doel: &ldquo;Ik wil voor eind november de Nederlandse slag consistent kunnen
  uitvoeren tijdens wedstrijden, en dat tijdens elke training twee keer oefenen.&rdquo;
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  5 doelen om dit seizoen te stellen
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1. Een technische vaardigheid aanscherpen
</h3>
<p>
  Kies één technisch element — een slag, push, of interceptietechniek — en maak dat je
  prioriteit voor de eerste helft van het seizoen. Breedte leer je tijdens wedstrijden;
  diepte bouw je door gericht te trainen. Focus loont.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  2. Jouw mentale spel versterken
</h3>
<p>
  Hockey wordt ook tussen de oren gespeeld. Stel een doel rondom concentratie, omgaan met
  fouten of communicatie op het veld. Mentale doelen zijn minder tastbaar, maar hebben enorme
  invloed op je prestaties in drukke wedstrijdmomenten.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  3. Fysieke conditie op een specifiek punt brengen
</h3>
<p>
  Duurvermogen, snelheid, wendbaarheid — kies er één. Formuleer een concreet meetpunt. Niet
  &ldquo;sneller worden&rdquo;, maar &ldquo;mijn 20-meterspurt met 0,2 seconden verbeteren
  voor december.&rdquo;
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  4. Jouw rol in de ploeg verdiepen
</h3>
<p>
  Elke positie heeft tactische verwachtingen. Stel een doel dat gaat over jouw bijdrage aan
  het team: beter positioneren, meer diepteloopballen maken, of slimmer druk zetten. Overleg
  met je coach wat voor jouw positie het meest waardevol is.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  5. Consistentie in zelfreflectie
</h3>
<p>
  Dit is het doel dat de andere doelen versterkt. Stel je voor: elke training een korte
  reflectie. Wat ging goed? Wat wil je anders? Spelers die dit bijhouden, herkennen patronen
  in hun ontwikkeling en passen hun aanpak sneller aan. Het is de gewoonte die het meeste
  verschil maakt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Doelen bijhouden met Deco
</h2>
<p>
  Het stellen van doelen is stap één. Ze bijhouden is stap twee — en precies daar gaat het
  vaak mis. Deco maakt het gemakkelijk om je seizoensdoelen vast te leggen, op te volgen en
  te koppelen aan je dagelijkse trainingen. Per doel kun je vooruitgang bijhouden en na
  iedere sessie een korte reflectie toevoegen, zodat je coach weet hoe het gaat en jij zelf
  het overzicht behoudt.
</p>
<p>
  Aan het einde van het seizoen heb je niet alleen beter gespeeld — je hebt ook een helder
  beeld van hoe je dat hebt bereikt. Dat is het fundament voor verdere groei.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Begin vandaag. Schrijf je vijf doelen op. Wees eerlijk, wees specifiek — en gebruik Deco
  om ze door het seizoen heen levend te houden.
</p>$body$,
  true
),

-- 2. effectief-reflecteren-na-training (PostReflecteren)
(
  'effectief-reflecteren-na-training',
  'Hoe reflecteer je effectief na een hockeytraining?',
  '2026-03-22',
  'Reflectie is de stille motor achter echte groei. Leer welke vragen je jezelf moet stellen na elke training en hoe je je inzichten bijhoudt.',
  'Deco Team',
  $body$<p>
  Je stap van het veld af. De training is klaar. Je voelt in je benen dat je hard hebt
  gewerkt. Maar weet je ook <em>wat</em> je vandaag beter hebt gemaakt? En waarom dat ene
  moment in de oefenvorm steeds misging?
</p>
<p>
  De meeste spelers rijden naar huis, eten wat en gaan slapen. De betere spelers nemen vijf
  minuten de tijd om te reflecteren. Dat verschil — vijf minuten — stapelt zich over een
  seizoen op tot tientallen waardevolle inzichten die je spel fundamenteel veranderen.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Waarom reflectie zo weinig gedaan wordt
</h2>
<p>
  Reflecteren voelt vaag. Je weet niet precies wat je moet opschrijven. Na een training ben
  je moe. En als het niet een gewoonte is, vergeet je het gewoon.
</p>
<p>
  Toch is zelfreflectie een van de sterkst gedocumenteerde mechanismen achter snelle
  vaardigheidsontwikkeling. Coaches die hun spelers systematisch laten reflecteren, zien
  aantoonbaar hogere progressie — niet in de laatste plaats omdat spelers zelf leren wat
  werkt voor hen persoonlijk.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Drie vragen die je altijd moet stellen
</h2>
<p>
  Effectieve reflectie hoeft niet ingewikkeld te zijn. Begin met deze drie vragen na elke
  training:
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1. Wat ging er goed vandaag?
</h3>
<p>
  Dit is geen oefening in zelfverheerlijking — het is bewust leren herkennen wat je
  vaardigheid al in huis heeft. Spelers die hun sterke punten kennen, zetten ze bewuster in.
  Wees specifiek: niet &ldquo;ik speelde goed&rdquo;, maar &ldquo;mijn positiespel bij de
  verdedigende cirkel was veel compacter dan vorige week.&rdquo;
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  2. Wat wil ik de volgende keer anders doen?
</h3>
<p>
  Formuleer dit als een intentie, niet als zelfkritiek. Het verschil: &ldquo;Ik was te
  langzaam in de omschakeling&rdquo; (kritiek) versus &ldquo;Volgende keer wil ik direct
  omschakelen zodra we de bal verliezen&rdquo; (intentie). Intenties activeren gedrag;
  kritiek demotiveert.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  3. Hoe staat dit in verhouding tot mijn seizoensdoel?
</h3>
<p>
  Dit is de verbindingsvraag. Wat je vandaag hebt geoefend — hielp dat bij het doel dat je
  dit seizoen wilt bereiken? Als je doel is om je overhandelingen te verbeteren en je hebt
  vandaag nauwelijks aan de bal gezeten, is dat relevant om op te merken.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Reflectie over meerdere trainingen heen
</h2>
<p>
  De echte kracht van reflectie zit niet in één notitie — het zit in het patroon. Als je na
  tien trainingen terugkijkt op je aantekeningen, zie je waar je systematisch groeit en
  waar je vastloopt. Dat is informatie die geen coach je kan geven, omdat niemand beter voelt
  hoe jij je spel ervaart dan jijzelf.
</p>
<p>
  Stel jezelf eens per maand de vraag: &ldquo;Welk thema zie ik terugkomen in mijn
  reflecties?&rdquo; Dat thema verdient extra aandacht in je training.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Reflecteren met Deco
</h2>
<p>
  Deco heeft een ingebouwde reflectiefunctie die precies om die drie vragen is gebouwd. Na
  elke sessie kun je in minder dan twee minuten je reflectie invullen. Deco slaat alles op
  zodat je later patronen kunt zien en je coach de context heeft om je beter te begeleiden.
</p>
<p>
  Jouw coach kan jouw reflecties zien en er direct op reageren — zodat feedback niet wacht
  op de volgende training, maar precies op het moment komt dat het relevant is.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Maak er een gewoonte van
</h3>
<p>
  Koppel reflectie aan iets wat je al doet na training: terwijl je in de auto zit, onder de
  douche staat, of thuis aankomt. Vijf minuten is genoeg. Het gaat niet om perfecte
  analyses — het gaat om de gewoonte van bewust nadenken over je eigen ontwikkeling.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Spelers die reflecteren groeien sneller. Niet omdat ze talentvoller zijn, maar omdat ze
  leren van elke training in plaats van alleen van grote wedstrijden.
</p>$body$,
  true
),

-- 3. hockey-coach-feedback-geven (PostCoachFeedback)
(
  'hockey-coach-feedback-geven',
  'Effectieve feedback geven als hockeycoach: 5 praktische tips',
  '2026-03-24',
  'Goede feedback is een van de krachtigste instrumenten die een coach heeft. Ontdek hoe je feedback geeft die spelers écht verder helpt.',
  'Deco Team',
  $body$<p>
  Feedback is het krachtigste instrument in de gereedschapskist van een coach. Een enkelvoudige
  observatie op het juiste moment kan een technische gewoonte doorbreken die een speler al
  jaren heeft. Maar diezelfde feedback, op de verkeerde manier gebracht, kan een speler
  onzeker maken en zijn zelfvertrouwen ondermijnen.
</p>
<p>
  Goede feedback is een vaardigheid. En net als elke vaardigheid kun je die aanleren en
  systematisch verbeteren. In dit artikel vind je vijf concrete tips om als hockeycoach
  feedback te geven die spelers écht verder helpt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  1. Wees specifiek, niet algemeen
</h2>
<p>
  &ldquo;Goed gedaan&rdquo; en &ldquo;je moet meer aandacht geven&rdquo; zijn twee zinnen die
  spelers tientallen keren per seizoen horen — en vrijwel nooit onthouden. Specifieke feedback
  blijft hangen omdat het een concreet beeld oproept.
</p>
<p>
  Vergelijk: &ldquo;Je loopbaan was goed&rdquo; met &ldquo;Je tiende de defender mee door
  diep te lopen en creëerde daarmee ruimte voor de oversteek van links — precies wat we
  hadden geoefend.&rdquo; Het tweede geeft de speler een helder mentaal model om op te bouwen.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  2. Geef feedback op gedrag, niet op persoon
</h2>
<p>
  Dit klinkt vanzelfsprekend, maar in de hitte van een wedstrijd of intensieve training glijden
  coaches makkelijk af naar persoonlijke commentaar. &ldquo;Jij denkt altijd te langzaam&rdquo;
  raakt de identiteit van de speler; &ldquo;in die situatie had je eerder kunnen beslissen&rdquo;
  richt zich op een aanpasbaar gedrag.
</p>
<p>
  Het verschil in effect is groot. Feedback op gedrag activeert leergedrag. Feedback op
  persoonlijkheid activeert defensieve reacties.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  3. Gebruik de sandwich-methode — maar doe het goed
</h2>
<p>
  De klassieke feedback-sandwich (positief — verbeterpunt — positief) heeft een slechte
  reputatie gekregen omdat coaches hem te formulaïsch toepassen. Spelers prikken er
  doorheen en wachten gewoon op het &ldquo;maar&rdquo;.
</p>
<p>
  De methode werkt wél als je hem oprecht invult: begin met een specifiek sterk punt dat je
  hebt gezien, benoem het verbeterpunt met een concrete situatie, en sluit af met een
  vooruitkijkende opmerking over wat er mogelijk wordt als de speler dit verbetert. Dat
  laatste is cruciaal: het verbindt de feedback aan een positief toekomstperspectief.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  4. Timing is net zo belangrijk als inhoud
</h2>
<p>
  Direct na een fout is niet altijd het beste moment voor diepgaande feedback. In de hitte
  van een wedstrijd is de emotionele cortex overactief en verwerkt de speler weinig van wat
  je zegt. Een korte, sturende opmerking (&ldquo;breeder staan bij de cirkel&rdquo;) werkt
  dan beter dan een uitleg.
</p>
<p>
  Verwerking en reflectie vinden beter plaats op rust of na de wedstrijd. Plan voor je
  meer complexe feedback-gesprekken altijd een rustig moment in — het liefst aansluitend op
  de reflectie van de speler zelf.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  5. Maak feedback tweerichtingsverkeer
</h2>
<p>
  De meest effectieve coaches geven niet alleen feedback — ze vragen ook wat de speler zelf
  heeft ervaren. &ldquo;Hoe voelde die situatie voor jou?&rdquo; of &ldquo;Wat had jij
  op dat moment anders kunnen doen?&rdquo; Hierdoor activeer je het zelfregulerend vermogen
  van de speler, wat op de lange termijn leidt tot grotere autonomie en snellere groei.
</p>
<p>
  Spelers die leren hun eigen spel te analyseren hebben minder aanwijzingen nodig naarmate het
  seizoen vordert. Dat is het einddoel: een speler die zichzelf coacht.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Digitale tools als verlengstuk van coaching
</h2>
<p>
  Feedback geven is niet beperkt tot het veld. Met Deco kunnen coaches feedback geven op
  de reflecties en doelen van individuele spelers — direct vanuit de app. Een speler schrijft
  na de training wat goed ging en wat beter kan; de coach reageert met gerichte opmerkingen
  en aanmoedigingen.
</p>
<p>
  Dit lost een van de grootste beperkingen van coaching op: de beschikbare tijd op het veld.
  Een team van vijftien spelers, twee trainingen per week — het is onmogelijk om elke speler
  voldoende individuele aandacht te geven. Asynchroon feedback geven via Deco maakt het
  mogelijk om toch elk speler wekelijks individueel te bereiken, zonder dat dit ten koste
  gaat van de groepstraining.
</p>
<p>
  Coaches die dit systematisch doen, zien hun spelers niet alleen technisch groeien — ze
  zien ook een sterkere relatie en meer openheid in het contact. Spelers voelen zich gezien,
  en dat is de basis voor een veilige leeromgeving.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Goede feedback is geen kunst — het is een vaardigheid die je kunt trainen. Begin bij één
  tip, oefen die bewust drie trainingen lang, en bouw dan verder. Jouw spelers zullen het
  merken.
</p>$body$,
  true
),

-- 4. hockey-apps-vergelijken (separate page component)
(
  'hockey-apps-vergelijken',
  'De beste hockey apps van 2026: een vergelijking',
  '2026-03-26',
  'Welke hockey app past bij jou? Vergelijk Deco, Sportlyzer, TeamSnap en andere tools voor spelers en coaches die willen groeien.',
  'Deco Team',
  $body$<p>
  Het aanbod aan sportapps groeit snel, maar welke tool helpt jou als hockeyspeler of
  -coach écht verder? Niet elke app is gemaakt met hockey in gedachten, en veel tools
  lossen slechts een deel van het puzzel op. Of je nu je persoonlijke ontwikkeling wilt
  bijhouden, je team wilt organiseren of diepere feedback wilt ontvangen — de keuze
  bepaalt hoeveel je er uiteindelijk uithaalt. In dit artikel vergelijken we de
  belangrijkste apps naast elkaar, zodat je een weloverwogen keuze kunt maken.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-4">
  Vergelijkingstabel: hockey apps op een rij
</h2>
<p>
  De tabel hieronder geeft een snel overzicht van de zes meest gebruikte oplossingen.
  Let op de kolommen <em>Speler features</em> en <em>Hockey-specifiek</em> — dat zijn
  vaak de doorslaggevende factoren voor individuele ontwikkeling.
</p>

<div class="overflow-x-auto -mx-6 px-6">
  <table class="w-full min-w-[600px] border-collapse text-sm mt-4">
    <thead>
      <tr class="bg-deco-primary-dark text-white">
        <th class="text-left px-4 py-3 font-semibold rounded-tl-xl">App</th>
        <th class="text-left px-4 py-3 font-semibold">Focus</th>
        <th class="text-center px-4 py-3 font-semibold">Speler</th>
        <th class="text-center px-4 py-3 font-semibold">Coach</th>
        <th class="text-center px-4 py-3 font-semibold">Gratis</th>
        <th class="text-center px-4 py-3 font-semibold rounded-tr-xl">Hockey-specifiek</th>
      </tr>
    </thead>
    <tbody>
      <tr class="bg-deco-primary/8 border border-deco-primary/30">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">
          <span class="flex items-center gap-2">Deco <span class="text-[10px] font-extrabold uppercase tracking-wide bg-deco-accent text-deco-primary-dark px-1.5 py-0.5 rounded-full leading-none">Aanbevolen</span></span>
        </td>
        <td class="px-4 py-3 text-deco-text-secondary">Persoonlijke ontwikkeling, doelen, reflectie, AI-feedback</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
      </tr>
      <tr class="bg-deco-bg">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">Sportlyzer</td>
        <td class="px-4 py-3 text-deco-text-secondary">Teammanagement, trainingsplanning</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">Deels</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
      </tr>
      <tr class="bg-white">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">TeamSnap</td>
        <td class="px-4 py-3 text-deco-text-secondary">Planning, logistiek, communicatie</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">Deels</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">Deels</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
      </tr>
      <tr class="bg-deco-bg">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">Coach's Eye / Hudl</td>
        <td class="px-4 py-3 text-deco-text-secondary">Videoanalyse en feedback</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
      </tr>
      <tr class="bg-white">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">Strava</td>
        <td class="px-4 py-3 text-deco-text-secondary">Fitness- en GPS-tracking</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">Deels</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
      </tr>
      <tr class="bg-deco-bg">
        <td class="px-4 py-3 font-bold text-deco-primary-dark whitespace-nowrap">Pen &amp; papier</td>
        <td class="px-4 py-3 text-deco-text-secondary">Traditionele methode</td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Ja</span></td>
        <td class="px-4 py-3 text-center"><span class="inline-flex items-center gap-1 text-sm font-semibold text-deco-text-tertiary">Nee</span></td>
      </tr>
    </tbody>
  </table>
</div>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  Deco — gebouwd voor hockeyontwikkeling
</h2>
<p>
  Deco is de enige app in dit overzicht die volledig is ontworpen voor de individuele
  ontwikkeling van hockeyspelers. De kerngedachte is simpel: groei ontstaat door
  gerichte doelen te stellen, na elke training te reflecteren en structurele feedback
  van je coach te ontvangen. Deco koppelt die drie elementen aan elkaar in één
  overzichtelijke flow.
</p>
<p>
  Wat Deco onderscheidt is de combinatie van AI-gestuurde feedback op je doelen,
  gamificatie via XP en prestaties, en een coach-dashboard waarop trainers per speler
  kunnen zien hoe de ontwikkeling verloopt. Alles is gratis beschikbaar — zonder
  verborgen abonnementskosten.
</p>
<p>
  Voor teams en clubs is er een coach-omgeving waarmee de staf eenvoudig inzicht krijgt
  in de focuspunten van alle spelers. Zo worden individuele doelen zichtbaar op
  teamniveau, wat de communicatie tijdens trainingen concreter en gerichter maakt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  Sportlyzer — sterk in teammanagement, minder in individuele groei
</h2>
<p>
  Sportlyzer is een volwassen platform dat coaches uitgebreide mogelijkheden biedt voor
  het plannen van trainingen, bijhouden van aanwezigheid en communiceren met spelers.
  Voor clubs die hun administratie willen digitaliseren is het een solide keuze.
</p>
<p>
  Wat Sportlyzer mist is een serieus individueel ontwikkeltraject voor de speler zelf.
  De app is gebouwd vanuit een coach-perspectief: de speler is primair een ontvanger van
  informatie, niet een actieve deelnemer aan zijn eigen groeiproces. Bovendien is
  Sportlyzer niet hockey-specifiek; de terminologie en structuur zijn generiek voor alle
  teamsporten.
</p>
<p>
  Het platform werkt op abonnementsbasis, wat voor kleinere clubs of individuele
  spelers een drempel kan zijn. Voor grote clubs met een dedicated technische staf kan de
  investering echter gerechtvaardigd zijn.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  TeamSnap — logistiek en communicatie, niet ontwikkeling
</h2>
<p>
  TeamSnap lost een ander probleem op: de chaos van teamlogistiek. Roosters, carpooling,
  beschikbaarheid en berichten — TeamSnap centraliseert dat. Voor ouders van jonge
  hockeyspelers is het populair omdat iedereen weet wanneer training is en wie rijdt.
</p>
<p>
  Als ontwikkeltool schiet TeamSnap echter ver tekort. Er zijn geen doelstellingen,
  geen reflectietool en geen feedbackmechanisme tussen coach en speler. Het is een
  communicatieplatform, geen coachingplatform. De gratis versie is beperkt; veel
  functies vereisen een betaald teamabonnement.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  Coach's Eye / Hudl — videoanalyse voor gevorderd gebruik
</h2>
<p>
  Tools als Coach's Eye en Hudl zijn krachtig als je beschikt over de tijd en
  middelen om video-analyse serieus te nemen. Coaches kunnen beelden annoteren, slow
  motion inzetten en spelers visueel laten zien wat er beter kan. Op hoog niveau, in
  professionele of nationale jeugdprogramma's, is dit een waardevolle aanvulling.
</p>
<p>
  Voor de gemiddelde club of individuele speler zijn deze tools echter overkill. Ze zijn
  prijzig, vereisen consistente video-opnames en hebben een leercurve. Bovendien zijn ze
  generiek van opzet en niet hockey-specifiek. Als aanvulling op een solide
  ontwikkelapp kunnen ze zinvol zijn; als enige tool zijn ze onvoldoende.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  Strava — populair, maar niet voor teamsporten
</h2>
<p>
  Strava is de meest gebruikte fitnessapp ter wereld en heeft zijn waarde bewezen voor
  hardlopers en wielrenners. Voor individuele conditietraining, bijhouden van
  kilometers of vergelijken met vrienden is het uitstekend. Maar Strava houdt op waar
  hockey begint.
</p>
<p>
  De app heeft geen begrip van technische hockeyvaardigheden, geen coachfunctionaliteit
  en geen teamcontext. GPS-tracking is zinvol voor duurlopen, maar legt niet vast of je
  eerste stick verbeterd is of hoe je tactisch positioneert. Voor hockeyontwikkeling
  biedt Strava geen meerwaarde.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-3">
  Pen &amp; papier — tijdloos, maar beperkt
</h2>
<p>
  Laten we eerlijk zijn: een notitieboekje en pen zijn nog steeds een prima manier om
  doelen op te schrijven en reflecties te noteren. Veel topsporters zweren bij fysiek
  schrijven. Het nadeel is de gebrek aan structuur, de onmogelijkheid om patronen te
  zien over langere tijd, en de afwezigheid van een feedbackloop met je coach.
</p>
<p>
  Als speler zie je niet hoe je doelen zich ontwikkelen over het seizoen. Als coach heb
  je geen zicht op wat je spelers bezighoudt. Pen en papier zijn een startpunt, geen
  systeem.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-12 mb-4">
  Waarom Deco?
</h2>
<p>
  Na het bekijken van alle opties valt op dat er tot nu toe geen app bestaat die
  individuele hockeyontwikkeling, coachingfeedback en gamificatie combineert in één
  gratis pakket. Deco vult die leegte. Concreet:
</p>
<ul class="space-y-3 mt-4 pl-0 list-none">
  <li class="flex gap-3 bg-white border border-deco-border rounded-xl p-4">
    <span>
      <strong class="text-deco-primary-dark">Hockey-specifiek van de grond af.</strong>
      <span class="text-deco-text-secondary">Deco is gebouwd met en voor hockeyspelers. De doelcategorieën, reflectievragen en feedback sluiten aan op de realiteit van het spel.</span>
    </span>
  </li>
  <li class="flex gap-3 bg-white border border-deco-border rounded-xl p-4">
    <span>
      <strong class="text-deco-primary-dark">Speler én coach in één app.</strong>
      <span class="text-deco-text-secondary">Spelers stellen doelen en reflecteren; coaches zien alles terug in een overzichtelijk dashboard en kunnen per speler reageren. Geen losse tools, geen e-mails.</span>
    </span>
  </li>
  <li class="flex gap-3 bg-white border border-deco-border rounded-xl p-4">
    <span>
      <strong class="text-deco-primary-dark">AI-feedback die motiveert.</strong>
      <span class="text-deco-text-secondary">Na het vastleggen van een doel of reflectie geeft Deco directe, gepersonaliseerde AI-feedback. Niet generiek, maar gericht op jouw situatie en niveau.</span>
    </span>
  </li>
  <li class="flex gap-3 bg-white border border-deco-border rounded-xl p-4">
    <span>
      <strong class="text-deco-primary-dark">Gratis, zonder verborgen kosten.</strong>
      <span class="text-deco-text-secondary">Alle kernfuncties zijn volledig gratis beschikbaar. Geen proefperiode, geen abonnement. Gewoon downloaden en starten.</span>
    </span>
  </li>
</ul>$body$,
  true
),

-- 5. hockey-skills-verbeteren (PostHockeySkillsVerbeteren)
(
  'hockey-skills-verbeteren',
  'De 10 belangrijkste hockey skills en hoe je ze verbetert',
  '2026-03-27',
  'Van afstoppen tot de drag flick: ontdek welke technische vaardigheden het meest bepalend zijn voor je ontwikkeling en hoe je er doelgericht aan werkt.',
  'Deco Team',
  $body$<p>
  Hockey is een van de technisch meest veeleisende teamsportsoorten ter wereld. Van razendsnel
  afstoppen tot een schijnbeweging in een 1v1-duel — elke vaardigheid vraagt om honderden uren
  bewuste oefening. Maar welke skills zijn nu het meest bepalend voor je ontwikkeling als
  speler, en hoe werk je er doelgericht aan?
</p>
<p>
  In dit artikel bespreken we de tien technische vaardigheden die elke hockeyspeler zou moeten
  beheersen, met concrete tips om ze te verbeteren.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  De 10 essentiële hockey skills
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">1. Afstoppen</h3>
<p>
  Een solide stop is de basis van elk aanvalsmoment. Oefen het afstoppen van harde ballen op
  de forehand én backhand. Werk aan je lichaamshouding: lage positie, stick plat op de grond,
  ogen op de bal. Varieer met bewegende ballen vanuit verschillende hoeken.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">2. Push pass</h3>
<p>
  De push is de nauwkeurigste passeerbeweging in hockey. Let op je aanloopbeweging, het
  gewicht op je voorste voet en een vlotte doorbeweging van je stick. Oefen op afstanden van
  5 tot 20 meter en bouw snelheid op zonder accuratesse te verliezen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">3. Slepen (drag flick)</h3>
<p>
  Voor aanvallers en strafcornerspecialisten onmisbaar. Begin met een correcte greep en leer
  de rollende beweging door je pols. Bouw kracht op via kernstabiliteit — de kracht komt niet
  alleen uit je armen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">4. 1-op-1 duel</h3>
<p>
  In een 1v1 gaat het om timing, lichaamsbeheersing en het lezen van de verdediger. Oefen
  schijnbewegingen bewust: pas op het moment dat de verdediger zijn gewicht verplaatst. Wissel
  af tussen aandrijven langs links en rechts.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">5. Balbeheersing</h3>
<p>
  Balbeheersing onder druk is een vaardigheid op zich. Dribbelcircuits met obstakels, oefenen
  in krappe ruimtes en passervormen met tijdsdruk helpen je om de bal ook in wedstrijden
  comfortabel onder controle te houden.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">6. Hitting</h3>
<p>
  Een krachtige en nauwkeurige hit vraagt om een vaste techniek. Zorg voor een stabiele
  grondpositie, ogen op de bal en een consistente backswing. Oefen eerst op nauwkeurigheid,
  dan op kracht.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">7. Rugslag</h3>
<p>
  De rugslag (reverse stick hit) is een wapen dat tegenstanders verrast. Oefen de
  grondhouding en polsrotatie apart voordat je ze combineert met een volledige beweging.
  Begin langzaam en verhoog tempo pas als de techniek zit.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">8. Interceptie</h3>
<p>
  Goede intercepties beginnen bij loopwerk en anticipatie, niet bij stickwerk. Leer de
  passeerlijnen van tegenstanders te lezen en positioneer je proactief. Oefenvormen met
  interceptiedruk helpen je om dit automatisch te maken.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">9. Penaltycorner verdedigen</h3>
<p>
  Verdedigen bij een strafcorner vereist explosiviteit en een goede startpositie. Oefen de
  uitlooptechniek met een coach of video-analyse. De eerste twee stappen zijn bepalend.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">10. Samenspelen in kleine ruimtes</h3>
<p>
  Hockey wordt steeds compacter gespeeld. Snelle combinaties, één-tweeën en het lossen van de
  druk door slim te bewegen zijn essentiële samenspeelvaardigheden. Speel regelmatig 3v3 en
  4v4 oefenpartijen op kleine velden.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Gerichte ontwikkeling met Deco
</h2>
<p>
  Weten welke skills je moet verbeteren is één ding — bijhouden hoe je vordert is een ander.
  In Deco kun je met de <strong>skill radar</strong> precies aangeven op welke technische
  vaardigheden jij je dit seizoen focust. Per skill stel je een ontwikkeldoel in, koppel je
  trainingsreflecties en zie je je progressie in één oogopslag terug.
</p>
<p>
  Je coach kan je skill radar bekijken en gerichte feedback geven op de gebieden waar jij
  bewust aan werkt. Zo werken speler en coach altijd vanuit hetzelfde beeld.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Kies deze week één skill uit de lijst, stel een concreet doel en begin er bewust aan te
  werken. Consistente focus op één punt levert meer op dan oppervlakkig aan alles tegelijk
  sleutelen.
</p>$body$,
  true
),

-- 6. mentale-weerbaarheid-hockey (PostMentaleWeerbaarheid)
(
  'mentale-weerbaarheid-hockey',
  'Mentale weerbaarheid in hockey: 7 tips voor jonge spelers',
  '2026-03-29',
  'Techniek en conditie zijn belangrijk, maar het zijn je hoofd dat bepaalt wie je op het veld bent. Leer hoe je mentaal sterker wordt met zeven concrete tips.',
  'Deco Team',
  $body$<p>
  Je hebt de techniek, je bent fit en je kent de tactiek. Toch loopt het soms vast op het
  moment dat het er écht op aankomt. Een gemiste kans, een coach die schreeuwt, een
  tegenstander die steeds het duel wint. In zulke momenten beslist je hoofd wie je op het
  veld bent.
</p>
<p>
  Mentale weerbaarheid is geen talent — het is een vaardigheid. En net als je techniek kun je
  het trainen. Hier zijn zeven concrete tips voor jonge hockeyspelers om mentaal sterker te
  worden.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  7 tips voor mentale weerbaarheid
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1. Bouw een vaste voorbereiding (preperformance routine)
</h3>
<p>
  Topspelers in alle sporten gebruiken vaste routines voor een wedstrijd of training. Niet
  omdat ze bijgelovig zijn, maar omdat een routine je hersenen in de juiste staat brengt.
  Kies iets simpels: altijd dezelfde warming-up, twee minuten rustig ademhalen, een
  persoonlijk cue-woord. Consistentie bouwt vertrouwen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  2. Visualiseer voor de wedstrijd
</h3>
<p>
  Visualisatie is bewezen effectief in sportpsychologie. Sluit je ogen en zie jezelf een
  actie correct uitvoeren: een push, een dribbel, het verdedigen van een 1v1. Je brein maakt
  nauwelijks onderscheid tussen een levendige voorstelling en de echte uitvoering. Vijf
  minuten per dag is genoeg om effect te zien.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  3. Accepteer fouten als onderdeel van het proces
</h3>
<p>
  Elk topspeler maakt fouten. Het verschil zit in de reactie. Spelers die na een fout blijven
  hangen in frustratie, verliezen hun concentratie voor de volgende actie. Train jezelf om
  een fout snel los te laten: erken het, leer ervan, en ga door. Een korte ademhaling of een
  vaste frase helpt daarbij (&ldquo;volgende kans&rdquo;, &ldquo;loslaten&rdquo;).
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  4. Focus op wat jij kunt controleren
</h3>
<p>
  De scheidsrechter, het veld, de tegenstander, het weer — je kunt er niets aan veranderen.
  Richt je energie op wat wel in jouw macht ligt: jouw inzet, jouw communicatie, jouw
  keuzes. Spelers die dit bewust oefenen, worden rustiger en stabieler onder druk.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  5. Praat positief tegen jezelf
</h3>
<p>
  Zelfspreuk (self-talk) heeft directe invloed op prestaties. Negatieve interne spraak
  (&ldquo;Ik kan dit niet&rdquo;, &ldquo;Ik ben altijd te langzaam&rdquo;) remt je af.
  Vervang ze bewust door neutrale of positieve alternatieven. Dit is geen positief denken uit
  een zelfhulpboek — het is een concrete mentale vaardigheid die getraind kan worden.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  6. Leer ontspannen onder druk
</h3>
<p>
  Diafragmatisch ademhalen — langzaam inademen via de neus, uitademen via de mond — activeert
  je parasympathisch zenuwstelsel en verlaagt stresshormonen. Oefen dit buiten de sport, zodat
  je het in drukke wedstrijdmomenten automatisch kunt inzetten. Twee minuten voor aanvang van
  een strafcorner kan het verschil maken.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  7. Reflecteer op je mentale prestaties, niet alleen technische
</h3>
<p>
  Na een training of wedstrijd stellen de meeste spelers vragen over techniek en tactiek. Maar
  hoe ging je mentaal? Hoe reageerde je op tegenslag? Bleef je geconcentreerd in het tweede
  kwart? Door hier bewust op te reflecteren, bouw je mentale zelfkennis op — en dat is de
  basis voor echte mentale groei.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Mentale ontwikkeling bijhouden met Deco
</h2>
<p>
  In Deco kun je na elke training of wedstrijd ook mentale aandachtspunten meenemen in je
  reflectie. Stel een doel rondom concentratie of omgaan met fouten, en koppel per sessie
  je ervaringen. Zo zie je over weken en maanden of je mentale weerbaarheid daadwerkelijk
  groeit — en geef je je coach concrete handvatten om je daarin te begeleiden.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Mentale weerbaarheid bouw je stap voor stap. Kies één tip uit dit artikel en pas hem de
  komende twee weken bewust toe. Daarna voeg je een volgende toe. Kleine gewoontes, groot
  effect.
</p>$body$,
  true
),

-- 7. hockey-training-schema (PostHockeyTrainingSchema)
(
  'hockey-training-schema',
  'Het perfecte hockey trainingsschema: zo plan je je week',
  '2026-04-01',
  'Hoe je je week indeelt bepaalt hoe snel je groeit als hockeyspeler. Ontdek hoe je een effectief trainingsschema opbouwt met de juiste balans tussen belasting en herstel.',
  'Deco Team',
  $body$<p>
  Hoe je je week indeelt, bepaalt voor een groot deel hoe snel je als hockeyspeler groeit.
  Een goede weekplanning gaat niet alleen over hard trainen — het gaat over slim trainen. De
  juiste balans tussen belasting en herstel, tussen techniektraining en wedstrijden, tussen
  structuur en flexibiliteit.
</p>
<p>
  In dit artikel leer je hoe je een effectief hockey trainingsschema opbouwt, ongeacht je
  niveau of leeftijd.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  De bouwstenen van een goede hockeyweek
</h2>
<p>
  Een optimale trainingsweek voor een hockeyspeler bestaat uit vier elementen:
</p>
<ul class="list-disc list-inside space-y-2 ml-2">
  <li><strong>Teamtrainingen</strong> — tactiek, samenspel en conditie in groepsverband</li>
  <li><strong>Individuele training</strong> — gericht werken aan persoonlijke zwakke punten</li>
  <li><strong>Wedstrijden</strong> — competitie als leermoment, niet alleen als prestatiemoment</li>
  <li><strong>Herstel</strong> — actief of passief; even belangrijk als de training zelf</li>
</ul>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Een voorbeeldschema per niveau
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Jeugdspeler (D/C-niveau, 10-14 jaar)
</h3>
<p>
  Op jonge leeftijd staat plezier en motorische ontwikkeling voorop. Twee à drie
  teamtrainingen per week zijn meer dan voldoende, aangevuld met één korte individuele
  oefensessie van 20-30 minuten.
</p>
<ul class="list-disc list-inside space-y-1 ml-2 text-sm">
  <li>Maandag: rust of lichte beweging</li>
  <li>Dinsdag: teamtraining</li>
  <li>Woensdag: individueel (techniek + balbeheersing, 25 min)</li>
  <li>Donderdag: teamtraining</li>
  <li>Vrijdag: rust</li>
  <li>Zaterdag: wedstrijd</li>
  <li>Zondag: actief herstel (fietsen, wandelen)</li>
</ul>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Seniore recreatief speler
</h3>
<p>
  Voor recreatieve spelers is consistentie het sleutelwoord. Twee trainingen en één wedstrijd
  per week, aangevuld met één extra conditiesessie buiten het hockeyveld.
</p>
<ul class="list-disc list-inside space-y-1 ml-2 text-sm">
  <li>Maandag: rust</li>
  <li>Dinsdag: teamtraining</li>
  <li>Woensdag: conditie (hardlopen of crosstraining, 30-40 min)</li>
  <li>Donderdag: teamtraining</li>
  <li>Vrijdag: rust of individueel stickwerk</li>
  <li>Zaterdag: wedstrijd</li>
  <li>Zondag: rust</li>
</ul>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Ambitieuze jeugdspeler (B/A-niveau)
</h3>
<p>
  Op hogere niveaus neemt de trainingsfrequentie toe. Let goed op herstelbalans: meer is niet
  altijd beter.
</p>
<ul class="list-disc list-inside space-y-1 ml-2 text-sm">
  <li>Maandag: individueel (skill-gericht, 45 min)</li>
  <li>Dinsdag: teamtraining (intensief)</li>
  <li>Woensdag: kracht + conditie</li>
  <li>Donderdag: teamtraining (tactisch)</li>
  <li>Vrijdag: actief herstel of lichte techniek</li>
  <li>Zaterdag: wedstrijd</li>
  <li>Zondag: rust</li>
</ul>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Principes voor een effectief schema
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Progressieve belasting
</h3>
<p>
  Vergroot de trainingsbelasting geleidelijk over het seizoen. Wissel intensieve periodes af
  met lichtere weken (deload). Dit voorkomt overtraining en blessures.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Kwaliteit boven kwantiteit
</h3>
<p>
  Twintig minuten gefocust individueel trainen met een concreet doel levert meer op dan een
  uur mindloos ballen schieten. Plan je individuele sessies altijd met een specifiek
  aandachtspunt.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Herstel is training
</h3>
<p>
  Slaap, voeding en actief herstel zijn geen luxe — ze zijn onderdeel van je schema. Zeven
  tot negen uur slaap per nacht heeft meer effect op je prestaties dan een extra
  trainingsdag.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Je schema bijhouden met Deco
</h2>
<p>
  In Deco zie je in één oogopslag je trainingsgeschiedenis: welke sessies je hebt gehad, hoe
  je je voelde en wat je per training hebt geoefend. Zo kun je patronen herkennen — wanneer
  je het beste presteert, wanneer je vermoeid bent — en je schema daar op aanpassen.
</p>
<p>
  Coaches kunnen per speler de trainingsfrequentie en reflecties bekijken, zodat ze
  individuele aanbevelingen kunnen doen over herstel en prioriteiten. Een goed schema is
  persoonlijk, en Deco helpt om dat inzicht te bouwen.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Begin met het schema dat bij je huidige niveau past. Voer het twee weken consequent uit en
  evalueer dan: voel je je uitgerust, gemotiveerd en verbeter je? Dan zit je op de goede weg.
</p>$body$,
  true
),

-- 8. gamification-sport (PostGamificatieSport)
(
  'gamification-sport',
  'Gamification in jeugdhockey: hoe XP en achievements motivatie verhogen',
  '2026-04-03',
  'XP, badges en ranglijsten zijn meer dan spelletjes — ze zijn bewezen motivatietools. Ontdek hoe gamification werkt in jeugdsport en hoe Deco dit toepast.',
  'Deco Team',
  $body$<p>
  Je kent het gevoel: een game die je net &ldquo;één level verder&rdquo; wil spelen, ook als
  het al laat is. Punten verzamelen, een badge verdienen, hoger op de ranglijst klimmen — het
  heeft iets verslavends. Geen toeval: het zijn bewust ontworpen motivatiemechanismes. En
  dezelfde principes werken verrassend goed in sport.
</p>
<p>
  Gamification — het toepassen van game-elementen buiten games — wint terrein in jeugdsport.
  Niet als truc, maar als serieuze aanpak om intrinsieke motivatie te versterken. Hier lees
  je hoe het werkt, wat de wetenschap erover zegt en hoe Deco het toepast in hockey.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Waarom motivatie het grootste obstakel is in jeugdsport
</h2>
<p>
  Onderzoek van de <em>Aspen Institute</em> toont dat meer dan 70% van de jeugdsporters voor
  hun 13e jaar stopt met sport, waarbij gebrek aan plezier en motivatie de meest genoemde
  redenen zijn. Techniek en tactiek zijn soms in orde — maar de wil om te blijven trainen
  ontbreekt.
</p>
<p>
  Traditionele motivatietools in sport — winnen, selectie, coaches die complimenten geven —
  zijn afhankelijk van externe factoren. Gamification helpt om de motivatie te internaliseren:
  de speler ervaart zelf dat zijn inzet loont.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  De drie kernmechanismes van gamification
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1. XP en voortgangsregistratie
</h3>
<p>
  Experience points (XP) maken abstracte vooruitgang zichtbaar en concreet. Elke training die
  je afrondt, elk doel dat je bijwerkt, elke reflectie die je schrijft — het levert iets op.
  Dit sluit aan bij de <strong>Self-Determination Theory</strong> van Deci en Ryan, die
  aantoont dat het gevoel van competentie (zien dat je vordert) een primaire drijfveer is voor
  volgehouden motivatie.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  2. Achievements en mijlpalen
</h3>
<p>
  Badges en achievements belonen specifiek gedrag: een reeks trainingen bijgehouden, een
  doelstelling gehaald, drie reflecties geschreven. Ze maken de weg naar grote doelen
  behapbaar door kleine overwinningen te vieren. Onderzoek in onderwijsgamificatie
  (Hamari, 2017) toont dat achievements de doorzettingsvermogen aanzienlijk verhogen,
  met name bij jongeren.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  3. Ranglijsten en sociaal vergelijken
</h3>
<p>
  Een ranglijst tussen ploeggenoten creëert gezonde competitie en sociale verbondenheid. De
  sleutel is dat de ranglijst gebaseerd is op <em>inzet</em> en <em>consistentie</em>, niet
  alleen op talent. Zo kan een speler die minder aanleg heeft maar heel betrokken is, hoog
  eindigen — een krachtig signaal voor de ploeg.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Valkuilen om te vermijden
</h2>
<p>
  Gamification werkt alleen als het intrinsieke motivatie versterkt, niet vervangt. Wanneer
  spelers uitsluitend voor punten spelen en niet meer voor de sport zelf, is er sprake van
  &ldquo;overjustification effect&rdquo;: de externe beloning ondermijnt de innerlijke
  motivatie. Goede gamification is dan ook subtiel: het beloont gedrag dat ertoe doet (inzet,
  reflectie, consistentie) en niet enkel aanwezigheid.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Hoe Deco gamification toepast
</h2>
<p>
  In Deco verdienen spelers XP voor elke zinvolle actie: een training registreren, een doel
  bijwerken, een reflectie schrijven na een sessie. Achievements worden uitgereikt voor
  mijlpalen zoals &ldquo;5 trainingen op rij bijgehouden&rdquo; of &ldquo;eerste seizoensdoel
  behaald&rdquo;.
</p>
<p>
  De teamranglijst laat zien wie het meest betrokken is — niet wie het beste speelt. Zo wordt
  betrokkenheid zichtbaar en gewaardeerd, ook voor spelers die technisch nog minder ver zijn.
  Coaches zien welke spelers actief bezig zijn met hun ontwikkeling en kunnen die inzet
  benoemen en belonen.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Gamification is geen gimmick — het is een bewezen manier om gedrag te sturen. Als de
  punten beloond worden voor de juiste dingen, ontstaat er een cultuur van bewuste
  ontwikkeling in je team.
</p>$body$,
  true
),

-- 9. spelerontwikkeling-bijhouden (PostSpelerontwikkelingBijhouden)
(
  'spelerontwikkeling-bijhouden',
  'Spelerontwikkeling digitaal bijhouden: waarom pen en papier niet meer werkt',
  '2026-04-06',
  'Losse notities en Whatsapp-berichten schieten tekort als je spelers écht wilt begeleiden. Ontdek waarom digitale ontwikkelingsregistratie beter werkt voor coach en speler.',
  'Deco Team',
  $body$<p>
  Een notitieblokje in de zak, losse Whatsapp-berichten, een Excel-bestand vol tabs —
  coaches hebben altijd creatieve oplossingen bedacht om spelerontwikkeling bij te houden.
  Maar in een tijd waarin data en technologie de sport transformeren, is het de vraag of pen
  en papier nog voldoende is.
</p>
<p>
  Dit artikel legt uit waarom digitale ontwikkelingsregistratie niet alleen handiger is, maar
  ook betere beslissingen oplevert voor coach én speler.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Het probleem met papier
</h2>
<p>
  Papier heeft één fundamenteel probleem: het schaalt niet. Een coach met 16 spelers die elk
  op drie of vier ontwikkelpunten werken, heeft al snel 48-64 losse datapunten per training te
  beheren. Notities raken kwijt, worden niet teruggelezen, en bevatten zelden de context die
  weken later nog relevant is.
</p>
<p>
  Daarnaast is papier eenrichtingsverkeer. De coach schrijft, de speler weet van niets. Er
  is geen dialoog, geen gezamenlijk overzicht, geen gedeeld begrip van waar de speler naartoe
  werkt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Wat digitaal anders maakt
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Trendanalyse over tijd
</h3>
<p>
  Digitale registratie maakt patronen zichtbaar die je met losse notities nooit zou zien. Is
  een speler consistent sterk na rust maar zwak in de eerste vijf minuten? Neemt zijn
  motivatiescore af naarmate het seizoen vordert? Verbetert zijn afstoppen structureel of
  blijft het schommelen? Data over meerdere weken geeft antwoorden op die vragen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Objectiviteit naast gevoel
</h3>
<p>
  Coachen op gevoel is waardevol, maar gevoel heeft blinde vlekken. We herinneren ons de
  laatste sessies het beste (recency bias) en hebben de neiging om bij bepaalde spelers meer
  op te letten dan andere. Gestructureerde data corrigeert die blinde vlekken — niet om het
  gevoel te vervangen, maar om het aan te scherpen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  De speler als actief deelnemer
</h3>
<p>
  Wanneer spelers zelf hun doelen bijhouden, reflecties schrijven en hun voortgang zien,
  verandert hun rol van passief object van coaching naar actief subject van ontwikkeling. Dit
  is een van de sterkste voorspellers van langetermijngroei in sport: de speler die eigenaar
  is van zijn eigen proces.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Efficiëntere gesprekken
</h3>
<p>
  Een evaluatiegesprek van tien minuten is waardevol als beide partijen dezelfde informatie
  voor zich hebben. Zonder gemeenschappelijk overzicht beginnen coach en speler het gesprek
  vanuit verschillende kaders en gaat veel tijd verloren aan reconstructie. Met gedeelde
  data ga je direct de diepte in.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Wat een digitaal systeem moet kunnen
</h2>
<ul class="list-disc list-inside space-y-2 ml-2">
  <li>Doelen vastleggen en koppelen aan trainingen en wedstrijden</li>
  <li>Spelerreflecties bijhouden in een gestructureerde vorm</li>
  <li>Inzicht geven in voortgang over de tijd, per speler en per vaardigheid</li>
  <li>Communicatie mogelijk maken tussen coach en speler</li>
  <li>Eenvoudig genoeg zijn dat zowel speler als coach het consequent gebruiken</li>
</ul>
<p>
  Dat laatste punt is cruciaal. Het beste systeem is het systeem dat iedereen daadwerkelijk
  gebruikt.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Deco als digitale ontwikkelingstool
</h2>
<p>
  Deco is specifiek gebouwd voor hockeyspelers en hun coaches. Spelers stellen doelen in de
  app, schrijven na elke training een korte reflectie en zien hun voortgang in overzichtelijke
  grafieken. Coaches bekijken alle spelersprofielen in één dashboard, geven directe feedback
  op doelen en reflecties en houden realtime bij wie actief bezig is met zijn ontwikkeling.
</p>
<p>
  Geen losse notities meer. Geen informatie die verloren gaat. Alleen een helder, gedeeld
  beeld van wie jouw speler is en waar hij naartoe gaat.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  De overstap van papier naar digitaal hoeft niet groot te zijn. Begin met het vastleggen van
  één ding — doelen of reflecties — en bouw van daaruit. De data die je opbouwt, is over een
  heel seizoen goud waard.
</p>$body$,
  true
),

-- 10. hockey-keeper-training (PostHockeyKeeperTraining)
(
  'hockey-keeper-training',
  'Hockey keeper training: specifieke oefeningen en doelen stellen',
  '2026-04-08',
  'De keeper is de meest specialistische positie in hockey. Leer welke oefeningen het meeste opleveren en hoe je gerichte keepersdoelen stelt.',
  'Deco Team',
  $body$<p>
  De keeper is de meest specialistische positie in hockey. Terwijl het veldspel steeds meer
  teamgericht wordt, staat de keeper als individu voor unieke technische, fysieke en mentale
  uitdagingen. Toch wordt keeperstraining in de jeugd vaak ondergewaardeerd — terwijl een
  goede keeper een team enorm kan optillen.
</p>
<p>
  In dit artikel vind je concrete oefeningen, ontwikkelprincipes en tips voor het stellen van
  keepersgerichte doelen.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  De unieke eisen aan een hockeykeeper
</h2>
<p>
  Een hockeykeeper heeft vaardigheden nodig die geen veldspeler hoeft te beheersen:
</p>
<ul class="list-disc list-inside space-y-2 ml-2">
  <li>Explosieve laterale bewegingen in zwaar keepersmateriaal</li>
  <li>Lezen van de richting van een drag flick in fracties van een seconde</li>
  <li>Voetwerk en blokkeertechniek bij strafcorners</li>
  <li>Communicatie als achterspeler en coach vanuit de goal</li>
  <li>Mentale rust na het slikken van een doelpunt</li>
</ul>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Specifieke keepersoefeningen
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Reactieoefeningen
</h3>
<p>
  Goede reactietijd begint bij de juiste startpositie. Oefen vanuit een actieve grondhouding
  (licht gehurkt, gewicht op de ballen van de voeten) en laat een assistent ballen schieten
  op verschillende hoogtes. Varieer het moment van schieten zodat de keeper niet kan
  anticiperen op timing.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Padsave en voetsave training
</h3>
<p>
  Veel keepers zijn te sterk gericht op stickwerk. Oefen bewust het blokkeren met de linker-
  en rechterpad afzonderlijk. Laat iemand laag schieten naar de hoeken en focus op het
  dichtgooien van de ruimte met de juiste lichaamsrotatie, niet alleen armreactie.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Strafcornerblokkade
</h3>
<p>
  De uitlooptechniek bij een strafcorner is cruciaal. Oefen de eerste twee stappen bewust:
  explosief starten, lage lichaamshouding behouden en de hoek afdekken. Doe dit eerst zonder
  bal (puur timing en explosiviteit), daarna met gesimuleerde flicks.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1v1 uitlooptraining
</h3>
<p>
  Bij een uitlopende tegenstander moet de keeper de hoek verkleinen zonder te vroeg te
  gokken. Oefen in een 1v1-scenario: keeper loopt uit, aanvaller drijft op doel af. Focus op
  lichaamshouding, voetwerk en het moment van de keuze.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  Distributieoefeningen
</h3>
<p>
  Een keeper die snel en accuraat kan verdelen, is een aanvalswapen. Oefen korte uitrol naar
  de zijverdediger én lange slagen naar aanvallers in de andere helft. Combineer met een
  quick-release moment direct na een stop.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Doelen stellen als keeper
</h2>
<p>
  Keepersdoelen zijn vaak moeilijker te kwantificeren dan veldspelersdoelen, maar het is
  zeker mogelijk. Voorbeelden van effectieve keepersdoelen:
</p>
<ul class="list-disc list-inside space-y-2 ml-2">
  <li>
    &ldquo;Mijn uitlooptechniek bij strafcorners verbeteren: voor eind november consistent de
    juiste startpositie innemen in 8 van de 10 herhalingen.&rdquo;
  </li>
  <li>
    &ldquo;Mijn communicatie naar de verdediging verbeteren: elke wedstrijd minstens vijf
    bewuste aanwijzingen geven.&rdquo;
  </li>
  <li>
    &ldquo;Na een tegendoelpunt mijn concentratie terugvinden binnen één minuut, elke keer.&rdquo;
  </li>
</ul>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Deco voor keepers
</h2>
<p>
  Deco werkt net zo goed voor keepers als voor veldspelers. Bij het aanmaken van je profiel
  kies je je positie — inclusief keeper — en stel je gerichte ontwikkeldoelen in die passen
  bij de keeperspositie. Je reflecteert na trainingen op wat je hebt geoefend en je coach
  kan direct feedback geven op je keepersontwikkeling.
</p>
<p>
  Zo wordt je keeperstraining net zo gestructureerd en inzichtelijk als het veldspel —
  iets wat keepers op het hoogste niveau al lang weten, maar ook op clubniveau grote
  voordelen oplevert.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Keepers worden gemaakt, niet geboren. Structureer je training, stel gerichte doelen en
  reflecteer na elke sessie op wat je hebt geoefend. Het verschil zit in de details.
</p>$body$,
  true
),

-- 11. hockey-seizoen-evaluatie (PostHockeySeizoenevaluatie)
(
  'hockey-seizoen-evaluatie',
  'Seizoenreflectie: zo evalueer je je hockeyseizoen effectief',
  '2026-04-10',
  'Het seizoen zit erop. Nu begint het waardevolste moment van het jaar: de seizoenreflectie. Leer hoe je terugkijkt op een manier die je echt verder helpt.',
  'Deco Team',
  $body$<p>
  Het seizoen zit erop. De laatste wedstrijd is gespeeld, het materiaal is opgeruimd en het
  veld ligt er stil bij. Voor de meeste spelers is dit het moment om even los te laten en
  bij te komen. Maar voor spelers die bewust willen groeien, is dit ook het meest waardevolle
  moment van het jaar: de seizoenreflectie.
</p>
<p>
  Een goede seizoenreflectie duurt geen uren. Maar het vraagt wel een gestructureerde aanpak.
  In dit artikel lees je hoe je je hockeyseizoen effectief evalueert en hoe je die inzichten
  vertaalt naar concrete plannen voor volgend seizoen.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Waarom seizoenreflectie zo belangrijk is
</h2>
<p>
  Eén training reflecteren geeft je inzicht in een moment. Een volledig seizoen reflecteren
  geeft je inzicht in een patroon. Je ziet welke aanpak werkte, welke doelen je hebt behaald
  en welke steeds opnieuw bleven liggen. Zonder die reflectie begin je elk nieuw seizoen
  feitelijk van nul — met dezelfde aanpak, dezelfde valkuilen en dezelfde blinde vlekken.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  De drie lagen van een seizoenreflectie
</h2>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  1. Wat ging goed?
</h3>
<p>
  Begin altijd met de positieve kant. Niet om jezelf een goed gevoel te geven, maar omdat
  het identificeren van wat werkte net zo waardevol is als het signaleren van zwakke punten.
  Wat zijn de drie momenten dit seizoen waarop je het beste speelde? Welke techniek of
  gewoonte heeft het meest bijgedragen aan je groei? Welke trainingsperiode voelde het meest
  productief?
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  2. Wat kon beter?
</h3>
<p>
  Wees eerlijk en specifiek. Niet &ldquo;ik had beter moeten trainen&rdquo;, maar &ldquo;ik
  miste consistentie in mijn individuele sessies na februari&rdquo;. Niet &ldquo;ik was
  mentaal niet sterk genoeg&rdquo;, maar &ldquo;ik liet mij te veel afleiden door commentaar
  van de kant&rdquo;. Specifieke observaties leiden tot specifieke verbeteringen.
</p>

<h3 class="text-xl font-bold text-deco-primary-dark mt-8 mb-2">
  3. Wat wil ik anders doen?
</h3>
<p>
  Dit is de brug naar volgend seizoen. Vertaal je inzichten naar concrete intenties. Niet
  &ldquo;ik wil meer trainen&rdquo;, maar &ldquo;ik wil twee keer per week een individuele
  sessie van 25 minuten plannen, maandag en woensdag&rdquo;. Kleine, concrete aanpassingen
  zijn altijd effectiever dan grote abstracte voornemens.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Vragen om jezelf te stellen
</h2>
<p>
  Gebruik deze vragen als leidraad voor je reflectiegesprek met jezelf of je coach:
</p>
<ul class="list-disc list-inside space-y-2 ml-2">
  <li>Welke doelen had ik aan het begin van het seizoen gesteld? Heb ik ze gehaald?</li>
  <li>Op welke vaardigheid ben ik het meest gegroeid dit seizoen?</li>
  <li>Welke vaardigheid heeft mij het meeste moeite gekost?</li>
  <li>Hoe was mijn trainingsattitude? Was ik gefocust en betrokken?</li>
  <li>Hoe reageerde ik op fouten en tegenslagen?</li>
  <li>Wat was mijn bijdrage aan de teamcultuur?</li>
  <li>Wat was de beste feedback die ik van mijn coach heb gekregen dit seizoen?</li>
  <li>Als ik één ding anders zou doen, wat zou dat zijn?</li>
</ul>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Van reflectie naar seizoensdoelen
</h2>
<p>
  Een goede seizoenreflectie eindigt niet met terugkijken — ze begint met vooruitkijken. Stel
  op basis van je inzichten twee à drie concrete doelen voor het nieuwe seizoen. Schrijf ze
  op. Bespreek ze met je coach. En bewaar ze zodat je ze aan het begin van het nieuwe seizoen
  terug kunt lezen.
</p>
<p>
  Spelers die hun doelen opschrijven, halen ze aantoonbaar vaker dan spelers die dat niet
  doen. Het is één van de meest onderbouwde bevindingen in sportpsychologisch onderzoek.
</p>

<h2 class="text-2xl font-extrabold text-deco-primary-dark mt-10 mb-3">
  Deco als reflectietool voor het seizoen
</h2>
<p>
  Als je dit seizoen Deco hebt gebruikt, heb je een groot voordeel: al je reflecties,
  doelen en trainingsnotities staan nog in de app. Je kunt je seizoen letterlijk teruglezen
  — patroon voor patroon, week voor week. Welke doelen heb je bijgehouden, welke vielen weg?
  Wanneer was je het meest actief? Welke feedback gaf je coach?
</p>
<p>
  Deco&rsquo;s reflectiefunctie is er niet alleen voor na elke training — het is ook een
  seizoensarchief dat je elk jaar waardevoller maakt. Voortgang zien over meerdere seizoenen
  is een van de krachtigste motivatoren die er zijn.
</p>

<p class="text-deco-text-secondary text-sm border-t border-deco-border pt-6 mt-8">
  Neem deze week een uur de tijd voor je seizoenreflectie. Doe het rustig, eerlijk en
  zonder oordeel. De inzichten die je opdoet, zijn de beste investering voor je volgende
  seizoen.
</p>$body$,
  true
)

ON CONFLICT (slug) DO NOTHING;
