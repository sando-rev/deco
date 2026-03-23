import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS, operates on deco schema)
// ---------------------------------------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { db: { schema: "deco" } },
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NotificationPrefs {
  pre_training: boolean;
  post_session: boolean;
  motivational: boolean;
  weekly_review: boolean;
}

interface SessionRow {
  id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm or HH:mm:ss
  end_time: string;    // HH:mm or HH:mm:ss
  session_type: string;
  reflection_id: string | null;
  notification_sent_pre: boolean;
  notification_sent_post: boolean;
  profiles: {
    push_token: string | null;
    notification_prefs: NotificationPrefs;
    notifications_paused_until: string | null;
    language: "nl" | "en";
  } | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: "default";
}

// ---------------------------------------------------------------------------
// i18n strings
// ---------------------------------------------------------------------------
interface CoachCommentRow {
  id: string;
  goal_id: string;
  content: string | null;
  is_thumbs_up: boolean;
  goals: {
    title: string;
    athlete_id: string;
    profiles: {
      push_token: string | null;
      notification_prefs: NotificationPrefs;
      notifications_paused_until: string | null;
      language: "nl" | "en";
    } | null;
  } | null;
}

const i18n = {
  coach_feedback: {
    nl: {
      title: "Nieuwe coach feedback",
      bodyThumbsUp: "Je coach heeft je doel '{{goal}}' aangemoedigd! 👍",
      bodyComment: "Je coach heeft feedback gegeven op '{{goal}}'",
    },
    en: {
      title: "New coach feedback",
      bodyThumbsUp: "Your coach encouraged your goal '{{goal}}'! 👍",
      bodyComment: "Your coach left feedback on '{{goal}}'",
    },
  },
  pre: {
    nl: {
      title: "Kies je focus",
      body: "Je sessie begint over 1 uur. Waar ga je je op focussen?",
    },
    en: {
      title: "Set your focus",
      body: "Your session starts in 1 hour. What will you focus on?",
    },
  },
  post: {
    nl: {
      title: "Hoe ging je training?",
      body: "Neem 2 minuten om te reflecteren op je focus van vandaag.",
    },
    en: {
      title: "How was your session?",
      body: "Take 2 minutes to reflect on today's focus.",
    },
  },
  weekly: {
    nl: {
      title: "Weekreflectie",
      body: "Hoe was je week? Neem even de tijd om terug te kijken op je ontwikkeling.",
    },
    en: {
      title: "Weekly reflection",
      body: "How was your week? Take a moment to look back on your development.",
    },
  },
  coach_report: {
    nl: {
      title: "Weekrapport invullen",
      body: "Neem even de tijd om een rapport te schrijven over de voortgang van je spelers deze week.",
    },
    en: {
      title: "Fill in weekly report",
      body: "Take a moment to write a report about the progress of your players this week.",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current date string (YYYY-MM-DD) in Europe/Amsterdam timezone.
 */
function todayAmsterdam(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(
    new Date(),
  );
}

/**
 * Combines a date string (YYYY-MM-DD) and a time string (HH:mm or HH:mm:ss)
 * into a Date object, treating the input as Europe/Amsterdam local time.
 *
 * We build an ISO-like string with the Amsterdam offset so that the Date
 * constructor parses it correctly regardless of the server's local timezone.
 */
function toAmsterdamDate(dateStr: string, timeStr: string): Date {
  // Normalise to HH:mm:ss
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;

  // Determine UTC offset for Europe/Amsterdam at the given moment.
  // We approximate by constructing a temporary Date and checking the offset.
  const provisional = new Date(`${dateStr}T${time}`);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(provisional);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  // offsetPart is like "GMT+1" or "GMT+2"
  const match = offsetPart.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1], 10) : 1;
  const sign = offsetHours >= 0 ? "-" : "+";
  const absHours = Math.abs(offsetHours).toString().padStart(2, "0");
  const isoString = `${dateStr}T${time}${sign === "-" ? "+" : "-"}${absHours}:00`;

  return new Date(isoString);
}

/**
 * Returns true when the profile should receive a notification.
 */
function shouldNotify(
  profile: SessionRow["profiles"],
  prefKey: "pre_training" | "post_session",
): boolean {
  if (!profile) return false;
  if (!profile.push_token) return false;
  if (!profile.notification_prefs[prefKey]) return false;

  const paused = profile.notifications_paused_until;
  if (paused && new Date(paused) > new Date()) return false;

  return true;
}

/**
 * Sends a single push notification via the Expo Push API.
 * Returns true on success, false on failure.
 */
async function sendExpoPush(message: ExpoMessage): Promise<boolean> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[expo-push] HTTP ${response.status}: ${text}`);
      return false;
    }

    const result = await response.json();

    // Expo returns { data: { status, message?, details? } }
    const status = result?.data?.status;
    if (status && status !== "ok") {
      console.error("[expo-push] Non-ok status:", JSON.stringify(result));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[expo-push] fetch error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Pre-training notifications
// ---------------------------------------------------------------------------
async function processPreTraining(): Promise<{ sent: number; skipped: number }> {
  const today = todayAmsterdam();
  const now = new Date();

  const { data: sessions, error } = await supabase
    .from("scheduled_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      session_type,
      reflection_id,
      notification_sent_pre,
      notification_sent_post,
      profiles (
        push_token,
        notification_prefs,
        notifications_paused_until,
        language
      )
    `)
    .eq("date", today)
    .eq("notification_sent_pre", false);

  if (error) {
    console.error("[pre-training] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const session of (sessions ?? []) as SessionRow[]) {
    const sessionStart = toAmsterdamDate(session.date, session.start_time);
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / 60_000;

    // Window: 55–65 minutes before session start
    if (minutesUntilStart < 55 || minutesUntilStart > 65) {
      skipped++;
      continue;
    }

    if (!shouldNotify(session.profiles, "pre_training")) {
      skipped++;
      // Still mark as sent so we don't re-evaluate every cron tick
      await supabase
        .from("scheduled_sessions")
        .update({ notification_sent_pre: true })
        .eq("id", session.id);
      continue;
    }

    const lang = session.profiles!.language ?? "nl";
    const strings = i18n.pre[lang] ?? i18n.pre.nl;

    const success = await sendExpoPush({
      to: session.profiles!.push_token!,
      title: strings.title,
      body: strings.body,
      data: { type: "session_focus", sessionId: session.id },
      sound: "default",
    });

    if (success) {
      console.log(`[pre-training] sent for session ${session.id}`);
      sent++;
    } else {
      console.warn(`[pre-training] push failed for session ${session.id}, marking sent to avoid retry storm`);
    }

    // Mark as sent regardless — avoids repeated attempts on transient push failures
    await supabase
      .from("scheduled_sessions")
      .update({ notification_sent_pre: true })
      .eq("id", session.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Post-training notifications
// ---------------------------------------------------------------------------
async function processPostTraining(): Promise<{ sent: number; skipped: number }> {
  const today = todayAmsterdam();
  const now = new Date();

  const { data: sessions, error } = await supabase
    .from("scheduled_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      session_type,
      reflection_id,
      notification_sent_pre,
      notification_sent_post,
      profiles (
        push_token,
        notification_prefs,
        notifications_paused_until,
        language
      )
    `)
    .eq("date", today)
    .eq("notification_sent_post", false)
    .is("reflection_id", null);

  if (error) {
    console.error("[post-training] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const session of (sessions ?? []) as SessionRow[]) {
    // For matches: use start_time + 3 hours as the "session over" threshold
    // For all other session types: use end_time
    let sessionEnd: Date;
    if (session.session_type === "match") {
      const matchStart = toAmsterdamDate(session.date, session.start_time);
      sessionEnd = new Date(matchStart.getTime() + 3 * 60 * 60_000);
    } else {
      sessionEnd = toAmsterdamDate(session.date, session.end_time);
    }

    // Only send after the session has ended
    if (now <= sessionEnd) {
      skipped++;
      continue;
    }

    if (!shouldNotify(session.profiles, "post_session")) {
      skipped++;
      await supabase
        .from("scheduled_sessions")
        .update({ notification_sent_post: true })
        .eq("id", session.id);
      continue;
    }

    const lang = session.profiles!.language ?? "nl";
    const strings = i18n.post[lang] ?? i18n.post.nl;

    const success = await sendExpoPush({
      to: session.profiles!.push_token!,
      title: strings.title,
      body: strings.body,
      data: { type: "post_training", sessionId: session.id },
      sound: "default",
    });

    if (success) {
      console.log(`[post-training] sent for session ${session.id}`);
      sent++;
    } else {
      console.warn(`[post-training] push failed for session ${session.id}, marking sent to avoid retry storm`);
    }

    await supabase
      .from("scheduled_sessions")
      .update({ notification_sent_post: true })
      .eq("id", session.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Coach feedback notifications
// ---------------------------------------------------------------------------
async function processCoachFeedback(): Promise<{ sent: number; skipped: number }> {
  const { data: comments, error } = await supabase
    .from("coach_comments")
    .select(`
      id,
      goal_id,
      content,
      is_thumbs_up,
      goals (
        title,
        athlete_id,
        profiles:athlete_id (
          push_token,
          notification_prefs,
          notifications_paused_until,
          language
        )
      )
    `)
    .eq("notification_sent", false);

  if (error) {
    console.error("[coach-feedback] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const comment of (comments ?? []) as unknown as CoachCommentRow[]) {
    const profile = comment.goals?.profiles;
    if (!profile || !profile.push_token) {
      skipped++;
      await supabase
        .from("coach_comments")
        .update({ notification_sent: true })
        .eq("id", comment.id);
      continue;
    }

    // Check if notifications are paused
    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > new Date()) {
      skipped++;
      await supabase
        .from("coach_comments")
        .update({ notification_sent: true })
        .eq("id", comment.id);
      continue;
    }

    const lang = profile.language ?? "nl";
    const strings = i18n.coach_feedback[lang] ?? i18n.coach_feedback.nl;
    const goalTitle = comment.goals?.title ?? "";
    const body = comment.is_thumbs_up && !comment.content
      ? strings.bodyThumbsUp.replace("{{goal}}", goalTitle)
      : strings.bodyComment.replace("{{goal}}", goalTitle);

    const success = await sendExpoPush({
      to: profile.push_token,
      title: strings.title,
      body,
      data: { type: "coach_feedback", goalId: comment.goal_id },
      sound: "default",
    });

    if (success) {
      console.log(`[coach-feedback] sent for comment ${comment.id}`);
      sent++;
    } else {
      console.warn(`[coach-feedback] push failed for comment ${comment.id}`);
    }

    await supabase
      .from("coach_comments")
      .update({ notification_sent: true })
      .eq("id", comment.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Weekly reflection notifications (Sunday 19:00 Europe/Amsterdam)
// ---------------------------------------------------------------------------
async function processWeeklyReflection(): Promise<{ sent: number; skipped: number }> {
  const now = new Date();

  // Check if it's Sunday in Amsterdam timezone
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  const dayName = dayFormatter.format(now);
  if (dayName !== "Sunday") {
    return { sent: 0, skipped: 0 };
  }

  // Check if it's within the 18:55–19:05 window (Amsterdam time)
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now); // "19:00"
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  // Window: 18:55 – 19:05 (1135 – 1145)
  if (minuteOfDay < 1135 || minuteOfDay > 1145) {
    return { sent: 0, skipped: 0 };
  }

  // Find athletes with push tokens who have weekly_review enabled
  // and haven't reflected in the past 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language")
    .eq("role", "athlete")
    .not("push_token", "is", null);

  if (error) {
    console.error("[weekly-reflection] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles ?? []) {
    // Check notification preferences
    if (!profile.push_token) { skipped++; continue; }
    if (!profile.notification_prefs?.weekly_review) { skipped++; continue; }

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Check if they already reflected this week
    const { count } = await supabase
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profile.id)
      .gte("created_at", sevenDaysAgo);

    if ((count ?? 0) > 0) {
      skipped++;
      continue;
    }

    const lang = profile.language ?? "nl";
    const strings = i18n.weekly[lang] ?? i18n.weekly.nl;

    const success = await sendExpoPush({
      to: profile.push_token,
      title: strings.title,
      body: strings.body,
      data: { type: "weekly_review" },
      sound: "default",
    });

    if (success) {
      console.log(`[weekly-reflection] sent for athlete ${profile.id}`);
      sent++;
    } else {
      console.warn(`[weekly-reflection] push failed for athlete ${profile.id}`);
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Coach weekly report reminder (Sunday 19:00 Europe/Amsterdam)
// ---------------------------------------------------------------------------
async function processCoachWeeklyReport(): Promise<{ sent: number; skipped: number }> {
  const now = new Date();

  // Check if it's Sunday in Amsterdam timezone
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  const dayName = dayFormatter.format(now);
  if (dayName !== "Sunday") {
    return { sent: 0, skipped: 0 };
  }

  // Check if it's within the 18:55–19:05 window (Amsterdam time)
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  if (minuteOfDay < 1135 || minuteOfDay > 1145) {
    return { sent: 0, skipped: 0 };
  }

  // Find coaches with push tokens
  const { data: coaches, error } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language")
    .eq("role", "coach")
    .not("push_token", "is", null);

  if (error) {
    console.error("[coach-report] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const coach of coaches ?? []) {
    if (!coach.push_token) { skipped++; continue; }

    const paused = coach.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    const lang = coach.language ?? "nl";
    const strings = i18n.coach_report[lang] ?? i18n.coach_report.nl;

    const success = await sendExpoPush({
      to: coach.push_token,
      title: strings.title,
      body: strings.body,
      data: { type: "coach_report" },
      sound: "default",
    });

    if (success) {
      console.log(`[coach-report] sent for coach ${coach.id}`);
      sent++;
    } else {
      console.warn(`[coach-report] push failed for coach ${coach.id}`);
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // Support CORS pre-flight (useful when triggering manually from dashboard)
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
    console.log("[send-notifications] starting run");

    const [preResult, postResult, feedbackResult, weeklyResult, coachReportResult] = await Promise.all([
      processPreTraining(),
      processPostTraining(),
      processCoachFeedback(),
      processWeeklyReflection(),
      processCoachWeeklyReport(),
    ]);

    const summary = {
      pre_training: preResult,
      post_training: postResult,
      coach_feedback: feedbackResult,
      weekly_reflection: weeklyResult,
      coach_report: coachReportResult,
      timestamp: new Date().toISOString(),
    };

    console.log("[send-notifications] done", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[send-notifications] unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
