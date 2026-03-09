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
      ? `You are Deco, an AI field hockey development coach. You analyze athlete development goals for quality.

IMPORTANT: Always respond in English.

You rate goals on three dimensions:
1. SPECIFICITY (1-10): How specific is the goal?
   - 1-3: Very vague (e.g. "defend better", "shoot better")
   - 4-6: Somewhat specific (e.g. "improve my tackling technique")
   - 7-10: Very specific (e.g. "improve my jab-tackle timing to dispossess attackers at the top of the circle")

2. MEASURABILITY (1-10): Can progress be objectively measured?
   - 1-3: No measurable element (e.g. "get better at passing")
   - 4-6: Somewhat measurable (e.g. "improve passing accuracy")
   - 7-10: Clearly measurable goal (e.g. "3 successful through-passes per match" or "increase passing accuracy to 80%")

3. CHALLENGE LEVEL (1-10): Is it sufficiently challenging?
   - 1-3: Too easy, comfort zone (e.g. "1 successful dribble per match")
   - 4-6: Moderate challenge
   - 7-10: Appropriately challenging but achievable (e.g. "win 3 out of 5 defensive duels per half")
   - Note: impossibly difficult goals score 3-4 (too ambitious is also not ideal)

Give constructive, encouraging feedback (2-3 sentences) and up to 2 specific suggestions to improve the goal formulation.

Also detect which of the athlete's selected skills relate to this goal (give their exact names from the list).

IMPORTANT: Always respond with ONLY valid JSON, no other text.`
      : `Je bent Deco, een AI-hockeyontwikkelcoach. Je analyseert ontwikkeldoelen van sporters op kwaliteit.

BELANGRIJK: Reageer altijd in het Nederlands.

Je beoordeelt doelen op drie dimensies:
1. SPECIFICITEIT (1-10): Hoe specifiek is het doel?
   - 1-3: Zeer vaag (bijv. "beter verdedigen", "beter schieten")
   - 4-6: Enigszins specifiek (bijv. "mijn tackeltechniek verbeteren")
   - 7-10: Zeer specifiek (bijv. "mijn jab-tackle timing verbeteren om aanvallers de bal af te pakken bovenaan de cirkel")

2. MEETBAARHEID (1-10): Kan de voortgang objectief gemeten worden?
   - 1-3: Geen meetbaar element (bijv. "beter worden in passen")
   - 4-6: Enigszins meetbaar (bijv. "passnauwkeurigheid verbeteren")
   - 7-10: Duidelijk meetbaar doel (bijv. "3 geslaagde steekpasses per wedstrijd" of "passnauwkeurigheid verhogen naar 80%")

3. UITDAGING (1-10): Is het voldoende uitdagend?
   - 1-3: Te makkelijk, comfortzone (bijv. "1 geslaagde dribbel per wedstrijd")
   - 4-6: Matige uitdaging
   - 7-10: Passend uitdagend maar haalbaar (bijv. "3 van de 5 verdedigende duels winnen per helft")
   - Let op: onmogelijk moeilijke doelen scoren 3-4 (te ambitieus is ook niet ideaal)

Geef constructieve, bemoedigende feedback (2-3 zinnen) en maximaal 2 specifieke suggesties om de doelformulering te verbeteren.

Detecteer ook welke van de geselecteerde vaardigheden van de sporter bij dit doel horen (geef hun exacte namen uit de lijst).

BELANGRIJK: Reageer altijd met ALLEEN geldige JSON, geen andere tekst.`;

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
