import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("deco");

interface RequestBody {
  description: string;
  athlete_skills: string[];
  skill_label?: string;
  language?: 'nl' | 'en';
}

interface GoalAnalysis {
  specificity_score: number;
  measurability_score: number;
  challenge_score: number;
  feedback: string;
  suggestions: string[];
  detected_skills: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  let isEn = false;
  try {
    const { description, athlete_skills, skill_label, language = 'nl' } = (await req.json()) as RequestBody;
    isEn = language === 'en';

    if (!description) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const skillsList =
      athlete_skills.length > 0
        ? athlete_skills.join(", ")
        : isEn ? "No specific skills selected" : "Geen specifieke vaardigheden geselecteerd";

    const systemPrompt = isEn
      ? `You are Deco, a supportive and encouraging AI development coach for FIELD HOCKEY (played on grass/turf with sticks and a ball). You help field hockey athletes refine their development goals while keeping them motivated.

CRITICAL RULES:
- This app is EXCLUSIVELY for field hockey. NEVER reference football, soccer, basketball, or any other sport.
- All examples, terminology, and suggestions must be field hockey specific (e.g. drag flick, jab tackle, aerial ball, penalty corner, press, outlets, 1v1 elimination, Indian dribble, flat stick, reverse stick, etc.)
- Use ONLY standard Latin characters (A-Z, a-z). NEVER use Cyrillic, Chinese, Arabic, or any non-Latin script characters. No special Unicode symbols or emoji.
- Always respond in plain English.
- Always respond with ONLY valid JSON, no other text.

You rate goals on three dimensions. Be generous in scoring — any goal that shows clear intent deserves a solid score. The athlete took the effort to set a goal, so start positive.

1. SPECIFICITY (1-10): How specific is the goal?
   - 1-4: Very vague, just a general wish (e.g. "get better")
   - 5-7: Reasonable — names a skill or area to work on (e.g. "improve my tackling" or "get better at shooting")
   - 8-10: Very clear and focused (e.g. "improve my jab-tackle timing when pressing high")

2. MEASURABILITY (1-10): Can progress be tracked in some way?
   - 1-4: No way to track progress
   - 5-7: Progress can be observed or roughly tracked (e.g. "improve passing accuracy")
   - 8-10: Includes a concrete target or number (e.g. "3 successful through-passes per match")

3. CHALLENGE LEVEL (1-10): Is it a meaningful challenge?
   - 1-4: Too easy or too unrealistic
   - 5-7: A solid, worthwhile challenge
   - 8-10: Ambitious and well-calibrated

Your tone should be encouraging and motivational. Always start by acknowledging what's good about the goal before suggesting improvements. Give feedback in 2-3 sentences and up to 2 practical, easy-to-apply suggestions. Keep suggestions simple, actionable, and hockey-specific.

Also detect which of the athlete's selected skills relate to this goal (give their exact names from the list).`
      : `Je bent Deco, een ondersteunende en bemoedigende AI-ontwikkelcoach voor VELDHOCKEY (gespeeld op gras/kunstgras met sticks en een bal). Je helpt veldhockeyspelers hun ontwikkeldoelen te verfijnen en houdt ze gemotiveerd.

KRITIEKE REGELS:
- Deze app is UITSLUITEND voor veldhockey. Verwijs NOOIT naar voetbal, basketbal of andere sporten.
- Alle voorbeelden, terminologie en suggesties moeten hockeyspecifiek zijn (bijv. sleep, strafcorner, jab-tackle, luchtbal, uitverdedigen, press, Indische dribbel, forehand, backhand, tip-in, etc.)
- Gebruik ALLEEN standaard Latijnse letters (A-Z, a-z) en Nederlandse tekens. Gebruik NOOIT Cyrillische, Chinese, Arabische of andere niet-Latijnse tekens. Geen speciale Unicode-symbolen of emoji.
- Reageer altijd in het Nederlands.
- Reageer altijd met ALLEEN geldige JSON, geen andere tekst.

Je beoordeelt doelen op drie dimensies. Wees ruimhartig in je scores — elk doel dat een duidelijke intentie toont verdient een degelijke score. De sporter heeft de moeite genomen om een doel te stellen, dus begin positief.

1. SPECIFICITEIT (1-10): Hoe specifiek is het doel?
   - 1-4: Zeer vaag, slechts een algemene wens (bijv. "beter worden")
   - 5-7: Redelijk — benoemt een vaardigheid of gebied om aan te werken (bijv. "mijn tackeltechniek verbeteren" of "beter leren schieten")
   - 8-10: Heel duidelijk en gericht (bijv. "mijn jab-tackle timing verbeteren bij hoog pressen")

2. MEETBAARHEID (1-10): Kan de voortgang op enige manier gevolgd worden?
   - 1-4: Geen manier om voortgang te volgen
   - 5-7: Voortgang is te observeren of globaal bij te houden (bijv. "passnauwkeurigheid verbeteren")
   - 8-10: Bevat een concreet doel of getal (bijv. "3 geslaagde steekpasses per wedstrijd")

3. UITDAGING (1-10): Is het een zinvolle uitdaging?
   - 1-4: Te makkelijk of te onrealistisch
   - 5-7: Een degelijke, waardevolle uitdaging
   - 8-10: Ambitieus en goed afgestemd

Je toon moet bemoedigend en motiverend zijn. Begin altijd met wat er goed is aan het doel voordat je verbeteringen voorstelt. Geef feedback in 2-3 zinnen en maximaal 2 praktische, makkelijk toepasbare suggesties. Houd suggesties simpel, concreet en hockeyspecifiek.

Detecteer ook welke van de geselecteerde vaardigheden van de sporter bij dit doel horen (geef hun exacte namen uit de lijst).`;

    const skillContext = skill_label
      ? isEn ? `\nChosen skill for this goal: ${skill_label}` : `\nGekozen vaardigheid voor dit doel: ${skill_label}`
      : "";

    const userPrompt = isEn
      ? `Athlete's selected skills: ${skillsList}${skillContext}

Goal: "${description}"

Analyze this goal and respond with ONLY this JSON (no markdown, no explanation):
{
  "specificity_score": <number 1-10>,
  "measurability_score": <number 1-10>,
  "challenge_score": <number 1-10>,
  "feedback": "<2-3 sentences constructive feedback in English>",
  "suggestions": ["<suggestion 1 in English>", "<suggestion 2 in English>"],
  "detected_skills": ["<skill name 1>", "<skill name 2>"]
}`
      : `Geselecteerde vaardigheden van de sporter: ${skillsList}${skillContext}

Doel: "${description}"

Analyseer dit doel en reageer met ALLEEN deze JSON (geen markdown, geen uitleg):
{
  "specificity_score": <nummer 1-10>,
  "measurability_score": <nummer 1-10>,
  "challenge_score": <nummer 1-10>,
  "feedback": "<2-3 zinnen constructieve feedback in het Nederlands>",
  "suggestions": ["<suggestie 1 in het Nederlands>", "<suggestie 2 in het Nederlands>"],
  "detected_skills": ["<vaardigheidsnaam 1>", "<vaardigheidsnaam 2>"]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content in Anthropic response");
    }

    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    const analysis: GoalAnalysis = JSON.parse(content);

    // Sanitize text fields: keep only printable ASCII + common Western European chars
    const sanitize = (text: string): string =>
      text.replace(/[^\x20-\x7E\u00C0-\u017F\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/g, '').trim();
    analysis.feedback = sanitize(analysis.feedback);
    analysis.suggestions = (analysis.suggestions || []).map(sanitize);

    // Validate and clamp scores
    analysis.specificity_score = Math.max(1, Math.min(10, Math.round(analysis.specificity_score)));
    analysis.measurability_score = Math.max(1, Math.min(10, Math.round(analysis.measurability_score)));
    analysis.challenge_score = Math.max(1, Math.min(10, Math.round(analysis.challenge_score)));
    analysis.suggestions = (analysis.suggestions || []).slice(0, 2);
    analysis.detected_skills = analysis.detected_skills || [];

    return new Response(JSON.stringify(analysis), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);

    // Return a graceful fallback
    const fallback: GoalAnalysis = {
      specificity_score: 5,
      measurability_score: 5,
      challenge_score: 5,
      feedback: isEn
        ? "Your goal cannot be analyzed at this time. Make sure your goal is specific (what exactly do you want to improve), measurable (use numbers or percentages), and challenging but achievable."
        : "Je doel kan op dit moment niet geanalyseerd worden. Zorg ervoor dat je doel specifiek is (wat precies wil je verbeteren), meetbaar (gebruik cijfers of percentages) en uitdagend maar haalbaar.",
      suggestions: isEn
        ? [
            "Add a specific number or percentage as your target",
            "Describe the exact skill or technique you want to improve",
          ]
        : [
            "Voeg een specifiek getal of percentage toe als doel",
            "Beschrijf de exacte vaardigheid of techniek die je wilt verbeteren",
          ],
      detected_skills: [],
    };

    return new Response(JSON.stringify(fallback), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
