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

// ---------------------------------------------------------------------------
// Template map type
// { [type]: { [variant]: { [lang]: { title, body, screen_path } } } }
// ---------------------------------------------------------------------------
interface TemplateStrings {
  title: string;
  body: string;
  screen_path: string | null;
}

type TemplateMap = Record<string, Record<string, Record<string, TemplateStrings>>>;

// ---------------------------------------------------------------------------
// Hardcoded fallback templates (mirrors the previous i18n const)
// Used when the DB query fails or returns no rows.
// ---------------------------------------------------------------------------
const FALLBACK_TEMPLATES: TemplateMap = {
  session_focus: {
    default: {
      nl: { title: "Kies je focus", body: "Je sessie begint over 1 uur. Waar ga je je op focussen?", screen_path: null },
      en: { title: "Set your focus", body: "Your session starts in 1 hour. What will you focus on?", screen_path: null },
    },
  },
  post_training: {
    default: {
      nl: { title: "Hoe ging je training?", body: "Neem 2 minuten om te reflecteren op je focus van vandaag.", screen_path: null },
      en: { title: "How was your session?", body: "Take 2 minutes to reflect on today's focus.", screen_path: null },
    },
  },
  coach_feedback: {
    thumbs_up: {
      nl: { title: "Nieuwe coach feedback", body: "Je coach heeft je doel '{{goal}}' aangemoedigd! 👍", screen_path: null },
      en: { title: "New coach feedback", body: "Your coach encouraged your goal '{{goal}}'! 👍", screen_path: null },
    },
    comment: {
      nl: { title: "Nieuwe coach feedback", body: "Je coach heeft feedback gegeven op '{{goal}}'", screen_path: null },
      en: { title: "New coach feedback", body: "Your coach left feedback on '{{goal}}'", screen_path: null },
    },
  },
  weekly_review: {
    default: {
      nl: { title: "Weekreflectie", body: "Hoe was je week? Neem even de tijd om terug te kijken op je ontwikkeling.", screen_path: null },
      en: { title: "Weekly reflection", body: "How was your week? Take a moment to look back on your development.", screen_path: null },
    },
  },
  coach_report: {
    default: {
      nl: { title: "Weekoverzicht klaar", body: "Weekoverzicht klaar — beoordeel je spelers.", screen_path: null },
      en: { title: "Weekly overview ready", body: "Weekly overview is ready — review your players.", screen_path: null },
    },
  },
};

// ---------------------------------------------------------------------------
// Template loader
// Queries deco.notification_templates and builds the TemplateMap.
// Falls back to FALLBACK_TEMPLATES if the query fails or returns no rows.
// ---------------------------------------------------------------------------
async function loadTemplates(): Promise<TemplateMap> {
  try {
    const { data, error } = await supabase
      .from("notification_templates")
      .select("type, variant, language, title, body, screen_path");

    if (error) {
      console.error("[templates] query error, using fallback:", error);
      return FALLBACK_TEMPLATES;
    }

    if (!data || data.length === 0) {
      console.warn("[templates] no rows returned, using fallback");
      return FALLBACK_TEMPLATES;
    }

    const map: TemplateMap = {};

    for (const row of data) {
      const { type, variant, language, title, body, screen_path } = row;
      if (!type || !variant || !language) continue;

      map[type] ??= {};
      map[type][variant] ??= {};
      map[type][variant][language] = { title, body, screen_path: screen_path ?? null };
    }

    console.log(`[templates] loaded ${data.length} rows from DB`);
    return map;
  } catch (err) {
    console.error("[templates] unexpected error, using fallback:", err);
    return FALLBACK_TEMPLATES;
  }
}

// ---------------------------------------------------------------------------
// Template lookup helper
// Resolves type → variant → lang, falling back through fallback map then "nl".
// ---------------------------------------------------------------------------
function getTemplate(
  templates: TemplateMap,
  type: string,
  variant: string,
  lang: string,
): TemplateStrings {
  return (
    templates[type]?.[variant]?.[lang] ??
    templates[type]?.[variant]?.["nl"] ??
    FALLBACK_TEMPLATES[type]?.[variant]?.[lang] ??
    FALLBACK_TEMPLATES[type]?.[variant]?.["nl"] ??
    { title: "", body: "", screen_path: null }
  );
}

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
async function processPreTraining(templates: TemplateMap): Promise<{ sent: number; skipped: number }> {
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

    // Window: 45–75 minutes before session start (30-min window = 3 cron cycles)
    if (minutesUntilStart < 45 || minutesUntilStart > 75) {
      skipped++;
      console.log(`[pre-training] session ${session.id} outside window (${Math.round(minutesUntilStart)} min until start)`);
      continue;
    }

    if (!shouldNotify(session.profiles, "pre_training")) {
      skipped++;
      console.log(`[pre-training] session ${session.id} shouldNotify=false (token=${!!session.profiles?.push_token}, pref=${session.profiles?.notification_prefs?.pre_training}, paused=${session.profiles?.notifications_paused_until})`);
      // Still mark as sent so we don't re-evaluate every cron tick
      await supabase
        .from("scheduled_sessions")
        .update({ notification_sent_pre: true })
        .eq("id", session.id);
      continue;
    }

    const lang = session.profiles!.language ?? "nl";
    const strings = getTemplate(templates, "session_focus", "default", lang);

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
async function processPostTraining(templates: TemplateMap): Promise<{ sent: number; skipped: number }> {
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

    const minutesSinceEnd = (now.getTime() - sessionEnd.getTime()) / 60_000;

    // Only send after the session has ended, but within 4 hours
    if (now <= sessionEnd) {
      skipped++;
      console.log(`[post-training] session ${session.id} not ended yet (ends in ${Math.round(-minutesSinceEnd)} min)`);
      continue;
    }
    if (minutesSinceEnd > 30) {
      skipped++;
      console.log(`[post-training] session ${session.id} ended too long ago (${Math.round(minutesSinceEnd)} min), marking sent`);
      await supabase
        .from("scheduled_sessions")
        .update({ notification_sent_post: true })
        .eq("id", session.id);
      continue;
    }

    if (!shouldNotify(session.profiles, "post_session")) {
      skipped++;
      console.log(`[post-training] session ${session.id} shouldNotify=false (token=${!!session.profiles?.push_token}, pref=${session.profiles?.notification_prefs?.post_session}, paused=${session.profiles?.notifications_paused_until})`);
      await supabase
        .from("scheduled_sessions")
        .update({ notification_sent_post: true })
        .eq("id", session.id);
      continue;
    }

    const lang = session.profiles!.language ?? "nl";
    const strings = getTemplate(templates, "post_training", "default", lang);

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
async function processCoachFeedback(templates: TemplateMap): Promise<{ sent: number; skipped: number }> {
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
    const variant = comment.is_thumbs_up && !comment.content ? "thumbs_up" : "comment";
    const strings = getTemplate(templates, "coach_feedback", variant, lang);
    const goalTitle = comment.goals?.title ?? "";
    const body = strings.body.replace("{{goal}}", goalTitle);

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
async function processWeeklyReflection(templates: TemplateMap): Promise<{ sent: number; skipped: number }> {
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

  // Check if it's within the 18:50–19:10 window (Amsterdam time)
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now); // "19:00"
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  // Window: 18:50 – 19:00 (1130 – 1140) — single cron cycle
  if (minuteOfDay < 1130 || minuteOfDay > 1140) {
    return { sent: 0, skipped: 0 };
  }

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString();
  const today = todayAmsterdam();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language, weekly_notif_sent_date")
    .eq("role", "athlete")
    .not("push_token", "is", null);

  if (error) {
    console.error("[weekly-reflection] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles ?? []) {
    if (!profile.push_token) { skipped++; continue; }
    if (!profile.notification_prefs?.weekly_review) { skipped++; continue; }

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Dedup: skip if already sent today
    if (profile.weekly_notif_sent_date === today) { skipped++; continue; }

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
    const strings = getTemplate(templates, "weekly_review", "default", lang);

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
      // Mark as sent today
      await supabase.from("profiles").update({ weekly_notif_sent_date: today }).eq("id", profile.id);
    } else {
      console.warn(`[weekly-reflection] push failed for athlete ${profile.id}`);
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Coach weekly report reminder (Sunday 19:00 Europe/Amsterdam)
// ---------------------------------------------------------------------------
async function processCoachWeeklyReport(templates: TemplateMap): Promise<{ sent: number; skipped: number }> {
  const now = new Date();
  const today = todayAmsterdam();

  // Get current Amsterdam day-of-week (0=Sun..6=Sat) and time
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  const fullDay = dayFormatter.format(now);
  const dayOfWeekMap: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const todayDow = dayOfWeekMap[fullDay];
  if (todayDow === undefined) return { sent: 0, skipped: 0 };

  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const currentMinuteOfDay = h * 60 + m;

  // Find coaches with push tokens
  const { data: coaches, error } = await supabase
    .from("profiles")
    .select("id, push_token, notifications_paused_until, language, coach_overview_day, coach_overview_time, coach_overview_notif_sent_date")
    .eq("role", "coach")
    .not("push_token", "is", null);

  if (error) {
    console.error("[coach-overview] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const coach of coaches ?? []) {
    if (!coach.push_token) { skipped++; continue; }

    const paused = coach.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Check if today matches the coach's configured day (default Friday=5)
    const overviewDay = coach.coach_overview_day ?? 5;
    if (todayDow !== overviewDay) { skipped++; continue; }

    // Check if current time is within 10-min window of configured time (default 18:00)
    const overviewTime = coach.coach_overview_time ?? "18:00";
    const [oh, om] = overviewTime.split(":").map(Number);
    const targetMinute = oh * 60 + om;
    if (currentMinuteOfDay < targetMinute - 10 || currentMinuteOfDay > targetMinute) { skipped++; continue; }

    // Dedup: skip if already sent today
    if (coach.coach_overview_notif_sent_date === today) { skipped++; continue; }

    const lang = coach.language ?? "nl";
    const strings = getTemplate(templates, "coach_report", "default", lang);

    const success = await sendExpoPush({
      to: coach.push_token,
      title: strings.title,
      body: strings.body,
      data: { type: "coach_weekly_overview" },
      sound: "default",
    });

    if (success) {
      console.log(`[coach-overview] sent for coach ${coach.id}`);
      sent++;
      await supabase.from("profiles").update({ coach_overview_notif_sent_date: today }).eq("id", coach.id);
    } else {
      console.warn(`[coach-overview] push failed for coach ${coach.id}`);
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Coach weekly action notifications (when coach gives feedback via overview)
// ---------------------------------------------------------------------------
async function processCoachWeeklyActionNotifications(): Promise<{ sent: number; skipped: number }> {
  // Find unnotified actions where action is 'good' or 'respond'
  const { data: actions, error } = await supabase
    .from("coach_weekly_actions")
    .select("id, athlete_id, action_type, message")
    .eq("notification_sent", false)
    .in("action_type", ["good", "respond"]);

  if (error) {
    console.error("[weekly-action-notif] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const action of actions ?? []) {
    // Get athlete profile for push token
    const { data: athlete } = await supabase
      .from("profiles")
      .select("push_token, language, notifications_paused_until")
      .eq("id", action.athlete_id)
      .single();

    if (!athlete?.push_token) { skipped++; continue; }

    const paused = athlete.notifications_paused_until;
    if (paused && new Date(paused) > new Date()) { skipped++; continue; }

    const lang = athlete.language ?? "nl";
    const title = lang === "nl" ? "Coach feedback" : "Coach feedback";
    const body = action.action_type === "good"
      ? (lang === "nl" ? "Je coach vindt dat je goed bezig bent!" : "Your coach thinks you're doing great!")
      : (lang === "nl" ? "Je coach heeft gereageerd op je week" : "Your coach responded to your week");

    const success = await sendExpoPush({
      to: athlete.push_token,
      title,
      body,
      data: { type: "coach_weekly_action" },
      sound: "default",
    });

    if (success) {
      sent++;
      await supabase.from("coach_weekly_actions").update({ notification_sent: true }).eq("id", action.id);
    } else {
      skipped++;
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Outlier notifications (extreme reflection scores → notify coach)
// ---------------------------------------------------------------------------
async function processOutlierNotifications(): Promise<{ sent: number; skipped: number }> {
  // Find recent reflections (last 15 min) that don't have outlier entries yet
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: recentReflections, error: rErr } = await supabase
    .from("reflections")
    .select("id, athlete_id, created_at")
    .gte("created_at", fifteenMinAgo);

  if (rErr || !recentReflections || recentReflections.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const ref of recentReflections) {
    // Check if outlier_notification already exists for this reflection
    const { data: existing } = await supabase
      .from("outlier_notifications")
      .select("id")
      .eq("reflection_id", ref.id)
      .limit(1);

    if (existing && existing.length > 0) { skipped++; continue; }

    // Get ratings for this reflection
    const { data: ratings } = await supabase
      .from("reflection_goals")
      .select("rating")
      .eq("reflection_id", ref.id);

    if (!ratings || ratings.length === 0) { skipped++; continue; }

    const avg = (ratings as any[]).reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Check if it's an outlier (avg <= 2 or avg >= 5)
    let outlierType: "low" | "high" | null = null;
    if (avg <= 2.0) outlierType = "low";
    else if (avg >= 5.0) outlierType = "high";

    if (!outlierType) { skipped++; continue; }

    // Get athlete name
    const { data: athlete } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", ref.athlete_id)
      .single();

    const athleteName = (athlete as any)?.full_name ?? "Speler";

    // Find team(s) and coach(es)
    const { data: teamMemberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("athlete_id", ref.athlete_id);

    if (!teamMemberships || teamMemberships.length === 0) { skipped++; continue; }

    const teamIds = (teamMemberships as any[]).map((m) => m.team_id);

    const { data: teamCoaches } = await supabase
      .from("team_coaches")
      .select("coach_id, team_id")
      .in("team_id", teamIds);

    if (!teamCoaches || teamCoaches.length === 0) { skipped++; continue; }

    for (const tc of teamCoaches as any[]) {
      // Check if coach has outlier notifications enabled
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("push_token, language, notifications_paused_until, outlier_notifications_enabled")
        .eq("id", tc.coach_id)
        .single();

      if (!coachProfile?.push_token) continue;
      if ((coachProfile as any).outlier_notifications_enabled === false) continue;
      if (coachProfile.notifications_paused_until && new Date(coachProfile.notifications_paused_until) > new Date()) continue;

      // Insert outlier notification record
      const { error: insertErr } = await supabase
        .from("outlier_notifications")
        .insert({
          reflection_id: ref.id,
          athlete_id: ref.athlete_id,
          coach_id: tc.coach_id,
          team_id: tc.team_id,
          outlier_type: outlierType,
          avg_score: avg,
        });

      if (insertErr) {
        // Likely unique constraint violation — already processed
        continue;
      }

      const lang = (coachProfile as any).language ?? "nl";
      const title = lang === "nl" ? "Uitschieter" : "Outlier";
      const body = outlierType === "low"
        ? (lang === "nl" ? `${athleteName} heeft een moeilijke training gehad — reageer?` : `${athleteName} had a tough session — respond?`)
        : (lang === "nl" ? `${athleteName} had een uitstekende training — bevestig dit met een reactie?` : `${athleteName} had an excellent session — confirm with a response?`);

      const success = await sendExpoPush({
        to: coachProfile.push_token,
        title,
        body,
        data: { type: "outlier", athleteId: ref.athlete_id },
        sound: "default",
      });

      if (success) sent++;
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Outlier action notifications (coach responded → notify athlete)
// ---------------------------------------------------------------------------
async function processOutlierActionNotifications(): Promise<{ sent: number; skipped: number }> {
  const { data: actions, error } = await supabase
    .from("outlier_notifications")
    .select("id, athlete_id, coach_action, coach_message")
    .eq("action_notification_sent", false)
    .not("coach_action", "is", null)
    .in("coach_action", ["good", "respond"]);

  if (error || !actions || actions.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const action of actions as any[]) {
    const { data: athlete } = await supabase
      .from("profiles")
      .select("push_token, language, notifications_paused_until")
      .eq("id", action.athlete_id)
      .single();

    if (!athlete?.push_token) { skipped++; continue; }
    if (athlete.notifications_paused_until && new Date(athlete.notifications_paused_until) > new Date()) { skipped++; continue; }

    const lang = (athlete as any).language ?? "nl";
    const title = lang === "nl" ? "Coach feedback" : "Coach feedback";
    const body = action.coach_action === "good"
      ? (lang === "nl" ? "Je coach vindt dat je goed bezig bent!" : "Your coach thinks you're doing great!")
      : (lang === "nl" ? "Je coach heeft gereageerd" : "Your coach responded");

    const success = await sendExpoPush({
      to: athlete.push_token,
      title,
      body,
      data: { type: "outlier_response" },
      sound: "default",
    });

    if (success) {
      sent++;
      await supabase.from("outlier_notifications").update({ action_notification_sent: true }).eq("id", action.id);
    } else {
      skipped++;
    }
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Match day notifications (pre-game 09:00, post-game 19:00)
// ---------------------------------------------------------------------------
async function processMatchDayNotifications(): Promise<{ sent: number; skipped: number }> {
  const now = new Date();

  // Get current day-of-week in Amsterdam timezone (0=Sunday, 6=Saturday)
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "narrow",
  });
  // Map to JS day-of-week number
  const dayMap: Record<string, number> = { S: 0, M: 1, T: 2, W: 3, F: 5 };
  const narrowDay = dayFormatter.format(now);
  // More precise: use the full weekday
  const fullDayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  const fullDay = fullDayFormatter.format(now);
  const dayOfWeekMap: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const todayDow = dayOfWeekMap[fullDay];
  if (todayDow === undefined) return { sent: 0, skipped: 0 };

  // Get Amsterdam time
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  // Determine notification type based on time window (single cron cycle each)
  let notifType: "pre_game" | "post_game" | null = null;
  if (minuteOfDay >= 530 && minuteOfDay <= 540) {
    // 08:50 - 09:00 → pre-game
    notifType = "pre_game";
  } else if (minuteOfDay >= 1140 && minuteOfDay <= 1150) {
    // 19:00 - 19:10 → post-game (offset from weekly 18:50-19:00 to avoid overlap)
    notifType = "post_game";
  }

  if (!notifType) return { sent: 0, skipped: 0 };

  const todayStr = todayAmsterdam();

  // Find athletes whose default_match_day matches today
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language, match_notif_sent_date")
    .eq("role", "athlete")
    .eq("default_match_day", todayDow)
    .not("push_token", "is", null);

  if (error) {
    console.error("[match-day] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles ?? []) {
    if (!profile.push_token) { skipped++; continue; }

    // Check pre_training pref for pre-game, post_session for post-game
    const prefKey = notifType === "pre_game" ? "pre_training" : "post_session";
    if (!profile.notification_prefs?.[prefKey]) { skipped++; continue; }

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Dedup: check if already sent today for this type
    // Use match_notif_sent_date — stores "YYYY-MM-DD:type"
    const sentKey = `${todayStr}:${notifType}`;
    if (profile.match_notif_sent_date === sentKey) { skipped++; continue; }

    const lang = profile.language ?? "nl";

    let title: string;
    let body: string;
    let screen: string;

    if (notifType === "pre_game") {
      title = lang === "en" ? "Match day! Set your goals" : "Wedstrijddag! Stel je doelen";
      body = lang === "en"
        ? "Which development goals are you taking into today's match?"
        : "Welke ontwikkeldoelen neem je mee de wedstrijd in?";
      screen = "/(athlete)/development/session-goals";
    } else {
      title = lang === "en" ? "How was the match?" : "Hoe ging de wedstrijd?";
      body = lang === "en"
        ? "Take 2 minutes to reflect on your performance."
        : "Neem 2 minuten om te reflecteren op je wedstrijd.";
      screen = "/(athlete)/development/reflect";
    }

    const success = await sendExpoPush({
      to: profile.push_token,
      title,
      body,
      data: { type: notifType === "pre_game" ? "session_focus" : "post_training", screen },
      sound: "default",
    });

    if (success) {
      console.log(`[match-day] sent ${notifType} to athlete ${profile.id}`);
      sent++;
    } else {
      console.warn(`[match-day] push failed for athlete ${profile.id}`);
    }

    // Mark as sent
    await supabase
      .from("profiles")
      .update({ match_notif_sent_date: sentKey })
      .eq("id", profile.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Goal deadline notifications
// ---------------------------------------------------------------------------
async function processGoalDeadlines(): Promise<{ sent: number; skipped: number }> {
  const today = todayAmsterdam();
  const todayDate = new Date(today + "T00:00:00");
  const tomorrowStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(
    new Date(todayDate.getTime() + 24 * 60 * 60_000),
  );
  const threeDaysAgoStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(
    new Date(todayDate.getTime() - 3 * 24 * 60 * 60_000),
  );

  // Only run once per day — check in the morning window 08:50-09:00
  const now = new Date();
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  // Run in 08:50-09:00 window only
  if (minuteOfDay < 530 || minuteOfDay > 540) {
    return { sent: 0, skipped: 0 };
  }

  // Find active goals with deadlines that are tomorrow, today, or 3 days ago
  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, title, deadline, deadline_notif_sent_date, athlete_id, profiles:athlete_id(push_token, notification_prefs, notifications_paused_until, language)")
    .eq("status", "active")
    .not("deadline", "is", null)
    .in("deadline", [tomorrowStr, today, threeDaysAgoStr]);

  if (error) {
    console.error("[goal-deadlines] query error:", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const goal of goals ?? []) {
    const profile = (goal as any).profiles;
    if (!profile?.push_token) { skipped++; continue; }

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Determine notification type
    let notifType: string;
    let title: string;
    let body: string;
    const lang = profile.language ?? "nl";
    const goalTitle = goal.title.length > 40 ? goal.title.slice(0, 40) + "..." : goal.title;

    if (goal.deadline === tomorrowStr) {
      notifType = "tomorrow";
      title = lang === "en" ? "Deadline tomorrow" : "Deadline morgen";
      body = lang === "en"
        ? `1 day left for: ${goalTitle}`
        : `Nog 1 dag voor: ${goalTitle}`;
    } else if (goal.deadline === today) {
      notifType = "today";
      title = lang === "en" ? "Deadline today" : "Deadline vandaag";
      body = lang === "en"
        ? `Last day for: ${goalTitle}`
        : `Laatste dag voor: ${goalTitle}`;
    } else if (goal.deadline === threeDaysAgoStr) {
      notifType = "overdue";
      title = lang === "en" ? "Goal expired" : "Doel verlopen";
      body = lang === "en"
        ? `Did you achieve "${goalTitle}"? Mark it as achieved or set a new goal.`
        : `Heb je "${goalTitle}" bereikt? Markeer als behaald of stel een nieuw doel.`;
    } else {
      continue;
    }

    // Dedup
    const sentKey = `${today}:${notifType}`;
    if (goal.deadline_notif_sent_date === sentKey) { skipped++; continue; }

    const success = await sendExpoPush({
      to: profile.push_token,
      title,
      body,
      data: { type: "goal_deadline", goalId: goal.id },
      sound: "default",
    });

    if (success) {
      console.log(`[goal-deadlines] sent ${notifType} for goal ${goal.id}`);
      sent++;
    }

    // Mark as sent
    await supabase.from("goals").update({ deadline_notif_sent_date: sentKey }).eq("id", goal.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Streak rescue notification (22:00 on session days)
// ---------------------------------------------------------------------------
async function processStreakRescue(): Promise<{ sent: number; skipped: number }> {
  const now = new Date();

  // Check Amsterdam time: 21:50-22:00 window
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;

  // Window: 21:50-22:00 (1310-1320) — single cron cycle
  if (minuteOfDay < 1310 || minuteOfDay > 1320) {
    return { sent: 0, skipped: 0 };
  }

  const today = todayAmsterdam();

  // Find athletes who have a session today but haven't been active today
  const { data: sessions, error: sessErr } = await supabase
    .from("scheduled_sessions")
    .select("athlete_id")
    .eq("date", today);

  if (sessErr || !sessions) return { sent: 0, skipped: 0 };

  // Unique athlete IDs with sessions today
  const athleteIds = [...new Set(sessions.map((s: { athlete_id: string }) => s.athlete_id))];
  if (athleteIds.length === 0) return { sent: 0, skipped: 0 };

  // Fetch their profiles
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language, last_active_at, match_notif_sent_date")
    .in("id", athleteIds)
    .not("push_token", "is", null);

  if (profErr || !profiles) return { sent: 0, skipped: 0 };

  let sent = 0;
  let skipped = 0;

  for (const profile of profiles) {
    if (!profile.push_token) { skipped++; continue; }
    if (!profile.notification_prefs?.motivational) { skipped++; continue; }

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) { skipped++; continue; }

    // Dedup: check if already sent today
    const sentKey = `${today}:streak_rescue`;
    if (profile.match_notif_sent_date === sentKey) { skipped++; continue; }

    // Check if user was active today — if yes, no need to rescue
    const lastActive = profile.last_active_at
      ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date(profile.last_active_at))
      : null;
    if (lastActive === today) { skipped++; continue; }

    // Calculate their current streak for the message
    const { data: streakData } = await supabase.rpc("calc_streak", { p_athlete_id: profile.id });
    const currentStreak = (streakData as number) ?? 0;

    const lang = profile.language ?? "nl";
    const title = lang === "en"
      ? `Your streak of ${currentStreak} is at risk!`
      : `Je streak van ${currentStreak} staat op het spel!`;
    const body = lang === "en"
      ? "Open the app to keep your streak alive."
      : "Open de app om je streak te behouden.";

    const success = await sendExpoPush({
      to: profile.push_token,
      title,
      body,
      data: { type: "streak_rescue", screen: "/(athlete)/development" },
      sound: "default",
    });

    if (success) {
      console.log(`[streak-rescue] sent to ${profile.id} (streak: ${currentStreak})`);
      sent++;
    }

    await supabase.from("profiles").update({ match_notif_sent_date: sentKey }).eq("id", profile.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Notification flow processing (Duolingo-style re-engagement sequences)
// ---------------------------------------------------------------------------

interface FlowRow {
  id: string;
  trigger_type: string;
  trigger_config: Record<string, number>;
  target_role: string | null;
  exit_on_activity: boolean;
}

interface FlowStepRow {
  id: string;
  flow_id: string;
  step_order: number;
  delay_hours: number;
  title_nl: string;
  title_en: string;
  body_nl: string;
  body_en: string;
  screen_path: string;
}

interface EnrollmentRow {
  id: string;
  flow_id: string;
  user_id: string;
  current_step: number;
  enrolled_at: string;
  last_step_sent_at: string | null;
}

interface FlowProfile {
  id: string;
  push_token: string | null;
  notification_prefs: NotificationPrefs;
  notifications_paused_until: string | null;
  language: "nl" | "en";
  last_active_at: string | null;
  created_at: string;
  role: string;
}

async function processFlows(): Promise<{ enrolled: number; sent: number; exited: number }> {
  let enrolled = 0;
  let sent = 0;
  let exited = 0;

  // 1. Load active flows
  const { data: flows, error: flowsErr } = await supabase
    .from("notification_flows")
    .select("id, trigger_type, trigger_config, target_role, exit_on_activity")
    .eq("is_active", true);

  if (flowsErr || !flows || flows.length === 0) {
    if (flowsErr) console.error("[flows] query error:", flowsErr);
    return { enrolled: 0, sent: 0, exited: 0 };
  }

  // 2. Enroll eligible users for each flow
  for (const flow of flows as FlowRow[]) {
    const newEnrollments = await enrollUsersForFlow(flow);
    enrolled += newEnrollments;
  }

  // 3. Load all active enrollments with their flow steps
  const { data: enrollments, error: enrollErr } = await supabase
    .from("notification_flow_enrollments")
    .select("id, flow_id, user_id, current_step, enrolled_at, last_step_sent_at")
    .is("completed_at", null);

  if (enrollErr || !enrollments || enrollments.length === 0) {
    if (enrollErr) console.error("[flows] enrollments query error:", enrollErr);
    return { enrolled, sent: 0, exited: 0 };
  }

  // Load all steps for active flows
  const flowIds = [...new Set(enrollments.map((e: EnrollmentRow) => e.flow_id))];
  const { data: allSteps } = await supabase
    .from("notification_flow_steps")
    .select("*")
    .in("flow_id", flowIds)
    .order("step_order", { ascending: true });

  const stepsByFlow: Record<string, FlowStepRow[]> = {};
  for (const step of (allSteps ?? []) as FlowStepRow[]) {
    stepsByFlow[step.flow_id] ??= [];
    stepsByFlow[step.flow_id].push(step);
  }

  // Build a map of flow configs for exit_on_activity checks
  const flowMap: Record<string, FlowRow> = {};
  for (const f of flows as FlowRow[]) flowMap[f.id] = f;

  // Load profiles for all enrolled users
  const userIds = [...new Set(enrollments.map((e: EnrollmentRow) => e.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token, notification_prefs, notifications_paused_until, language, last_active_at, created_at, role")
    .in("id", userIds);

  const profileMap: Record<string, FlowProfile> = {};
  for (const p of (profiles ?? []) as FlowProfile[]) profileMap[p.id] = p;

  // 4. Process each enrollment
  const now = new Date();

  for (const enrollment of enrollments as EnrollmentRow[]) {
    const flow = flowMap[enrollment.flow_id];
    const profile = profileMap[enrollment.user_id];
    if (!flow || !profile) continue;

    // Exit check: if user became active after enrollment
    if (flow.exit_on_activity && profile.last_active_at) {
      const lastActive = new Date(profile.last_active_at);
      const enrolledAt = new Date(enrollment.enrolled_at);
      if (lastActive > enrolledAt) {
        await supabase
          .from("notification_flow_enrollments")
          .update({ completed_at: now.toISOString(), exit_reason: "active" })
          .eq("id", enrollment.id);
        exited++;
        console.log(`[flows] user ${enrollment.user_id} exited flow ${enrollment.flow_id} (became active)`);
        continue;
      }
    }

    // Get steps for this flow
    const steps = stepsByFlow[enrollment.flow_id] ?? [];
    const currentStep = steps.find((s) => s.step_order === enrollment.current_step);

    // No more steps → mark completed
    if (!currentStep) {
      await supabase
        .from("notification_flow_enrollments")
        .update({ completed_at: now.toISOString(), exit_reason: "completed" })
        .eq("id", enrollment.id);
      console.log(`[flows] enrollment ${enrollment.id} completed (no more steps)`);
      continue;
    }

    // Calculate fire time
    const delayMs = currentStep.delay_hours * 60 * 60_000;
    const baseTime = enrollment.current_step === 0
      ? new Date(enrollment.enrolled_at)
      : enrollment.last_step_sent_at
        ? new Date(enrollment.last_step_sent_at)
        : new Date(enrollment.enrolled_at);
    const fireTime = new Date(baseTime.getTime() + delayMs);

    if (now < fireTime) continue; // Not yet time

    // Check push token and preferences
    if (!profile.push_token) continue;
    if (!profile.notification_prefs?.motivational) continue;

    const paused = profile.notifications_paused_until;
    if (paused && new Date(paused) > now) continue; // Paused — retry next cycle

    // Send the notification
    const lang = profile.language ?? "nl";
    const title = lang === "en" ? currentStep.title_en : currentStep.title_nl;
    const body = lang === "en" ? currentStep.body_en : currentStep.body_nl;

    const success = await sendExpoPush({
      to: profile.push_token,
      title,
      body,
      data: {
        type: "flow_notification",
        screen: currentStep.screen_path || undefined,
        flowId: enrollment.flow_id,
      },
      sound: "default",
    });

    if (success) {
      console.log(`[flows] sent step ${currentStep.step_order} to user ${enrollment.user_id} (flow ${enrollment.flow_id})`);
      sent++;
    } else {
      console.warn(`[flows] push failed for user ${enrollment.user_id} step ${currentStep.step_order}`);
    }

    // Advance to next step (regardless of push success to avoid retry storm)
    await supabase
      .from("notification_flow_enrollments")
      .update({
        current_step: enrollment.current_step + 1,
        last_step_sent_at: now.toISOString(),
      })
      .eq("id", enrollment.id);
  }

  return { enrolled, sent, exited };
}

async function enrollUsersForFlow(flow: FlowRow): Promise<number> {
  const now = new Date();
  let enrolled = 0;

  // Build the query based on trigger type
  const config = flow.trigger_config;

  if (flow.trigger_type === "inactivity" || flow.trigger_type === "coach_inactive") {
    const daysInactive = config.days_inactive ?? 3;
    const cutoff = new Date(now.getTime() - daysInactive * 24 * 60 * 60_000).toISOString();

    let query = supabase
      .from("profiles")
      .select("id")
      .lt("last_active_at", cutoff)
      .not("push_token", "is", null);

    if (flow.target_role) {
      query = query.eq("role", flow.target_role);
    }

    const { data: users } = await query;

    for (const user of users ?? []) {
      const { error } = await supabase
        .from("notification_flow_enrollments")
        .insert({ flow_id: flow.id, user_id: user.id })
        .select()
        .maybeSingle();

      // ON CONFLICT will cause a unique violation error — that's expected for already-enrolled users
      if (!error) {
        enrolled++;
        console.log(`[flows] enrolled user ${user.id} in flow ${flow.id} (${flow.trigger_type})`);
      }
    }
  } else if (flow.trigger_type === "new_signup") {
    const daysAfter = config.days_after_signup ?? 1;
    const windowStart = new Date(now.getTime() - (daysAfter + 1) * 24 * 60 * 60_000).toISOString();
    const windowEnd = new Date(now.getTime() - daysAfter * 24 * 60 * 60_000).toISOString();

    let query = supabase
      .from("profiles")
      .select("id")
      .gte("created_at", windowStart)
      .lt("created_at", windowEnd)
      .not("push_token", "is", null);

    if (flow.target_role) {
      query = query.eq("role", flow.target_role);
    }

    const { data: users } = await query;

    for (const user of users ?? []) {
      const { error } = await supabase
        .from("notification_flow_enrollments")
        .insert({ flow_id: flow.id, user_id: user.id })
        .select()
        .maybeSingle();

      if (!error) {
        enrolled++;
        console.log(`[flows] enrolled user ${user.id} in flow ${flow.id} (new_signup)`);
      }
    }
  } else if (flow.trigger_type === "no_goals") {
    const daysWithout = config.days_without_goals ?? 3;
    const cutoff = new Date(now.getTime() - daysWithout * 24 * 60 * 60_000).toISOString();

    // Find athletes who signed up before the cutoff and have zero goals
    let query = supabase
      .from("profiles")
      .select("id")
      .lt("created_at", cutoff)
      .not("push_token", "is", null);

    if (flow.target_role) {
      query = query.eq("role", flow.target_role);
    }

    const { data: users } = await query;

    for (const user of users ?? []) {
      // Check if they have any goals
      const { count } = await supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", user.id);

      if ((count ?? 0) > 0) continue;

      const { error } = await supabase
        .from("notification_flow_enrollments")
        .insert({ flow_id: flow.id, user_id: user.id })
        .select()
        .maybeSingle();

      if (!error) {
        enrolled++;
        console.log(`[flows] enrolled user ${user.id} in flow ${flow.id} (no_goals)`);
      }
    }
  } else if (flow.trigger_type === "no_reflections") {
    const daysWithout = config.days_without_reflections ?? 7;
    const cutoff = new Date(now.getTime() - daysWithout * 24 * 60 * 60_000).toISOString();

    let query = supabase
      .from("profiles")
      .select("id")
      .not("push_token", "is", null);

    if (flow.target_role) {
      query = query.eq("role", flow.target_role);
    }

    const { data: users } = await query;

    for (const user of users ?? []) {
      // Check if they have any reflections in the past N days
      const { count } = await supabase
        .from("reflections")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", user.id)
        .gte("created_at", cutoff);

      if ((count ?? 0) > 0) continue;

      const { error } = await supabase
        .from("notification_flow_enrollments")
        .insert({ flow_id: flow.id, user_id: user.id })
        .select()
        .maybeSingle();

      if (!error) {
        enrolled++;
        console.log(`[flows] enrolled user ${user.id} in flow ${flow.id} (no_reflections)`);
      }
    }
  }

  return enrolled;
}

// ---------------------------------------------------------------------------
// Auto feed events (milestones: streaks, records, etc.)
// ---------------------------------------------------------------------------
async function processAutoFeedEvents(): Promise<{ created: number }> {
  let created = 0;

  // Get all teams
  const { data: teams } = await supabase.from("teams").select("id");
  if (!teams || teams.length === 0) return { created: 0 };

  for (const team of teams as any[]) {
    const { data: members } = await supabase
      .from("team_members")
      .select("athlete_id")
      .eq("team_id", team.id);

    if (!members || members.length === 0) continue;

    const athleteIds = (members as any[]).map((m) => m.athlete_id);

    for (const athleteId of athleteIds) {
      // Check feed_visible preference
      const { data: prof } = await supabase
        .from("profiles")
        .select("feed_visible, full_name")
        .eq("id", athleteId)
        .single();

      if ((prof as any)?.feed_visible === false) continue;
      const firstName = ((prof as any)?.full_name ?? "Speler").split(" ")[0];

      // Dedup: check recent feed events for this athlete+team (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
      const { data: recentEvents } = await supabase
        .from("feed_events")
        .select("event_type")
        .eq("team_id", team.id)
        .eq("athlete_id", athleteId)
        .gte("created_at", weekAgo);

      const recentTypes = new Set((recentEvents ?? []).map((e: any) => e.event_type));

      // 1. Check 3-reflection streak (3 reflections, each within 2 days of previous)
      if (!recentTypes.has("reflection_streak_3")) {
        const { data: refs } = await supabase
          .from("reflections")
          .select("created_at")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (refs && refs.length >= 3) {
          const dates = (refs as any[]).map((r) => new Date(r.created_at));
          const gap1 = (dates[0].getTime() - dates[1].getTime()) / (24 * 60 * 60_000);
          const gap2 = (dates[1].getTime() - dates[2].getTime()) / (24 * 60 * 60_000);
          if (gap1 <= 2 && gap2 <= 2) {
            await supabase.from("feed_events").insert({
              team_id: team.id,
              athlete_id: athleteId,
              event_type: "reflection_streak_3",
              metadata: { name: firstName },
            });
            created++;
          }
        }
      }

      // 2. Check personal record reflections per week
      if (!recentTypes.has("personal_record_week")) {
        // Count reflections this week
        const mondayStr = getMondayOfWeek(new Date());
        const { count: thisWeekCount } = await supabase
          .from("reflections")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", athleteId)
          .gte("created_at", mondayStr);

        if ((thisWeekCount ?? 0) >= 3) {
          // Check if this is more than any previous week
          // Count reflections per week historically using simple approach
          const { data: allRefs } = await supabase
            .from("reflections")
            .select("created_at")
            .eq("athlete_id", athleteId)
            .lt("created_at", mondayStr);

          const weekCounts = new Map<string, number>();
          for (const r of (allRefs ?? []) as any[]) {
            const wk = getMondayOfWeek(new Date(r.created_at));
            weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1);
          }

          const maxPrev = Math.max(0, ...weekCounts.values());
          if ((thisWeekCount ?? 0) > maxPrev) {
            await supabase.from("feed_events").insert({
              team_id: team.id,
              athlete_id: athleteId,
              event_type: "personal_record_week",
              metadata: { name: firstName, count: thisWeekCount },
            });
            created++;
          }
        }
      }

      // 3. Check 7+ day streak
      if (!recentTypes.has("streak_7_plus")) {
        try {
          const { data: streakData } = await supabase.rpc("calc_streak", { p_athlete_id: athleteId });
          const streak = (streakData as any) ?? 0;
          if (streak >= 7) {
            await supabase.from("feed_events").insert({
              team_id: team.id,
              athlete_id: athleteId,
              event_type: "streak_7_plus",
              metadata: { name: firstName, days: streak },
            });
            created++;
          }
        } catch {
          // calc_streak may not exist in all environments
        }
      }
    }
  }

  return { created };
}

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0] + "T00:00:00.000Z";
}

// ---------------------------------------------------------------------------
// Reaction notifications (notify post owner when someone reacts)
// ---------------------------------------------------------------------------
async function processReactionNotifications(): Promise<{ sent: number; skipped: number }> {
  const { data: reactions, error } = await supabase
    .from("feed_reactions")
    .select("id, event_id, user_id")
    .eq("notification_sent", false);

  if (error || !reactions || reactions.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const reaction of reactions as any[]) {
    // Get the event to find the post owner
    const { data: event } = await supabase
      .from("feed_events")
      .select("athlete_id")
      .eq("id", reaction.event_id)
      .single();

    if (!event || !(event as any).athlete_id || (event as any).athlete_id === reaction.user_id) {
      // Skip if no owner, or if reactor is the owner
      await supabase.from("feed_reactions").update({ notification_sent: true }).eq("id", reaction.id);
      skipped++;
      continue;
    }

    // Get reactor name
    const { data: reactor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", reaction.user_id)
      .single();

    const reactorName = ((reactor as any)?.full_name ?? "Iemand").split(" ")[0];

    // Get owner push token
    const { data: owner } = await supabase
      .from("profiles")
      .select("push_token, language, notifications_paused_until")
      .eq("id", (event as any).athlete_id)
      .single();

    if (!owner?.push_token) {
      await supabase.from("feed_reactions").update({ notification_sent: true }).eq("id", reaction.id);
      skipped++;
      continue;
    }

    if (owner.notifications_paused_until && new Date(owner.notifications_paused_until) > new Date()) {
      skipped++;
      continue;
    }

    const lang = (owner as any).language ?? "nl";
    const body = lang === "nl"
      ? `${reactorName} reageerde op je mijlpaal!`
      : `${reactorName} reacted to your milestone!`;

    const success = await sendExpoPush({
      to: owner.push_token,
      title: lang === "nl" ? "Teamfeed" : "Team Feed",
      body,
      data: { type: "feed_reaction" },
      sound: "default",
    });

    if (success) sent++;
    await supabase.from("feed_reactions").update({ notification_sent: true }).eq("id", reaction.id);
  }

  return { sent, skipped };
}

// ---------------------------------------------------------------------------
// Weekly team summary (auto-generated Sunday 20:00 Amsterdam)
// ---------------------------------------------------------------------------
async function processWeeklyTeamSummary(): Promise<{ created: number; notified: number }> {
  const now = new Date();
  const today = todayAmsterdam();

  // Check if it's Sunday in Amsterdam
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
  });
  if (dayFormatter.format(now) !== "Sunday") return { created: 0, notified: 0 };

  // Check time window: 19:50–20:10
  const hourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = hourFormatter.format(now);
  const [h, m] = timeStr.split(":").map(Number);
  const minuteOfDay = h * 60 + m;
  if (minuteOfDay < 1190 || minuteOfDay > 1210) return { created: 0, notified: 0 };

  const { data: teams } = await supabase.from("teams").select("id, weekly_summary_sent_date");
  if (!teams || teams.length === 0) return { created: 0, notified: 0 };

  let created = 0;
  let notified = 0;

  for (const team of teams as any[]) {
    // Dedup
    if (team.weekly_summary_sent_date === today) continue;

    const { data: members } = await supabase
      .from("team_members")
      .select("athlete_id")
      .eq("team_id", team.id);

    if (!members || members.length === 0) continue;

    const athleteIds = (members as any[]).map((m) => m.athlete_id);
    const totalPlayers = athleteIds.length;

    // This week's reflections (Mon-Sun)
    const mondayStr = getMondayOfWeek(now);
    const { data: weekRefs } = await supabase
      .from("reflections")
      .select("id, athlete_id")
      .in("athlete_id", athleteIds)
      .gte("created_at", mondayStr);

    if (!weekRefs || weekRefs.length === 0) continue; // No reflections = no summary

    // Count reflections per athlete
    const refCountMap = new Map<string, number>();
    const refIds: string[] = [];
    for (const r of weekRefs as any[]) {
      refCountMap.set(r.athlete_id, (refCountMap.get(r.athlete_id) ?? 0) + 1);
      refIds.push(r.id);
    }

    // Most active (most reflections)
    let mostActiveId = "";
    let mostActiveCount = 0;
    for (const [aid, count] of refCountMap) {
      if (count > mostActiveCount) {
        mostActiveId = aid;
        mostActiveCount = count;
      }
    }

    // Get names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", athleteIds);

    const nameMap = new Map<string, string>();
    for (const p of (profiles ?? []) as any[]) {
      nameMap.set(p.id, (p.full_name ?? "Speler").split(" ")[0]);
    }

    // This week's avg scores
    const { data: thisWeekRatings } = await supabase
      .from("reflection_goals")
      .select("reflection_id, rating")
      .in("reflection_id", refIds);

    const refToAthlete = new Map<string, string>();
    for (const r of weekRefs as any[]) refToAthlete.set(r.id, r.athlete_id);

    const athleteAvgs = new Map<string, number>();
    const athleteRatings = new Map<string, number[]>();
    let allRatings: number[] = [];

    for (const rg of (thisWeekRatings ?? []) as any[]) {
      allRatings.push(rg.rating);
      const aid = refToAthlete.get(rg.reflection_id);
      if (aid) {
        const existing = athleteRatings.get(aid) ?? [];
        existing.push(rg.rating);
        athleteRatings.set(aid, existing);
      }
    }

    for (const [aid, ratings] of athleteRatings) {
      athleteAvgs.set(aid, ratings.reduce((a, b) => a + b, 0) / ratings.length);
    }

    const teamAverage = allRatings.length > 0
      ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
      : null;

    // Last week's avg for comparison
    const lastMondayDate = new Date(mondayStr);
    lastMondayDate.setDate(lastMondayDate.getDate() - 7);
    const lastMondayStr = lastMondayDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    const { data: lastWeekRefs } = await supabase
      .from("reflections")
      .select("id")
      .in("athlete_id", athleteIds)
      .gte("created_at", lastMondayStr)
      .lt("created_at", mondayStr);

    let lastWeekAvg: number | null = null;
    if (lastWeekRefs && lastWeekRefs.length > 0) {
      const lastRefIds = (lastWeekRefs as any[]).map((r) => r.id);
      const { data: lastRatings } = await supabase
        .from("reflection_goals")
        .select("rating")
        .in("reflection_id", lastRefIds);

      if (lastRatings && lastRatings.length > 0) {
        lastWeekAvg = (lastRatings as any[]).reduce((a, r) => a + r.rating, 0) / lastRatings.length;
      }
    }

    const avgChange = teamAverage !== null && lastWeekAvg !== null
      ? Math.round((teamAverage - lastWeekAvg) * 10) / 10
      : undefined;

    // Biggest growth: compare this week's avg to last week's avg per athlete
    let biggestGrowthId = "";
    let biggestGrowthDelta = 0;

    if (lastWeekRefs && lastWeekRefs.length > 0) {
      const lastRefIds = (lastWeekRefs as any[]).map((r) => r.id);
      // Get last week athlete-level ratings
      const { data: lastWeekRefDetails } = await supabase
        .from("reflections")
        .select("id, athlete_id")
        .in("id", lastRefIds);

      const { data: lastWeekRGoals } = await supabase
        .from("reflection_goals")
        .select("reflection_id, rating")
        .in("reflection_id", lastRefIds);

      const lastRefToAthlete = new Map<string, string>();
      for (const r of (lastWeekRefDetails ?? []) as any[]) lastRefToAthlete.set(r.id, r.athlete_id);

      const lastAthleteRatings = new Map<string, number[]>();
      for (const rg of (lastWeekRGoals ?? []) as any[]) {
        const aid = lastRefToAthlete.get(rg.reflection_id);
        if (aid) {
          const existing = lastAthleteRatings.get(aid) ?? [];
          existing.push(rg.rating);
          lastAthleteRatings.set(aid, existing);
        }
      }

      for (const [aid, thisAvg] of athleteAvgs) {
        const lastRatings = lastAthleteRatings.get(aid);
        if (!lastRatings || lastRatings.length === 0) continue;
        const lastAvg = lastRatings.reduce((a, b) => a + b, 0) / lastRatings.length;
        const delta = thisAvg - lastAvg;
        if (delta > biggestGrowthDelta) {
          biggestGrowthDelta = delta;
          biggestGrowthId = aid;
        }
      }
    }

    const playersReflected = refCountMap.size;

    // Unpin previous weekly summary
    await supabase
      .from("feed_events")
      .update({ is_pinned: false })
      .eq("team_id", team.id)
      .eq("event_type", "weekly_summary")
      .eq("is_pinned", true);

    // Insert new weekly summary
    const metadata: Record<string, any> = {
      mostActive: mostActiveId ? nameMap.get(mostActiveId) : null,
      biggestGrowth: biggestGrowthId && biggestGrowthDelta > 0 ? nameMap.get(biggestGrowthId) : null,
      teamAverage,
      avgChange,
      playersReflected,
      totalPlayers,
    };

    await supabase.from("feed_events").insert({
      team_id: team.id,
      event_type: "weekly_summary",
      metadata,
      is_pinned: true,
    });
    created++;

    // Mark dedup
    await supabase.from("teams").update({ weekly_summary_sent_date: today }).eq("id", team.id);

    // Notify all team members
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, push_token, language, notifications_paused_until")
      .in("id", athleteIds)
      .not("push_token", "is", null);

    // Also notify coaches
    const { data: coaches } = await supabase
      .from("team_coaches")
      .select("coach_id")
      .eq("team_id", team.id);

    const coachIds = (coaches ?? []).map((c: any) => c.coach_id);
    let coachProfiles: any[] = [];
    if (coachIds.length > 0) {
      const { data: cp } = await supabase
        .from("profiles")
        .select("id, push_token, language, notifications_paused_until")
        .in("id", coachIds)
        .not("push_token", "is", null);
      coachProfiles = (cp ?? []) as any[];
    }

    const allToNotify = [...((allProfiles ?? []) as any[]), ...coachProfiles];

    for (const p of allToNotify) {
      if (p.notifications_paused_until && new Date(p.notifications_paused_until) > now) continue;

      const lang = p.language ?? "nl";
      const body = lang === "nl"
        ? "Het weekoverzicht van je team is klaar!"
        : "Your team's weekly summary is ready!";

      const success = await sendExpoPush({
        to: p.push_token,
        title: lang === "nl" ? "Weekoverzicht" : "Weekly Summary",
        body,
        data: { type: "weekly_summary" },
        sound: "default",
      });

      if (success) notified++;
    }
  }

  return { created, notified };
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
    const nowIso = new Date().toISOString();
    const amsterdamTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    }).format(new Date());
    console.log(`[send-notifications] starting run — UTC: ${nowIso}, Amsterdam: ${amsterdamTime}`);

    // Load templates once; all process functions share the same map
    const templates = await loadTemplates();

    const [preResult, postResult, feedbackResult, weeklyResult, coachReportResult, matchDayResult, goalDeadlineResult, streakRescueResult, flowResult, weeklyActionResult, outlierResult, outlierActionResult, feedEventsResult, reactionResult, weeklySummaryResult] = await Promise.all([
      processPreTraining(templates),
      processPostTraining(templates),
      processCoachFeedback(templates),
      processWeeklyReflection(templates),
      processCoachWeeklyReport(templates),
      processMatchDayNotifications(),
      processGoalDeadlines(),
      processStreakRescue(),
      processFlows(),
      processCoachWeeklyActionNotifications(),
      processOutlierNotifications(),
      processOutlierActionNotifications(),
      processAutoFeedEvents(),
      processReactionNotifications(),
      processWeeklyTeamSummary(),
    ]);

    const summary = {
      pre_training: preResult,
      post_training: postResult,
      coach_feedback: feedbackResult,
      weekly_reflection: weeklyResult,
      coach_report: coachReportResult,
      match_day: matchDayResult,
      goal_deadlines: goalDeadlineResult,
      streak_rescue: streakRescueResult,
      flows: flowResult,
      weekly_actions: weeklyActionResult,
      outlier: outlierResult,
      outlier_actions: outlierActionResult,
      feed_events: feedEventsResult,
      feed_reactions: reactionResult,
      weekly_summary: weeklySummaryResult,
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
