import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import {
  Home, Utensils, Dumbbell, Users, Settings, Plus, Droplet, Flame,
  Check, X, ChevronLeft, ChevronRight, Sparkles, Heart, Trash2,
  Footprints, Bike, Activity, RefreshCw, Clock, Send, Edit3,
  ChevronDown, Wand2, Minus, Scale, Ruler, Camera, Wine, Leaf,
  TrendingUp, TrendingDown, BarChart3, CalendarDays
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
  sedentary: { f: 1.2,   label: "Mostly sitting", desc: "Desk job, little exercise" },
  light:     { f: 1.375, label: "Lightly active", desc: "Light exercise 1–3 days/wk" },
  moderate:  { f: 1.55,  label: "Moderately active", desc: "Exercise 3–5 days/wk" },
  very:      { f: 1.725, label: "Very active", desc: "Hard exercise 6–7 days/wk" },
};
const GOALS = {
  lose:     { label: "Lose fat", desc: "Gentle calorie deficit" },
  maintain: { label: "Maintain", desc: "Recomp & stay steady" },
  gain:     { label: "Build muscle", desc: "Lean surplus" },
};
const ACCESS = {
  gym:     { label: "Full gym", desc: "Weights + machines", icon: Dumbbell },
  home:    { label: "Home / minimal", desc: "Bodyweight + a few items", icon: Activity },
  outdoor: { label: "Outdoor", desc: "Walking, running, hiking", icon: Footprints },
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
  let cal = tdee, clamped = false;
  const gentle = p.pace === "gentle";
  if (p.goal === "lose") cal = tdee * (gentle ? 0.88 : 0.8);
  else if (p.goal === "gain") cal = Math.min(tdee * (gentle ? 1.07 : 1.12), tdee + 600);
  const floor = p.sex === "female" ? 1300 : 1500;
  if (cal < floor) { cal = floor; clamped = true; }
  cal = round(cal, 10);
  const perKg = p.goal === "lose" ? 2.0 : p.goal === "gain" ? 1.8 : 1.7;
  const protein = clamp(round(perKg * kg), 40, 260);
  const fat = Math.max(40, round(0.9 * kg));
  const carbs = Math.max(50, round((cal - protein * 4 - fat * 9) / 4));
  const water_oz = clamp(round(mlToOz(35 * kg + 500), 4), 64, 160);
  return { bmr: round(bmr), tdee: round(tdee), calories: cal, protein, carbs, fat, water_oz, clamped };
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
function computeStats(history, weights) {
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
  return { dryStreak, workoutStreak, logStreak, weight, weightChange30, ts: Date.now() };
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
async function aiFocusWorkout(profile, focus) {
  const out = await callClaude(
    [{ role: "user", content:
      `Build today's "${focus}" workout. Access: ${ACCESS[profile.access]?.label}. Goal: ${GOALS[profile.goal]?.label}. 30–45 min, realistic, 4–6 exercises.` }],
    'You are a fitness coach. Reply with ONLY a JSON object, no prose: {"title":string,"type":"strength"|"cardio"|"mobility"|"run","duration_min":int,"exercises":[{"name":string,"detail":string}]}. "detail" is sets×reps or time. Keep the title close to the requested focus.',
    700);
  const j = parseLoose(out);
  if (!j || !Array.isArray(j.exercises)) throw new Error("bad");
  return slotFrom({ title: j.title || focus, type: j.type || "strength", duration: j.duration_min || 40,
    location: ACCESS[profile.access]?.label || "", exercises: j.exercises.slice(0, 8) }, profile.mainTime);
}
function slotFrom(s, time) {
  return { id: uid(), time: time || "Lunch", done: false, title: s.title, type: s.type,
    duration: Math.round(s.duration || 35), location: s.location || "",
    exercises: (s.exercises || []).map((e) => ({ name: String(e.name || ""), detail: String(e.detail || "") })) };
}
function templatePrimary(profile, focus) {
  const t = FOCUS_TEMPLATES[profile.access]?.[focus] || FOCUS_TEMPLATES.home["Full-body strength"];
  return slotFrom({ title: focus, type: t.type, duration: t.duration,
    location: ACCESS[profile.access]?.label || "", exercises: expand(t.ex) }, profile.mainTime);
}
function focusForDate(access, date) {
  const arr = FOCUS[access] || FOCUS.home;
  return arr[dayOfYear(date) % arr.length];
}
function buildTogether(profile, date) {
  if (!profile.eveningTogether) return null;
  const t = TOGETHER_POOL[dayOfYear(date) % TOGETHER_POOL.length];
  return { ...slotFrom({ title: t.title, type: t.type, duration: t.duration, location: t.location, exercises: expand(t.ex) }, "Evening"), together: true };
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
function Avatar({ p, size = 36 }) {
  return <div className="f-disp" style={{ width: size, height: size, borderRadius: size / 3, background: accentHex(p.accent),
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
    activity: "moderate", goal: "lose", pace: "standard",
    access: "gym", mainTime: "Lunch", eveningTogether: true,
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
    { title: "How active are you?", valid: () => true, body: (
      <Choice value={p.activity} onChange={(v) => set("activity", v)} options={Object.entries(ACT).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} />
    ) },
    { title: "What's the goal?", valid: () => true, body: (
      <>
        <Choice value={p.goal} onChange={(v) => set("goal", v)} options={Object.entries(GOALS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc }))} />
        {p.goal !== "maintain" && (
          <div style={{ marginTop: 14 }}>
            <Field label="Pace">
              <Choice columns={2} value={p.pace} onChange={(v) => set("pace", v)} options={[
                { value: "gentle", label: "Gentle", desc: p.goal === "lose" ? "~0.5 lb/wk" : "Slow & lean" },
                { value: "standard", label: "Standard", desc: p.goal === "lose" ? "~1 lb/wk" : "Faster" }]} />
            </Field>
          </div>
        )}
      </>
    ) },
    { title: "How do you train?", valid: () => true, body: (
      <>
        <Field label="What do you have access to?">
          <Choice value={p.access} onChange={(v) => set("access", v)} options={Object.entries(ACCESS).map(([k, v]) => ({ value: k, label: v.label, desc: v.desc, icon: v.icon }))} />
        </Field>
        <Field label="When do you usually train?">
          <Choice columns={2} value={p.mainTime} onChange={(v) => set("mainTime", v)} options={TIMES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Add a shared evening activity?" hint="Rotates through a run, backyard Spartan circuit, yoga, a long walk, and more — and shows on both of your plans. You can always swap the day's pick.">
          <Choice columns={2} value={p.eveningTogether ? "yes" : "no"} onChange={(v) => set("eveningTogether", v === "yes")}
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        </Field>
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
        <div className="f-body" style={{ fontSize: 12.5, color: "#7A828D", lineHeight: 1.5, background: "#F4F6F8", borderRadius: 12, padding: "11px 13px" }}>
          Built from the Mifflin–St Jeor equation and standard guidelines (BMR {targets.bmr} · maintenance ≈ {targets.tdee} kcal).
          {targets.clamped ? " Floored to a safe minimum." : ""} It's a starting point — adjust to how you feel, and check with a doctor or dietitian for anything personalized.
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
              <div style={{ fontSize: 12.5, color: "#9097A1" }}>{GOALS[ep.goal]?.label} · {ACCESS[ep.access]?.label}</div>
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
function Today({ me, partner, myLog, partnerLog, myPlan, partnerPlan, myStats, nudge, onClearNudge, onGo }) {
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
        : myPlan.slots.map((sl) => <SlotRow key={sl.id} slot={sl} accent={accentHex(me.accent)} compact />)}
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
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const food = log?.food || [], alcohol = log?.alcohol || [];

  async function estimate() {
    if (!desc.trim()) return;
    setBusy(true); setErr("");
    try { setDraft(await estimateMacros(desc.trim())); }
    catch (e) { setErr("Couldn't estimate that one — add the numbers yourself below."); setDraft({ label: desc.trim().slice(0, 40), cal: "", p: "", c: "", f: "" }); }
    setBusy(false);
  }
  function addDraft() {
    if (!draft) return;
    const entry = { id: uid(), label: draft.label || "Food", cal: +draft.cal || 0, p: +draft.p || 0, c: +draft.c || 0, f: +draft.f || 0, ts: Date.now() };
    onSave({ ...(log || {}), food: [...food, entry] }); setDraft(null); setDesc(""); setErr("");
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
          {[["Glass", 8], ["Bottle", 16], ["Big", 24]].map(([l, oz]) => <Btn key={l} kind="soft" color="#0EA5E9" size="sm" onClick={() => addWater(oz)}><Plus className="w-3.5 h-3.5" /> {oz}oz</Btn>)}
        </div>
      </Card>

      <SectionTitle>Add food</SectionTitle>
      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          <TextInput value={desc} placeholder="e.g. grilled chicken bowl with rice" onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && estimate()} />
          <Btn color={VIOLET} disabled={busy || !desc.trim()} onClick={estimate}>{busy ? <RefreshCw className="w-4 h-4" style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 className="w-4 h-4" />}</Btn>
        </div>
        <div className="f-body" style={{ fontSize: 12, color: "#9097A1", marginTop: 8 }}>Describe it and tap the wand — Tandem estimates the macros for you.</div>
        {err && <div className="f-body" style={{ fontSize: 12.5, color: "#C2410C", marginTop: 8 }}>{err}</div>}
        {draft && (
          <div style={{ marginTop: 14, padding: 14, background: "#F6F7F9", borderRadius: 14 }}>
            <TextInput value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} style={{ ...inputStyle, marginBottom: 10, fontWeight: 600 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[["cal", "kcal"], ["p", "protein"], ["c", "carbs"], ["f", "fat"]].map(([k, lbl]) => (
                <div key={k}>
                  <div className="f-body" style={{ fontSize: 10.5, color: "#9097A1", marginBottom: 3 }}>{lbl}</div>
                  <input className="f-body tnum" type="number" inputMode="numeric" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} style={{ ...inputStyle, padding: "9px 10px", textAlign: "center" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn kind="outline" size="sm" onClick={() => setDraft(null)}>Cancel</Btn>
              <Btn full size="sm" color={accentHex(me.accent)} onClick={addDraft}><Plus className="w-4 h-4" /> Add to log</Btn>
            </div>
          </div>
        )}
      </Card>

      <SectionTitle right={<span className="f-disp tnum" style={{ fontSize: 13, color: "#9097A1" }}>{tot.cal} / {t.calories} kcal</span>}>Today's log</SectionTitle>
      {food.length === 0
        ? <Card><Empty icon={Utensils} title="Nothing logged yet" sub="Add your first meal above." /></Card>
        : <Card style={{ padding: 8 }}>
            {food.map((x) => (
              <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderBottom: "1px solid #F1F3F6" }}>
                <div style={{ flex: 1 }}>
                  <div className="f-body" style={{ fontSize: 14, fontWeight: 600, color: INK }}>{x.label}</div>
                  <div className="f-body tnum" style={{ fontSize: 12, color: "#9097A1" }}>{x.cal} kcal · {x.p}p · {x.c}c · {x.f}f</div>
                </div>
                <button onClick={() => removeFood(x.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Trash2 className="w-4 h-4" style={{ color: "#C7CDD6" }} /></button>
              </div>
            ))}
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
const TYPE_ICON = { strength: Dumbbell, cardio: Activity, run: Footprints, mobility: Bike };
function SlotRow({ slot, accent, onToggle, onSub, onRemove, compact }) {
  const [open, setOpen] = useState(false);
  const Icon = TYPE_ICON[slot.type] || Dumbbell;
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
          </div>
          <div className="f-body" style={{ fontSize: 12, color: "#9097A1", display: "flex", gap: 8, marginTop: 2 }}>
            <span><Clock className="w-3 h-3" style={{ display: "inline", marginRight: 3, verticalAlign: "-1px" }} />{slot.time}</span>
            <span>· {slot.duration} min</span>{slot.location && <span>· {slot.location}</span>}
          </div>
        </div>
        {!compact && <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronDown className="w-5 h-5" style={{ color: "#C7CDD6", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>}
      </div>
      {open && !compact && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ background: "#F6F7F9", borderRadius: 12, padding: 12 }}>
            {(slot.exercises || []).map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < slot.exercises.length - 1 ? "1px solid #ECEFF2" : "none" }}>
                <span className="f-body" style={{ fontSize: 13.5, color: INK }}>{e.name}</span>
                <span className="f-body tnum" style={{ fontSize: 13, color: "#7A828D" }}>{e.detail}</span>
              </div>
            ))}
          </div>
          {(onSub || onRemove) && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {onSub && <Btn kind="outline" size="sm" onClick={() => onSub(slot.id)}><RefreshCw className="w-3.5 h-3.5" /> Swap</Btn>}
              {onRemove && <Btn kind="outline" size="sm" onClick={() => onRemove(slot.id)}><Trash2 className="w-3.5 h-3.5" /> Remove</Btn>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
function Train({ me, plan, onSave }) {
  const [busy, setBusy] = useState(false);
  const accent = accentHex(me.accent);
  const slots = plan?.slots || [];
  const date = todayKey();
  const focus = focusForDate(me.access, date);

  async function generate() {
    setBusy(true);
    let main;
    try { main = await aiFocusWorkout(me, focus); } catch (e) { main = templatePrimary(me, focus); }
    const ev = buildTogether(me, date);
    onSave({ slots: [...(main ? [main] : []), ...(ev ? [ev] : [])] });
    setBusy(false);
  }
  async function swap(id) {
    setBusy(true);
    const cur = slots.find((s) => s.id === id);
    let repl;
    if (cur?.together) {
      const others = TOGETHER_POOL.filter((t) => t.title !== cur.title);
      const pick = others[Math.floor(Math.random() * others.length)];
      repl = { ...slotFrom({ title: pick.title, type: pick.type, duration: pick.duration, location: pick.location, exercises: expand(pick.ex) }, "Evening"), together: true };
    } else {
      const others = (FOCUS[me.access] || FOCUS.home).filter((f) => f !== cur?.title);
      const nf = others[Math.floor(Math.random() * others.length)];
      try { repl = await aiFocusWorkout(me, nf); } catch (e) { repl = templatePrimary(me, nf); }
    }
    onSave({ slots: slots.map((s) => (s.id === id ? { ...repl, id, time: s.time, together: s.together } : s)) });
    setBusy(false);
  }
  const toggle = (id) => onSave({ slots: slots.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });
  const remove = (id) => onSave({ slots: slots.filter((s) => s.id !== id) });
  const reschedule = (id, time) => onSave({ slots: slots.map((s) => (s.id === id ? { ...s, time } : s)) });
  const doneCt = slots.filter((s) => s.done).length;

  return (
    <Screen>
      <Header me={me} title="Train" subtitle={`${ACCESS[me.access]?.label} · today's focus: ${focus}`} />
      {slots.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: accent + "1a", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}><Dumbbell className="w-7 h-7" style={{ color: accent }} /></div>
          <h3 className="f-disp" style={{ fontSize: 19, fontWeight: 700, color: INK, margin: "0 0 6px" }}>Today is {focus.toLowerCase()}</h3>
          <p className="f-body" style={{ fontSize: 14, color: "#6B7280", margin: "0 0 18px" }}>
            Tailored to your {ACCESS[me.access]?.label.toLowerCase()} access{me.eveningTogether ? ", plus tonight's shared activity" : ""}. The focus rotates daily, so no two days repeat.</p>
          <Btn full size="lg" color={accent} disabled={busy} onClick={generate}>
            {busy ? <RefreshCw className="w-5 h-5" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles className="w-5 h-5" />}{busy ? "Building…" : "Generate today's plan"}</Btn>
        </Card>
      ) : (
        <>
          <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Ring value={slots.length ? doneCt / slots.length : 0} color={accent} size={58}><span className="f-disp tnum" style={{ fontSize: 15, fontWeight: 700, color: INK }}>{doneCt}/{slots.length}</span></Ring>
            <div style={{ flex: 1 }}>
              <div className="f-body" style={{ fontWeight: 600, color: INK, fontSize: 15 }}>{doneCt === slots.length ? "Crushed it today 💪" : "Sessions done"}</div>
              <div className="f-body" style={{ fontSize: 12.5, color: "#9097A1" }}>Tap a circle to check one off.</div>
            </div>
            <Btn kind="soft" color={accent} size="sm" disabled={busy} onClick={generate}><RefreshCw className="w-3.5 h-3.5" /> Redo</Btn>
          </Card>
          {slots.map((sl) => (
            <div key={sl.id}>
              <SlotRow slot={sl} accent={accent} onToggle={toggle} onSub={swap} onRemove={remove} />
              <div style={{ display: "flex", gap: 6, margin: "-6px 0 12px 4px", flexWrap: "wrap" }}>
                {TIMES.map((tm) => (
                  <button key={tm} onClick={() => reschedule(sl.id, tm)} className="f-body" style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid " + (sl.time === tm ? accent : "#E5E8EC"), background: sl.time === tm ? accent + "14" : "#fff", color: sl.time === tm ? accent : "#9097A1", fontWeight: 600 }}>{tm}</button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
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
function Progress({ me, data, busy, onLogWeight, onLogMeasure, onAddPhoto, onDeletePhoto }) {
  const [showW, setShowW] = useState(false);
  const [showM, setShowM] = useState(false);
  const [wVal, setWVal] = useState("");
  const [mVals, setMVals] = useState({});
  const [viewer, setViewer] = useState(null);
  const fileRef = useRef(null);
  if (!data) return <Screen><Header me={me} title="Progress" /><Card><div className="f-body" style={{ textAlign: "center", color: "#9097A1", padding: 12 }}>Loading…</div></Card></Screen>;

  const { weights, measures, photoIdx, images, history, stats } = data;
  const weightVals = weights.map((w) => w.lb);
  const latestW = weights.length ? weights[weights.length - 1].lb : null;
  const waistSeries = measures.filter((m) => m.waist != null).map((m) => m.waist);
  const latestM = measures.length ? measures[measures.length - 1] : null;
  const days = history.slice(0, 7).reverse();

  function saveW() { const v = parseFloat(wVal); if (!v) return; onLogWeight(v); setWVal(""); setShowW(false); }
  function saveM() {
    const obj = {}; let any = false;
    MEASURE_FIELDS.forEach((f) => { const v = parseFloat(mVals[f.key]); if (v) { obj[f.key] = v; any = true; } });
    if (!any) return; onLogMeasure(obj); setMVals({}); setShowM(false);
  }
  function onFile(e) { const f = e.target.files?.[0]; if (f) onAddPhoto(f); e.target.value = ""; }

  return (
    <Screen>
      <Header me={me} title="Progress" subtitle="Streaks, trends & photos" />
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
        {latestM ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <Ruler className="w-4 h-4" style={{ color: "#9097A1" }} />
              <span className="f-body" style={{ fontSize: 13, color: "#6B7280" }}>Waist</span>
              <span className="f-disp tnum" style={{ fontSize: 22, fontWeight: 700, color: INK }}>{latestM.waist ?? "—"}<span style={{ fontSize: 13, color: "#9097A1", fontWeight: 600 }}>{latestM.waist != null ? " in" : ""}</span></span>
            </div>
            {waistSeries.length >= 2 && <MiniLine values={waistSeries} color="#10B981" height={42} />}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {MEASURE_FIELDS.filter((f) => f.key !== "waist" && latestM[f.key] != null).map((f) => (
                <span key={f.key} className="f-body tnum" style={{ fontSize: 12.5, background: "#F6F7F9", borderRadius: 10, padding: "6px 10px", color: "#374151" }}>{f.label} {latestM[f.key]}″</span>
              ))}
            </div>
          </>
        ) : <Empty icon={Ruler} title="No measurements yet" sub="Track your waist and key spots over time." />}
      </Card>

      {/* photos */}
      <SectionTitle right={<Btn kind="soft" color={accentHex(me.accent)} size="sm" onClick={() => fileRef.current?.click()}><Camera className="w-3.5 h-3.5" /> Add</Btn>}>Progress photos</SectionTitle>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      <Card>
        <div className="f-body" style={{ fontSize: 12, color: "#9097A1", marginBottom: photoIdx.length ? 12 : 0 }}>Private to you — your partner can't see these.</div>
        {photoIdx.length === 0 ? <Empty icon={Camera} title="No photos yet" sub="Add a starting photo to track visible change." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {photoIdx.slice().reverse().map((ph) => (
              <button key={ph.id} onClick={() => setViewer(ph)} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 12, overflow: "hidden", border: "1px solid #EBEEF2", cursor: "pointer", padding: 0, background: "#F6F7F9" }}>
                {images[ph.id] ? <img src={images[ph.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera className="w-5 h-5" style={{ color: "#C7CDD6" }} /></div>}
                <span className="f-body" style={{ position: "absolute", left: 6, bottom: 6, fontSize: 10, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,.5)", padding: "2px 6px", borderRadius: 6 }}>{fmtDate(ph.date)}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
      {busy && <div className="f-body" style={{ textAlign: "center", fontSize: 12.5, color: "#9097A1", marginTop: -6 }}>Working…</div>}

      {viewer && (
        <div onClick={() => setViewer(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,.85)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          {images[viewer.id] && <img src={images[viewer.id]} alt="" style={{ maxWidth: "100%", maxHeight: "78%", borderRadius: 14 }} />}
          <div className="f-body" style={{ color: "#fff", marginTop: 12, fontSize: 13 }}>{fmtDate(viewer.date)}</div>
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
            <div className="f-body" style={{ fontSize: 13, color: "#9097A1" }}>{GOALS[me.goal]?.label} · {ACT[me.activity]?.label} · {ACCESS[me.access]?.label}</div></div>
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

  const date = todayKey();
  const me = meId ? profiles[meId] : null;
  const partnerId = Object.keys(profiles).find((id) => id !== meId);
  const partner = partnerId ? profiles[partnerId] : null;

  const loadProfiles = useCallback(async () => {
    const keys = await store.list("profile:", true);
    const obj = {};
    for (const k of keys) { const id = k.replace("profile:", ""); const pr = await getJSON(k, true); if (pr) obj[id] = pr; }
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
    for (const ph of photoIdx.slice(-12)) images[ph.id] = await store.get(`photo:${mid}:${ph.id}`);
    const history = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() - i); const dk = todayKey(d);
      history.push({ date: dk, log: await getJSON(`log:${mid}:${dk}`, true), plan: await getJSON(`plan:${mid}:${dk}`, true) });
    }
    const stats = computeStats(history, weights);
    await store.set(`stats:${mid}`, stats, true);
    setMyStats(stats);
    setProgress({ weights, measures, photoIdx, images, history, stats });
    setProgressBusy(false);
  }, []);

  useEffect(() => {
    (async () => {
      const obj = await loadProfiles();
      const saved = device.get();
      if (saved && obj[saved]) {
        setMeId(saved);
        await loadData(saved, Object.keys(obj).find((id) => id !== saved));
      }
      setBooted(true);
    })();
  }, [loadProfiles, loadData]);

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
    setTab("today");
  }
  async function saveMyLog(next) { setMyLog(next); await store.set(`log:${meId}:${date}`, next, true); }
  async function saveMyPlan(next) { setMyPlan(next); await store.set(`plan:${meId}:${date}`, next, true); }
  async function sendNudge(text) { if (partnerId) await store.set(`nudge:${partnerId}`, { from: meId, text, ts: Date.now() }, true); }
  async function clearNudge() { setNudge(null); await store.del(`nudge:${meId}`, true); }

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
  async function addPhoto(file) {
    setProgressBusy(true);
    try {
      const { dataUrl, w, h } = await fileToThumb(file);
      const id = uid();
      await store.set(`photo:${meId}:${id}`, dataUrl);
      const idx = (await getJSON(`photoidx:${meId}`)) || [];
      idx.push({ id, ts: Date.now(), date, w, h });
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
      <EditProfile me={me} onDone={async (np) => { await store.set(`profile:${np.id}`, np, true); await loadProfiles(); setEditing(false); }} onCancel={() => setEditing(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK }} className="f-body">
      <StyleInjector />
      {tab === "today" && <Today me={me} partner={partner} myLog={myLog} partnerLog={partnerLog} myPlan={myPlan} partnerPlan={partnerPlan} myStats={myStats} nudge={nudge} onClearNudge={clearNudge} onGo={setTab} />}
      {tab === "food" && <Food me={me} log={myLog} onSave={saveMyLog} />}
      {tab === "train" && <Train me={me} plan={myPlan} onSave={saveMyPlan} />}
      {tab === "progress" && <Progress me={me} data={progress} busy={progressBusy} onLogWeight={logWeight} onLogMeasure={logMeasure} onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} />}
      {tab === "us" && <Us me={me} partner={partner} myLog={myLog} partnerLog={partnerLog} myPlan={myPlan} partnerPlan={partnerPlan} myStats={myStats} partnerStats={partnerStats} onNudge={sendNudge} />}
      {tab === "settings" && <SettingsView me={me} onEdit={() => setEditing(true)} onSwitch={async () => { device.del(); setMeId(null); setForceSetup(true); }} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid #EBEEF2", display: "flex", justifyContent: "center", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 480 }}>
          {TABS.map((tb) => {
            const active = tab === tb.id, col = active ? accentHex(me.accent) : "#A6ACB5";
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <tb.icon className="w-5 h-5" style={{ color: col }} strokeWidth={active ? 2.5 : 2} />
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
  const [p, setP] = useState({ ...me });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const targets = computeTargets(p);
  return (
    <SetupShell>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h1 className="f-disp" style={{ fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>Edit profile</h1>
        <button onClick={onCancel} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#9097A1" }} /></button>
      </div>
      <Field label="Name"><TextInput value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Weight (lbs)" hint="Logging a weigh-in on the Progress tab updates this automatically."><TextInput type="number" value={p.weightLb} onChange={(e) => set("weightLb", e.target.value)} /></Field>
      <Field label="Activity"><Choice value={p.activity} onChange={(v) => set("activity", v)} options={Object.entries(ACT).map(([k, v]) => ({ value: k, label: v.label }))} columns={2} /></Field>
      <Field label="Goal"><Choice value={p.goal} onChange={(v) => set("goal", v)} options={Object.entries(GOALS).map(([k, v]) => ({ value: k, label: v.label }))} columns={3} /></Field>
      <Field label="Training access"><Choice value={p.access} onChange={(v) => set("access", v)} options={Object.entries(ACCESS).map(([k, v]) => ({ value: k, label: v.label }))} columns={3} /></Field>
      <Field label="Shared evening activity"><Choice columns={2} value={p.eveningTogether ? "yes" : "no"} onChange={(v) => set("eveningTogether", v === "yes")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "8px 0 16px" }}>
        <Metric label="Calories" value={targets.calories} unit="kcal" color={accentHex(p.accent)} />
        <Metric label="Protein" value={targets.protein} unit="g" color={VIOLET} />
      </div>
      <Btn full color={accentHex(p.accent)} onClick={() => onDone({ ...p, targets })}><Check className="w-4 h-4" /> Save changes</Btn>
    </SetupShell>
  );
}
