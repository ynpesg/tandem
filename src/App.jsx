import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import {
  Home, Utensils, Dumbbell, Users, Settings, Plus, Droplet, Flame,
  Check, X, ChevronLeft, ChevronRight, Sparkles, Heart, Trash2,
  Footprints, Bike, Activity, RefreshCw, Clock, Send, Edit3,
  ChevronDown, Wand2, Minus, Scale, Ruler, Camera, Wine, Leaf,
  TrendingUp, TrendingDown, BarChart3, CalendarDays, AlertTriangle, Sun, Moon,
  Play, Timer, ChevronUp
} from "lucide-react";

/* ============================================================
   TANDEM — get in shape, together.
   ============================================================ */

const BG = "#F6F7F9";
const INK = "#11151C";
const VIOLET = "#7C5CFC";
const ACCENTS = [
  { id: "sky",    hex: "#0EA5E9", name: "Sky" },
  { id: "rose",   hex: "#F43F5E", name: "Rose" },
  { id: "violet", hex: "#7C5CFC", name: "Violet" },
  { id: "amber",  hex: "#F59E0B", name: "Amber" },
  { id: "emerald",hex: "#10B981", name: "Emerald" },
  { id: "coral",  hex: "#FB7185", name: "Coral" },
];
const accentHex = (id) => (ACCENTS.find((a) => a.id === id) || ACCENTS[0]).hex;

const ACT = {
  sedentary: { f: 1.2,   label: "Mostly sitting", desc: "Desk job, on your feet very little" },
  light:     { f: 1.375, label: "Lightly active", desc: "Some walking / on your feet a bit" },
  moderate:  { f: 1.55,  label: "Moderately active", desc: "On your feet a fair amount most days" },
  very:      { f: 1.725, label: "Very active", desc: "Physical job or constantly moving" },
};
// Goals. "recomp" = lose fat and build muscle at the same time (eat near
// maintenance, train hard, keep protein high).
const GOALS = {
  lose:     { label: "Lose fat", desc: "Calorie deficit" },
  recomp:   { label: "Recomp", desc: "Lose fat + build muscle" },
  maintain: { label: "Maintain", desc: "Hold steady" },
  gain:     { label: "Build muscle", desc: "Lean surplus" },
};
const PACES = {
  gentle:     { label: "Gentle", desc: "Easy does it" },
  standard:   { label: "Standard", desc: "Steady progress" },
  aggressive: { label: "Aggressive", desc: "Hardcore — read the note", warn: true },
};
const ACCESS = {
  gym:     { label: "Full gym", short: "Gym", desc: "Weights + machines", icon: Dumbbell },
  home:    { label: "Home / minimal", short: "Home", desc: "Bodyweight + a few items", icon: Activity },
  outdoor: { label: "Outdoor", short: "Outdoor", desc: "Walking, running, hiking", icon: Footprints },
};
const TOGETHER_MODES = {
  none:  { label: "On our own", desc: "No shared sessions" },
  few:   { label: "A few days", desc: "Mon · Wed · Sat" },
  daily: { label: "Every day", desc: "One together each day" },
};
const TIMES = ["Morning", "Lunch", "Afternoon", "Evening"];
const DRINKS = [
  { label: "Beer", cal: 150 }, { label: "Wine", cal: 125 },
  { label: "Spirit", cal: 100 }, { label: "Seltzer", cal: 100 },
];
const MEASURE_FIELDS = [
  { key: "waist", label: "Waist" }, { key: "chest", label: "Chest" },
  { key: "hips", label: "Hips" }, { key: "arms", label: "Arm" }, { key: "thighs", label: "Thigh" },
];
const MEALS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snacks", label: "Snacks" },
];
const CUSTOM_TYPES = [
  { key: "strength", label: "Strength" }, { key: "cardio", label: "Cardio" },
  { key: "run", label: "Run" }, { key: "bike", label: "Bike" },
  { key: "mobility", label: "Yoga / mobility" }, { key: "other", label: "Other" },
];
const mealForNow = () => { const h = new Date().getHours(); return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snacks"; };
const VESSELS = [
  { label: "Stanley", oz: 30 },
  { label: "Yeti", oz: 26 },
  { label: "Owala", oz: 24 },
];
const GLASS = [8, 12, 16];
const POSES = [
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
  { key: "back", label: "Back" },
];
const CHECKIN_DAYS = 7;
const isDue = (ts) => !ts || Date.now() - ts >= CHECKIN_DAYS * 86400000;
const daysSince = (ts) => (ts ? Math.floor((Date.now() - ts) / 86400000) : null);

/* ---------- workout content (rotating split + together pool) ---------- */
const FOCUS = {
  gym: ["Push", "Pull", "Legs", "Arms", "Upper body", "Core & conditioning"],
  home: ["Full-body strength", "Push & core", "Lower body", "Arms & shoulders", "HIIT burner", "Mobility & core"],
  outdoor: ["Brisk walk + intervals", "Hill repeats", "Walk + bodyweight", "Steady distance", "Run/walk intervals", "Recovery & mobility"],
};
const FOCUS_TEMPLATES = {
  gym: {
    "Push": { type: "strength", duration: 42, ex: [["Bench press","4 × 8"],["Overhead press","3 × 10"],["Incline DB press","3 × 10"],["Cable fly","3 × 12"],["Triceps pushdown","3 × 12"]] },
    "Pull": { type: "strength", duration: 42, ex: [["Deadlift","4 × 5"],["Lat pulldown","3 × 10"],["Seated row","3 × 10"],["Face pull","3 × 15"],["Hammer curl","3 × 12"]] },
    "Legs": { type: "strength", duration: 44, ex: [["Back squat","4 × 6"],["Leg press","3 × 12"],["Romanian deadlift","3 × 10"],["Walking lunge","3 × 20"],["Calf raise","4 × 15"]] },
    "Arms": { type: "strength", duration: 38, ex: [["Barbell curl","4 × 10"],["Skull crusher","4 × 10"],["Hammer curl","3 × 12"],["Triceps pushdown","3 × 15"],["Cable curl","3 × 15"]] },
    "Upper body": { type: "strength", duration: 42, ex: [["Bench press","3 × 8"],["Pull-up","3 × 8"],["Shoulder press","3 × 10"],["DB row","3 × 10"],["Lateral raise","3 × 15"]] },
    "Core & conditioning": { type: "cardio", duration: 35, ex: [["Hanging leg raise","3 × 12"],["Cable crunch","3 × 15"],["Plank","3 × 60s"],["Russian twist","3 × 20"],["Row or bike intervals","10 min"]] },
  },
  home: {
    "Full-body strength": { type: "strength", duration: 32, ex: [["Push-ups","4 × 12"],["Air squats","4 × 20"],["Reverse lunge","3 × 12/side"],["Pike push-up","3 × 10"],["Glute bridge","3 × 15"]] },
    "Push & core": { type: "strength", duration: 30, ex: [["Push-ups","4 × max"],["Pike push-up","3 × 10"],["Chair dips","3 × 12"],["Plank","3 × 45s"],["Hollow hold","3 × 30s"]] },
    "Lower body": { type: "strength", duration: 32, ex: [["Bulgarian split squat","3 × 12/side"],["Air squats","4 × 25"],["Single-leg RDL","3 × 10/side"],["Calf raise","4 × 20"],["Wall sit","3 × 60s"]] },
    "Arms & shoulders": { type: "strength", duration: 28, ex: [["Pike push-up","4 × 8"],["Diamond push-ups","3 × 10"],["Chair dips","4 × 12"],["Towel/biceps curls","3 × 15"],["Lateral raise (jugs)","3 × 15"]] },
    "HIIT burner": { type: "cardio", duration: 24, ex: [["Burpees","6 × 30s"],["Mountain climbers","6 × 30s"],["Squat jumps","6 × 30s"],["High knees","6 × 30s (30s rest)"]] },
    "Mobility & core": { type: "mobility", duration: 26, ex: [["Dead bug","3 × 10"],["Bird dog","3 × 10"],["World's greatest stretch","2 × 5/side"],["Cat-cow","2 min"],["Plank","3 × 45s"]] },
  },
  outdoor: {
    "Brisk walk + intervals": { type: "cardio", duration: 35, ex: [["Warm-up","5 min easy"],["Fast / easy intervals","8 × (1 min fast / 2 min easy)"],["Cool-down","5 min"]] },
    "Hill repeats": { type: "cardio", duration: 36, ex: [["Find a hill or incline","—"],["Up-tempo climbs","6 × 3 min"],["Walk down","recovery between"]] },
    "Walk + bodyweight": { type: "strength", duration: 34, ex: [["Walk","15 min"],["Squats","3 × 15"],["Push-ups","3 × 10"],["Lunges","3 × 10/side"]] },
    "Steady distance": { type: "cardio", duration: 42, ex: [["Steady walk or jog","40–45 min, conversational pace"]] },
    "Run/walk intervals": { type: "cardio", duration: 33, ex: [["Jog / walk","10 × (2 min jog / 1 min walk)"]] },
    "Recovery & mobility": { type: "mobility", duration: 28, ex: [["Easy walk","20 min"],["Full-body stretch","10 min"]] },
  },
};
const TOGETHER_POOL = [
  { title: "Evening run", type: "run", duration: 30, location: "Outside",
    ex: [["Easy-pace run","~2 mi together"],["Cool-down walk","5 min"]] },
  { title: "Backyard Spartan circuit", type: "strength", duration: 28, location: "Backyard",
    ex: [["Burpees","4 × 10"],["Jump squats","4 × 15"],["Bear crawl","4 × 20 ft"],["Push-ups","4 × 12"],["Plank hold","4 × 45s"]] },
  { title: "Yoga flow", type: "mobility", duration: 30, location: "Living room",
    ex: [["Sun salutations","5 rounds"],["Warrior I & II","5 breaths each"],["Pigeon pose","2 min/side"],["Forward fold","2 min"],["Savasana","3 min"]] },
  { title: "Couples bodyweight circuit", type: "strength", duration: 25, location: "Anywhere",
    ex: [["Partner squats","3 × 20"],["Push-up + high-five","3 × 10"],["Wall-sit race","3 × 60s"],["Sit-up pass","3 × 15"]] },
  { title: "Long walk", type: "cardio", duration: 35, location: "Neighborhood",
    ex: [["Steady walk & talk","35 min"]] },
  { title: "Mobility & stretch", type: "mobility", duration: 20, location: "Living room",
    ex: [["Hip openers","5 min"],["Hamstring stretch","2 × 40s"],["Thoracic rotations","2 × 10"],["Deep breathing","3 min"]] },
  { title: "Bike ride", type: "cardio", duration: 35, location: "Outside",
    ex: [["Easy ride together","~30–40 min"]] },
];
const expand = (ex) => ex.map(([name, detail]) => ({ name, detail }));

/* ---------- storage (Supabase-backed) ----------
   A single `entries(key text primary key, value text)` table holds all synced
   data, namespaced by key. The `shared` argument is kept for call-site
   compatibility but every entry lives in the shared project (two trusted
   partners). Personal data (photos) is namespaced by user id and only the
   owner's keys are ever read — private by convention. The device's own
   identity ("which profile am I") stays local to the phone in localStorage. */
const store = {
  async get(key) {
    try {
      const { data, error } = await supabase.from("entries").select("value").eq("key", key).maybeSingle();
      if (error || !data) return null;
      return data.value;
    } catch (e) { return null; }
  },
  async set(key, val) {
    const value = typeof val === "string" ? val : JSON.stringify(val);
    try { await supabase.from("entries").upsert({ key, value, updated_at: new Date().toISOString() }); return true; }
    catch (e) { return false; }
  },
  async del(key) {
    try { await supabase.from("entries").delete().eq("key", key); } catch (e) {}
  },
  async list(prefix = "") {
    try {
      const { data } = await supabase.from("entries").select("key").like("key", prefix.replace(/[%_]/g, "\\$&") + "%");
      return (data || []).map((r) => r.key);
    } catch (e) { return []; }
  },
};
const device = {
  get: () => { try { return localStorage.getItem("tandem.deviceUserId"); } catch (e) { return null; } },
  set: (v) => { try { localStorage.setItem("tandem.deviceUserId", v); } catch (e) {} },
  del: () => { try { localStorage.removeItem("tandem.deviceUserId"); } catch (e) {} },
};
async function getJSON(key, shared = false) {
  const v = await store.get(key, shared);
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}

/* ---------- helpers ---------- */
const uid = () => "u_" + Math.random().toString(36).slice(2, 9);
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const lbToKg = (lb) => lb * 0.45359237;
const ftInToCm = (ft, inch) => (ft * 12 + inch) * 2.54;
const mlToOz = (ml) => ml / 29.5735;
const round = (n, step = 1) => Math.round(n / step) * step;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const pct = (a, b) => (b > 0 ? clamp(a / b, 0, 1) : 0);
function dayOfYear(dateLike) {
  const d = typeof dateLike === "string" ? new Date(dateLike + "T00:00:00") : dateLike;
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
function fmtDate(dk) {
  const d = new Date(dk + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function weekdayLetter(dk) {
  return ["S", "M", "T", "W", "T", "F", "S"][new Date(dk + "T00:00:00").getDay()];
}

function computeTargets(p) {
  const kg = lbToKg(Number(p.weightLb) || 0);
  const cm = ftInToCm(Number(p.heightFt) || 0, Number(p.heightIn) || 0);
  const age = Number(p.age) || 0;
  const base = 10 * kg + 6.25 * cm - 5 * age;
  const bmr = p.sex === "female" ? base - 161 : base + 5;
  const tdee = bmr * (ACT[p.activity]?.f || 1.2);
  const pace = p.pace || "standard";
  let cal = tdee, clamped = false;
  if (p.goal === "lose") {
    const m = pace === "gentle" ? 0.88 : pace === "aggressive" ? 0.72 : 0.8;
    cal = tdee * m;
  } else if (p.goal === "recomp") {
    // eat near maintenance; aggressive leans to a small deficit
    const m = pace === "aggressive" ? 0.9 : pace === "gentle" ? 1.0 : 0.95;
    cal = tdee * m;
  } else if (p.goal === "gain") {
    const m = pace === "gentle" ? 1.07 : pace === "aggressive" ? 1.18 : 1.12;
    const capAdd = pace === "aggressive" ? 800 : 600;
    cal = Math.min(tdee * m, tdee + capAdd);
  }
  // Hard safety floor — never prescribe below this, even on Aggressive.
  const floor = p.sex === "female" ? 1300 : 1500;
  if (cal < floor) { cal = floor; clamped = true; }
  cal = round(cal, 10);
  const perKg = p.goal === "recomp" ? 2.1 : p.goal === "lose" ? 2.0 : p.goal === "gain" ? 1.8 : 1.7;
  const protein = clamp(round(perKg * kg), 40, 260);
  const fat = Math.max(40, round(0.9 * kg));
  const carbs = Math.max(50, round((cal - protein * 4 - fat * 9) / 4));
  const water_oz = clamp(round(mlToOz(35 * kg + 500), 4), 64, 160);
  const warn = pace === "aggressive"
    ? "Aggressive pace: faster isn't always better. Expect it to be demanding, and ease off if your energy, sleep, or mood dip."
    : clamped ? "Calories were raised to a safe minimum." : "";
  return { bmr: round(bmr), tdee: round(tdee), calories: cal, protein, carbs, fat, water_oz, clamped, warn };
}

function totals(log) {
  const f = log?.food || [], a = log?.alcohol || [];
  const foodCal = f.reduce((s, x) => s + (x.cal || 0), 0);
  const alcCal = a.reduce((s, x) => s + (x.cal || 0), 0);
  return {
    cal: foodCal + alcCal,
    p: f.reduce((s, x) => s + (x.p || 0), 0),
    c: f.reduce((s, x) => s + (x.c || 0), 0),
    fat: f.reduce((s, x) => s + (x.f || 0), 0),
    water: log?.water_oz || 0, drinks: a.length, alcCal,
  };
}
function dayScore(profile, log, plan) {
  if (!profile?.targets) return 0;
  const parts = [];
  parts.push(pct(log?.water_oz || 0, profile.targets.water_oz));
  parts.push(pct(totals(log).p, profile.targets.protein));
  const slots = plan?.slots || [];
  if (slots.length) parts.push(slots.filter((x) => x.done).length / slots.length);
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
function streakBack(history, ok, allowPending = true) {
  let s = 0;
  for (let i = 0; i < history.length; i++) {
    if (ok(history[i])) { s++; continue; }
    if (i === 0 && allowPending) continue;
    break;
  }
  return s;
}
function computeStats(history, weights, measures, photoIdx) {
  const dryStreak = streakBack(history, (d) => (d.log?.alcohol?.length || 0) === 0, false);
  const workoutStreak = streakBack(history, (d) => (d.plan?.slots || []).some((s) => s.done));
  const logStreak = streakBack(history, (d) =>
    (d.log?.food?.length || 0) > 0 || (d.log?.water_oz || 0) > 0 ||
    (d.log?.alcohol?.length || 0) > 0 || (d.plan?.slots || []).some((s) => s.done));
  let weight = null, weightChange30 = null;
  if (weights && weights.length) {
    weight = weights[weights.length - 1].lb;
    const cutoff = Date.now() - 30 * 86400000;
    const old = weights.find((w) => w.ts >= cutoff) || weights[0];
    weightChange30 = +(weight - old.lb).toFixed(1);
  }
  const lastWeighTs = weights?.length ? weights[weights.length - 1].ts : 0;
  const lastMeasureTs = measures?.length ? measures[measures.length - 1].ts : 0;
  const lastPhotoTs = photoIdx?.length ? Math.max(...photoIdx.map((p) => p.ts || 0)) : 0;
  return { dryStreak, workoutStreak, logStreak, weight, weightChange30, lastWeighTs, lastMeasureTs, lastPhotoTs, ts: Date.now() };
}

/* ---------- lift tracking ---------- */
function liftKey(name) { return String(name || "").toLowerCase().replace(/\s+/g, " ").trim(); }
function parseTarget(detail = "") {
  const d = String(detail).toLowerCase();
  let sets = 3, lo = null, hi = null, rest = 90;
  const m = d.match(/(\d+)\s*(?:sets?\s*)?[×x]\s*(\d+)(?:\s*[–\-]\s*(\d+))?/);
  if (m) { sets = +m[1]; lo = +m[2]; hi = m[3] ? +m[3] : +m[2]; }
  const r = d.match(/rest\s*(\d+)\s*(?:s|sec)/) || d.match(/(\d+)\s*(?:s|sec)[^a-z]*rest/);
  if (r) rest = +r[1];
  return { sets: clamp(sets, 1, 12), lo, hi: hi || lo || 10, rest: clamp(rest, 15, 300) };
}
function bestSet(sets) {
  let best = null;
  for (const s of (sets || [])) {
    if (s.w == null || s.reps == null) continue;
    if (!best || s.w > best.w || (s.w === best.w && s.reps > best.reps)) best = { w: s.w, reps: s.reps };
  }
  return best;
}
const LOWER_RE = /squat|deadlift|dead lift|leg press|lunge|rdl|romanian|hip thrust|calf|split squat|step-?up|hack/;
function suggestLoad(history, target, name) {
  if (!history || !history.length) return null;
  const last = history[history.length - 1];
  const top = last.top || bestSet(last.sets);
  if (!top || top.w == null) return null;
  const hi = target.hi || 10;
  const inc = LOWER_RE.test(String(name).toLowerCase()) ? 10 : 5;
  const next = top.reps >= hi ? top.w + inc : top.w;
  return { last: top, next, up: next > top.w };
}

/* ---------- AI ---------- */
/* AI is optional. Set VITE_AI_PROXY_URL to a serverless proxy that holds your
   Anthropic key (a Supabase Edge Function is included in /supabase/functions/ai).
   If it's unset, every AI call throws and the app falls back to manual macro
   entry + template workouts — it stays fully usable. */
const AI_PROXY = import.meta.env.VITE_AI_PROXY_URL || "";
async function callClaude(messages, system, maxTokens = 1000) {
  if (!AI_PROXY) throw new Error("AI proxy not configured");
  const body = { model: "claude-sonnet-4-6", max_tokens: maxTokens, messages };
  if (system) body.system = system;
  const res = await fetch(AI_PROXY, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
function parseLoose(text) {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const m = t.match(/[\[{][\s\S]*[\]}]/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}
async function estimateMacros(desc) {
  const out = await callClaude(
    [{ role: "user", content: desc }],
    'You estimate nutrition. Reply with ONLY a JSON object, no prose, no markdown: {"label":string,"calories":int,"protein_g":int,"carbs_g":int,"fat_g":int}. "label" is a short clean food name. Estimate a realistic single serving as described.',
    400);
  const j = parseLoose(out);
  if (!j) throw new Error("bad");
  return { label: String(j.label || desc).slice(0, 40), cal: Math.max(0, Math.round(j.calories || 0)),
    p: Math.max(0, Math.round(j.protein_g || 0)), c: Math.max(0, Math.round(j.carbs_g || 0)), f: Math.max(0, Math.round(j.fat_g || 0)) };
}
async function estimateMacrosFromImage(dataUrl) {
  const m = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!m) throw new Error("bad image");
  const out = await callClaude(
    [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
      { type: "text", text: "Estimate the nutrition of the food in this photo." },
    ] }],
    'You estimate nutrition from a food photo. Reply with ONLY a JSON object, no prose, no markdown: {"label":string,"calories":int,"protein_g":int,"carbs_g":int,"fat_g":int}. Identify the dish and estimate a realistic single serving as shown.',
    400);
  const j = parseLoose(out);
  if (!j) throw new Error("bad");
  return { label: String(j.label || "Food").slice(0, 40), cal: Math.max(0, Math.round(j.calories || 0)),
    p: Math.max(0, Math.round(j.protein_g || 0)), c: Math.max(0, Math.round(j.carbs_g || 0)), f: Math.max(0, Math.round(j.fat_g || 0)) };
}
/* ---------- profile helpers + migration ---------- */
// Older profiles stored a single `access` string and an `eveningTogether` bool.
// Bring them forward to the new multi-access / together-mode shape, keeping the
// legacy fields populated too so nothing that still reads them breaks.
function migrate(p) {
  if (!p) return p;
  const q = { ...p };
  if (!Array.isArray(q.accesses)) q.accesses = q.access ? [q.access] : ["gym"];
  q.access = q.accesses[0];
  if (!q.together) q.together = { mode: q.eveningTogether === false ? "none" : (q.eveningTogether ? "daily" : "few"), time: "Evening" };
  if (!q.sessionsPerDay) q.sessionsPerDay = 1;
  if (!q.secondTime) q.secondTime = "Evening";
  if (!q.pace) q.pace = "standard";
  if (typeof q.trainingStyle !== "string") q.trainingStyle = "";
  return q;
}
const accessesOf = (p) => (p?.accesses?.length ? p.accesses : p?.access ? [p.access] : ["home"]);
const accessesLabel = (p) => accessesOf(p).map((a) => ACCESS[a]?.short || a).join(" + ");

/* ---------- workout building ---------- */
function placeSlot(base, time) {
  return {
    id: uid(), time: time || "Lunch", done: false,
    title: base.title, focus: base.focus, access: base.access, type: base.type,
    duration: Math.round(base.duration || 35), location: base.location || "",
    exercises: (base.exercises || []).map((e) => ({ name: String(e.name || ""), detail: String(e.detail || "") })),
  };
}
function templateSlot(access, focus) {
  const lib = FOCUS_TEMPLATES[access] || FOCUS_TEMPLATES.home;
  const t = lib[focus] || lib[Object.keys(lib)[0]];
  return { title: focus, focus, access, type: t.type, duration: t.duration, location: ACCESS[access]?.label || "", exercises: expand(t.ex) };
}
// Order a modality's focuses by learned preference (liked first, skipped last).
function focusOrder(access, prefs) {
  const arr = [...(FOCUS[access] || FOCUS.home)];
  return arr
    .map((f) => ({ f, s: (prefs?.like?.[f] || 0) - (prefs?.skip?.[f] || 0) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.f);
}
// Which modality a given session of the day draws from. Session 1 favors
// strength (gym > home > outdoor); a 2nd session leans to a different one.
function sessionAccess(accesses, i) {
  const order = ["gym", "home", "outdoor"].filter((a) => accesses.includes(a));
  if (!order.length) return "home";
  if (i === 0) return order[0];
  return order.length > 1 ? order[order.length - 1] : order[0];
}
const COACH_STYLE = `Program like an experienced strength coach:
- Build each session as a warm-up ramp, then working sets. For main lifts, ramp up (a light set ~RPE 1-2, then a few reps around 50-75% of the working weight) before the working sets.
- Prescribe working sets as SETS × REP-RANGE with an RPE target. RPE is reps-in-reserve on a 1-10 scale (RPE 8 ≈ 2 reps left, RPE 10 = failure). Example detail: "3-4 × 8-12 @ RPE 8, rest 90s".
- Use "% of 1RM" only for a heavy compound's warm-up ramp, never as the whole prescription — otherwise use RPE.
- Where it fits, pair movements into supersets, include a unilateral / weak-side-first movement, and a core or anti-rotation piece.
- Keep any cue brief.`;

async function aiFocusWorkout(p, access, focus, note = "") {
  const goalHint = p.goal === "recomp" ? "lose fat while building muscle" : GOALS[p.goal]?.label;
  const style = p.trainingStyle ? `\nTrainee's own style notes: ${p.trainingStyle}` : "";
  const adj = note ? `\nApply this adjustment from the trainee: ${note}` : "";
  const out = await callClaude(
    [{ role: "user", content:
      `Build a "${focus}" workout for ${ACCESS[access]?.label} access. Goal: ${goalHint}. Pace: ${p.pace}. ~30-45 min, 4-6 exercises, realistic.${style}${adj}` }],
    COACH_STYLE + '\n\nReply with ONLY a JSON object, no prose: {"title":string,"type":"strength"|"cardio"|"mobility"|"run","duration_min":int,"exercises":[{"name":string,"detail":string}]}. "detail" must clearly state sets × rep-range @ RPE (and rest), e.g. "3 × 8-12 @ RPE 8, rest 90s". Keep the title close to the requested focus.',
    800);
  const j = parseLoose(out);
  if (!j || !Array.isArray(j.exercises)) throw new Error("bad");
  return { title: j.title || focus, focus, access, type: j.type || "strength",
    duration: j.duration_min || 40, location: ACCESS[access]?.label || "", exercises: j.exercises.slice(0, 10) };
}
async function aiOrTemplate(p, access, focus, cache, note = "") {
  const k = access + "|" + focus + "|" + note;
  if (cache[k]) return cache[k];
  try { cache[k] = await aiFocusWorkout(p, access, focus, note); }
  catch (e) { cache[k] = templateSlot(access, focus); }
  return cache[k];
}
async function aiAdjustDay(p, slots, request) {
  const cur = (slots || []).map((s) => `- ${s.title} (${s.type}, ${s.duration}min): ${(s.exercises || []).map((e) => `${e.name} ${e.detail}`).join("; ")}`).join("\n");
  const style = p.trainingStyle ? `\nTrainee's own style notes: ${p.trainingStyle}` : "";
  const out = await callClaude(
    [{ role: "user", content:
      `Today's planned workout:\n${cur || "(nothing planned)"}\n\nTrainee's request: ${request}\n\nRevise today's workout accordingly. Keep a similar number of sessions unless the request says otherwise.${style}` }],
    COACH_STYLE + '\n\nReply with ONLY a JSON object, no prose: {"sessions":[{"title":string,"type":"strength"|"cardio"|"mobility"|"run","duration_min":int,"exercises":[{"name":string,"detail":string}]}]}. "detail" must clearly state sets × rep-range @ RPE (and rest).',
    1200);
  const j = parseLoose(out);
  if (!j || !Array.isArray(j.sessions)) throw new Error("bad");
  return j.sessions;
}
function togetherBase(date) {
  const t = TOGETHER_POOL[dayOfYear(date) % TOGETHER_POOL.length];
  return { title: t.title, focus: "together", access: "together", type: t.type, duration: t.duration, location: t.location, exercises: expand(t.ex) };
}
function togetherOnDate(p, date) {
  const mode = p.together?.mode || "none";
  if (mode === "none") return false;
  if (mode === "daily") return true;
  const wd = new Date(date + "T00:00:00").getDay(); // 0 Sun .. 6 Sat
  return wd === 1 || wd === 3 || wd === 6; // "few": Mon / Wed / Sat
}

/* ---------- week scheduling ---------- */
function weekStartKey(d = new Date()) {
  const x = new Date(d); const back = (x.getDay() + 6) % 7; // Monday start
  x.setDate(x.getDate() - back); x.setHours(0, 0, 0, 0); return todayKey(x);
}
function weekDates(startKey) {
  const s = new Date(startKey + "T00:00:00"); const out = [];
  for (let i = 0; i < 7; i++) { const d = new Date(s); d.setDate(s.getDate() + i); out.push(todayKey(d)); }
  return out;
}
// Build (or top up) a week of day-plans. force=true rebuilds every day;
// otherwise existing days are kept (so edits and rest days survive). useAI
// enriches with Claude, caching one call per unique (access, focus).
async function buildWeekPlans(p, wkStart, prefs, existing = {}, opts = {}) {
  const { force = false, useAI = false, note = "" } = opts;
  const dates = weekDates(wkStart);
  const accesses = accessesOf(p);
  const orderByAccess = {}; accesses.forEach((a) => (orderByAccess[a] = focusOrder(a, prefs)));
  const n = p.sessionsPerDay === 2 ? 2 : 1;
  const cache = {};
  const out = {};
  for (let di = 0; di < dates.length; di++) {
    const dk = dates[di];
    if (!force && existing[dk]) { out[dk] = existing[dk]; continue; }
    const slots = [];
    for (let i = 0; i < n; i++) {
      const access = sessionAccess(accesses, i);
      const order = orderByAccess[access] || ["Full-body strength"];
      let focus = order[(di + i * (order.length > 1 ? 2 : 1)) % order.length];
      if (slots.some((s) => s.focus === focus)) focus = order[(di + i + 3) % order.length];
      const base = useAI ? await aiOrTemplate(p, access, focus, cache, note) : templateSlot(access, focus);
      slots.push(placeSlot(base, i === 0 ? (p.mainTime || "Lunch") : (p.secondTime || "Evening")));
    }
    if (togetherOnDate(p, dk)) slots.push({ ...placeSlot(togetherBase(dk), p.together?.time || "Evening"), together: true });
    out[dk] = { slots };
  }
  return out;
}
function bumpPref(prefs, focus, kind) {
  const q = { like: { ...(prefs?.like || {}) }, skip: { ...(prefs?.skip || {}) } };
  if (!focus || focus === "together") return q;
  q[kind][focus] = (q[kind][focus] || 0) + 1;
  return q;
}

/* ============================================================
   UI atoms
   ============================================================ */
function StyleInjector() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
      .f-disp{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;}
      .f-body{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;}
      .tnum{font-variant-numeric:tabular-nums;}
      .ring-fg{transition:stroke-dashoffset .7s cubic-bezier(.4,0,.2,1);}
      .card-in{animation:cardIn .4s ease both;}
      @keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @media (prefers-reduced-motion: reduce){.ring-fg{transition:none}.card-in{animation:none}}
      ::-webkit-scrollbar{width:0;height:0}
      input,button,textarea{font-family:inherit}
    `}</style>
  );
}
function Ring({ value, size = 76, stroke = 9, color, track = "#E7EAEF", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(value, 0, 1));
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle className="ring-fg" cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}
function DualRing({ me, partner, meScore, partnerScore }) {
  const size = 168, stroke = 13, ro = (size - stroke) / 2, ri = ro - stroke - 6;
  const co = 2 * Math.PI * ro, ci = 2 * Math.PI * ri;
  return (
    <div style={{ width: size, height: size, position: "relative", margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={ro} fill="none" stroke="#E7EAEF" strokeWidth={stroke} />
        <circle className="ring-fg" cx={size/2} cy={size/2} r={ro} fill="none" stroke={accentHex(me?.accent)}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={co} strokeDashoffset={co * (1 - clamp(meScore, 0, 1))} />
        <circle cx={size/2} cy={size/2} r={ri} fill="none" stroke="#E7EAEF" strokeWidth={stroke} />
        <circle className="ring-fg" cx={size/2} cy={size/2} r={ri} fill="none" stroke={partner ? accentHex(partner.accent) : "#C7CDD6"}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={ci} strokeDashoffset={ci * (1 - clamp(partnerScore, 0, 1))} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="f-disp tnum" style={{ fontSize: 34, fontWeight: 700, color: INK, lineHeight: 1 }}>{Math.round(meScore * 100)}</div>
        <div className="f-body" style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>your day score</div>
      </div>
    </div>
  );
}
function Btn({ children, onClick, kind = "solid", color = INK, disabled, full, size = "md", style }) {
  const pad = size === "sm" ? "8px 12px" : size === "lg" ? "14px 18px" : "11px 16px";
  const base = { padding: pad, borderRadius: 14, fontWeight: 600, fontSize: size === "sm" ? 13 : 15,
    cursor: disabled ? "default" : "pointer", border: "none", width: full ? "100%" : "auto",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    opacity: disabled ? 0.45 : 1, transition: "transform .08s, filter .15s", ...style };
  const styles = kind === "solid" ? { ...base, background: color, color: "#fff" }
    : kind === "soft" ? { ...base, background: color + "1a", color }
    : { ...base, background: "#fff", color: INK, border: "1px solid #E2E6EC" };
  return (
    <button className="f-body" style={styles} disabled={disabled} onClick={onClick}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "none")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>{children}</button>
  );
}
function Card({ children, style, className = "" }) {
  return <div className={"card-in " + className} style={{ background: "#fff", border: "1px solid #EBEEF2",
    borderRadius: 20, padding: 18, boxShadow: "0 1px 2px rgba(16,21,28,.04)", marginBottom: 14, ...style }}>{children}</div>;
}
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>{label}</div>
      {children}
      {hint && <div className="f-body" style={{ fontSize: 12, color: "#9097A1", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 13, border: "1px solid #DFE3E9",
  fontSize: 15, color: INK, outline: "none", background: "#fff", boxSizing: "border-box" };
function TextInput(props) {
  return <input className="f-body" style={inputStyle} {...props}
    onFocus={(e) => (e.target.style.borderColor = "#11151C")} onBlur={(e) => (e.target.style.borderColor = "#DFE3E9")} />;
}
function Choice({ options, value, onChange, columns = 1 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 9 }}>
      {options.map((o) => {
        const sel = value === o.value;
        return (
          <button key={o.value} className="f-body" onClick={() => onChange(o.value)}
            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 14, cursor: "pointer",
              border: sel ? "2px solid " + INK : "1px solid #E2E6EC", background: sel ? "#11151C" : "#fff",
              color: sel ? "#fff" : INK, transition: "all .12s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {o.icon && <o.icon className="w-4 h-4" />}
              <span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>
            </div>
            {o.desc && <div style={{ fontSize: 12, marginTop: 3, opacity: sel ? 0.8 : 0.6 }}>{o.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}
function MultiChoice({ options, values, onToggle, columns = 1 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 9 }}>
      {options.map((o) => {
        const sel = (values || []).includes(o.value);
        return (
          <button key={o.value} className="f-body" onClick={() => onToggle(o.value)}
            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 14, cursor: "pointer",
              border: sel ? "2px solid " + INK : "1px solid #E2E6EC", background: sel ? "#11151C" : "#fff",
              color: sel ? "#fff" : INK, transition: "all .12s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {o.icon && <o.icon className="w-4 h-4" />}
              <span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>
              {sel && <Check className="w-4 h-4" style={{ marginLeft: "auto" }} />}
            </div>
            {o.desc && <div style={{ fontSize: 12, marginTop: 3, opacity: sel ? 0.8 : 0.6 }}>{o.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}
function Avatar({ p, size = 36 }) {  return <div className="f-disp" style={{ width: size, height: size, borderRadius: size / 3, background: accentHex(p.accent),
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42, flexShrink: 0 }}>
    {(p.name || "?").trim().charAt(0).toUpperCase()}</div>;
}
function Metric({ label, value, unit, color, big }) {
  return (
    <div style={{ background: "#F6F7F9", borderRadius: 14, padding: big ? "14px" : "10px 12px" }}>
      <div className="f-body" style={{ fontSize: 12, color: "#7A828D", marginBottom: 4 }}>{label}</div>
      <div className="f-disp tnum" style={{ fontSize: big ? 24 : 18, fontWeight: 700, color: INK }}>
        {value}<span style={{ fontSize: 12, color, marginLeft: 4, fontWeight: 600 }}>{unit}</span></div>
    </div>
  );
}
function Bar({ value, color, height = 8 }) {
  return <div style={{ height, background: "#EDEFF2", borderRadius: height, overflow: "hidden" }}>
    <div className="ring-fg" style={{ width: `${clamp(value, 0, 1) * 100}%`, height: "100%", background: color, borderRadius: height, transition: "width .5s ease" }} /></div>;
}
function MiniBar({ label, v, max, unit, color }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="f-body" style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
        <span className="f-disp tnum" style={{ fontSize: 12, color: INK, fontWeight: 600 }}>{v}<span style={{ color: "#B6BCC4" }}>/{max}{unit}</span></span>
      </div>
      <Bar value={pct(v, max)} color={color} height={6} />
    </div>
  );
}
function MiniLine({ values, color = INK, height = 50 }) {
  if (!values || values.length < 2)
    return <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1", padding: "10px 0" }}>Log a couple of entries to see your trend.</div>;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1, n = values.length;
  const pts = values.map((v, i) => [n === 1 ? 50 : (i / (n - 1)) * 96 + 2, 40 - ((v - min) / range) * 34 + 3]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2" fill="#fff" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}
function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
      <h2 className="f-disp" style={{ fontSize: 18, fontWeight: 700, color: INK, margin: 0 }}>{children}</h2>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}
function Screen({ children }) { return <div style={{ padding: "14px 16px 92px", maxWidth: 480, margin: "0 auto" }}>{children}</div>; }
function Header({ me, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingTop: 4 }}>
      <div style={{ flex: 1 }}>
        {title ? <h1 className="f-disp" style={{ fontSize: 24, fontWeight: 700, color: INK, margin: 0 }}>{title}</h1>
          : <h1 className="f-disp" style={{ fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>Hi, {me.name}</h1>}
        {subtitle && <div className="f-body" style={{ fontSize: 13.5, color: "#9097A1", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Avatar p={me} size={40} />
    </div>
  );
}
function Empty({ icon: Icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "18px 8px" }}>
      <Icon className="w-7 h-7" style={{ color: "#C7CDD6", margin: "0 auto 8px" }} />
      <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 14.5 }}>{title}</div>
      <div className="f-body" style={{ fontSize: 13, color: "#9097A1", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function greeting() { const h = new Date().getHours(); return h < 12 ? "Let's start strong." : h < 18 ? "Keep the momentum." : "Finish the day well."; }
function StreakPill({ icon: Icon, n, label, color }) {
  return (
    <div style={{ flex: 1, background: "#F6F7F9", borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
      <Icon className="w-4 h-4" style={{ color, margin: "0 auto 4px" }} />
      <div className="f-disp tnum" style={{ fontSize: 20, fontWeight: 700, color: INK, lineHeight: 1 }}>{n}</div>
      <div className="f-body" style={{ fontSize: 10.5, color: "#7A828D", marginTop: 3 }}>{label}</div>
    </div>
  );
}

/* ============================================================
   SETUP
   ============================================================ */
function Setup({ existing, onDone }) {
  const [step, setStep] = useState(existing.length ? -1 : 0);
  const [p, setP] = useState({
    id: uid(), name: "", accent: existing.length ? "rose" : "sky", sex: "male",
    age: "", heightFt: "", heightIn: "", weightLb: "",
    activity: "moderate", goal: "recomp", pace: "standard",
    accesses: ["gym"], sessionsPerDay: 1, mainTime: "Lunch", secondTime: "Evening",
    together: { mode: "few", time: "Evening" },
  });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const targets = computeTargets(p);

  const STEPS = [
    { title: "Who's this?", valid: () => p.name.trim().length > 0, body: (
      <>
        <Field label="Your name"><TextInput value={p.name} placeholder="e.g. Evan" onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Your color" hint="So you and your partner are easy to tell apart.">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {ACCENTS.map((a) => (
              <button key={a.id} onClick={() => set("accent", a.id)} style={{ width: 40, height: 40, borderRadius: 12, background: a.hex,
                cursor: "pointer", border: p.accent === a.id ? "3px solid #11151C" : "3px solid transparent", boxShadow: "0 0 0 1px #E2E6EC" }} />
            ))}
          </div>
        </Field>
        <Field label="Sex" hint="Used only for the metabolic rate formula.">
          <Choice columns={2} value={p.sex} onChange={(v) => set("sex", v)} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </Field>
      </>
    ) },
    { title: "Your body", valid: () => p.age && p.weightLb && p.heightFt, body: (
      <>
        <Field label="Age"><TextInput type="number" inputMode="numeric" value={p.age} placeholder="years" onChange={(e) => set("age", e.target.value)} /></Field>
        <Field label="Height">
          <div style={{ display: "flex", gap: 10 }}>
            <TextInput type="number" inputMode="numeric" value={p.heightFt} placeholder="ft" onChange={(e) => set("heightFt", e.target.value)} />
            <TextInput type="number" inputMode="numeric" value={p.heightIn} placeholder="in" onChange={(e) => set("heightIn", e.target.value)} />
          </div>
        </Field>
        <Field label="Weight"><TextInput type="number" inputMode="decimal" value={p.weightLb} placeholder="lbs" onChange={(e) => set("weightLb", e.target.value)} /></Field>
      </>
    ) },
    { title: "How active is your everyday life?", valid: () => true, body: (
      <>
        <p className="f-body" style={{ fontSize: 13.5, color: "#6B7280", margin: "-6px 0 14px", lineHeight: 1.5 }}>
          This is about your normal day — job, walking, errands — <b>not</b> the workouts Tandem plans for you. It sets your baseline calorie burn.
        </p>
        <Choice value={p.activity} onChange={(v) => set("activity", v)} options={Object.entries(ACT).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} />
      </>
    ) },
    { title: "What's the goal?", valid: () => true, body: (
      <>
        <Choice value={p.goal} onChange={(v) => set("goal", v)} options={Object.entries(GOALS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} columns={2} />
        {p.goal !== "maintain" && (
          <div style={{ marginTop: 16 }}>
            <Field label="Pace">
              <Choice columns={3} value={p.pace} onChange={(v) => set("pace", v)} options={Object.entries(PACES).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} />
            </Field>
            {p.pace === "aggressive" && (
              <div className="f-body" style={{ display: "flex", gap: 9, fontSize: 12.5, color: "#92400E", background: "#FEF3C7", borderRadius: 12, padding: "11px 13px", lineHeight: 1.5 }}>
                <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1, color: "#B45309" }} />
                <span>Hardcore mode. Tandem will push the deficit/surplus hard — but never below a safe calorie floor. Faster isn't always better: watch your energy, sleep, and mood, and dial it back if they slip.</span>
              </div>
            )}
          </div>
        )}
      </>
    ) },
    { title: "How do you train?", valid: () => p.accesses.length > 0, body: (
      <>
        <Field label="What do you have access to?" hint="Pick all that apply — Tandem mixes them across your week.">
          <MultiChoice columns={1} values={p.accesses}
            onToggle={(v) => { const has = p.accesses.includes(v); let next = has ? p.accesses.filter((a) => a !== v) : [...p.accesses, v]; if (!next.length) next = [v]; setP((s) => ({ ...s, accesses: next, access: next[0] })); }}
            options={Object.entries(ACCESS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc, icon: v.icon }))} />
        </Field>
        <Field label="Sessions per day" hint="Two-a-day lets Tandem schedule, e.g., a gym lift in the morning and yoga or a walk later.">
          <Choice columns={2} value={p.sessionsPerDay} onChange={(v) => set("sessionsPerDay", v)} options={[
            { value: 1, label: "One a day" }, { value: 2, label: "Two a day" }]} />
        </Field>
        <Field label={p.sessionsPerDay === 2 ? "First session time" : "When do you usually train?"}>
          <Choice columns={2} value={p.mainTime} onChange={(v) => set("mainTime", v)} options={TIMES.map((t) => ({ value: t, label: t }))} />
        </Field>
        {p.sessionsPerDay === 2 && (
          <Field label="Second session time">
            <Choice columns={2} value={p.secondTime} onChange={(v) => set("secondTime", v)} options={TIMES.map((t) => ({ value: t, label: t }))} />
          </Field>
        )}
      </>
    ) },
    { title: "Training together", valid: () => true, body: (
      <>
        <p className="f-body" style={{ fontSize: 13.5, color: "#6B7280", margin: "-6px 0 14px", lineHeight: 1.5 }}>
          How often do you want a shared session with your partner? It rotates through a run, backyard Spartan circuit, yoga, a long walk, and more — and lands on both of your plans the same day.
        </p>
        <Choice value={p.together.mode} onChange={(v) => set("together", { ...p.together, mode: v })}
          options={Object.entries(TOGETHER_MODES).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} />
        {p.together.mode !== "none" && (
          <div style={{ marginTop: 14 }}>
            <Field label="When?">
              <Choice columns={2} value={p.together.time} onChange={(v) => set("together", { ...p.together, time: v })} options={TIMES.map((t) => ({ value: t, label: t }))} />
            </Field>
          </div>
        )}
      </>
    ) },
    { title: "Your daily targets", valid: () => true, body: (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <Metric big label="Calories" value={targets.calories} unit="kcal" color={accentHex(p.accent)} />
          <Metric big label="Protein" value={targets.protein} unit="g" color={VIOLET} />
          <Metric big label="Water" value={targets.water_oz} unit="oz" color="#0EA5E9" />
          <Metric big label="Carbs / Fat" value={`${targets.carbs} / ${targets.fat}`} unit="g" color="#10B981" />
        </div>
        {targets.warn && (
          <div className="f-body" style={{ display: "flex", gap: 9, fontSize: 12.5, color: "#92400E", background: "#FEF3C7", borderRadius: 12, padding: "11px 13px", marginBottom: 12, lineHeight: 1.5 }}>
            <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1, color: "#B45309" }} />
            <span>{targets.warn}</span>
          </div>
        )}
        <div className="f-body" style={{ fontSize: 12.5, color: "#7A828D", lineHeight: 1.5, background: "#F4F6F8", borderRadius: 12, padding: "11px 13px" }}>
          Built from the Mifflin–St Jeor equation and standard guidelines (BMR {targets.bmr} · maintenance ≈ {targets.tdee} kcal).
          {" "}It's a starting point — adjust to how you feel, and check with a doctor or dietitian for anything personalized.
        </div>
      </>
    ) },
  ];

  if (step === -1) {
    return (
      <SetupShell>
        <div className="f-disp" style={{ fontSize: 13, letterSpacing: 2, color: "#9097A1", marginBottom: 8 }}>WELCOME TO TANDEM</div>
        <h1 className="f-disp" style={{ fontSize: 26, fontWeight: 700, color: INK, margin: "0 0 6px" }}>Who's setting up?</h1>
        <p className="f-body" style={{ color: "#6B7280", margin: "0 0 20px", fontSize: 14.5 }}>
          {existing.length} profile{existing.length > 1 ? "s" : ""} already here. Tap yours, or add the second one.</p>
        {existing.map((ep) => (
          <button key={ep.id} className="f-body" onClick={() => onDone(ep, true)} style={{ width: "100%", display: "flex", alignItems: "center",
            gap: 12, padding: 14, borderRadius: 16, border: "1px solid #E2E6EC", background: "#fff", cursor: "pointer", marginBottom: 10 }}>
            <Avatar p={ep} size={42} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, color: INK }}>{ep.name}</div>
              <div style={{ fontSize: 12.5, color: "#9097A1" }}>{GOALS[ep.goal]?.label} · {accessesLabel(ep)}</div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ marginLeft: "auto", color: "#C7CDD6" }} />
          </button>
        ))}
        <Btn full kind="soft" color={INK} onClick={() => setStep(0)}><Plus className="w-4 h-4" /> Add a new profile</Btn>
      </SetupShell>
    );
  }
  const s = STEPS[step];
  return (
    <SetupShell>
      <div style={{ display: "flex", gap: 5, marginBottom: 22 }}>
        {STEPS.map((_, i) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i <= step ? accentHex(p.accent) : "#E7EAEF", transition: "background .3s" }} />)}
      </div>
      <h1 className="f-disp" style={{ fontSize: 24, fontWeight: 700, color: INK, margin: "0 0 18px" }}>{s.title}</h1>
      <div style={{ minHeight: 120 }}>{s.body}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {(step > 0 || existing.length > 0) && <Btn kind="outline" onClick={() => (step === 0 ? setStep(-1) : setStep(step - 1))}><ChevronLeft className="w-4 h-4" /> Back</Btn>}
        {step < STEPS.length - 1
          ? <Btn full color={accentHex(p.accent)} disabled={!s.valid()} onClick={() => setStep(step + 1)}>Continue</Btn>
          : <Btn full color={accentHex(p.accent)} onClick={() => onDone({ ...p, targets }, false)}><Check className="w-4 h-4" /> Start</Btn>}
      </div>
    </SetupShell>
  );
}
function SetupShell({ children }) {
  return (
    <div style={{ minHeight: "100%", background: BG, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, paddingTop: 18 }}><Card style={{ padding: 24 }}>{children}</Card></div>
    </div>
  );
}

/* ============================================================
   TODAY
   ============================================================ */
function Today({ me, partner, myLog, partnerLog, myPlan, partnerPlan, myStats, nudge, onClearNudge, onGo, onStart }) {
  const t = me.targets, tot = totals(myLog);
  const myScore = dayScore(me, myLog, myPlan);
  const partnerScore = partner ? dayScore(partner, partnerLog, partnerPlan) : 0;
  const [coach, setCoach] = useState("");
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const line = await callClaude([{ role: "user", content:
          `Give ONE short upbeat coaching line (max 16 words) for ${me.name}, at ${Math.round(myScore*100)}% of today's goals${partner ? `, partner ${partner.name} at ${Math.round(partnerScore*100)}%` : ""}. No emoji, no quotes.` }],
          "You are a warm, concise fitness buddy.", 120);
        if (live) setCoach(line.replace(/^["']|["']$/g, ""));
      } catch (e) {}
    })();
    return () => { live = false; };
  }, []); // eslint-disable-line
  return (
    <Screen>
      <Header me={me} subtitle={greeting()} />
      {nudge && (
        <Card style={{ borderColor: accentHex(partner?.accent || "rose") + "55", background: accentHex(partner?.accent || "rose") + "0f", display: "flex", alignItems: "center", gap: 10 }}>
          <Heart className="w-5 h-5" style={{ color: accentHex(partner?.accent || "rose") }} />
          <div className="f-body" style={{ fontSize: 14, color: INK, flex: 1 }}><b>{partner?.name || "Partner"}:</b> {nudge.text}</div>
          <button onClick={onClearNudge} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="w-4 h-4" style={{ color: "#9097A1" }} /></button>
        </Card>
      )}
      <Card style={{ textAlign: "center", paddingTop: 24, paddingBottom: 22 }}>
        <DualRing me={me} partner={partner} meScore={myScore} partnerScore={partnerScore} />
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 16 }}>
          <Legend p={me} score={myScore} you />
          {partner ? <Legend p={partner} score={partnerScore} /> : <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1", alignSelf: "center" }}>partner not set up yet</div>}
        </div>
        {coach && <div className="f-body" style={{ marginTop: 16, fontSize: 13.5, color: "#4B5563", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Sparkles className="w-4 h-4" style={{ color: VIOLET }} /> {coach}</div>}
      </Card>
      {myStats && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <StreakPill icon={Flame} n={myStats.workoutStreak} label="workout streak" color="#F59E0B" />
          <StreakPill icon={Leaf} n={myStats.dryStreak} label="alcohol-free" color="#10B981" />
          <StreakPill icon={CalendarDays} n={myStats.logStreak} label="day streak" color={accentHex(me.accent)} />
        </div>
      )}
      <SectionTitle>Today's fuel</SectionTitle>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Ring value={pct(tot.cal, t.calories)} color={accentHex(me.accent)} size={84}>
            <div style={{ textAlign: "center" }}>
              <div className="f-disp tnum" style={{ fontSize: 20, fontWeight: 700, color: INK }}>{tot.cal}</div>
              <div className="f-body" style={{ fontSize: 10, color: "#9097A1" }}>/ {t.calories}</div>
            </div>
          </Ring>
          <div style={{ flex: 1 }}>
            <MiniBar label="Protein" v={tot.p} max={t.protein} unit="g" color={VIOLET} />
            <MiniBar label="Carbs" v={tot.c} max={t.carbs} unit="g" color="#10B981" />
            <MiniBar label="Fat" v={tot.fat} max={t.fat} unit="g" color="#F59E0B" />
            <MiniBar label="Water" v={tot.water} max={t.water_oz} unit="oz" color="#0EA5E9" />
          </div>
        </div>
        {tot.drinks > 0 && <div className="f-body" style={{ marginTop: 12, fontSize: 12.5, color: "#9097A1" }}>{tot.drinks} drink{tot.drinks > 1 ? "s" : ""} today · {tot.alcCal} kcal from alcohol</div>}
        <Btn full kind="soft" color={accentHex(me.accent)} style={{ marginTop: 16 }} onClick={() => onGo("food")}><Plus className="w-4 h-4" /> Log food or water</Btn>
      </Card>
      <SectionTitle right={<button className="f-body" onClick={() => onGo("train")} style={{ background: "none", border: "none", color: VIOLET, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Open →</button>}>Today's training</SectionTitle>
      {(myPlan?.slots || []).length === 0
        ? <Card><Empty icon={Dumbbell} title="No workout yet" sub="Head to Train to generate today's session." /></Card>
        : myPlan.slots.map((sl) => <SlotRow key={sl.id} slot={sl} accent={accentHex(me.accent)} onStart={(slot) => onStart(sl)} compact />)}
      <div style={{ height: 8 }} />
    </Screen>
  );
}
function Legend({ p, score, you }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: 4, background: accentHex(p.accent) }} />
      <div>
        <div className="f-body" style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{p.name}{you ? " (you)" : ""}</div>
        <div className="f-disp tnum" style={{ fontSize: 12, color: "#9097A1" }}>{Math.round(score * 100)}%</div>
      </div>
    </div>
  );
}

/* ============================================================
   FOOD
   ============================================================ */
function Food({ me, log, onSave }) {
  const t = me.targets, tot = totals(log);
  const accent = accentHex(me.accent);
  const [mode, setMode] = useState(null);   // "describe" | "manual" | null
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState(null);  // { label, cal, p, c, f, meal }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cw, setCw] = useState("");
  const fileRef = useRef(null);
  const food = log?.food || [], alcohol = log?.alcohol || [];
  const aiOn = !!AI_PROXY;

  const openDraft = (d) => { setErr(""); setDraft({ label: "", cal: "", p: "", c: "", f: "", meal: mealForNow(), ...d }); };
  async function estimate() {
    if (!desc.trim()) return;
    setBusy(true); setErr("");
    try { const r = await estimateMacros(desc.trim()); openDraft(r); setDesc(""); }
    catch (e) { setErr("Couldn't estimate that — type the numbers in below."); openDraft({ label: desc.trim().slice(0, 40) }); setDesc(""); }
    setBusy(false);
  }
  async function onPhoto(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!aiOn) { setErr("Photo needs AI turned on. Use Manual to type the numbers."); return; }
    setMode(null); setBusy(true); setErr("");
    try { const { dataUrl } = await fileToThumb(f, 800); const r = await estimateMacrosFromImage(dataUrl); openDraft(r); }
    catch (e2) { setErr("Couldn't read that photo — type the numbers in below."); openDraft({}); }
    setBusy(false);
  }
  function addDraft() {
    if (!draft) return;
    const entry = { id: uid(), label: draft.label || "Food", cal: +draft.cal || 0, p: +draft.p || 0, c: +draft.c || 0, f: +draft.f || 0, meal: draft.meal || "snacks", ts: Date.now() };
    onSave({ ...(log || {}), food: [...food, entry] }); setDraft(null); setDesc(""); setErr(""); setMode(null);
  }
  const removeFood = (id) => onSave({ ...(log || {}), food: food.filter((x) => x.id !== id) });
  const addWater = (oz) => onSave({ ...(log || {}), water_oz: Math.max(0, (log?.water_oz || 0) + oz) });
  const addDrink = (d) => onSave({ ...(log || {}), alcohol: [...alcohol, { id: uid(), label: d.label, cal: d.cal, ts: Date.now() }] });
  const removeDrink = (id) => onSave({ ...(log || {}), alcohol: alcohol.filter((x) => x.id !== id) });

  return (
    <Screen>
      <Header me={me} title="Food & water" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Ring value={pct(tot.water, t.water_oz)} color="#0EA5E9" size={66}><Droplet className="w-5 h-5" style={{ color: "#0EA5E9" }} /></Ring>
          <div style={{ flex: 1 }}>
            <div className="f-disp tnum" style={{ fontSize: 22, fontWeight: 700, color: INK }}>{tot.water}<span style={{ fontSize: 13, color: "#9097A1", fontWeight: 600 }}> / {t.water_oz} oz</span></div>
            <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1" }}>{Math.round(pct(tot.water, t.water_oz) * 100)}% hydrated</div>
          </div>
          {tot.water > 0 && <button onClick={() => addWater(-8)} style={{ background: "#F1F3F6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Minus className="w-4 h-4" style={{ color: "#6B7280" }} /></button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {VESSELS.map((v) => (
            <Btn key={v.label} kind="soft" color="#0EA5E9" size="sm" onClick={() => addWater(v.oz)}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
                <span style={{ fontWeight: 700 }}>{v.label}</span>
                <span style={{ fontSize: 10.5, opacity: 0.85 }}>{v.oz} oz</span>
              </span>
            </Btn>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          {GLASS.map((oz) => (
            <button key={oz} onClick={() => addWater(oz)} className="f-body" style={{ flex: "0 0 auto", fontSize: 12.5, fontWeight: 600, padding: "9px 12px", borderRadius: 11, border: "1px solid #DCEBF5", background: "#fff", color: "#0EA5E9", cursor: "pointer" }}>+{oz}</button>
          ))}
          <input className="f-body tnum" type="number" inputMode="numeric" value={cw} placeholder="oz" onChange={(e) => setCw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && +cw) { addWater(+cw); setCw(""); } }} style={{ ...inputStyle, flex: 1, minWidth: 0, padding: "9px 10px", textAlign: "center" }} />
          <Btn kind="soft" color="#0EA5E9" size="sm" disabled={!+cw} onClick={() => { addWater(+cw); setCw(""); }}><Plus className="w-3.5 h-3.5" /></Btn>
        </div>
      </Card>

      <SectionTitle>Add food</SectionTitle>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Btn kind={mode === "describe" ? "solid" : "outline"} size="sm" color={VIOLET} onClick={() => { setDraft(null); setErr(""); setMode(mode === "describe" ? null : "describe"); }}><Wand2 className="w-4 h-4" /> Describe</Btn>
          <Btn kind="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}><Camera className="w-4 h-4" /> Photo</Btn>
          <Btn kind={mode === "manual" ? "solid" : "outline"} size="sm" color={accent} onClick={() => { setMode("manual"); openDraft({}); }}><Edit3 className="w-4 h-4" /> Manual</Btn>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />

        {mode === "describe" && (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <TextInput value={desc} placeholder="e.g. grilled chicken bowl with rice" onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && estimate()} />
              <Btn color={VIOLET} disabled={busy || !desc.trim()} onClick={estimate}>{busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 className="w-4 h-4" />}</Btn>
            </div>
            <div className="f-body" style={{ fontSize: 12, color: "#9097A1", marginTop: 8 }}>Describe it or snap a photo and Tandem estimates the macros. Use Manual to type them off a label.</div>
          </>
        )}
        {busy && !draft && <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1", marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}><RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> Reading…</div>}
        {err && <div className="f-body" style={{ fontSize: 12.5, color: "#C2410C", marginTop: 10 }}>{err}</div>}

        {draft && (
          <div style={{ marginTop: 14, padding: 14, background: "#F6F7F9", borderRadius: 14 }}>
            <TextInput value={draft.label} placeholder="Food name" onChange={(e) => setDraft({ ...draft, label: e.target.value })} style={{ ...inputStyle, marginBottom: 10, fontWeight: 600 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[["cal", "kcal"], ["p", "protein"], ["c", "carbs"], ["f", "fat"]].map(([k, lbl]) => (
                <div key={k}>
                  <div className="f-body" style={{ fontSize: 10.5, color: "#9097A1", marginBottom: 3 }}>{lbl}</div>
                  <input className="f-body tnum" type="number" inputMode="numeric" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} style={{ ...inputStyle, padding: "9px 10px", textAlign: "center" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="f-body" style={{ fontSize: 11, color: "#9097A1", marginBottom: 6 }}>Meal</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {MEALS.map((m) => (
                  <button key={m.key} onClick={() => setDraft({ ...draft, meal: m.key })} className="f-body" style={{ fontSize: 12, padding: "7px 4px", borderRadius: 9, cursor: "pointer", fontWeight: 600,
                    border: "1px solid " + (draft.meal === m.key ? accent : "#E5E8EC"), background: draft.meal === m.key ? accent + "14" : "#fff", color: draft.meal === m.key ? accent : "#6B7280" }}>{m.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn kind="outline" size="sm" onClick={() => { setDraft(null); setMode(null); }}>Cancel</Btn>
              <Btn full size="sm" color={accent} onClick={addDraft}><Plus className="w-4 h-4" /> Add to log</Btn>
            </div>
          </div>
        )}
      </Card>

      <SectionTitle right={<span className="f-disp tnum" style={{ fontSize: 13, color: "#9097A1" }}>{tot.cal} / {t.calories} kcal</span>}>Today's log</SectionTitle>
      {food.length === 0
        ? <Card><Empty icon={Utensils} title="Nothing logged yet" sub="Add your first meal above." /></Card>
        : <Card style={{ padding: 8 }}>
            {MEALS.map((m) => {
              const rows = food.filter((x) => (x.meal || "snacks") === m.key);
              if (!rows.length) return null;
              const mcal = rows.reduce((s, x) => s + (x.cal || 0), 0);
              return (
                <div key={m.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 10px 4px" }}>
                    <span className="f-body" style={{ fontSize: 11, fontWeight: 700, color: "#9097A1", letterSpacing: 0.4, textTransform: "uppercase" }}>{m.label}</span>
                    <span className="f-disp tnum" style={{ fontSize: 11.5, color: "#B6BCC4" }}>{mcal} kcal</span>
                  </div>
                  {rows.map((x) => (
                    <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderBottom: "1px solid #F1F3F6" }}>
                      <div style={{ flex: 1 }}>
                        <div className="f-body" style={{ fontSize: 14, fontWeight: 600, color: INK }}>{x.label}</div>
                        <div className="f-body tnum" style={{ fontSize: 12, color: "#9097A1" }}>{x.cal} kcal · {x.p}p · {x.c}c · {x.f}f</div>
                      </div>
                      <button onClick={() => removeFood(x.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Trash2 className="w-4 h-4" style={{ color: "#C7CDD6" }} /></button>
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>}

      {/* alcohol */}
      <SectionTitle>Alcohol</SectionTitle>
      <Card>
        {alcohol.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#10B9811a", display: "flex", alignItems: "center", justifyContent: "center" }}><Leaf className="w-5 h-5" style={{ color: "#10B981" }} /></div>
            <div>
              <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 14.5 }}>Dry day so far 🌱</div>
              <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1" }}>Keeps your streak alive. Only log if you have one.</div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div className="f-body" style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
              {alcohol.length} drink{alcohol.length > 1 ? "s" : ""} · {tot.alcCal} kcal — resets today's dry streak.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {alcohol.map((x) => (
                <span key={x.id} className="f-body" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, background: "#F6F7F9", borderRadius: 10, padding: "6px 8px 6px 11px" }}>
                  {x.label}
                  <button onClick={() => removeDrink(x.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X className="w-3.5 h-3.5" style={{ color: "#B6BCC4" }} /></button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {DRINKS.map((d) => <Btn key={d.label} kind="outline" size="sm" onClick={() => addDrink(d)}><Plus className="w-3.5 h-3.5" /> {d.label}</Btn>)}
        </div>
      </Card>
      <div style={{ height: 8 }} />
    </Screen>
  );
}

/* ============================================================
   TRAIN
   ============================================================ */
const TYPE_ICON = { strength: Dumbbell, cardio: Activity, run: Footprints, mobility: Bike, bike: Bike, other: Activity };
function SlotRow({ slot, accent, onToggle, onSub, onRemove, onEdit, onStart, compact }) {
  const [open, setOpen] = useState(false);
  const Icon = TYPE_ICON[slot.type] || Dumbbell;
  const metrics = [];
  if (slot.distance) metrics.push(`${slot.distance} mi`);
  if (slot.calories) metrics.push(`${slot.calories} cal`);
  const hasDetail = (slot.exercises || []).length > 0 || slot.notes;
  const canStart = onStart && slot.type === "strength" && !slot.custom && !slot.together && !slot.done && (slot.exercises || []).length > 0;
  return (
    <Card style={{ padding: 0, overflow: "hidden", borderColor: slot.done ? accent + "55" : "#EBEEF2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
        {onToggle ? (
          <button onClick={() => onToggle(slot.id)} style={{ width: 30, height: 30, borderRadius: 10, cursor: "pointer", flexShrink: 0,
            border: slot.done ? "none" : "2px solid #DCE0E6", background: slot.done ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {slot.done && <Check className="w-4 h-4" style={{ color: "#fff" }} />}
          </button>
        ) : (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: accent + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon className="w-4 h-4" style={{ color: accent }} /></div>
        )}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => !compact && setOpen(!open)}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="f-body" style={{ fontSize: 14.5, fontWeight: 600, color: INK, textDecoration: slot.done ? "line-through" : "none", opacity: slot.done ? 0.55 : 1 }}>{slot.title}</span>
            {slot.together && <span className="f-body" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: VIOLET, padding: "2px 6px", borderRadius: 6 }}>TOGETHER</span>}
            {slot.custom && <span className="f-body" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#10B981", padding: "2px 6px", borderRadius: 6 }}>LOGGED</span>}
          </div>
          <div className="f-body" style={{ fontSize: 12, color: "#9097A1", display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
            <span><Clock className="w-3 h-3" style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />{slot.time}</span>
            {slot.duration ? <span>· {slot.duration} min</span> : null}
            {slot.location && <span>· {slot.location}</span>}
            {metrics.map((m, i) => <span key={i}>· {m}</span>)}
          </div>
        </div>
        {compact && canStart && (
          <button onClick={() => onStart(slot)} className="f-body" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#fff", background: accent, border: "none", borderRadius: 9, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}><Play className="w-3 h-3" /> Start</button>
        )}
        {!compact && <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronDown className="w-5 h-5" style={{ color: "#C7CDD6", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>}
      </div>
      {open && !compact && (
        <div style={{ padding: "0 14px 14px" }}>
          {canStart && <Btn full color={accent} size="sm" style={{ marginBottom: 12 }} onClick={() => onStart(slot)}><Play className="w-4 h-4" /> Start workout</Btn>}
          {(slot.exercises || []).length > 0 && (
            <div style={{ background: "#F6F7F9", borderRadius: 12, padding: 12 }}>
              {slot.exercises.map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < slot.exercises.length - 1 ? "1px solid #ECEFF2" : "none" }}>
                  <span className="f-body" style={{ fontSize: 13.5, color: INK }}>{e.name}</span>
                  <span className="f-body tnum" style={{ fontSize: 13, color: "#7A828D" }}>{e.detail}</span>
                </div>
              ))}
            </div>
          )}
          {slot.notes && <div className="f-body" style={{ fontSize: 13, color: "#6B7280", marginTop: hasDetail ? 10 : 0, background: "#F6F7F9", borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 }}>{slot.notes}</div>}
          {(onSub || onRemove || onEdit) && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {onEdit && <Btn kind="outline" size="sm" onClick={() => onEdit(slot.id)}><Edit3 className="w-3.5 h-3.5" /> Edit</Btn>}
              {onSub && !slot.custom && <Btn kind="outline" size="sm" onClick={() => onSub(slot.id)}><RefreshCw className="w-3.5 h-3.5" /> Swap</Btn>}
              {onRemove && <Btn kind="outline" size="sm" onClick={() => onRemove(slot.id)}><Trash2 className="w-3.5 h-3.5" /> Remove</Btn>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
function WeekDay({ dk, plan, isToday, accent, me, prefs, busy, on }) {
  const [open, setOpen] = useState(isToday);
  const slots = plan?.slots || [];
  const done = slots.filter((s) => s.done).length;
  const exists = !!plan; // a saved (possibly empty / rest) day
  const wname = new Date(dk + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
  return (
    <Card style={{ padding: 0, overflow: "hidden", borderColor: isToday ? accent + "66" : "#EBEEF2" }}>
      <button onClick={() => setOpen(!open)} className="f-body"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 42 }}>
          <div className="f-disp" style={{ fontSize: 13, fontWeight: 700, color: isToday ? accent : INK }}>{wname}</div>
          <div className="f-body" style={{ fontSize: 11, color: "#9097A1" }}>{fmtDate(dk)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {slots.length === 0
            ? <span className="f-body" style={{ fontSize: 13, color: "#A6ACB5" }}>{exists ? "Rest day" : "—"}</span>
            : <div className="f-body" style={{ fontSize: 13, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {slots.map((s) => s.title).join("  ·  ")}
              </div>}
        </div>
        {isToday && <span className="f-body" style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: accent, padding: "2px 7px", borderRadius: 6 }}>TODAY</span>}
        {slots.length > 0 && <span className="f-disp tnum" style={{ fontSize: 12, color: done === slots.length ? "#10B981" : "#9097A1" }}>{done}/{slots.length}</span>}
        <ChevronDown className="w-4 h-4" style={{ color: "#C7CDD6", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          {slots.map((sl) => (
            <div key={sl.id}>
              <SlotRow slot={sl} accent={accent} onToggle={(id) => on.toggle(dk, id)} onSub={(id) => on.swap(dk, id)} onRemove={(id) => on.remove(dk, id)} onEdit={(id) => on.edit(dk, id)} onStart={(slot) => on.start(dk, slot)} />
              <div style={{ display: "flex", gap: 6, margin: "-6px 0 12px 4px", flexWrap: "wrap" }}>
                {TIMES.map((tm) => (
                  <button key={tm} onClick={() => on.reschedule(dk, sl.id, tm)} className="f-body" style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid " + (sl.time === tm ? accent : "#E5E8EC"), background: sl.time === tm ? accent + "14" : "#fff", color: sl.time === tm ? accent : "#9097A1", fontWeight: 600 }}>{tm}</button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <Btn kind="soft" color={accent} size="sm" onClick={() => on.addCustom(dk)}><Plus className="w-3.5 h-3.5" /> Add what I did</Btn>
            <Btn kind="outline" size="sm" disabled={busy} onClick={() => on.addSession(dk)}><Plus className="w-3.5 h-3.5" /> Plan a session</Btn>
            {slots.length > 0 && <Btn kind="outline" size="sm" disabled={busy} onClick={() => on.restDay(dk)}>Rest day</Btn>}
          </div>
        </div>
      )}
    </Card>
  );
}
function SessionEditor({ me, slot, onSave, onClose }) {
  const isEdit = !!slot;
  const accent = accentHex(me.accent);
  const [s, setS] = useState(() => ({
    id: slot?.id, title: slot?.title || "", type: slot?.type || "strength",
    time: slot?.time || (slot ? slot.time : "Evening"), duration: slot?.duration ?? 30,
    distance: slot?.distance ?? "", calories: slot?.calories ?? "", notes: slot?.notes || "",
    exercises: slot?.exercises ? slot.exercises.map((e) => ({ ...e })) : [],
  }));
  const set = (k, v) => setS((q) => ({ ...q, [k]: v }));
  const addEx = () => setS((q) => ({ ...q, exercises: [...q.exercises, { name: "", detail: "" }] }));
  const setEx = (i, k, v) => setS((q) => ({ ...q, exercises: q.exercises.map((e, j) => (j === i ? { ...e, [k]: v } : e)) }));
  const delEx = (i) => setS((q) => ({ ...q, exercises: q.exercises.filter((_, j) => j !== i) }));
  function save() {
    const data = {
      title: s.title.trim() || "Workout", type: s.type, time: s.time,
      duration: Math.max(0, Math.round(+s.duration || 0)),
      exercises: s.exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name.trim(), detail: (e.detail || "").trim() })),
    };
    if (+s.distance) data.distance = +s.distance;
    if (+s.calories) data.calories = Math.round(+s.calories);
    if (s.notes.trim()) data.notes = s.notes.trim();
    if (s.id) data.id = s.id;
    onSave(data);
  }
  const numStyle = { ...inputStyle, padding: "10px 11px", textAlign: "center" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,.5)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="f-body" style={{ background: "#fff", width: "100%", maxWidth: 480, borderRadius: "22px 22px 0 0", padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h2 className="f-disp" style={{ fontSize: 19, fontWeight: 700, color: INK, margin: 0 }}>{isEdit ? "Edit session" : "Add what I did"}</h2>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#9097A1" }} /></button>
        </div>
        <Field label="What was it?"><TextInput value={s.title} placeholder="e.g. Custom chest day · Garmin run" onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Type">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {CUSTOM_TYPES.map((ct) => (
              <button key={ct.key} onClick={() => set("type", ct.key)} className="f-body" style={{ fontSize: 13, padding: "7px 11px", borderRadius: 10, cursor: "pointer", fontWeight: 600,
                border: "1px solid " + (s.type === ct.key ? accent : "#E5E8EC"), background: s.type === ct.key ? accent + "14" : "#fff", color: s.type === ct.key ? accent : "#6B7280" }}>{ct.label}</button>
            ))}
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Minutes"><input className="f-body tnum" type="number" inputMode="numeric" value={s.duration} onChange={(e) => set("duration", e.target.value)} style={numStyle} /></Field>
          <Field label="Miles"><input className="f-body tnum" type="number" inputMode="decimal" value={s.distance} placeholder="—" onChange={(e) => set("distance", e.target.value)} style={numStyle} /></Field>
          <Field label="Calories"><input className="f-body tnum" type="number" inputMode="numeric" value={s.calories} placeholder="—" onChange={(e) => set("calories", e.target.value)} style={numStyle} /></Field>
        </div>
        <Field label="When"><Choice columns={4} value={s.time} onChange={(v) => set("time", v)} options={TIMES.map((tm) => ({ value: tm, label: tm }))} /></Field>
        <Field label="Notes (optional)"><textarea className="f-body" value={s.notes} placeholder="How it went, anything to remember…" onChange={(e) => set("notes", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.5 }} /></Field>
        <div style={{ marginBottom: 16 }}>
          <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Exercises (optional)</div>
          {s.exercises.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
              <input className="f-body" value={e.name} placeholder="Exercise" onChange={(ev) => setEx(i, "name", ev.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <input className="f-body" value={e.detail} placeholder="3×10" onChange={(ev) => setEx(i, "detail", ev.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => delEx(i)} style={{ background: "#F1F3F6", border: "none", borderRadius: 10, padding: "0 11px", cursor: "pointer", flexShrink: 0 }}><X className="w-4 h-4" style={{ color: "#9097A1" }} /></button>
            </div>
          ))}
          <Btn kind="outline" size="sm" onClick={addEx}><Plus className="w-3.5 h-3.5" /> Add exercise</Btn>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn kind="outline" onClick={onClose}>Cancel</Btn>
          <Btn full color={accent} onClick={save}><Check className="w-4 h-4" /> {isEdit ? "Save" : "Log it"}</Btn>
        </div>
      </div>
    </div>
  );
}
function Train({ me, week, prefs, onSaveDay, onGenWeek, onPref, onStart }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // { dk, slot } — slot null = add custom
  const [req, setReq] = useState("");
  const [showRpe, setShowRpe] = useState(false);
  const accent = accentHex(me.accent);
  const aiOn = !!AI_PROXY;
  const today = todayKey();
  const plans = week?.plans || {};
  const dates = week?.dates || weekDates(weekStartKey());

  async function applyChange(toWeek) {
    const r = req.trim(); if (!r) return;
    setBusy(true);
    try {
      if (toWeek) {
        await onGenWeek(true, r);
      } else {
        const sessions = await aiAdjustDay(me, plans[today]?.slots || [], r);
        const times = [me.mainTime || "Lunch", me.secondTime || "Evening"];
        const slots = sessions.map((s, i) => placeSlot({ title: s.title, focus: "custom", access: accessesOf(me)[0], type: s.type, duration: s.duration_min, location: "", exercises: s.exercises || [] }, times[i] || "Evening"));
        await onSaveDay(today, { slots });
      }
      setReq("");
    } catch (e) { /* leave text so they can retry */ }
    setBusy(false);
  }

  async function buildOne(access, focus) {
    if (aiOn) { try { return await aiFocusWorkout(me, access, focus); } catch (e) { return templateSlot(access, focus); } }
    return templateSlot(access, focus);
  }
  const on = {
    start(dk, slot) { onStart(dk, slot); },
    toggle(dk, id) {
      const plan = plans[dk] || { slots: [] };
      const slot = plan.slots.find((s) => s.id === id);
      if (slot && !slot.done) onPref(slot.focus, "like");
      onSaveDay(dk, { slots: plan.slots.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });
    },
    remove(dk, id) {
      const plan = plans[dk] || { slots: [] };
      const slot = plan.slots.find((s) => s.id === id);
      if (slot) onPref(slot.focus, "skip");
      onSaveDay(dk, { slots: plan.slots.filter((s) => s.id !== id) });
    },
    reschedule(dk, id, time) {
      const plan = plans[dk] || { slots: [] };
      onSaveDay(dk, { slots: plan.slots.map((s) => (s.id === id ? { ...s, time } : s)) });
    },
    restDay(dk) { onSaveDay(dk, { slots: [] }); },
    edit(dk, id) { const plan = plans[dk] || { slots: [] }; const slot = plan.slots.find((s) => s.id === id); if (slot) setEditing({ dk, slot }); },
    addCustom(dk) { setEditing({ dk, slot: null }); },
    async swap(dk, id) {
      const plan = plans[dk] || { slots: [] };
      const cur = plan.slots.find((s) => s.id === id); if (!cur) return;
      setBusy(true);
      let repl;
      if (cur.together) {
        const others = TOGETHER_POOL.filter((t) => t.title !== cur.title);
        const pick = others[Math.floor(Math.random() * others.length)];
        repl = { ...placeSlot({ title: pick.title, focus: "together", access: "together", type: pick.type, duration: pick.duration, location: pick.location, exercises: expand(pick.ex) }, cur.time), together: true };
      } else {
        onPref(cur.focus, "skip");
        const order = focusOrder(cur.access, prefs).filter((f) => f !== cur.focus);
        const nf = order[Math.floor(Math.random() * order.length)] || cur.focus;
        repl = placeSlot(await buildOne(cur.access, nf), cur.time);
      }
      onSaveDay(dk, { slots: plan.slots.map((s) => (s.id === id ? repl : s)) });
      setBusy(false);
    },
    async addSession(dk) {
      const plan = plans[dk] || { slots: [] };
      setBusy(true);
      const accesses = accessesOf(me);
      const idx = plan.slots.filter((s) => !s.together).length;
      const access = sessionAccess(accesses, idx);
      const used = new Set(plan.slots.map((s) => s.focus));
      const order = focusOrder(access, prefs);
      const nf = order.find((f) => !used.has(f)) || order[0];
      const time = idx === 0 ? (me.mainTime || "Lunch") : (me.secondTime || "Evening");
      onSaveDay(dk, { slots: [...plan.slots, placeSlot(await buildOne(access, nf), time)] });
      setBusy(false);
    },
  };
  async function gen(useAI) { setBusy(true); await onGenWeek(useAI); setBusy(false); }
  function saveSession(dk, data) {
    const plan = plans[dk] || { slots: [] };
    let slots;
    if (data.id && plan.slots.some((s) => s.id === data.id)) {
      slots = plan.slots.map((s) => (s.id === data.id ? { ...s, ...data } : s));
    } else {
      slots = [...plan.slots, { ...data, id: uid(), done: true, custom: true }];
    }
    onSaveDay(dk, { slots });
    setEditing(null);
  }

  let wkDone = 0, wkTotal = 0;
  dates.forEach((d) => { const s = plans[d]?.slots || []; wkDone += s.filter((x) => x.done).length; wkTotal += s.length; });

  return (
    <Screen>
      <Header me={me} title="Train" subtitle={`${accessesLabel(me)} · ${me.sessionsPerDay === 2 ? "2 sessions/day" : "1 session/day"}`} />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Ring value={wkTotal ? wkDone / wkTotal : 0} color={accent} size={56}><span className="f-disp tnum" style={{ fontSize: 13, fontWeight: 700, color: INK }}>{wkDone}/{wkTotal}</span></Ring>
          <div style={{ flex: 1 }}>
            <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 15 }}>This week</div>
            <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1" }}>Auto-built and rotating. Tap any day to tweak it.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {aiOn
            ? <Btn full color={VIOLET} size="sm" disabled={busy} onClick={() => gen(true)}>
                {busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles className="w-4 h-4" />} Generate week with AI
              </Btn>
            : <Btn full color={accent} size="sm" disabled={busy} onClick={() => gen(false)}>
                {busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw className="w-4 h-4" />} Rebuild week
              </Btn>}
        </div>
        {!aiOn && <div className="f-body" style={{ fontSize: 11.5, color: "#9097A1", marginTop: 8 }}>Turn on AI (see setup) and Tandem will write each week's workouts for you — and learn what you keep vs. skip.</div>}
        {aiOn && <div className="f-body" style={{ fontSize: 11.5, color: "#9097A1", marginTop: 8 }}>AI learns from what you finish vs. swap away, and leans your week toward what you like.</div>}
      </Card>

      {aiOn && (
        <Card>
          <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><Wand2 className="w-4 h-4" style={{ color: VIOLET }} /> Ask the coach to change it</div>
          <textarea className="f-body" value={req} placeholder="e.g. make today arms & shoulders only · add a Pallof press · swap Wednesday for a run · more RPE-8 supersets this week" onChange={(e) => setReq(e.target.value)} style={{ ...inputStyle, minHeight: 56, resize: "vertical", lineHeight: 1.5 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn kind="soft" color={accent} size="sm" disabled={busy || !req.trim()} onClick={() => applyChange(false)}>{busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles className="w-4 h-4" />} Apply to today</Btn>
            <Btn kind="soft" color={VIOLET} size="sm" disabled={busy || !req.trim()} onClick={() => applyChange(true)}>{busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles className="w-4 h-4" />} Apply to week</Btn>
          </div>
        </Card>
      )}

      <button onClick={() => setShowRpe(!showRpe)} className="f-body" style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "0 2px 8px", color: "#9097A1", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronDown className="w-3.5 h-3.5" style={{ transform: showRpe ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> What do RPE and % mean?
      </button>
      {showRpe && (
        <Card style={{ background: "#F6F7F9", border: "none" }}>
          <div className="f-body" style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.6 }}>
            <b>RPE</b> (Rate of Perceived Exertion, 1–10) = how many reps you had left. <b>RPE 8</b> ≈ 2 reps in reserve, <b>RPE 10</b> = all-out. Prescriptions read like <span className="tnum">3 × 8–12 @ RPE 8</span> — do 3 sets of 8–12 reps, stopping ~2 shy of failure, and pick a weight that makes that true.<br /><br />
            <b>% (of 1RM)</b> = a load relative to your one-rep max, used mainly to ramp up on heavy compound lifts (e.g. warm-up sets at 50–75% before working sets). RPE autoregulates day to day; % is a fixed target off your max.
          </div>
        </Card>
      )}

      {dates.map((dk) => (
        <WeekDay key={dk} dk={dk} plan={plans[dk]} isToday={dk === today} accent={accent} me={me} prefs={prefs} busy={busy} on={on} />
      ))}
      {editing && <SessionEditor me={me} slot={editing.slot} onSave={(data) => saveSession(editing.dk, data)} onClose={() => setEditing(null)} />}
      <div style={{ height: 8 }} />
    </Screen>
  );
}

/* ============================================================
   PROGRESS  (history, streaks, weigh-in, measurements, photos)
   ============================================================ */
function ChangeTag({ delta, suffix = " lb" }) {
  if (delta === null || delta === undefined) return null;
  const up = delta > 0, flat = Math.abs(delta) < 0.05;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const col = flat ? "#9097A1" : "#6B7280";
  return (
    <span className="f-body tnum" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5, color: col }}>
      <Icon className="w-3.5 h-3.5" />{flat ? "no change" : `${up ? "+" : ""}${delta}${suffix}`}<span style={{ color: "#B6BCC4" }}> · 30d</span>
    </span>
  );
}
function BodyDiagram({ latestM, measures, accent }) {
  const firstOf = (k) => { for (const m of (measures || [])) if (m[k] != null) return m[k]; return null; };
  const PTS = [
    { key: "chest", label: "Chest", y: 96, mx: 108, side: "left" },
    { key: "arms", label: "Arm", y: 120, mx: 170, side: "right" },
    { key: "waist", label: "Waist", y: 134, mx: 114, side: "left" },
    { key: "hips", label: "Hips", y: 162, mx: 150, side: "right" },
    { key: "thighs", label: "Thigh", y: 222, mx: 120, side: "left" },
  ];
  const stroke = accent + "70", fill = accent + "1c";
  return (
    <svg viewBox="0 0 260 330" style={{ width: "100%", maxWidth: 300, display: "block", margin: "2px auto 0" }}>
      <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
        <circle cx="130" cy="32" r="18" />
        <path d="M114,52 L146,52 Q156,54 154,64 L150,120 Q149,134 142,152 L118,152 Q111,134 110,120 L106,64 Q104,54 114,52 Z" />
        <rect x="92" y="62" width="13" height="76" rx="6.5" transform="rotate(7 98 100)" />
        <rect x="155" y="62" width="13" height="76" rx="6.5" transform="rotate(-7 162 100)" />
        <rect x="115" y="150" width="13" height="150" rx="6.5" />
        <rect x="132" y="150" width="13" height="150" rx="6.5" />
      </g>
      {PTS.map((p) => {
        const v = latestM && latestM[p.key] != null ? latestM[p.key] : null;
        const f = firstOf(p.key);
        const d = v != null && f != null ? +(v - f).toFixed(1) : null;
        const gutterX = p.side === "left" ? 66 : 194;
        const labelX = p.side === "left" ? 6 : 254;
        const anchor = p.side === "left" ? "start" : "end";
        return (
          <g key={p.key}>
            <line x1={p.mx} y1={p.y} x2={gutterX} y2={p.y} stroke="#D8DCE2" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={p.mx} cy={p.y} r="3.4" fill={accent} />
            <text x={labelX} y={p.y - 3} textAnchor={anchor} className="f-body" style={{ fontSize: 11, fontWeight: 600, fill: "#6B7280" }}>{p.label}</text>
            <text x={labelX} y={p.y + 12} textAnchor={anchor} className="f-disp" style={{ fontSize: 13, fontWeight: 700, fill: v != null ? INK : "#C7CDD6" }}>
              {v != null ? v + "″" : "—"}{d != null && Math.abs(d) >= 0.1 ? `  ${d > 0 ? "+" : ""}${d}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function Progress({ me, data, busy, onLogWeight, onLogMeasure, onAddPhoto, onDeletePhoto }) {
  const [showW, setShowW] = useState(false);
  const [showM, setShowM] = useState(false);
  const [wVal, setWVal] = useState("");
  const [mVals, setMVals] = useState({});
  const [viewer, setViewer] = useState(null);
  const fileRef = useRef(null);
  const poseRef = useRef("front");
  if (!data) return <Screen><Header me={me} title="Progress" /><Card><div className="f-body" style={{ textAlign: "center", color: "#9097A1", padding: 12 }}>Loading…</div></Card></Screen>;

  const { weights, measures, photoIdx, images, history, stats } = data;
  const accent = accentHex(me.accent);
  const weightVals = weights.map((w) => w.lb);
  const latestW = weights.length ? weights[weights.length - 1].lb : null;
  const waistSeries = measures.filter((m) => m.waist != null).map((m) => m.waist);
  const latestM = measures.length ? measures[measures.length - 1] : null;
  const days = history.slice(0, 7).reverse();
  const dueWeigh = isDue(stats.lastWeighTs), dueMeasure = isDue(stats.lastMeasureTs), duePhoto = isDue(stats.lastPhotoTs);
  const anyDue = dueWeigh || dueMeasure || duePhoto;

  function saveW() { const v = parseFloat(wVal); if (!v) return; onLogWeight(v); setWVal(""); setShowW(false); }
  function saveM() {
    const obj = {}; let any = false;
    MEASURE_FIELDS.forEach((f) => { const v = parseFloat(mVals[f.key]); if (v) { obj[f.key] = v; any = true; } });
    if (!any) return; onLogMeasure(obj); setMVals({}); setShowM(false);
  }
  function onFile(e) { const f = e.target.files?.[0]; if (f) onAddPhoto(f, poseRef.current); e.target.value = ""; }
  function pickPhoto(pose) { poseRef.current = pose; fileRef.current?.click(); }

  return (
    <Screen>
      <Header me={me} title="Progress" subtitle="Streaks, trends & photos" />
      {anyDue && (
        <Card style={{ borderColor: accent + "55", background: accent + "0d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: accent + "1f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CalendarDays className="w-5 h-5" style={{ color: accent }} /></div>
            <div>
              <div className="f-body" style={{ fontWeight: 700, color: INK, fontSize: 14.5 }}>Weekly check-in</div>
              <div className="f-body" style={{ fontSize: 12.5, color: "#7A828D" }}>A quick update keeps your trends honest.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {dueWeigh && <Btn size="sm" color={accent} onClick={() => { setShowW(true); setShowM(false); }}><Scale className="w-3.5 h-3.5" /> Weigh in{daysSince(stats.lastWeighTs) != null ? ` · ${daysSince(stats.lastWeighTs)}d` : ""}</Btn>}
            {dueMeasure && <Btn size="sm" kind="soft" color={accent} onClick={() => { setShowM(true); setShowW(false); }}><Ruler className="w-3.5 h-3.5" /> Measure</Btn>}
            {duePhoto && <Btn size="sm" kind="soft" color={accent} onClick={() => pickPhoto("front")}><Camera className="w-3.5 h-3.5" /> Photo</Btn>}
          </div>
        </Card>
      )}
      {/* streaks */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <StreakPill icon={Flame} n={stats.workoutStreak} label="workout streak" color="#F59E0B" />
        <StreakPill icon={Leaf} n={stats.dryStreak} label="alcohol-free" color="#10B981" />
        <StreakPill icon={CalendarDays} n={stats.logStreak} label="day streak" color={accentHex(me.accent)} />
      </div>

      {/* weekly history */}
      <SectionTitle>Last 7 days</SectionTitle>
      <Card>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {days.map((d) => {
            const sc = dayScore(me, d.log, d.plan);
            return (
              <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 44, borderRadius: 10, background: accentHex(me.accent), opacity: 0.12 + sc * 0.88,
                  display: "flex", alignItems: "flex-end", justifyContent: "center" }} title={`${Math.round(sc * 100)}%`} />
                <div className="f-body" style={{ fontSize: 11, color: "#9097A1", marginTop: 5 }}>{weekdayLetter(d.date)}</div>
              </div>
            );
          })}
        </div>
        {days.slice().reverse().map((d) => {
          const tt = totals(d.log), sc = dayScore(me, d.log, d.plan);
          const done = (d.plan?.slots || []).filter((s) => s.done).length;
          const dry = (d.log?.alcohol?.length || 0) === 0;
          const empty = !d.log && !d.plan;
          return (
            <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid #F1F3F6" }}>
              <div className="f-body" style={{ fontSize: 13, fontWeight: 600, color: INK, width: 56 }}>{fmtDate(d.date)}</div>
              {empty ? <div className="f-body" style={{ fontSize: 12.5, color: "#C7CDD6" }}>no activity</div> : (
                <>
                  <div className="f-disp tnum" style={{ fontSize: 13, color: accentHex(me.accent), fontWeight: 700, width: 38 }}>{Math.round(sc * 100)}%</div>
                  <div className="f-body tnum" style={{ fontSize: 12, color: "#7A828D", flex: 1 }}>{tt.cal} kcal · {done} workout{done !== 1 ? "s" : ""}</div>
                  {dry ? <Leaf className="w-4 h-4" style={{ color: "#10B981" }} /> : <Wine className="w-4 h-4" style={{ color: "#C7B6A0" }} />}
                </>
              )}
            </div>
          );
        })}
      </Card>

      {/* weight */}
      <SectionTitle right={<Btn kind="soft" color={accentHex(me.accent)} size="sm" onClick={() => setShowW(!showW)}><Plus className="w-3.5 h-3.5" /> Log</Btn>}>Weight</SectionTitle>
      <Card>
        {showW && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <TextInput type="number" inputMode="decimal" autoFocus value={wVal} placeholder="lbs" onChange={(e) => setWVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveW()} />
            <Btn color={accentHex(me.accent)} onClick={saveW}><Check className="w-4 h-4" /></Btn>
          </div>
        )}
        {latestW != null ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <Scale className="w-4 h-4" style={{ color: "#9097A1" }} />
              <span className="f-disp tnum" style={{ fontSize: 26, fontWeight: 700, color: INK }}>{latestW}<span style={{ fontSize: 14, color: "#9097A1", fontWeight: 600 }}> lb</span></span>
              <span style={{ marginLeft: "auto" }}><ChangeTag delta={stats.weightChange30} /></span>
            </div>
            <MiniLine values={weightVals} color={accentHex(me.accent)} />
          </>
        ) : <Empty icon={Scale} title="No weigh-ins yet" sub="Tap Log to add your first." />}
      </Card>

      {/* measurements */}
      <SectionTitle right={<Btn kind="soft" color={accentHex(me.accent)} size="sm" onClick={() => setShowM(!showM)}><Plus className="w-3.5 h-3.5" /> Log</Btn>}>Measurements</SectionTitle>
      <Card>
        {showM && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {MEASURE_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="f-body" style={{ fontSize: 11, color: "#9097A1", marginBottom: 3 }}>{f.label} (in)</div>
                  <input className="f-body tnum" type="number" inputMode="decimal" value={mVals[f.key] || ""} onChange={(e) => setMVals({ ...mVals, [f.key]: e.target.value })} style={{ ...inputStyle, padding: "9px 10px" }} />
                </div>
              ))}
            </div>
            <Btn full size="sm" color={accentHex(me.accent)} onClick={saveM}><Check className="w-4 h-4" /> Save measurements</Btn>
          </div>
        )}
        <BodyDiagram latestM={latestM} measures={measures} accent={accent} />
        {waistSeries.length >= 2 && (
          <div style={{ marginTop: 8 }}>
            <div className="f-body" style={{ fontSize: 11.5, color: "#9097A1", marginBottom: 2 }}>Waist trend</div>
            <MiniLine values={waistSeries} color="#10B981" height={42} />
          </div>
        )}
        {!latestM && <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1", textAlign: "center", marginTop: 6 }}>Tap <b>Log</b> to add your first measurements.</div>}
      </Card>

      {/* photos */}
      <SectionTitle>Progress photos</SectionTitle>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      <Card>
        <div className="f-body" style={{ fontSize: 12, color: "#9097A1", marginBottom: 12 }}>Private to you — grouped by angle so you can compare over time.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {POSES.map((p) => (
            <Btn key={p.key} kind="outline" size="sm" onClick={() => pickPhoto(p.key)}><Camera className="w-3.5 h-3.5" /> {p.label}</Btn>
          ))}
        </div>
        {photoIdx.length === 0
          ? <div style={{ marginTop: 10 }}><Empty icon={Camera} title="No photos yet" sub="Add a front / side / back shot to start." /></div>
          : POSES.map((pose) => {
              const shots = photoIdx.filter((ph) => (ph.pose || "front") === pose.key).sort((a, b) => a.ts - b.ts);
              if (!shots.length) return null;
              return (
                <div key={pose.key} style={{ marginTop: 14 }}>
                  <div className="f-body" style={{ fontSize: 11, fontWeight: 700, color: "#9097A1", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 7 }}>{pose.label} · {shots.length}</div>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                    {shots.map((ph) => (
                      <button key={ph.id} onClick={() => setViewer(ph)} style={{ position: "relative", flex: "0 0 auto", width: 94, aspectRatio: "3/4", borderRadius: 12, overflow: "hidden", border: "1px solid #EBEEF2", cursor: "pointer", padding: 0, background: "#F6F7F9" }}>
                        {images[ph.id] ? <img src={images[ph.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera className="w-5 h-5" style={{ color: "#C7CDD6" }} /></div>}
                        <span className="f-body" style={{ position: "absolute", left: 6, bottom: 6, fontSize: 10, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,.5)", padding: "2px 6px", borderRadius: 6 }}>{fmtDate(ph.date)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
      </Card>
      {busy && <div className="f-body" style={{ textAlign: "center", fontSize: 12.5, color: "#9097A1", marginTop: -6 }}>Working…</div>}

      {viewer && (
        <div onClick={() => setViewer(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          {images[viewer.id] && <img src={images[viewer.id]} alt="" style={{ maxWidth: "100%", maxHeight: "78%", borderRadius: 14 }} />}
          <div className="f-body" style={{ color: "#fff", marginTop: 12, fontSize: 13 }}>{POSES.find((p) => p.key === (viewer.pose || "front"))?.label} · {fmtDate(viewer.date)}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
            <Btn kind="outline" onClick={() => { onDeletePhoto(viewer.id); setViewer(null); }}><Trash2 className="w-4 h-4" /> Delete</Btn>
            <Btn color="#fff" style={{ color: INK }} onClick={() => setViewer(null)}>Close</Btn>
          </div>
        </div>
      )}
      <div style={{ height: 8 }} />
    </Screen>
  );
}

/* ============================================================
   US
   ============================================================ */
function Us({ me, partner, myLog, partnerLog, myPlan, partnerPlan, myStats, partnerStats, onNudge }) {
  const [sent, setSent] = useState(false);
  const [custom, setCustom] = useState("");
  if (!partner) {
    return (
      <Screen>
        <Header me={me} title="Us" />
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: VIOLET + "1a", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}><Users className="w-7 h-7" style={{ color: VIOLET }} /></div>
          <h3 className="f-disp" style={{ fontSize: 19, fontWeight: 700, color: INK, margin: "0 0 8px" }}>Bring in your partner</h3>
          <p className="f-body" style={{ fontSize: 14, color: "#6B7280", margin: "0 0 8px", lineHeight: 1.55 }}>Share this same app with them. When they open it, they'll tap <b>Add a new profile</b> and set up their side.</p>
          <p className="f-body" style={{ fontSize: 13, color: "#9097A1", margin: 0 }}>After that, your logs sync here automatically.</p>
        </Card>
      </Screen>
    );
  }
  const send = (text) => { onNudge(text); setSent(true); setCustom(""); setTimeout(() => setSent(false), 2200); };
  const pairs = [
    { p: me, log: myLog, plan: myPlan, stats: myStats, you: true },
    { p: partner, log: partnerLog, plan: partnerPlan, stats: partnerStats },
  ];
  return (
    <Screen>
      <Header me={me} title="Us" subtitle="Same goals, side by side" />
      {pairs.map(({ p, log, plan, stats, you }) => {
        const t2 = totals(log), tg = p.targets, sc = dayScore(p, log, plan);
        const done = (plan?.slots || []).filter((s) => s.done).length, total = (plan?.slots || []).length;
        return (
          <Card key={p.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar p={p} size={44} />
              <div style={{ flex: 1 }}>
                <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 15.5 }}>{p.name}{you ? " (you)" : ""}</div>
                <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1" }}>{GOALS[p.goal]?.label}</div>
              </div>
              <Ring value={sc} color={accentHex(p.accent)} size={50}><span className="f-disp tnum" style={{ fontSize: 13, fontWeight: 700, color: INK }}>{Math.round(sc * 100)}</span></Ring>
            </div>
            <MiniBar label="Calories" v={t2.cal} max={tg.calories} unit="" color={accentHex(p.accent)} />
            <MiniBar label="Protein" v={t2.p} max={tg.protein} unit="g" color={VIOLET} />
            <MiniBar label="Water" v={t2.water} max={tg.water_oz} unit="oz" color="#0EA5E9" />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: stats ? 12 : 0 }}>
              <Dumbbell className="w-4 h-4" style={{ color: "#9097A1" }} />
              <span className="f-body" style={{ fontSize: 13, color: "#6B7280" }}>{total ? `${done}/${total} session${total > 1 ? "s" : ""} done` : "no workout planned yet"}</span>
            </div>
            {stats && (
              <div style={{ display: "flex", gap: 8, borderTop: "1px solid #F1F3F6", paddingTop: 12 }}>
                <SmallStat icon={Flame} n={stats.workoutStreak} label="streak" color="#F59E0B" />
                <SmallStat icon={Leaf} n={stats.dryStreak} label="dry days" color="#10B981" />
                <SmallStat icon={Scale} n={stats.weight != null ? `${stats.weight}` : "—"} label="lb" color={accentHex(p.accent)} />
              </div>
            )}
          </Card>
        );
      })}
      <SectionTitle>Nudge {partner.name}</SectionTitle>
      <Card>
        {sent ? <div className="f-body" style={{ textAlign: "center", padding: 8, color: "#10B981", fontWeight: 600 }}><Check className="w-4 h-4" style={{ display: "inline", marginRight: 6 }} /> Nudge sent!</div> : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {["Don't skip tonight 👟", "Hydrate! 💧", "Proud of you today", "Dry day, let's go 🌱"].map((q) => (
                <button key={q} onClick={() => send(q)} className="f-body" style={{ fontSize: 13, padding: "8px 12px", borderRadius: 11, cursor: "pointer", border: "1px solid #E5E8EC", background: "#F6F7F9", color: INK }}>{q}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <TextInput value={custom} placeholder="Write your own…" onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && custom.trim() && send(custom.trim())} />
              <Btn color={accentHex(me.accent)} disabled={!custom.trim()} onClick={() => send(custom.trim())}><Send className="w-4 h-4" /></Btn>
            </div>
          </>
        )}
      </Card>
      <div style={{ height: 8 }} />
    </Screen>
  );
}
function SmallStat({ icon: Icon, n, label, color }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7 }}>
      <Icon className="w-4 h-4" style={{ color }} />
      <div><div className="f-disp tnum" style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1 }}>{n}</div>
        <div className="f-body" style={{ fontSize: 10.5, color: "#9097A1" }}>{label}</div></div>
    </div>
  );
}

/* ============================================================
   SETTINGS
   ============================================================ */
function SettingsView({ me, onEdit, onSwitch }) {
  const t = me.targets;
  return (
    <Screen>
      <Header me={me} title="Settings" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Avatar p={me} size={48} />
          <div><div className="f-body" style={{ fontWeight: 600, fontSize: 16, color: INK }}>{me.name}</div>
            <div className="f-body" style={{ fontSize: 13, color: "#9097A1" }}>{GOALS[me.goal]?.label} · {accessesLabel(me)} · {me.sessionsPerDay === 2 ? "2/day" : "1/day"}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Metric label="Calories" value={t.calories} unit="kcal" color={accentHex(me.accent)} />
          <Metric label="Protein" value={t.protein} unit="g" color={VIOLET} />
          <Metric label="Water" value={t.water_oz} unit="oz" color="#0EA5E9" />
          <Metric label="Maintenance" value={t.tdee} unit="kcal" color="#10B981" />
        </div>
      </Card>
      <Btn full kind="outline" onClick={onEdit} style={{ marginBottom: 10 }}><Edit3 className="w-4 h-4" /> Edit my profile & targets</Btn>
      <Btn full kind="outline" onClick={onSwitch}><Users className="w-4 h-4" /> Switch profile on this device</Btn>
      <Card style={{ marginTop: 16, background: "#F6F7F9", border: "none" }}>
        <div className="f-body" style={{ fontSize: 12.5, color: "#7A828D", lineHeight: 1.6 }}>
          Targets use the Mifflin–St Jeor equation with standard activity and macro guidelines. They're a well-grounded starting point,
          not medical advice — adjust to how you feel and progress, and talk to a doctor or registered dietitian for anything tailored to you.</div>
      </Card>
      <div style={{ height: 8 }} />
    </Screen>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
const TABS = [
  { id: "today", label: "Today", icon: Home },
  { id: "food", label: "Food", icon: Utensils },
  { id: "train", label: "Train", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "us", label: "Us", icon: Users },
  { id: "settings", label: "You", icon: Settings },
];

async function fileToThumb(file, maxDim = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      let q = 0.72, out = cv.toDataURL("image/jpeg", q);
      while (out.length * 0.75 > 4_500_000 && q > 0.3) { q -= 0.12; out = cv.toDataURL("image/jpeg", q); }
      resolve({ dataUrl: out, w, h });
    };
    img.onerror = reject; img.src = url;
  });
}

function GymMode({ slot, me, lifts, accent, onFinish, onClose }) {
  const overlay = { position: "fixed", inset: 0, background: "rgba(246,247,249,.98)", zIndex: 70, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto" };
  const sheet = { background: "#fff", width: "100%", maxWidth: 480, minHeight: "100%", padding: "18px 18px 40px", boxSizing: "border-box" };
  const exercises = (slot.exercises || []).filter((e) => e.name);
  const [idx, setIdx] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [cal, setCal] = useState("");
  const [rest, setRest] = useState(0);
  const restRef = useRef(null);
  const [log, setLog] = useState(() => exercises.map((e) => {
    const t = parseTarget(e.detail);
    const sug = suggestLoad((lifts || {})[liftKey(e.name)], t, e.name);
    const w = sug ? String(sug.next) : "";
    return { sets: Array.from({ length: t.sets }, () => ({ w, reps: "", done: false })) };
  }));
  useEffect(() => () => clearInterval(restRef.current), []);
  function startRest(sec) {
    clearInterval(restRef.current);
    setRest(sec);
    restRef.current = setInterval(() => setRest((r) => { if (r <= 1) { clearInterval(restRef.current); return 0; } return r - 1; }), 1000);
  }
  if (!exercises.length) {
    return <div style={overlay}><div style={{ padding: 30, textAlign: "center", margin: "auto" }}>
      <div className="f-body" style={{ color: INK, marginBottom: 16 }}>This session has no exercises to run — log it with "Add what I did" instead.</div>
      <Btn color={accent} onClick={onClose}>Close</Btn></div></div>;
  }
  const ex = exercises[idx];
  const t = parseTarget(ex.detail);
  const sug = suggestLoad((lifts || {})[liftKey(ex.name)], t, ex.name);
  const cur = log[idx];
  const setField = (si, f, v) => setLog((L) => L.map((x, i) => i === idx ? { ...x, sets: x.sets.map((s, j) => j === si ? { ...s, [f]: v } : s) } : x));
  function checkSet(si) {
    const wasDone = cur.sets[si].done;
    setLog((L) => L.map((x, i) => i === idx ? { ...x, sets: x.sets.map((s, j) => j === si ? { ...s, done: !s.done } : s) } : x));
    if (!wasDone) startRest(t.rest);
  }
  const addSet = () => setLog((L) => L.map((x, i) => i === idx ? { ...x, sets: [...x.sets, { w: x.sets[x.sets.length - 1]?.w || "", reps: "", done: false }] } : x));
  const anyLogged = log.some((x) => x.sets.some((s) => +s.w > 0 || +s.reps > 0));
  function doFinish() {
    const logs = exercises.map((e, ei) => ({
      name: e.name,
      sets: log[ei].sets.filter((s) => +s.w > 0 || +s.reps > 0).map((s) => ({ w: +s.w || 0, reps: +s.reps || 0 })),
    })).filter((x) => x.sets.length);
    onFinish(logs, +cal || 0);
  }

  if (finishing) {
    const totalSets = log.reduce((a, x) => a + x.sets.filter((s) => +s.w > 0 || +s.reps > 0).length, 0);
    const exDone = log.filter((x) => x.sets.some((s) => +s.w > 0 || +s.reps > 0)).length;
    return (
      <div style={overlay}><div style={sheet}>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: accent + "1f", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Check className="w-7 h-7" style={{ color: accent }} /></div>
          <h2 className="f-disp" style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "0 0 4px" }}>Nice work</h2>
          <div className="f-body" style={{ fontSize: 13.5, color: "#7A828D", marginBottom: 18 }}>{exDone} exercise{exDone !== 1 ? "s" : ""} · {totalSets} set{totalSets !== 1 ? "s" : ""} logged</div>
        </div>
        <Field label="Calories burned (optional)" hint="From your watch — Apple, Garmin, whatever it says.">
          <TextInput type="number" inputMode="numeric" value={cal} placeholder="e.g. 480" onChange={(e) => setCal(e.target.value)} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Btn kind="outline" onClick={() => setFinishing(false)}>Back</Btn>
          <Btn full color={accent} onClick={doFinish}><Check className="w-4 h-4" /> Save workout</Btn>
        </div>
      </div></div>
    );
  }

  return (
    <div style={overlay}><div style={{ ...sheet, maxHeight: "none" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X className="w-6 h-6" style={{ color: "#9097A1" }} /></button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div className="f-disp" style={{ fontSize: 15, fontWeight: 700, color: INK }}>{slot.title}</div>
          <div className="f-body" style={{ fontSize: 11.5, color: "#9097A1" }}>Exercise {idx + 1} of {exercises.length}</div>
        </div>
        <button onClick={() => setFinishing(true)} disabled={!anyLogged} className="f-body" style={{ background: "none", border: "none", cursor: anyLogged ? "pointer" : "default", color: anyLogged ? accent : "#C7CDD6", fontWeight: 700, fontSize: 13.5 }}>Finish</button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {exercises.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 3, background: i < idx ? accent : i === idx ? accent + "88" : "#E7EAEF" }} />)}
      </div>
      {rest > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: accent + "12", borderRadius: 14, padding: "10px 14px", marginBottom: 14 }}>
          <Timer className="w-5 h-5" style={{ color: accent }} />
          <div className="f-disp tnum" style={{ fontSize: 20, fontWeight: 700, color: INK }}>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}</div>
          <div className="f-body" style={{ fontSize: 12.5, color: "#7A828D" }}>rest</div>
          <button onClick={() => { clearInterval(restRef.current); setRest(0); }} className="f-body" style={{ marginLeft: "auto", background: "none", border: "none", color: accent, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Skip</button>
        </div>
      )}
      <div className="f-disp" style={{ fontSize: 20, fontWeight: 700, color: INK }}>{ex.name}</div>
      <div className="f-body" style={{ fontSize: 13, color: "#7A828D", marginTop: 2 }}>{ex.detail || "Log your sets"}</div>
      <div className="f-body" style={{ fontSize: 12.5, marginTop: 10, marginBottom: 16, color: sug ? INK : "#6B7280", background: "#F6F7F9", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        {sug
          ? <><TrendingUp className="w-4 h-4" style={{ color: sug.up ? "#10B981" : "#9097A1", flexShrink: 0 }} /><span>Last time: <b>{sug.last.w}×{sug.last.reps}</b> · suggested <b>{sug.next} lb</b></span></>
          : <><Sparkles className="w-4 h-4" style={{ color: VIOLET, flexShrink: 0 }} /><span>First time on this — log what you do and I'll suggest next time.</span></>}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, padding: "0 4px 6px" }} className="f-body">
          <div style={{ width: 34, fontSize: 11, color: "#9097A1", fontWeight: 600 }}>SET</div>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9097A1", fontWeight: 600 }}>WEIGHT</div>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#9097A1", fontWeight: 600 }}>REPS</div>
          <div style={{ width: 40 }} />
        </div>
        {cur.sets.map((s, si) => (
          <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div className="f-disp" style={{ width: 34, fontSize: 15, fontWeight: 700, color: s.done ? accent : "#9097A1" }}>{si + 1}</div>
            <input className="f-body tnum" type="number" inputMode="decimal" value={s.w} placeholder="—" onChange={(e) => setField(si, "w", e.target.value)} style={{ ...inputStyle, flex: 1, textAlign: "center", padding: "11px 8px", background: s.done ? "#F6F7F9" : "#fff" }} />
            <input className="f-body tnum" type="number" inputMode="numeric" value={s.reps} placeholder={String(t.hi)} onChange={(e) => setField(si, "reps", e.target.value)} style={{ ...inputStyle, flex: 1, textAlign: "center", padding: "11px 8px", background: s.done ? "#F6F7F9" : "#fff" }} />
            <button onClick={() => checkSet(si)} style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, cursor: "pointer", border: s.done ? "none" : "2px solid #DCE0E6", background: s.done ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Check className="w-4 h-4" style={{ color: s.done ? "#fff" : "#C7CDD6" }} /></button>
          </div>
        ))}
        <button onClick={addSet} className="f-body" style={{ background: "none", border: "none", color: accent, fontWeight: 600, cursor: "pointer", fontSize: 13, padding: "2px 4px" }}>+ Add set</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {idx > 0 && <Btn kind="outline" onClick={() => setIdx(idx - 1)}><ChevronLeft className="w-4 h-4" /> Prev</Btn>}
        {idx < exercises.length - 1
          ? <Btn full color={accent} onClick={() => setIdx(idx + 1)}>Next <ChevronRight className="w-4 h-4" /></Btn>
          : <Btn full color={accent} onClick={() => setFinishing(true)}><Check className="w-4 h-4" /> Finish workout</Btn>}
      </div>
    </div></div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [meId, setMeId] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [tab, setTab] = useState("today");
  const [editing, setEditing] = useState(false);
  const [forceSetup, setForceSetup] = useState(false);

  const [myLog, setMyLog] = useState(null);
  const [partnerLog, setPartnerLog] = useState(null);
  const [myPlan, setMyPlan] = useState(null);
  const [partnerPlan, setPartnerPlan] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [partnerStats, setPartnerStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressBusy, setProgressBusy] = useState(false);
  const [myWeek, setMyWeek] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [myLifts, setMyLifts] = useState({});
  const [gym, setGym] = useState(null); // { dk, slot }

  const date = todayKey();
  const me = meId ? profiles[meId] : null;
  const partnerId = Object.keys(profiles).find((id) => id !== meId);
  const partner = partnerId ? profiles[partnerId] : null;

  const loadProfiles = useCallback(async () => {
    const keys = await store.list("profile:", true);
    const obj = {};
    for (const k of keys) { const id = k.replace("profile:", ""); const pr = await getJSON(k, true); if (pr) obj[id] = migrate(pr); }
    setProfiles(obj); return obj;
  }, []);

  const loadData = useCallback(async (mid, pid) => {
    if (mid) {
      setMyLog((await getJSON(`log:${mid}:${date}`, true)) || { food: [], water_oz: 0, alcohol: [] });
      setMyPlan((await getJSON(`plan:${mid}:${date}`, true)) || { slots: [] });
      const n = await getJSON(`nudge:${mid}`, true); setNudge(n && n.text ? n : null);
      setMyStats(await getJSON(`stats:${mid}`, true));
    }
    if (pid) {
      setPartnerLog((await getJSON(`log:${pid}:${date}`, true)) || { food: [], water_oz: 0, alcohol: [] });
      setPartnerPlan((await getJSON(`plan:${pid}:${date}`, true)) || { slots: [] });
      setPartnerStats(await getJSON(`stats:${pid}`, true));
    } else { setPartnerLog(null); setPartnerPlan(null); setPartnerStats(null); }
  }, [date]);

  const loadProgress = useCallback(async (mid) => {
    setProgressBusy(true);
    const weights = (await getJSON(`weights:${mid}`, true)) || [];
    const measures = (await getJSON(`measure:${mid}`, true)) || [];
    const photoIdx = (await getJSON(`photoidx:${mid}`)) || [];
    const images = {};
    for (const ph of photoIdx.slice(-30)) images[ph.id] = await store.get(`photo:${mid}:${ph.id}`);
    const history = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() - i); const dk = todayKey(d);
      history.push({ date: dk, log: await getJSON(`log:${mid}:${dk}`, true), plan: await getJSON(`plan:${mid}:${dk}`, true) });
    }
    const stats = computeStats(history, weights, measures, photoIdx);
    await store.set(`stats:${mid}`, stats, true);
    setMyStats(stats);
    setProgress({ weights, measures, photoIdx, images, history, stats });
    setProgressBusy(false);
  }, []);

  const loadWeek = useCallback(async (prof, pf) => {
    if (!prof) return;
    const wk = weekStartKey();
    const dates = weekDates(wk);
    const existing = {};
    for (const dk of dates) { const pl = await getJSON(`plan:${prof.id}:${dk}`, true); if (pl) existing[dk] = pl; }
    let plans = existing;
    if (dates.some((d) => !existing[d])) {
      // Auto-fill any not-yet-planned day with rotating templates (instant, no AI).
      const built = await buildWeekPlans(prof, wk, pf || { like: {}, skip: {} }, existing, { force: false, useAI: false });
      for (const dk of dates) if (!existing[dk]) await store.set(`plan:${prof.id}:${dk}`, built[dk], true);
      plans = built;
    }
    setMyWeek({ weekStart: wk, dates, plans });
    if (plans[todayKey()]) setMyPlan(plans[todayKey()]);
  }, []);

  const loadPrefs = useCallback(async (mid) => {
    const pf = (await getJSON(`prefs:${mid}`, true)) || { like: {}, skip: {} };
    setPrefs(pf); return pf;
  }, []);

  useEffect(() => {
    (async () => {
      const obj = await loadProfiles();
      const saved = device.get();
      if (saved && obj[saved]) {
        setMeId(saved);
        await loadData(saved, Object.keys(obj).find((id) => id !== saved));
        const pf = await loadPrefs(saved);
        await loadWeek(obj[saved], pf);
        setMyLifts((await getJSON(`lifts:${saved}`, true)) || {});
      }
      setBooted(true);
    })();
  }, [loadProfiles, loadData, loadPrefs, loadWeek]);

  useEffect(() => {
    if (!meId) return;
    const refresh = async () => {
      const obj = await loadProfiles();
      await loadData(meId, Object.keys(obj).find((id) => id !== meId));
    };
    const iv = setInterval(refresh, 25000);
    const ch = supabase
      .channel("entries-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, refresh)
      .subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, [meId, loadProfiles, loadData]);

  useEffect(() => { if (tab === "progress" && meId) loadProgress(meId); }, [tab, meId, loadProgress]);

  async function handleSetupDone(profile, claimed) {
    if (!claimed) await store.set(`profile:${profile.id}`, profile, true);
    device.set(profile.id);
    setForceSetup(false); setEditing(false);
    const obj = await loadProfiles();
    setMeId(profile.id);
    await loadData(profile.id, Object.keys(obj).find((id) => id !== profile.id));
    const pf = await loadPrefs(profile.id);
    await loadWeek(obj[profile.id] || profile, pf);
    setMyLifts((await getJSON(`lifts:${profile.id}`, true)) || {});
    setTab("today");
  }
  async function saveMyLog(next) { setMyLog(next); await store.set(`log:${meId}:${date}`, next, true); }
  async function saveMyPlan(next) { setMyPlan(next); await store.set(`plan:${meId}:${date}`, next, true); }
  async function sendNudge(text) { if (partnerId) await store.set(`nudge:${partnerId}`, { from: meId, text, ts: Date.now() }, true); }
  async function clearNudge() { setNudge(null); await store.del(`nudge:${meId}`, true); }

  async function saveDay(dk, plan) {
    await store.set(`plan:${meId}:${dk}`, plan, true);
    setMyWeek((w) => (w ? { ...w, plans: { ...w.plans, [dk]: plan } } : w));
    if (dk === date) setMyPlan(plan);
  }
  async function regenWeek(prof, useAI, note = "") {
    const who = prof || me;
    const pf = prefs || (await getJSON(`prefs:${who.id}`, true)) || { like: {}, skip: {} };
    const wk = weekStartKey();
    const dates = weekDates(wk);
    const built = await buildWeekPlans(who, wk, pf, {}, { force: true, useAI, note });
    for (const dk of dates) await store.set(`plan:${who.id}:${dk}`, built[dk], true);
    setMyWeek({ weekStart: wk, dates, plans: built });
    if (built[todayKey()]) setMyPlan(built[todayKey()]);
  }
  async function genWeek(useAI, note = "") { await regenWeek(me, useAI, note); }

  function startGym(dk, slot) { setGym({ dk, slot }); }
  async function saveWorkout(logs, calories) {
    if (!gym) return;
    const { dk, slot } = gym;
    // 1) append to per-exercise lift history (learns weights/reps)
    const lf = { ...(myLifts || {}) };
    const now = Date.now();
    for (const ex of logs) {
      const k = liftKey(ex.name);
      const entry = { ts: now, date: dk, sets: ex.sets, top: bestSet(ex.sets) };
      lf[k] = [...(lf[k] || []), entry].slice(-20);
    }
    await store.set(`lifts:${meId}`, lf, true);
    setMyLifts(lf);
    // 2) mark the session done (+ calories) on the day plan
    const plan = (myWeek?.plans?.[dk]) || (dk === date ? myPlan : null) || { slots: [] };
    const slots = (plan.slots || []).map((s) => s.id === slot.id ? { ...s, done: true, ...(calories ? { calories } : {}) } : s);
    await saveDay(dk, { slots });
    setGym(null);
  }
  async function bumpPreference(focus, kind) {
    const pf = bumpPref(prefs, focus, kind);
    setPrefs(pf);
    await store.set(`prefs:${meId}`, pf, true);
  }

  async function logWeight(lb) {
    const arr = (await getJSON(`weights:${meId}`, true)) || [];
    arr.push({ ts: Date.now(), date, lb });
    await store.set(`weights:${meId}`, arr, true);
    // keep targets tracking current weight
    const np = { ...me, weightLb: lb }; np.targets = computeTargets(np);
    await store.set(`profile:${meId}`, np, true);
    await loadProfiles();
    await loadProgress(meId);
  }
  async function logMeasure(obj) {
    const arr = (await getJSON(`measure:${meId}`, true)) || [];
    arr.push({ ts: Date.now(), date, ...obj });
    await store.set(`measure:${meId}`, arr, true);
    await loadProgress(meId);
  }
  async function addPhoto(file, pose = "front") {
    setProgressBusy(true);
    try {
      const { dataUrl, w, h } = await fileToThumb(file);
      const id = uid();
      await store.set(`photo:${meId}:${id}`, dataUrl);
      const idx = (await getJSON(`photoidx:${meId}`)) || [];
      idx.push({ id, ts: Date.now(), date, w, h, pose });
      await store.set(`photoidx:${meId}`, idx);
      await loadProgress(meId);
    } catch (e) { setProgressBusy(false); }
  }
  async function deletePhoto(id) {
    await store.del(`photo:${meId}:${id}`);
    const idx = ((await getJSON(`photoidx:${meId}`)) || []).filter((p) => p.id !== id);
    await store.set(`photoidx:${meId}`, idx);
    await loadProgress(meId);
  }

  if (!booted) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StyleInjector /><div className="f-disp" style={{ fontSize: 28, fontWeight: 700, color: INK }}>Tandem</div>
    </div>
  );
  if (!me || forceSetup) return (
    <div style={{ minHeight: "100vh", background: BG }}><StyleInjector /><Setup existing={Object.values(profiles)} onDone={handleSetupDone} /></div>
  );
  if (editing) return (
    <div style={{ minHeight: "100vh", background: BG }}><StyleInjector />
      <EditProfile me={me} onDone={async (np) => { await store.set(`profile:${np.id}`, np, true); const obj = await loadProfiles(); await regenWeek(obj[np.id] || np, false); setEditing(false); }} onCancel={() => setEditing(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK }} className="f-body">
      <StyleInjector />
      {tab === "today" && <Today me={me} partner={partner} myLog={myLog} partnerLog={partnerLog} myPlan={myPlan} partnerPlan={partnerPlan} myStats={myStats} nudge={nudge} onClearNudge={clearNudge} onGo={setTab} onStart={(slot) => startGym(date, slot)} />}
      {tab === "food" && <Food me={me} log={myLog} onSave={saveMyLog} />}
      {tab === "train" && <Train me={me} week={myWeek} prefs={prefs} onSaveDay={saveDay} onGenWeek={genWeek} onPref={bumpPreference} onStart={startGym} />}
      {tab === "progress" && <Progress me={me} data={progress} busy={progressBusy} onLogWeight={logWeight} onLogMeasure={logMeasure} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} />}
      {tab === "us" && <Us me={me} partner={partner} myLog={myLog} partnerLog={partnerLog} myPlan={myPlan} partnerPlan={partnerPlan} myStats={myStats} partnerStats={partnerStats} onNudge={sendNudge} />}
      {tab === "settings" && <SettingsView me={me} onEdit={() => setEditing(true)} onSwitch={async () => { device.del(); setMeId(null); setForceSetup(true); }} />}

      {gym && <GymMode slot={gym.slot} me={me} lifts={myLifts} accent={accentHex(me.accent)} onFinish={saveWorkout} onClose={() => setGym(null)} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid #EBEEF2", display: "flex", justifyContent: "center", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 480 }}>
          {TABS.map((tb) => {
            const active = tab === tb.id, col = active ? accentHex(me.accent) : "#A6ACB5";
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ position: "relative" }}>
                  <tb.icon className="w-5 h-5" style={{ color: col }} strokeWidth={active ? 2.5 : 2} />
                  {tb.id === "progress" && myStats && (isDue(myStats.lastWeighTs) || isDue(myStats.lastMeasureTs) || isDue(myStats.lastPhotoTs)) &&
                    <span style={{ position: "absolute", top: -2, right: -5, width: 7, height: 7, borderRadius: 4, background: "#F43F5E", border: "1.5px solid #fff" }} />}
                </div>
                <span className="f-body" style={{ fontSize: 10, color: col, fontWeight: active ? 600 : 500 }}>{tb.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EditProfile({ me, onDone, onCancel }) {
  const [p, setP] = useState({ ...me, accesses: accessesOf(me), sessionsPerDay: me.sessionsPerDay || 1, together: me.together || { mode: "few", time: "Evening" } });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const targets = computeTargets(p);
  const toggleAccess = (v) => { const has = p.accesses.includes(v); let next = has ? p.accesses.filter((a) => a !== v) : [...p.accesses, v]; if (!next.length) next = [v]; setP((s) => ({ ...s, accesses: next, access: next[0] })); };
  return (
    <SetupShell>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h1 className="f-disp" style={{ fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>Edit profile</h1>
        <button onClick={onCancel} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#9097A1" }} /></button>
      </div>
      <Field label="Name"><TextInput value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Weight (lbs)" hint="A weigh-in on the Progress tab updates this automatically."><TextInput type="number" value={p.weightLb} onChange={(e) => set("weightLb", e.target.value)} /></Field>
      <Field label="Everyday activity" hint="Your normal day — not Tandem's workouts."><Choice value={p.activity} onChange={(v) => set("activity", v)} options={Object.entries(ACT).map(([k, v]) => ({ value: k, label: v.label }))} columns={2} /></Field>
      <Field label="Goal"><Choice value={p.goal} onChange={(v) => set("goal", v)} options={Object.entries(GOALS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} columns={2} /></Field>
      {p.goal !== "maintain" && (
        <Field label="Pace"><Choice columns={3} value={p.pace} onChange={(v) => set("pace", v)} options={Object.entries(PACES).map(([k, v]) => ({ value: k, label: v.label }))} /></Field>
      )}
      <Field label="Training access" hint="Pick all that apply."><MultiChoice columns={1} values={p.accesses} onToggle={toggleAccess} options={Object.entries(ACCESS).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))} /></Field>
      <Field label="Sessions per day"><Choice columns={2} value={p.sessionsPerDay} onChange={(v) => set("sessionsPerDay", v)} options={[{ value: 1, label: "One a day" }, { value: 2, label: "Two a day" }]} /></Field>
      {p.sessionsPerDay === 2 && (
        <Field label="Session times">
          <div style={{ display: "flex", gap: 8 }}>
            <Choice columns={2} value={p.mainTime} onChange={(v) => set("mainTime", v)} options={TIMES.map((t) => ({ value: t, label: t }))} />
            <Choice columns={2} value={p.secondTime} onChange={(v) => set("secondTime", v)} options={TIMES.map((t) => ({ value: t, label: t }))} />
          </div>
        </Field>
      )}
      <Field label="Training together"><Choice value={p.together.mode} onChange={(v) => set("together", { ...p.together, mode: v })} options={Object.entries(TOGETHER_MODES).map(([k, v]) => ({ value: k, label: v.label }))} columns={3} /></Field>
      <Field label="Coaching style notes (optional)" hint="Fed to the AI when it writes your workouts — favorite lifts, splits, injuries to work around, RPE vs %, superset preferences, etc.">
        <textarea className="f-body" value={p.trainingStyle || ""} placeholder="e.g. Station-based supersets, warm-up ramps, RPE 8–10 working sets, lots of unilateral + core, bad left shoulder — go easy on overhead pressing." onChange={(e) => set("trainingStyle", e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </Field>
      {targets.warn && (
        <div className="f-body" style={{ display: "flex", gap: 9, fontSize: 12.5, color: "#92400E", background: "#FEF3C7", borderRadius: 12, padding: "11px 13px", marginBottom: 12, lineHeight: 1.5 }}>
          <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0, marginTop: 1, color: "#B45309" }} /><span>{targets.warn}</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "8px 0 16px" }}>
        <Metric label="Calories" value={targets.calories} unit="kcal" color={accentHex(p.accent)} />
        <Metric label="Protein" value={targets.protein} unit="g" color={VIOLET} />
      </div>
      <Btn full color={accentHex(p.accent)} onClick={() => onDone({ ...p, targets })}><Check className="w-4 h-4" /> Save changes</Btn>
    </SetupShell>
  );
}
