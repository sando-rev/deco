import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RequestBody {
  description: string;
  athlete_skills: string[];
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

  try {
    const { description, athlete_skills } = (await req.json()) as RequestBody;

    if (!description) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const skillsList =
      athlete_skills.length > 0
        ? athlete_skills.join(", ")
        : "No specific skills selected";

    const systemPrompt = `You are Deco, an AI field hockey development coach. You analyze athlete development goals for quality.

You evaluate goals on three dimensions:
1. SPECIFICITY (1-10): How specific is the goal?
   - 1-3: Very vague (e.g., "defend better", "improve shooting")
   - 4-6: Somewhat specific (e.g., "improve my tackling technique")
   - 7-10: Very specific (e.g., "improve my jab tackle timing to dispossess attackers at the top of the circle")

2. MEASURABILITY (1-10): Can progress be objectively measured?
   - 1-3: No measurable element (e.g., "get better at passing")
   - 4-6: Some measurable element (e.g., "improve passing accuracy")
   - 7-10: Clear measurable target (e.g., "complete 3 successful through-balls per match" or "increase passing accuracy to 80%")

3. CHALLENGE (1-10): Is it appropriately challenging?
   - 1-3: Too easy, comfort zone (e.g., "1 successful dribble per match")
   - 4-6: Moderate challenge
   - 7-10: Appropriately challenging but achievable (e.g., "win 3 out of 5 defensive duels per half")
   - Note: impossibly hard goals should score 3-4 (too ambitious is also not ideal)

Provide constructive, encouraging feedback (2-3 sentences) and up to 2 specific suggestions to improve the goal formulation.

Also detect which of the athlete's selected skills this goal relates to (return their exact names from the list provided).

IMPORTANT: Always respond in valid JSON format.`;

    const userPrompt = `Athlete's selected skills: ${skillsList}

Goal: "${description}"

Analyze this goal and respond in this exact JSON format:
{
  "specificity_score": <number 1-10>,
  "measurability_score": <number 1-10>,
  "challenge_score": <number 1-10>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "detected_skills": ["<skill name 1>", "<skill name 2>"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

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
      feedback:
        "Unable to analyze your goal right now. Make sure your goal is specific (what exactly you want to improve), measurable (include numbers or percentages), and challenging but achievable.",
      suggestions: [
        "Try adding a specific number or percentage target",
        "Describe the exact skill or technique you want to improve",
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
