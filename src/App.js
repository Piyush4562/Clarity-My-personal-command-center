import { useState, useEffect, useRef } from “react”;

// ============================================================
// CLARITY — Personal Command Center for Piyush
// Version 1.0 | May 2026
// ============================================================

const SECTIONS = [
{ id: “dashboard”, label: “Dashboard”, icon: “◈” },
{ id: “eagle-vision”, label: “Eagle Vision”, icon: “🏗” },
{ id: “job-search”, label: “Job Search”, icon: “🎯” },
{ id: “productivity”, label: “Productivity”, icon: “⚡” },
{ id: “fitness”, label: “Fitness”, icon: “💪” },
{ id: “finance”, label: “Finance”, icon: “₿” },
{ id: “self-growth”, label: “Self Growth”, icon: “🌱” },
{ id: “social”, label: “Socializing”, icon: “🤝” },
{ id: “brain-dump”, label: “Brain Dump”, icon: “🧠” },
{ id: “someday”, label: “Someday / Maybe”, icon: “✨” },
{ id: “goals”, label: “Goals”, icon: “🏔” },
{ id: “claude”, label: “Talk to Claude”, icon: “◎” },
];

const URGENCY = [
{ id: “do-first”, label: “Do First”, desc: “Urgent + Important”, color: “#E84040” },
{ id: “schedule”, label: “Schedule”, desc: “Important, Not Urgent”, color: “#2563EB” },
{ id: “delegate”, label: “Delegate”, desc: “Urgent, Not Important”, color: “#D97706” },
{ id: “eliminate”, label: “Eliminate”, desc: “Neither”, color: “#6B7280” },
];

const CATEGORIES = [“eagle-vision”, “job-search”, “productivity”, “fitness”, “finance”, “self-growth”, “social”];

const initialState = {
tasks: [],
goals: { daily: [], weekly: [], monthly: [], yearly: [], fiveYear: [] },
brainDump: [],
someday: [],
jobLeads: [],
jobApplications: [],
financeEntries: [],
updates: {},
streak: 3,
theme: “light”,
};

function loadFromStorage() {
try {
const saved = localStorage.getItem(“clarity_data_v1”);
return saved ? { …initialState, …JSON.parse(saved) } : initialState;
} catch { return initialState; }
}

function saveToStorage(data) {
try { localStorage.setItem(“clarity_data_v1”, JSON.stringify(data)); } catch {}
}

function loadTheme() {
try { return localStorage.getItem(“clarity_theme”) || “light”; } catch { return “light”; }
}

function formatDate() {
return new Date().toLocaleDateString(“en-US”, { weekday: “long”, month: “long”, day: “numeric” });
}

function getGreeting() {
const h = new Date().getHours();
if (h < 12) return “Good morning”;
if (h < 17) return “Good afternoon”;
return “Good evening”;
}

export default function Clarity() {
const [appState, setAppState] = useState(“splash”); // splash | briefing | app
const [splashStep, setSplashStep] = useState(0);
const [activeSection, setActiveSection] = useState(“dashboard”);
const [drawerOpen, setDrawerOpen] = useState(false);
const [data, setData] = useState(() => loadFromStorage());
const [theme, setTheme] = useState(() => loadTheme());
const [showTaskModal, setShowTaskModal] = useState(false);
const [showUpdateModal, setShowUpdateModal] = useState(null);
const [showClaudeFloat, setShowClaudeFloat] = useState(false);
const [claudeMessages, setClaudeMessages] = useState([]);
const [claudeInput, setClaudeInput] = useState(””);
const [claudeLoading, setClaudeLoading] = useState(false);
const [newTask, setNewTask] = useState({ title: “”, firstStep: “”, category: “productivity”, urgency: “schedule”, dueDate: “”, links: [], notes: “” });
const [newLink, setNewLink] = useState(””);
const [updateText, setUpdateText] = useState(””);
const [updateSentiment, setUpdateSentiment] = useState(“positive”);
const [brainText, setBrainText] = useState(””);
const [someday, setSomething] = useState(””);
const [eisView, setEisView] = useState(false);
const [todayFocus, setTodayFocus] = useState([]);
const claudoRef = useRef(null);

// Weather & destination state
const [weather, setWeather] = useState(null); // { tempC, desc, icon }
const [weatherLoading, setWeatherLoading] = useState(false);
const [showDestModal, setShowDestModal] = useState(false);
const [destination, setDestination] = useState(””);
const [destWeather, setDestWeather] = useState(null); // { tempC, desc, arrivalTime, travelMins }
const [destLoading, setDestLoading] = useState(false);
const [userCoords, setUserCoords] = useState(null);

const colors = theme === “light”
? { bg: “#FAF7F2”, card: “#FFFFFF”, text: “#1A1410”, sub: “#6B5E52”, accent: “#C8832A”, accent2: “#2D6A4F”, border: “#E8E0D5”, nav: “#1A1410”, navText: “#FAF7F2” }
: { bg: “#0F1623”, card: “#1A2332”, text: “#F0EDE8”, sub: “#8A9BB5”, accent: “#F0A830”, accent2: “#4ECDC4”, border: “#2A3547”, nav: “#0A1020”, navText: “#F0EDE8” };

useEffect(() => {
const timer = setTimeout(() => {
if (splashStep === 0) setSplashStep(1);
}, 2800);
return () => clearTimeout(timer);
}, [splashStep]);

// Auto-save data to localStorage whenever it changes
useEffect(() => { saveToStorage(data); }, [data]);

// Auto-save theme
useEffect(() => { try { localStorage.setItem(“clarity_theme”, theme); } catch {} }, [theme]);

// Fetch current weather on briefing screen
useEffect(() => {
if (appState === “briefing” && !weather && !weatherLoading) {
setWeatherLoading(true);
navigator.geolocation?.getCurrentPosition(async (pos) => {
const { latitude, longitude } = pos.coords;
setUserCoords({ latitude, longitude });
try {
const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=celsius`);
const json = await res.json();
const tempC = Math.round(json.current.temperature_2m);
const code = json.current.weathercode;
const desc = weatherDesc(code);
const icon = weatherIcon(code);
setWeather({ tempC, desc, icon });
} catch { setWeather({ tempC: “–”, desc: “Unavailable”, icon: “—” }); }
setWeatherLoading(false);
}, () => { setWeather({ tempC: “–”, desc: “Enable location for weather”, icon: “—” }); setWeatherLoading(false); });
}
}, [appState]);

// Also fetch weather when app opens to dashboard
useEffect(() => {
if (appState === “app” && !weather && !weatherLoading) {
setWeatherLoading(true);
navigator.geolocation?.getCurrentPosition(async (pos) => {
const { latitude, longitude } = pos.coords;
setUserCoords({ latitude, longitude });
try {
const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=celsius`);
const json = await res.json();
setWeather({ tempC: Math.round(json.current.temperature_2m), desc: weatherDesc(json.current.weathercode), icon: weatherIcon(json.current.weathercode) });
} catch { setWeather({ tempC: “–”, desc: “Unavailable”, icon: “—” }); }
setWeatherLoading(false);
}, () => { setWeatherLoading(false); });
}
}, [appState]);

function weatherDesc(code) {
if (code === 0) return “Clear skies”;
if (code <= 3) return “Partly cloudy”;
if (code <= 48) return “Foggy”;
if (code <= 67) return “Rainy”;
if (code <= 77) return “Snowy”;
if (code <= 82) return “Rain showers”;
return “Stormy”;
}

function weatherIcon(code) {
if (code === 0) return “○”; // clear
if (code <= 3) return “◑”; // cloudy
if (code <= 48) return “≈”; // fog
if (code <= 67) return “·”; // rain
if (code <= 77) return “*”; // snow
return “~”; // storm
}

const fetchDestinationWeather = async () => {
if (!destination.trim()) return;
setDestLoading(true);
setDestWeather(null);
try {
// Geocode destination using Open-Meteo geocoding
const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`);
const geoJson = await geoRes.json();
if (!geoJson.results?.length) { setDestWeather({ error: “Location not found. Try a city name.” }); setDestLoading(false); return; }
const { latitude, longitude, name, country } = geoJson.results[0];

```
  // Estimate travel time using straight-line distance (rough)
  let travelMins = 30; // default
  if (userCoords) {
    const R = 6371;
    const dLat = (latitude - userCoords.latitude) * Math.PI / 180;
    const dLon = (longitude - userCoords.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.latitude * Math.PI/180) * Math.cos(latitude * Math.PI/180) * Math.sin(dLon/2)**2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    travelMins = distKm < 5 ? 15 : distKm < 20 ? 30 : distKm < 60 ? 60 : distKm < 200 ? 120 : 180;
  }

  // Calculate arrival time
  const arrivalDate = new Date(Date.now() + travelMins * 60000);
  const arrivalHour = arrivalDate.getHours();
  const arrivalTime = arrivalDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Fetch hourly forecast and pick the arrival hour
  const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&temperature_unit=celsius&forecast_days=1`);
  const forecastJson = await forecastRes.json();
  const hourIndex = Math.min(arrivalHour, 23);
  const tempC = Math.round(forecastJson.hourly.temperature_2m[hourIndex]);
  const code = forecastJson.hourly.weathercode[hourIndex];

  setDestWeather({ tempC, desc: weatherDesc(code), icon: weatherIcon(code), arrivalTime, travelMins, name, country });
} catch { setDestWeather({ error: "Couldn't fetch weather. Check your connection." }); }
setDestLoading(false);
```

};

const addTask = () => {
if (!newTask.title.trim()) return;
const task = { …newTask, id: Date.now(), created: new Date().toISOString(), completed: false };
setData(d => ({ …d, tasks: [task, …d.tasks] }));
setNewTask({ title: “”, firstStep: “”, category: “productivity”, urgency: “schedule”, dueDate: “”, links: [], notes: “” });
setShowTaskModal(false);
};

const toggleTask = (id) => {
setData(d => ({ …d, tasks: d.tasks.map(t => t.id === id ? { …t, completed: !t.completed } : t) }));
};

const addUpdate = () => {
if (!updateText.trim() || !showUpdateModal) return;
const update = { text: updateText, sentiment: updateSentiment, date: new Date().toISOString() };
setData(d => ({
…d,
updates: { …d.updates, [showUpdateModal]: […(d.updates[showUpdateModal] || []), update] }
}));
setUpdateText(””);
setShowUpdateModal(null);
};

const addToFocus = (taskId) => {
if (todayFocus.includes(taskId)) setTodayFocus(f => f.filter(id => id !== taskId));
else if (todayFocus.length < 5) setTodayFocus(f => […f, taskId]);
};

const sendToClaud = async () => {
if (!claudeInput.trim() || claudeLoading) return;
const userMsg = claudeInput.trim();
setClaudeInput(””);
const newMsgs = […claudeMessages, { role: “user”, content: userMsg }];
setClaudeMessages(newMsgs);
setClaudeLoading(true);
try {
const taskSummary = data.tasks.slice(0, 10).map(t => `• ${t.title} [${t.urgency}] ${t.completed ? "(done)" : ""}`).join(”\n”);
const systemPrompt = `You are Claude, Piyush’s personal co-pilot inside his app called Clarity. You have full context of his life and goals:

ABOUT PIYUSH:

- Junior Project Manager at Eagle Vision General Contracting Corp in Queens, NY
- Actively job searching for APM roles at commercial GCs, especially RC Andersen (STO Building Group)
- Background in NYC mixed-use residential ground-up construction
- Masters in Construction Engineering & Management from Stevens Institute of Technology
- Certifications: CMIT, OSHA 62, Site Safety Training, FDNY F-60
- Tools: Procore, AutoCAD, Primavera, Bluebeam, Revit, BIM Navisworks
- Interests: Tennis, badminton (Yonex Astrox 99), stock investing, fitness
- Working on: vocabulary, vocal communication skills for interviews

CURRENT TASKS (up to 10):
${taskSummary || “No tasks yet”}

TODAY’S FOCUS: ${todayFocus.length} tasks selected

YOUR ROLE: Be his thinking partner. Help him plan, remind him what’s on deck, research things together, suggest tasks as tappable options when useful, and think out loud with him. Be direct, warm, and genuinely useful. Keep responses concise for mobile reading. When suggesting tasks, format them clearly so he can act on them.`;

```
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: newMsgs,
    }),
  });
  const result = await response.json();
  const reply = result.content?.find(b => b.type === "text")?.text || "I'm here. What's on your mind?";
  setClaudeMessages([...newMsgs, { role: "assistant", content: reply }]);
} catch {
  setClaudeMessages([...newMsgs, { role: "assistant", content: "Something went wrong. Try again in a moment." }]);
}
setClaudeLoading(false);
setTimeout(() => claudoRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
```

};

const pendingTasks = data.tasks.filter(t => !t.completed);
const doneTasks = data.tasks.filter(t => t.completed);
const focusTasks = data.tasks.filter(t => todayFocus.includes(t.id));

// =================== SPLASH SCREEN ===================
if (appState === “splash”) {
return (
<div style={{ width: “100%”, height: “100vh”, background: theme === “light” ? “linear-gradient(135deg, #FAF7F2 0%, #F5EDD8 50%, #EDE0C8 100%)” : “linear-gradient(135deg, #0F1623 0%, #1A2332 50%, #0A1020 100%)”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, position: “relative”, overflow: “hidden”, fontFamily: “‘Georgia’, serif”, cursor: “pointer” }}
onClick={() => { if (splashStep >= 1) setAppState(“briefing”); }}
>
{/* Background geometric */}
<div style={{ position: “absolute”, width: 400, height: 400, borderRadius: “50%”, background: theme === “light” ? “rgba(200,131,42,0.08)” : “rgba(240,168,48,0.06)”, top: -100, right: -100 }} />
<div style={{ position: “absolute”, width: 250, height: 250, borderRadius: “50%”, background: theme === “light” ? “rgba(45,106,79,0.06)” : “rgba(78,205,196,0.05)”, bottom: 50, left: -50 }} />

```
    <div style={{ textAlign: "center", animation: "fadeUp 1s ease forwards", opacity: 0, animationDelay: "0.2s" }}>
      <div style={{ fontSize: 11, letterSpacing: 6, color: colors.accent, textTransform: "uppercase", marginBottom: 24, fontFamily: "Georgia, serif" }}>
        {formatDate()}
      </div>
      <div style={{ fontSize: 72, fontWeight: 300, color: theme === "light" ? "#1A1410" : "#F0EDE8", letterSpacing: -2, lineHeight: 1, marginBottom: 8, fontFamily: "Georgia, serif" }}>
        Clarity
      </div>
      <div style={{ width: 40, height: 1, background: colors.accent, margin: "20px auto" }} />
      <div style={{ fontSize: 14, color: colors.sub, letterSpacing: 2, fontFamily: "Georgia, serif" }}>
        {getGreeting()}, Piyush
      </div>
    </div>

    {splashStep >= 1 && (
      <div style={{ position: "absolute", bottom: 48, fontSize: 12, color: colors.sub, letterSpacing: 3, animation: "fadeUp 0.6s ease forwards", fontFamily: "Georgia, serif" }}>
        TAP TO BEGIN
      </div>
    )}

    <style>{`
      @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
  </div>
);
```

}

// =================== MORNING BRIEFING ===================
if (appState === “briefing”) {
return (
<div style={{ width: “100%”, minHeight: “100vh”, background: theme === “light” ? “linear-gradient(160deg, #FAF7F2, #F0E8D8)” : “linear-gradient(160deg, #0F1623, #1A2332)”, display: “flex”, flexDirection: “column”, padding: 24, fontFamily: “Georgia, serif”, boxSizing: “border-box” }}>
<div style={{ fontSize: 11, letterSpacing: 5, color: colors.accent, textTransform: “uppercase”, marginBottom: 32 }}>{formatDate()}</div>

```
    <div style={{ fontSize: 28, fontWeight: 300, color: colors.text, marginBottom: 8, lineHeight: 1.3 }}>
      {getGreeting()},<br />Piyush.
    </div>
    <div style={{ width: 32, height: 2, background: colors.accent, marginBottom: 32 }} />

    {/* Weather - live, tappable */}
    <div onClick={() => setShowDestModal(true)} style={{ background: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${colors.border}`, cursor: "pointer", position: "relative" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: colors.sub, marginBottom: 12, textTransform: "uppercase" }}>Current Weather</div>
      {weatherLoading ? (
        <div style={{ fontSize: 14, color: colors.sub }}>Detecting your location...</div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 36, fontFamily: "monospace", color: colors.accent }}>{weather?.icon || "—"}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{weather?.tempC ?? "--"}°C</div>
              <div style={{ fontSize: 13, color: colors.sub }}>{weather?.desc || "Enable location"}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: colors.accent, border: `1px solid ${colors.accent}40`, borderRadius: 8, padding: "6px 10px" }}>
            Where to? →
          </div>
        </div>
      )}
    </div>

    {/* Key data points */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
      <div style={{ background: colors.card, borderRadius: 16, padding: 16, border: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: colors.sub, marginBottom: 8, textTransform: "uppercase" }}>Tasks Today</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>{pendingTasks.length}</div>
        <div style={{ fontSize: 12, color: colors.sub }}>pending</div>
      </div>
      <div style={{ background: colors.card, borderRadius: 16, padding: 16, border: `1px solid ${colors.border}` }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: colors.sub, marginBottom: 8, textTransform: "uppercase" }}>Streak</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>{data.streak}</div>
        <div style={{ fontSize: 12, color: colors.sub }}>days strong</div>
      </div>
    </div>

    {/* Start options */}
    <div style={{ background: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 13, color: colors.sub, marginBottom: 16 }}>How do you want to start your day?</div>
      <button onClick={() => { setShowClaudeFloat(true); setAppState("app"); }} style={{ width: "100%", padding: "14px 20px", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 10, cursor: "pointer", letterSpacing: 0.5 }}>
        ◎ Talk to Claude first
      </button>
      <button onClick={() => setAppState("app")} style={{ width: "100%", padding: "14px 20px", background: "transparent", color: colors.text, border: `1.5px solid ${colors.border}`, borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
        Enter Clarity manually
      </button>
    </div>

    {/* Destination modal on briefing screen */}
    {showDestModal && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && setShowDestModal(false)}>
        <div style={{ width: "100%", background: colors.card, borderRadius: "24px 24px 0 0", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Where are you headed?</div>
          <div style={{ fontSize: 13, color: colors.sub, marginBottom: 20 }}>I'll show you the weather when you arrive.</div>
          {weather && (
            <div style={{ background: colors.bg, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24, fontFamily: "monospace", color: colors.accent }}>{weather.icon}</div>
              <div>
                <div style={{ fontSize: 13, color: colors.sub }}>Your current location</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{weather.tempC}°C · {weather.desc}</div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={destination} onChange={e => setDestination(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchDestinationWeather()} placeholder="Enter city or destination..." style={{ flex: 1, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, outline: "none", fontFamily: "Georgia, serif" }} autoFocus />
            <button onClick={fetchDestinationWeather} style={{ padding: "13px 18px", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, cursor: "pointer", fontWeight: 700 }}>→</button>
          </div>
          {destLoading && <div style={{ textAlign: "center", padding: 16, color: colors.sub, fontSize: 14 }}>Calculating travel time and weather...</div>}
          {destWeather && !destLoading && (
            destWeather.error ? <div style={{ color: "#E84040", fontSize: 14, padding: 8 }}>{destWeather.error}</div> : (
              <div style={{ background: `linear-gradient(135deg, ${colors.accent}12, ${colors.accent2}12)`, borderRadius: 16, padding: 20, border: `1px solid ${colors.accent}25` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{destWeather.name}, {destWeather.country}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{destWeather.tempC}°C <span style={{ fontSize: 14, color: colors.sub }}>{destWeather.desc}</span></div>
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <div style={{ flex: 1, background: colors.card, borderRadius: 10, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: colors.sub }}>TRAVEL TIME</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>~{destWeather.travelMins} min</div>
                  </div>
                  <div style={{ flex: 1, background: colors.card, borderRadius: 10, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: colors.sub }}>ARRIVING AT</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{destWeather.arrivalTime}</div>
                  </div>
                </div>
              </div>
            )
          )}
          <button onClick={() => { setShowDestModal(false); setDestWeather(null); setDestination(""); }} style={{ width: "100%", padding: "13px 0", background: "transparent", color: colors.sub, border: `1px solid ${colors.border}`, borderRadius: 12, fontSize: 14, cursor: "pointer", marginTop: 16 }}>Close</button>
        </div>
      </div>
    )}
  </div>
);
```

}

// =================== MAIN APP ===================
const urgencyObj = (id) => URGENCY.find(u => u.id === id) || URGENCY[1];

const renderDashboard = () => (
<div>
{/* Hero stat row */}
<div style={{ display: “grid”, gridTemplateColumns: “1fr 1fr 1fr”, gap: 10, marginBottom: 20 }}>
{[
{ label: “Pending”, val: pendingTasks.length, color: colors.accent },
{ label: “Done”, val: doneTasks.length, color: colors.accent2 },
{ label: “Streak”, val: data.streak, color: “#E84040” },
].map(s => (
<div key={s.label} style={{ background: colors.card, borderRadius: 14, padding: “14px 10px”, textAlign: “center”, border: `1px solid ${colors.border}` }}>
<div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
<div style={{ fontSize: 10, color: colors.sub, letterSpacing: 1, textTransform: “uppercase”, marginTop: 2 }}>{s.label}</div>
</div>
))}
</div>

```
  {/* Live weather card - tappable */}
  <div onClick={() => setShowDestModal(true)} style={{ background: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${colors.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 28, fontFamily: "monospace", color: colors.accent }}>{weather?.icon || "—"}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{weather?.tempC ?? "--"}°C</div>
        <div style={{ fontSize: 12, color: colors.sub }}>{weather?.desc || "Tap to load weather"}</div>
      </div>
    </div>
    <div style={{ fontSize: 11, color: colors.accent, border: `1px solid ${colors.accent}40`, borderRadius: 8, padding: "5px 10px" }}>Where to? →</div>
  </div>

  {/* Today's Focus */}
  <div style={{ background: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${colors.border}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, letterSpacing: 0.5 }}>Today's Focus</div>
      <div style={{ fontSize: 11, color: colors.sub }}>{focusTasks.length}/5 selected</div>
    </div>
    {focusTasks.length === 0 ? (
      <div style={{ fontSize: 13, color: colors.sub, fontStyle: "italic" }}>No focus tasks yet. Head to a section and tap ⊕ to pin a task here.</div>
    ) : (
      focusTasks.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <button onClick={() => toggleTask(t.id)} style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${urgencyObj(t.urgency).color}`, background: t.completed ? urgencyObj(t.urgency).color : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: t.completed ? colors.sub : colors.text, textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</div>
            {t.firstStep && <div style={{ fontSize: 11, color: colors.accent, marginTop: 2 }}>↳ {t.firstStep}</div>}
          </div>
          <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: urgencyObj(t.urgency).color + "20", color: urgencyObj(t.urgency).color }}>{urgencyObj(t.urgency).label}</div>
        </div>
      ))
    )}
  </div>

  {/* Eisenhower toggle */}
  <div style={{ background: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${colors.border}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: eisView ? 16 : 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Eisenhower Matrix</div>
      <button onClick={() => setEisView(!eisView)} style={{ fontSize: 12, color: colors.accent, background: "none", border: "none", cursor: "pointer" }}>{eisView ? "Hide" : "View"}</button>
    </div>
    {eisView && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {URGENCY.map(u => {
          const uTasks = pendingTasks.filter(t => t.urgency === u.id);
          return (
            <div key={u.id} style={{ background: u.color + "12", border: `1px solid ${u.color}30`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: u.color, marginBottom: 4 }}>{u.label}</div>
              <div style={{ fontSize: 10, color: colors.sub, marginBottom: 8 }}>{u.desc}</div>
              {uTasks.length === 0 ? <div style={{ fontSize: 11, color: colors.sub, fontStyle: "italic" }}>None</div> : uTasks.slice(0, 3).map(t => <div key={t.id} style={{ fontSize: 12, color: colors.text, marginBottom: 4 }}>• {t.title}</div>)}
              {uTasks.length > 3 && <div style={{ fontSize: 11, color: colors.sub }}>+{uTasks.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* Daily motivation */}
  <div style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent2}15)`, borderRadius: 16, padding: 18, border: `1px solid ${colors.accent}25` }}>
    <div style={{ fontSize: 11, letterSpacing: 2, color: colors.accent, textTransform: "uppercase", marginBottom: 8 }}>Today's Nudge</div>
    <div style={{ fontSize: 14, color: colors.text, fontStyle: "italic", lineHeight: 1.6 }}>"The best time to plant a tree was 20 years ago. The second best time is now."</div>
  </div>
</div>
```

);

const renderTaskList = (sectionId) => {
const sectionTasks = data.tasks.filter(t => t.category === sectionId);
return (
<div>
<button onClick={() => setShowTaskModal(sectionId)} style={{ width: “100%”, padding: “13px 20px”, background: colors.accent, color: “#fff”, border: “none”, borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 18, cursor: “pointer” }}>
+ Add Task
</button>
{sectionTasks.length === 0 ? (
<div style={{ textAlign: “center”, padding: 40, color: colors.sub, fontSize: 14, fontStyle: “italic” }}>No tasks here yet.<br />Add your first one above.</div>
) : (
sectionTasks.map(t => (
<div key={t.id} style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${colors.border}`, animation: “slideUp 0.3s ease” }}>
<div style={{ display: “flex”, alignItems: “flex-start”, gap: 12 }}>
<button onClick={() => toggleTask(t.id)} style={{ width: 22, height: 22, borderRadius: “50%”, border: `2px solid ${urgencyObj(t.urgency).color}`, background: t.completed ? urgencyObj(t.urgency).color : “transparent”, cursor: “pointer”, flexShrink: 0, marginTop: 2, transition: “all 0.2s” }} />
<div style={{ flex: 1 }}>
<div style={{ fontSize: 15, fontWeight: 600, color: t.completed ? colors.sub : colors.text, textDecoration: t.completed ? “line-through” : “none”, marginBottom: 4 }}>{t.title}</div>
{t.firstStep && (
<div style={{ fontSize: 12, color: colors.accent, marginBottom: 6, display: “flex”, alignItems: “center”, gap: 4 }}>
<span style={{ opacity: 0.7 }}>↳ First step:</span> {t.firstStep}
</div>
)}
{t.dueDate && <div style={{ fontSize: 11, color: colors.sub, marginBottom: 6 }}>📅 {t.dueDate}</div>}
<div style={{ display: “flex”, gap: 6, flexWrap: “wrap”, alignItems: “center” }}>
<span style={{ fontSize: 10, padding: “2px 8px”, borderRadius: 20, background: urgencyObj(t.urgency).color + “20”, color: urgencyObj(t.urgency).color, fontWeight: 600 }}>{urgencyObj(t.urgency).label}</span>
{t.links?.map((l, i) => (
<a key={i} href={l} target=”_blank” rel=“noreferrer” style={{ fontSize: 10, color: colors.accent2, textDecoration: “none”, padding: “2px 8px”, borderRadius: 20, background: colors.accent2 + “15” }}>🔗 Link {i + 1}</a>
))}
</div>
{/* Updates */}
{(data.updates[t.id] || []).length > 0 && (
<div style={{ marginTop: 8, borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
{(data.updates[t.id] || []).slice(-2).map((u, i) => (
<div key={i} style={{ fontSize: 11, color: u.sentiment === “positive” ? colors.accent2 : “#E84040”, marginBottom: 2 }}>
{u.sentiment === “positive” ? “↑” : “↓”} {u.text}
</div>
))}
</div>
)}
</div>
</div>
<div style={{ display: “flex”, gap: 8, marginTop: 10, justifyContent: “flex-end” }}>
<button onClick={() => addToFocus(t.id)} style={{ fontSize: 11, color: todayFocus.includes(t.id) ? colors.accent : colors.sub, background: todayFocus.includes(t.id) ? colors.accent + “15” : “transparent”, border: `1px solid ${todayFocus.includes(t.id) ? colors.accent : colors.border}`, borderRadius: 8, padding: “4px 10px”, cursor: “pointer” }}>
{todayFocus.includes(t.id) ? “★ Focus” : “☆ Focus”}
</button>
<button onClick={() => setShowUpdateModal(t.id)} style={{ fontSize: 11, color: colors.sub, background: “transparent”, border: `1px solid ${colors.border}`, borderRadius: 8, padding: “4px 10px”, cursor: “pointer” }}>
+ Update
</button>
</div>
</div>
))
)}
</div>
);
};

const renderJobSearch = () => (
<div>
{/* Sub tabs */}
<div style={{ display: “flex”, gap: 8, marginBottom: 20 }}>
{[“Tasks”, “Applications”, “Leads”].map(tab => (
<button key={tab} onClick={() => setData(d => ({ …d, _jobTab: tab }))} style={{ flex: 1, padding: “10px 0”, fontSize: 12, fontWeight: 600, borderRadius: 10, border: “none”, background: (data._jobTab || “Tasks”) === tab ? colors.accent : colors.card, color: (data._jobTab || “Tasks”) === tab ? “#fff” : colors.sub, cursor: “pointer” }}>
{tab}
</button>
))}
</div>

```
  {(data._jobTab || "Tasks") === "Tasks" && renderTaskList("job-search")}

  {(data._jobTab || "Tasks") === "Applications" && (
    <div>
      <button onClick={() => {
        const company = prompt("Company name?");
        const role = prompt("Role?");
        if (company) setData(d => ({ ...d, jobApplications: [...d.jobApplications, { id: Date.now(), company, role, status: "Applied", date: new Date().toLocaleDateString(), notes: "" }] }));
      }} style={{ width: "100%", padding: "13px 20px", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 18, cursor: "pointer" }}>
        + Log Application
      </button>
      {data.jobApplications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.sub, fontSize: 14, fontStyle: "italic" }}>No applications logged yet.</div>
      ) : (
        data.jobApplications.map(app => (
          <div key={app.id} style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{app.company}</div>
            <div style={{ fontSize: 13, color: colors.sub, marginBottom: 8 }}>{app.role}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Applied", "Follow-Up", "Interview", "Offer", "Rejected"].map(s => (
                <button key={s} onClick={() => setData(d => ({ ...d, jobApplications: d.jobApplications.map(a => a.id === app.id ? { ...a, status: s } : a) }))} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, border: "none", background: app.status === s ? colors.accent : colors.border, color: app.status === s ? "#fff" : colors.sub, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )}

  {(data._jobTab || "Tasks") === "Leads" && (
    <div>
      <button onClick={() => {
        const company = prompt("Company / Lead name?");
        const idea = prompt("Opportunity idea?");
        if (company) setData(d => ({ ...d, jobLeads: [...d.jobLeads, { id: Date.now(), company, idea, date: new Date().toLocaleDateString() }] }));
      }} style={{ width: "100%", padding: "13px 20px", background: colors.accent2, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, marginBottom: 18, cursor: "pointer" }}>
        + Add Lead Idea
      </button>
      {data.jobLeads.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.sub, fontSize: 14, fontStyle: "italic" }}>No leads yet. This is your opportunity pipeline.</div>
      ) : (
        data.jobLeads.map(lead => (
          <div key={lead.id} style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{lead.company}</div>
            <div style={{ fontSize: 13, color: colors.sub, marginTop: 4 }}>{lead.idea}</div>
            <div style={{ fontSize: 11, color: colors.sub, marginTop: 6 }}>Added {lead.date}</div>
          </div>
        ))
      )}
    </div>
  )}
</div>
```

);

const renderBrainDump = () => (
<div>
<div style={{ background: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${colors.border}` }}>
<div style={{ fontSize: 13, color: colors.sub, marginBottom: 10 }}>What’s on your mind right now?</div>
<textarea value={brainText} onChange={e => setBrainText(e.target.value)} placeholder=“Just throw it all out here. No judgment. No structure. Just get it out of your head…” style={{ width: “100%”, minHeight: 120, background: “transparent”, border: “none”, outline: “none”, resize: “none”, fontSize: 15, color: colors.text, lineHeight: 1.6, fontFamily: “Georgia, serif”, boxSizing: “border-box” }} />
<button onClick={() => { if (brainText.trim()) { setData(d => ({ …d, brainDump: [{ id: Date.now(), text: brainText, date: new Date().toLocaleDateString() }, …d.brainDump] })); setBrainText(””); } }} style={{ width: “100%”, padding: “12px 0”, background: colors.accent, color: “#fff”, border: “none”, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: “pointer”, marginTop: 10 }}>
Capture It
</button>
</div>
{data.brainDump.map(item => (
<div key={item.id} style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${colors.border}` }}>
<div style={{ fontSize: 14, color: colors.text, lineHeight: 1.6, marginBottom: 8 }}>{item.text}</div>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<div style={{ fontSize: 11, color: colors.sub }}>{item.date}</div>
<button onClick={() => { setNewTask(n => ({ …n, title: item.text })); setShowTaskModal(“productivity”); setData(d => ({ …d, brainDump: d.brainDump.filter(b => b.id !== item.id) })); }} style={{ fontSize: 11, color: colors.accent, background: “none”, border: `1px solid ${colors.accent}`, borderRadius: 8, padding: “4px 10px”, cursor: “pointer” }}>
→ Make Task
</button>
</div>
</div>
))}
</div>
);

const renderGoals = () => {
const periods = [“daily”, “weekly”, “monthly”, “yearly”, “fiveYear”];
const labels = { daily: “Daily”, weekly: “Weekly”, monthly: “Monthly”, yearly: “Yearly”, fiveYear: “5 Year Vision” };
return (
<div>
{periods.map(p => (
<div key={p} style={{ background: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, border: `1px solid ${colors.border}` }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 12 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{labels[p]}</div>
<button onClick={() => {
const goal = prompt(`Add a ${labels[p]} goal:`);
if (goal) setData(d => ({ …d, goals: { …d.goals, [p]: […d.goals[p], { id: Date.now(), text: goal, done: false }] } }));
}} style={{ fontSize: 12, color: colors.accent, background: “none”, border: `1px solid ${colors.accent}`, borderRadius: 8, padding: “4px 10px”, cursor: “pointer” }}>
+ Add
</button>
</div>
{data.goals[p].length === 0 ? (
<div style={{ fontSize: 13, color: colors.sub, fontStyle: “italic” }}>No {labels[p].toLowerCase()} goals yet.</div>
) : (
data.goals[p].map(g => (
<div key={g.id} style={{ display: “flex”, alignItems: “center”, gap: 10, marginBottom: 8 }}>
<button onClick={() => setData(d => ({ …d, goals: { …d.goals, [p]: d.goals[p].map(x => x.id === g.id ? { …x, done: !x.done } : x) } }))} style={{ width: 18, height: 18, borderRadius: “50%”, border: `2px solid ${colors.accent}`, background: g.done ? colors.accent : “transparent”, cursor: “pointer”, flexShrink: 0 }} />
<div style={{ fontSize: 14, color: g.done ? colors.sub : colors.text, textDecoration: g.done ? “line-through” : “none”, flex: 1 }}>{g.text}</div>
<button onClick={() => setShowUpdateModal(`goal-${p}-${g.id}`)} style={{ fontSize: 11, color: colors.sub, background: “none”, border: `1px solid ${colors.border}`, borderRadius: 6, padding: “2px 6px”, cursor: “pointer” }}>+ Update</button>
</div>
))
)}
</div>
))}
</div>
);
};

const renderFinance = () => (
<div>
<div style={{ background: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${colors.border}` }}>
<div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Monthly Statement Upload</div>
<div style={{ fontSize: 13, color: colors.sub, lineHeight: 1.6, marginBottom: 12 }}>At the start of each month, upload your bank, investment, and credit card statements. Claude will analyze them and give you a full picture.</div>
<button style={{ width: “100%”, padding: “12px 0”, background: colors.accent2, color: “#fff”, border: “none”, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: “pointer” }}>
📄 Upload Statement (Coming v2)
</button>
</div>
{renderTaskList(“finance”)}
</div>
);

const renderClaudeSection = () => (
<div style={{ display: “flex”, flexDirection: “column”, height: “calc(100vh - 160px)” }}>
<div ref={claudoRef} style={{ flex: 1, overflowY: “auto”, marginBottom: 12 }}>
{claudeMessages.length === 0 && (
<div style={{ textAlign: “center”, padding: 32, color: colors.sub }}>
<div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
<div style={{ fontSize: 14, lineHeight: 1.6 }}>Claude is here — your thinking partner.<br />Ask anything. Plan your day. Think out loud.</div>
</div>
)}
{claudeMessages.map((m, i) => (
<div key={i} style={{ marginBottom: 12, display: “flex”, justifyContent: m.role === “user” ? “flex-end” : “flex-start” }}>
<div style={{ maxWidth: “85%”, padding: “12px 16px”, borderRadius: m.role === “user” ? “16px 16px 4px 16px” : “16px 16px 16px 4px”, background: m.role === “user” ? colors.accent : colors.card, color: m.role === “user” ? “#fff” : colors.text, fontSize: 14, lineHeight: 1.6, border: m.role === “assistant” ? `1px solid ${colors.border}` : “none” }}>
{m.content}
</div>
</div>
))}
{claudeLoading && (
<div style={{ display: “flex”, gap: 4, padding: 12 }}>
{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: “50%”, background: colors.accent, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
</div>
)}
</div>
<div style={{ display: “flex”, gap: 10 }}>
<input value={claudeInput} onChange={e => setClaudeInput(e.target.value)} onKeyDown={e => e.key === “Enter” && sendToClaud()} placeholder=“Talk to Claude…” style={{ flex: 1, padding: “12px 16px”, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 14, outline: “none”, fontFamily: “Georgia, serif” }} />
<button onClick={sendToClaud} disabled={claudeLoading} style={{ padding: “12px 18px”, background: colors.accent, color: “#fff”, border: “none”, borderRadius: 12, fontSize: 16, cursor: “pointer” }}>→</button>
</div>
</div>
);

const getSectionContent = () => {
switch (activeSection) {
case “dashboard”: return renderDashboard();
case “eagle-vision”: return renderTaskList(“eagle-vision”);
case “job-search”: return renderJobSearch();
case “productivity”: return renderTaskList(“productivity”);
case “fitness”: return renderTaskList(“fitness”);
case “finance”: return renderFinance();
case “self-growth”: return renderTaskList(“self-growth”);
case “social”: return renderTaskList(“social”);
case “brain-dump”: return renderBrainDump();
case “someday”: return (
<div>
<div style={{ display: “flex”, gap: 10, marginBottom: 18 }}>
<input value={someday} onChange={e => setSomething(e.target.value)} placeholder=“Something you want to do someday…” style={{ flex: 1, padding: “12px 16px”, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.text, fontSize: 14, outline: “none” }} />
<button onClick={() => { if (someday.trim()) { setData(d => ({ …d, someday: [{ id: Date.now(), text: someday, date: new Date().toLocaleDateString() }, …d.someday] })); setSomething(””); } }} style={{ padding: “12px 16px”, background: colors.accent, color: “#fff”, border: “none”, borderRadius: 12, fontSize: 14, cursor: “pointer” }}>Add</button>
</div>
{data.someday.map(s => (
<div key={s.id} style={{ background: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${colors.border}` }}>
<div style={{ fontSize: 14, color: colors.text }}>{s.text}</div>
<div style={{ fontSize: 11, color: colors.sub, marginTop: 6 }}>{s.date}</div>
</div>
))}
</div>
);
case “goals”: return renderGoals();
case “claude”: return renderClaudeSection();
default: return renderTaskList(activeSection);
}
};

const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label || “”;

return (
<div style={{ width: “100%”, minHeight: “100vh”, background: colors.bg, fontFamily: “Georgia, serif”, position: “relative”, transition: “background 0.3s” }}>
{/* Drawer overlay */}
{drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: “fixed”, inset: 0, background: “rgba(0,0,0,0.4)”, zIndex: 40, backdropFilter: “blur(4px)” }} />}

```
  {/* Side Drawer */}
  <div style={{ position: "fixed", top: 0, left: drawerOpen ? 0 : "-280px", width: 270, height: "100vh", background: colors.nav, zIndex: 50, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", overflowY: "auto", padding: "0 0 40px" }}>
    <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
      <div style={{ fontSize: 22, fontWeight: 300, color: colors.navText, letterSpacing: -0.5 }}>Clarity</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4 }}>PIYUSH · {formatDate()}</div>
    </div>
    {SECTIONS.map(s => (
      <button key={s.id} onClick={() => { setActiveSection(s.id); setDrawerOpen(false); }} style={{ width: "100%", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: activeSection === s.id ? "rgba(200,131,42,0.15)" : "transparent", border: "none", borderLeft: activeSection === s.id ? `3px solid ${colors.accent}` : "3px solid transparent", color: activeSection === s.id ? colors.accent : "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
        <span style={{ fontSize: 16 }}>{s.icon}</span>
        {s.label}
      </button>
    ))}
    <div style={{ padding: "20px 20px 0", borderTop: `1px solid rgba(255,255,255,0.08)`, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Dark Mode</span>
        <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} style={{ width: 44, height: 24, borderRadius: 12, background: theme === "dark" ? colors.accent : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: theme === "dark" ? 23 : 3, transition: "left 0.3s" }} />
        </button>
      </div>
    </div>
  </div>

  {/* Top bar */}
  <div style={{ position: "sticky", top: 0, background: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 30 }}>
    <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.text }}>
      <div style={{ width: 20, height: 2, background: colors.text, marginBottom: 4, borderRadius: 1 }} />
      <div style={{ width: 14, height: 2, background: colors.text, marginBottom: 4, borderRadius: 1 }} />
      <div style={{ width: 20, height: 2, background: colors.text, borderRadius: 1 }} />
    </button>
    <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, letterSpacing: 0.5 }}>{activeLabel}</div>
    <div style={{ fontSize: 13, color: colors.accent }}>🔥 {data.streak}</div>
  </div>

  {/* Main content */}
  <div style={{ padding: "20px 20px 120px" }}>
    {getSectionContent()}
  </div>

  {/* Floating Claude button */}
  {!showClaudeFloat && activeSection !== "claude" && (
    <button onClick={() => setShowClaudeFloat(true)} style={{ position: "fixed", bottom: 30, right: 20, width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`, border: "none", color: "#fff", fontSize: 20, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 35, display: "flex", alignItems: "center", justifyContent: "center" }}>
      ◎
    </button>
  )}

  {/* Floating Claude panel */}
  {showClaudeFloat && (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "65vh", background: colors.card, borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", zIndex: 45, display: "flex", flexDirection: "column", padding: 20, border: `1px solid ${colors.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>◎ Claude</div>
          <div style={{ fontSize: 11, color: colors.sub }}>Your thinking partner</div>
        </div>
        <button onClick={() => setShowClaudeFloat(false)} style={{ background: "none", border: "none", fontSize: 20, color: colors.sub, cursor: "pointer" }}>×</button>
      </div>
      <div ref={claudoRef} style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
        {claudeMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: colors.sub, fontSize: 13 }}>What's on your mind?</div>
        )}
        {claudeMessages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? colors.accent : colors.bg, color: m.role === "user" ? "#fff" : colors.text, fontSize: 13, lineHeight: 1.6, border: m.role === "assistant" ? `1px solid ${colors.border}` : "none" }}>
              {m.content}
            </div>
          </div>
        ))}
        {claudeLoading && <div style={{ fontSize: 13, color: colors.sub, padding: 8 }}>Claude is thinking...</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={claudeInput} onChange={e => setClaudeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendToClaud()} placeholder="Ask Claude anything..." style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, outline: "none", fontFamily: "Georgia, serif" }} />
        <button onClick={sendToClaud} style={{ padding: "11px 16px", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, cursor: "pointer" }}>→</button>
      </div>
    </div>
  )}

  {/* Add Task Modal */}
  {showTaskModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
      <div style={{ width: "100%", background: colors.card, borderRadius: "24px 24px 0 0", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 20 }}>New Task</div>

        <input value={newTask.title} onChange={e => setNewTask(n => ({ ...n, title: e.target.value }))} placeholder="What needs to get done?" style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "Georgia, serif" }} />

        <input value={newTask.firstStep} onChange={e => setNewTask(n => ({ ...n, firstStep: e.target.value }))} placeholder="↳ First step to begin (capture it now!)" style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.accent}30`, background: colors.accent + "08", color: colors.text, fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "Georgia, serif" }} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: colors.sub, textTransform: "uppercase", marginBottom: 8 }}>Category</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setNewTask(n => ({ ...n, category: c }))} style={{ padding: "6px 12px", borderRadius: 20, border: "none", fontSize: 11, background: newTask.category === c ? colors.accent : colors.border, color: newTask.category === c ? "#fff" : colors.sub, cursor: "pointer" }}>
                {SECTIONS.find(s => s.id === c)?.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: colors.sub, textTransform: "uppercase", marginBottom: 8 }}>Urgency</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {URGENCY.map(u => (
              <button key={u.id} onClick={() => setNewTask(n => ({ ...n, urgency: u.id }))} style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${newTask.urgency === u.id ? u.color : colors.border}`, background: newTask.urgency === u.id ? u.color + "15" : "transparent", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: u.color }}>{u.label}</div>
                <div style={{ fontSize: 10, color: colors.sub }}>{u.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <input type="date" value={newTask.dueDate} onChange={e => setNewTask(n => ({ ...n, dueDate: e.target.value }))} style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="Paste a link (LinkedIn, YouTube, PDF...)" style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 13, outline: "none" }} />
          <button onClick={() => { if (newLink.trim()) { setNewTask(n => ({ ...n, links: [...n.links, newLink] })); setNewLink(""); } }} style={{ padding: "11px 14px", background: colors.accent2, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" }}>+</button>
        </div>
        {newTask.links.map((l, i) => <div key={i} style={{ fontSize: 12, color: colors.accent2, marginBottom: 4 }}>🔗 {l}</div>)}

        <button onClick={addTask} style={{ width: "100%", padding: "15px 0", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 12 }}>
          Save Task
        </button>
      </div>
    </div>
  )}

  {/* Update Modal */}
  {showUpdateModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && setShowUpdateModal(null)}>
      <div style={{ width: "100%", background: colors.card, borderRadius: "24px 24px 0 0", padding: 24 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 16 }}>Add Update</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {["positive", "negative", "neutral"].map(s => (
            <button key={s} onClick={() => setUpdateSentiment(s)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: updateSentiment === s ? (s === "positive" ? colors.accent2 : s === "negative" ? "#E84040" : colors.accent) : colors.border, color: updateSentiment === s ? "#fff" : colors.sub, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
              {s === "positive" ? "↑ Win" : s === "negative" ? "↓ Setback" : "→ Neutral"}
            </button>
          ))}
        </div>
        <textarea value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="What happened? Capture it while it's fresh..." style={{ width: "100%", minHeight: 100, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "Georgia, serif", boxSizing: "border-box" }} />
        <button onClick={addUpdate} style={{ width: "100%", padding: "14px 0", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 12 }}>
          Save Update
        </button>
      </div>
    </div>
  )}

  {/* Destination Weather Modal */}
  {showDestModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && setShowDestModal(false)}>
      <div style={{ width: "100%", background: colors.card, borderRadius: "24px 24px 0 0", padding: 24, boxSizing: "border-box" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Where are you headed?</div>
        <div style={{ fontSize: 13, color: colors.sub, marginBottom: 20 }}>I'll show you the weather when you arrive.</div>

        {/* Current weather summary */}
        {weather && (
          <div style={{ background: colors.bg, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24, fontFamily: "monospace", color: colors.accent }}>{weather.icon}</div>
            <div>
              <div style={{ fontSize: 13, color: colors.sub }}>Your current location</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{weather.tempC}°C · {weather.desc}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchDestinationWeather()}
            placeholder="Enter city or destination..."
            style={{ flex: 1, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 14, outline: "none", fontFamily: "Georgia, serif" }}
            autoFocus
          />
          <button onClick={fetchDestinationWeather} style={{ padding: "13px 18px", background: colors.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, cursor: "pointer", fontWeight: 700 }}>→</button>
        </div>

        {destLoading && (
          <div style={{ textAlign: "center", padding: 24, color: colors.sub, fontSize: 14 }}>
            Calculating travel time and weather...
          </div>
        )}

        {destWeather && !destLoading && (
          destWeather.error ? (
            <div style={{ textAlign: "center", padding: 16, color: "#E84040", fontSize: 14 }}>{destWeather.error}</div>
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${colors.accent}12, ${colors.accent2}12)`, borderRadius: 16, padding: 20, border: `1px solid ${colors.accent}25` }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: colors.sub, textTransform: "uppercase", marginBottom: 12 }}>
                {destWeather.name}, {destWeather.country}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 36, fontFamily: "monospace", color: colors.accent }}>{destWeather.icon}</div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>{destWeather.tempC}°C</div>
                  <div style={{ fontSize: 14, color: colors.sub }}>{destWeather.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, background: colors.card, borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: colors.sub, marginBottom: 4 }}>TRAVEL TIME</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>~{destWeather.travelMins} min</div>
                </div>
                <div style={{ flex: 1, background: colors.card, borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: colors.sub, marginBottom: 4 }}>ARRIVING AT</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{destWeather.arrivalTime}</div>
                </div>
              </div>
            </div>
          )
        )}

        <button onClick={() => { setShowDestModal(false); setDestWeather(null); setDestination(""); }} style={{ width: "100%", padding: "13px 0", background: "transparent", color: colors.sub, border: `1px solid ${colors.border}`, borderRadius: 12, fontSize: 14, cursor: "pointer", marginTop: 16 }}>
          Close
        </button>
      </div>
    </div>
  )}

  <style>{`
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    * { -webkit-tap-highlight-color: transparent; }
    ::-webkit-scrollbar { width: 0; }
  `}</style>
</div>
```

);
}