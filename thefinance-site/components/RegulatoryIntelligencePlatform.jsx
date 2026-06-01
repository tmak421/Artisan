import React, { useState } from "react";

const C = {
  green: "#4B5320",
  gold: "#C8A951",
  tan: "#F5F0E8",
  dark: "#1A1A1A",
  mid: "#555555",
  light: "#F0EDE4",
  red: "#8B1A1A",
  blue: "#1A3A5C",
  teal: "#1A4A3A",
};

const MODULES = [
  {
    id: "genius",
    label: "GENIUS Act",
    badge: null,
    icon: "§",
    color: C.blue,
    status: "Active — Pub. L. 119-27",
    summary: "Payment stablecoin definition, reserve requirements, redemption rights, and supervisory framework for federally qualified stablecoin issuers.",
    keyPoints: [
      "Defines 'payment stablecoin' — expressly excludes deposits recorded on DLT",
      "Reserve requirements: 1:1 liquid assets (Treasuries, Fed reserves)",
      "DTCC participant Circle (USDC) operates under GENIUS Act scope",
      "Kraken's stablecoin services governed here — distinct from Bitcoin custody",
      "Stablecoin rails ≠ Bitcoin: GENIUS Act governs dollar-pegged instruments only",
    ],
    dtccRelevance: "Circle and Kraken are DTCC Digital Launchpad participants. Their stablecoin operations fall under GENIUS Act. Stablecoin settlement rails being piloted are GENIUS Act–governed, not Bitcoin-governed. Track separately.",
    dtccPriority: "MEDIUM",
    action: "Monitor GENIUS Act implementing regulations for stablecoin reserve custody rules — impacts how DTCC participants hold collateral on-chain.",
  },
  {
    id: "fdic",
    label: "FDIC AML/CFT NPRM",
    badge: null,
    icon: "⚖",
    color: C.teal,
    status: "Comment Period Closed — Final Rule Pending",
    summary: "Risk-based AML/CFT framework replacing categorical de-risking. Tokenized deposit treatment under FDI Act. RIN 3064-AG19.",
    keyPoints: [
      "Risk-based standard: categorical de-risking of digital asset customers is non-compliant",
      "Tokenized deposits = deposits under FDI Act (technology-neutral)",
      "DTCC participant banks (JPMorgan, Citi, BofA, HSBC) are FDIC-supervised",
      "On-chain settlement creates new tokenized deposit classification obligations",
      "Bitcoin holders (DoD service members) represent lowest AML/CFT risk profile",
    ],
    dtccRelevance: "DTCC's migration to blockchain settlement means FDIC-supervised participant banks will custody tokenized securities on-chain. The FDIC's technology-neutral deposit rule directly governs how those custodied instruments are treated. Final rule timing is material.",
    dtccPriority: "HIGH",
    action: "File public comment on final rule framing Bitcoin's transparent ledger as compliance asset. Reference DTCC institutional adoption as evidence of normalized blockchain custody.",
  },
  {
    id: "fincen",
    label: "FinCEN Priorities",
    badge: null,
    icon: "⬡",
    color: C.mid,
    status: "Active — 2024 National Priorities",
    summary: "BSA compliance; digital asset MSB registration; beneficial ownership under CTA; SAR filing thresholds for digital asset transactions.",
    keyPoints: [
      "Digital asset exchanges: MSB registration required regardless of blockchain used",
      "On-chain transactions: same BSA reporting obligations as traditional settlement",
      "Beneficial ownership: DTCC participant firms subject to CTA filing",
      "Chain analytics (Chainalysis, TRM Labs) are FinCEN-recognized compliance tools",
      "De-risking prohibition in AML/CFT NPRM applies to FinCEN framework interpretation",
    ],
    dtccRelevance: "DTCC on-chain settlement does not reduce FinCEN reporting obligations. Participant KYC/AML flows through FinCEN regardless of settlement technology. Faster settlement does not mean reduced compliance burden.",
    dtccPriority: "MEDIUM",
    action: "Monitor FinCEN guidance on tokenized securities SAR thresholds and on-chain transaction reporting as DTCC pilot data emerges.",
  },
  {
    id: "clarity",
    label: "CLARITY Act",
    badge: "ELEVATED",
    icon: "⚡",
    color: C.gold,
    status: "H.R. 3633 — Senate Markup Pending",
    summary: "Digital commodity vs. security classification; CFTC/SEC jurisdiction split; §604 developer liability carve-out; blockchain regulatory certainty framework.",
    keyPoints: [
      "SEC/CFTC jurisdiction: DTCC equity settlement on blockchain triggers classification questions",
      "Russell 1000 stocks on-chain: securities — SEC jurisdiction confirmed",
      "Treasury instruments on-chain: commodities — CFTC jurisdiction likely",
      "§604 developer liability: non-controlling DLT developers not treated as MSBs",
      "DTCC live launch (Oct 2026) will force Senate action on unresolved provisions",
    ],
    dtccRelevance: "PRIORITY ELEVATION: The CLARITY Act is now the most consequential near-term legislative tracker. DTCC's October 2026 live launch for Russell 1000 equities and Treasuries on blockchain rails will force SEC/CFTC jurisdiction resolution. Senate markup timing is now directly linked to DTCC operational milestones.",
    dtccPriority: "CRITICAL",
    action: "Track Senate markup calendar against DTCC July pilot date. Any CLARITY Act provision touching tokenized securities settlement will affect DTCC participant compliance framework before October 2026.",
  },
  {
    id: "bitcoin_reserve",
    label: "Strategic Bitcoin Reserve",
    badge: "NEW — MAY 2026",
    icon: "₿",
    color: "#C8A951",
    status: "Senate: S.954 (BITCOIN Act) | House: ARMA — Introduced May 21, 2026",
    summary:
      "Parallel Senate and House legislation to codify Trump's March 2025 executive order establishing a US Strategic Bitcoin Reserve. Senate: BITCOIN Act (S.954, Lummis). House: American Reserve Modernization Act (ARMA, Begich/Golden). Both target 1 million BTC acquired over five years, held for a mandatory 20-year minimum. Bipartisan — 17+ original House co-sponsors.",
    keyPoints: [
      "Senate BITCOIN Act (S.954): Lummis lead; cosponsors Tuberville (AL), Marshall (KS), Blackburn (TN), Moreno (OH), Justice (WV)",
      "House ARMA: Begich (AK) lead, Golden (ME) Democratic co-lead; 17 original co-sponsors across both parties",
      "Target: 1 million BTC acquired by Treasury over 5 years — up to 200,000 BTC/year",
      "20-year mandatory hold — insulates reserve from short-term political reversal",
      "Budget-neutral acquisition: Fed surplus reduction + gold certificate revaluation mechanism offset costs",
      "Separate Digital Asset Stockpile for non-Bitcoin federal holdings (altcoins from forfeitures)",
      "Quarterly Proof of Reserve reports + independent audits required by statute",
      "Affirms individual right to own, transfer, and self-custody Bitcoin — explicit statutory protection",
      "US currently holds ~328,372 BTC from Silk Road and Bitfinex forfeitures — reserve consolidates these under Treasury",
      "Codifying into statute prevents reversal by future executive order — the critical distinction from Trump's EO alone",
    ],
    dtccRelevance:
      "DTCC and the Strategic Bitcoin Reserve operate in the same legislative cycle but address separate monetary questions. DTCC modernizes dollar-settlement infrastructure. The Bitcoin Reserve creates a sovereign position in the only asset outside that infrastructure. The combination makes 2026 the most consequential year in US monetary policy since Bretton Woods.",
    dtccPriority: "CRITICAL",
    action:
      "IMMEDIATE: Add Strategic Bitcoin Reserve as a sixth module. Track Senate Banking Committee and House Financial Services Committee markup calendars. The Cantillon argument — that reserve diversification into fixed-supply assets addresses debasement at the monetary creation layer — is Artisan Bitcoin's primary education hook for DoD and government audiences. Draft FINRED-aligned curriculum brief on reserve implications for service member financial readiness.",
    cantillonNote: false,
    bitcoinReserveNote: true,
  },
  {
    id: "dtcc",
    label: "DTCC Tokenized Securities",
    badge: "NEW — MAY 2026",
    icon: "◈",
    color: C.green,
    status: "Announced May 4, 2026 — Pilot July 2026",
    summary: "DTCC Digital Launchpad: permissioned blockchain settlement for US equities, ETFs, and Treasury securities. $2 quadrillion annual settlement volume migrating to on-chain rails.",
    keyPoints: [
      "Assets migrating: Russell 1000, major ETFs, US Treasury bills/bonds/notes",
      "50 firms at launch: BlackRock, Goldman Sachs, JPMorgan, Citi, NYSE, Nasdaq, Kraken, Circle (+42)",
      "Permissioned blockchain — access controlled by DTCC and participant institutions",
      "Dollar-denominated settlement: Cantillon Effect fully operational, monetary debasement unchanged",
      "Bitcoin is NOT a participant asset — structurally distinct from settlement infrastructure",
      "G Fund (TSP) Treasuries: same instruments migrating to on-chain settlement",
      "July 2026: pilot | October 2026: live launch | Q3–Q4 2026: regulatory guidance expected",
    ],
    dtccRelevance: "This IS the DTCC module. Tracks pilot milestones, regulatory approvals, participant list changes, custody framework evolution, and DoD-specific implications for Treasury holdings and TSP equity funds.",
    dtccPriority: "PRIMARY",
    action: "IMMEDIATE: Publish Cantillon brief. Update SBIR Phase I scope citing DTCC as operational validation. Elevate CLARITY Act tracking. Monitor SEC/OCC/CFTC guidance timeline for Q3 2026.",
    cantillonNote: true,
  },
];

function PriorityBadge({ level }) {
  const map = {
    CRITICAL: { bg: "#8B1A1A", color: "#fff", label: "CRITICAL" },
    HIGH:     { bg: "#4B5320", color: "#fff", label: "HIGH" },
    PRIMARY:  { bg: C.gold,   color: "#1A1A1A", label: "PRIMARY" },
    MEDIUM:   { bg: "#555",   color: "#fff", label: "MEDIUM" },
  };
  const s = map[level] || map.MEDIUM;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5, textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
}

function ModuleCard({ mod, active, onClick }) {
  const isNew = mod.badge?.includes("NEW");
  const isElevated = mod.badge === "ELEVATED";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        padding: "14px 18px", background: active ? C.light : "transparent",
        border: "none", borderLeft: active ? `5px solid ${C.gold}` : "5px solid transparent",
        borderBottom: "1px solid #E8E0D0", cursor: "pointer", transition: "all 0.15s ease",
        boxShadow: active ? "inset 3px 0 0 #C8A951" : "none",
      }}
      aria-current={active ? "page" : undefined}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#FFFBF0";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 22, color: mod.color, minWidth: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{mod.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{mod.label}</span>
          {isNew && <span style={{ background: C.gold, color: C.dark, fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5 }}>NEW</span>}
          {isElevated && <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.5 }}>ELEVATED</span>}
        </div>
        <div style={{ fontSize: 11, color: C.mid, marginTop: 3, lineHeight: 1.3 }}>{mod.status}</div>
      </div>
    </button>
  );
}

function BitcoinReserveBox() {
  return (
    <div style={{ border: `2px solid #C8A951`, borderLeft: `6px solid #4B5320`, background: "#F5F0E8", borderRadius: 6, padding: "18px 22px", margin: "18px 0", boxShadow: "0 2px 8px rgba(200,169,81,0.15)" }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#4B5320", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
        <span>₿</span> Cantillon Relevance — Strategic Bitcoin Reserve
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "#1A1A1A", lineHeight: 1.7 }}>
        The BITCOIN Act and ARMA address monetary debasement at the <strong>sovereign balance sheet layer</strong> — the layer the Cantillon Effect actually operates on. DTCC makes dollar settlement faster. The Strategic Bitcoin Reserve creates a US sovereign position in the only monetary asset no counterparty can create. These are not competing policies. They are operating on different problems.
      </p>
    </div>
  );
}

function CantillonBox() {
  return (
    <div style={{ border: `2px solid ${C.gold}`, borderLeft: `6px solid ${C.gold}`, background: "#FFFBF0", borderRadius: 6, padding: "18px 22px", margin: "18px 0", boxShadow: "0 2px 8px rgba(200,169,81,0.12)" }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: C.green, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
        <span>⚠</span> Cantillon Assessment — DTCC Digital Launchpad
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: C.dark, lineHeight: 1.7 }}>
        The Digital Launchpad is <strong>infrastructure modernization within the existing monetary system</strong>. Faster settlement does not change who creates the dollar or the rate of monetary expansion. Bitcoin remains the only asset structurally immune to Cantillon dynamics.
      </p>
    </div>
  );
}

function DetailPanel({ mod }) {
  return (
    <div style={{ padding: "32px 44px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
        <div style={{ 
          width: 52, height: 52, borderRadius: "50%", 
          background: `linear-gradient(135deg, ${mod.color}22, ${mod.color}11)`, 
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, color: mod.color, border: `2px solid ${mod.color}33`
        }}>
          {mod.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: C.green, fontWeight: 800, letterSpacing: -0.3 }}>{mod.label}</h2>
          <div style={{ fontSize: 12.5, color: C.mid, marginTop: 3 }}>{mod.status}</div>
        </div>
      </div>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.green}, ${C.gold}, ${C.green})`, borderRadius: 3, marginBottom: 26 }} />
      <p style={{ fontSize: 15, color: C.dark, lineHeight: 1.75, marginBottom: 28, maxWidth: 820 }}>{mod.summary}</p>
      
      {mod.cantillonNote && <CantillonBox />}
      {mod.bitcoinReserveNote && <BitcoinReserveBox />}
      
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 18, height: 1, background: C.gold }}></span> KEY INTELLIGENCE POINTS
        </div>
        {mod.keyPoints.map((pt, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 11, alignItems: "flex-start" }}>
            <span style={{ color: C.gold, fontWeight: 800, marginTop: 1, fontSize: 15, minWidth: 14 }}>›</span>
            <span style={{ fontSize: 14, color: C.dark, lineHeight: 1.65 }}>{pt}</span>
          </div>
        ))}
      </div>
      
      <div style={{ background: C.light, border: `1px solid #D8CEB8`, borderLeft: `6px solid ${mod.color}`, borderRadius: 6, padding: "18px 20px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: mod.color, textTransform: "uppercase", letterSpacing: 1.2 }}>DTCC RELEVANCE</span>
          <PriorityBadge level={mod.dtccPriority} />
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: C.dark, lineHeight: 1.7 }}>{mod.dtccRelevance}</p>
      </div>
      
      <div style={{ background: C.green, borderRadius: 6, padding: "18px 20px", boxShadow: "0 3px 10px rgba(75,83,32,0.25)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          REQUIRED ACTION
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#fff", lineHeight: 1.7 }}>{mod.action}</p>
      </div>
    </div>
  );
}

const TIMELINE = [
  { date: "Mar 11, 2025",  event: "BITCOIN Act (S.954) reintroduced by Lummis — codifies Trump Strategic Bitcoin Reserve EO",  type: "reserve",    impact: "HIGH" },
  { date: "May 4, 2026",   event: "DTCC Digital Launchpad announced — 50 firms signed at launch",                              type: "dtcc",       impact: "HIGH" },
  { date: "May 14, 2026",  event: "CLARITY Act clears Senate Banking 15-9 — Section 301/604 link removed in ante room deal",   type: "clarity",    impact: "CRITICAL" },
  { date: "May 21, 2026",  event: "ARMA introduced by Begich/Golden — 17+ bipartisan House co-sponsors, 1M BTC target",        type: "reserve",    impact: "CRITICAL" },
  { date: "May 2026",      event: "Artisan Bitcoin Regulatory Intelligence Platform — Modules V & VI added",                    type: "artisan",    impact: "MEDIUM" },
  { date: "Jul 2026",      event: "DTCC pilot launch — live blockchain settlement begins",                                      type: "dtcc",       impact: "CRITICAL" },
  { date: "Q3 2026",       event: "CLARITY Act Senate floor vote — Agriculture Committee reconciliation required first",        type: "clarity",    impact: "HIGH" },
  { date: "Oct 2026",      event: "DTCC full live launch — Russell 1000, ETFs, Treasuries on-chain",                           type: "dtcc",       impact: "CRITICAL" },
  { date: "Q3–Q4 2026",    event: "SEC / CFTC / OCC regulatory guidance on tokenized securities",                              type: "regulatory", impact: "HIGH" },
];

const typeStyles = {
  dtcc:       { color: C.green,   label: "DTCC" },
  artisan:    { color: C.gold,    label: "Artisan" },
  clarity:    { color: C.red,     label: "CLARITY" },
  regulatory: { color: C.mid,     label: "Regulatory" },
  reserve:    { color: "#8B6914", label: "BTC Reserve" },
};

function Timeline() {
  return (
    <div style={{ padding: "36px 32px", maxWidth: 740, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>REGULATORY CALENDAR</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.green, margin: 0, letterSpacing: -0.4 }}>2026 Timeline — Critical Milestones</h2>
        <p style={{ fontSize: 14, color: C.mid, marginTop: 10, lineHeight: 1.6, maxWidth: 620 }}>
          Key dates for DTCC migration, CLARITY Act, and regulatory guidance shaping institutional Bitcoin custody policy.
        </p>
      </div>
      <div style={{ position: "relative", paddingLeft: 36 }}>
        <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 3, background: "#E8E0D0", borderRadius: 3 }} />
        {TIMELINE.map((item, index) => {
          const ts = typeStyles[item.type] || typeStyles.regulatory;
          const impactBg = item.impact === "CRITICAL" ? "#8B1A1A" : item.impact === "HIGH" ? "#4B5320" : "#555";
          return (
            <div key={index} style={{ position: "relative", marginBottom: index === TIMELINE.length - 1 ? 0 : 32, display: "flex", gap: 18 }}>
              <div style={{ 
                position: "absolute", left: -5, top: 8, width: 22, height: 22, 
                borderRadius: "50%", background: ts.color, border: "4px solid #fff", 
                boxShadow: "0 0 0 4px #E8E0D0, 0 2px 6px rgba(0,0,0,0.1)", zIndex: 2 
              }} />
              <div style={{ 
                flex: 1, background: "#fff", border: "1px solid #E8E0D0", borderRadius: 10, 
                padding: "18px 22px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ts.color, letterSpacing: 0.6 }}>{item.date}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.dark, lineHeight: 1.45, marginTop: 5 }}>{item.event}</div>
                  </div>
                  <span style={{ 
                    marginLeft: 14, flexShrink: 0, background: impactBg, color: "#fff", 
                    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5,
                    alignSelf: "flex-start", marginTop: 2
                  }}>
                    {item.impact}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: C.mid, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ background: ts.color + "22", color: ts.color, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{ts.label}</span>
                  <span style={{ color: "#ccc" }}>•</span>
                  <span>DTCC / Legislative Impact</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegulatoryIntelligencePlatform() {
  const [activeId, setActiveId] = useState("bitcoin_reserve");
  const [view, setView] = useState("modules");
  const [search, setSearch] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(278);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const active = MODULES.find(m => m.id === activeId);
  const filteredModules = MODULES.filter(m =>
    m.label.toLowerCase().includes(search.toLowerCase()) ||
    m.summary.toLowerCase().includes(search.toLowerCase())
  );

  const clearSearch = () => setSearch("");

  // Swipe / Drag-to-collapse handlers
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const startWidth = sidebarWidth;

    const handleDrag = (moveEvent) => {
      const currentX = moveEvent.type.includes('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const delta = currentX - startX;
      let newWidth = Math.max(60, Math.min(320, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);

      // Snap logic: close if dragged narrow, otherwise full open
      setSidebarWidth((currentWidth) => {
        if (currentWidth < 160) {
          setSidebarOpen(false);
          return 0;
        } else {
          setSidebarOpen(true);
          return 278;
        }
      });
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  };

  return (
    <div style={{ 
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", 
      background: "#FAFAF7", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale"
    }}>

      {/* Header */}
      <div style={{ 
        background: `linear-gradient(90deg, ${C.green} 0%, #3A4218 100%)`, 
        padding: "16px 28px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
      }}>
        <div>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 800, letterSpacing: 2.5, opacity: 0.95 }}>ARTISAN BITCOIN INC.</div>
          <div style={{ color: "#fff", fontSize: 21, fontWeight: 800, marginTop: 2, letterSpacing: -0.3 }}>Regulatory Intelligence Platform</div>
          <div style={{ color: "#C8C8A0", fontSize: 11.5, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            Government · DoD · Institutional 
            <span style={{ color: "#8B8B6A" }}>•</span> 
            Todd Maki, AFC® 
            <span style={{ color: "#8B8B6A" }}>•</span> 
            May 2026
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ 
            background: C.gold, color: C.dark, fontSize: 10, fontWeight: 800, 
            padding: "4px 12px", borderRadius: 4, letterSpacing: 1.2,
            boxShadow: "0 1px 3px rgba(200,169,81,0.4)"
          }}>
            6 MODULES ACTIVE
          </div>
          <div style={{ color: "#C8C8A0", fontSize: 10.5, marginTop: 5, fontWeight: 500 }}>BITCOIN Reserve + DTCC Added May 2026</div>
        </div>
      </div>

      {/* Alert Banner */}
      <div style={{ 
        background: "linear-gradient(90deg, #FFF3CD 0%, #FFECB3 100%)", 
        borderBottom: `2.5px solid ${C.gold}`, 
        padding: "11px 28px", 
        display: "flex", 
        alignItems: "center", 
        gap: 14, 
        flexWrap: "wrap",
        boxShadow: "inset 0 -1px 0 rgba(200,169,81,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, color: "#7B4F00" }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: 12.5, color: "#7B4F00", letterSpacing: 0.4 }}>
            CLARITY ACT — PASSED COMMITTEE 15-9
          </span>
        </div>
        <span style={{ fontSize: 12.5, color: "#7B4F00", opacity: 0.9 }}>
          Senate floor vote pending reconciliation. ₿ ARMA INTRODUCED MAY 21 — 1M BTC sovereign reserve target.
        </span>
      </div>

      {/* Nav */}
      <div style={{ 
        background: C.light, 
        borderBottom: `1.5px solid #D8CEB8`, 
        display: "flex", 
        padding: "0 24px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.6)"
      }}>
        {[
          { id: "modules", label: "Regulatory Modules", icon: "📋" }, 
          { id: "timeline", label: "Calendar", icon: "📅" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: "13px 22px", 
              border: "none", 
              background: "transparent",
              color: view === tab.id ? C.green : C.mid,
              fontWeight: view === tab.id ? 700 : 500,
              borderBottom: view === tab.id ? `4px solid ${C.gold}` : "4px solid transparent",
              cursor: "pointer", 
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.1s ease"
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "timeline" ? (
        <Timeline />
      ) : (
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

          {/* Sidebar */}
          <div style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            background: "#fff",
            borderRight: sidebarWidth > 0 ? `1.5px solid #D8CEB8` : "none",
            overflowY: sidebarWidth > 60 ? "auto" : "hidden",
            overflowX: "hidden",
            flexShrink: 0,
            transition: isDragging ? "none" : "width 0.18s cubic-bezier(0.32, 0.72, 0, 1), min-width 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            boxShadow: sidebarWidth > 60 ? "2px 0 12px rgba(0,0,0,0.06)" : "none",
            cursor: isDragging ? "ew-resize" : "default"
          }}>
            <div style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
              {/* Search */}
              <div style={{ 
                padding: "14px 18px 10px", 
                borderBottom: `1px solid #E8E0D0`,
                position: "relative"
              }}>
                <input
                  type="text"
                  placeholder="Search modules or summaries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ 
                    width: "100%", 
                    padding: "9px 36px 9px 13px", 
                    border: `1.5px solid #D8CEB8`, 
                    borderRadius: 7, 
                    fontSize: 13.5, 
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = C.gold;
                    e.target.style.boxShadow = "0 0 0 3px rgba(200,169,81,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#D8CEB8";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    style={{
                      position: "absolute",
                      right: 22,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: C.mid,
                      fontSize: 17,
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                      opacity: 0.7
                    }}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div style={{ 
                padding: "10px 18px 7px", 
                fontSize: 10, 
                fontWeight: 700, 
                color: C.mid, 
                letterSpacing: 1.2, 
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span>Active Frameworks</span>
                <span style={{ fontSize: 9, background: "#E8E0D0", color: C.mid, padding: "0 5px", borderRadius: 3 }}>{filteredModules.length}</span>
              </div>
              
              {filteredModules.length > 0
                ? filteredModules.map(mod => (
                    <ModuleCard key={mod.id} mod={mod} active={activeId === mod.id} onClick={() => setActiveId(mod.id)} />
                  ))
                : <div style={{ padding: "24px 18px", fontSize: 13.5, color: C.mid, textAlign: "center" }}>
                    No modules match your search.<br />Try a different term.
                  </div>
              }
            </div>

            {/* Swipe / Drag Handle for natural collapse */}
            {sidebarWidth > 0 && (
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                  position: "absolute",
                  right: -1,
                  top: 0,
                  bottom: 0,
                  width: 10,
                  cursor: "ew-resize",
                  background: isDragging ? "rgba(200,169,81,0.35)" : "transparent",
                  zIndex: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => !isDragging && (e.currentTarget.style.background = "rgba(200,169,81,0.2)")}
                onMouseLeave={(e) => !isDragging && (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 3, height: 36, background: C.gold, borderRadius: 2, opacity: 0.65 }} />
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (fallback) */}
          <button
            onClick={() => {
              if (sidebarWidth > 0) {
                setSidebarWidth(0);
                setSidebarOpen(false);
              } else {
                setSidebarWidth(278);
                setSidebarOpen(true);
              }
            }}
            title={sidebarWidth > 0 ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={sidebarWidth > 0 ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              position: "absolute",
              left: sidebarWidth > 0 ? sidebarWidth - 12 : -1,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 25,
              width: 26,
              height: 54,
              background: C.green,
              border: "none",
              borderRadius: sidebarWidth > 0 ? "0 8px 8px 0" : "0 8px 8px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.gold,
              fontSize: 15,
              fontWeight: 800,
              transition: isDragging ? "none" : "left 0.18s cubic-bezier(0.32, 0.72, 0, 1), background 0.1s ease",
              boxShadow: "2px 0 8px rgba(0,0,0,0.18)",
              opacity: isDragging ? 0.6 : 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#3A4218"}
            onMouseLeave={(e) => e.currentTarget.style.background = C.green}
          >
            {sidebarWidth > 0 ? "⟨" : "⟩"}
          </button>

          {/* Detail panel */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            background: "#fff",
            boxShadow: "inset 1px 0 0 #E8E0D0"
          }}>
            {active && <DetailPanel mod={active} />}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        background: C.dark, 
        padding: "11px 28px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        fontSize: 11, 
        color: "#888",
        borderTop: "1px solid #333"
      }}>
        <span>Educational purposes only — not investment advice. AFC® scope-of-practice boundaries maintained.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.gold, fontWeight: 700 }}>ArtisanBitcoin.com</span>
          <span style={{ color: "#555" }}>•</span>
          <span style={{ fontSize: 10, color: "#666" }}>Updated May 25, 2026</span>
        </div>
      </div>
    </div>
  );
}
