import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ═══════════════════════════════════════════════════════════
   FINANCIAL READINESS NAVIGATOR v7.0
   §992 Compliance Architecture · LRS · Warfighter Score
   13 Sections, 31+ Topics, 80+ Resources, 6 Calculators
   WCAG AA Accessible · Memoized · Error-Guarded · Light/Dark
   ═══════════════════════════════════════════════════════════ */

/* ── Accessible Emoji wrapper — hidden from screen readers or labeled ── */
function Ico({ children, label }) {
  return label
    ? <span role="img" aria-label={label}>{children}</span>
    : <span aria-hidden="true">{children}</span>;
}

/* ── Shared chart wrapper with accessible figure role ── */
function ChartFigure({ label, summary, children }) {
  return (
    <div role="figure" aria-label={label}>
      {children}
      <div className="sr-only">{summary}</div>
    </div>
  );
}

/* ── Haptic feedback (mobile PWA) ── */
const buzz = () => { try { navigator?.vibrate?.(12); } catch {} };

/* ── Toast notification system ── */
const ToastBus = { emit: null };
const notify = (msg, type = "info") => ToastBus.emit?.(msg, type);

/* ── localStorage persistence hook (type-guarded) ── */
function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      const parsed = JSON.parse(stored);
      // Type guard: reset if stored type doesn't match default
      if (typeof defaultValue === "number" && typeof parsed !== "number") return defaultValue;
      if (typeof defaultValue === "boolean" && typeof parsed !== "boolean") return defaultValue;
      return parsed;
    } catch {
      notify("Storage read error — using defaults.", "error");
      return defaultValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { notify("Storage full. Changes may not save.", "error"); }
  }, [key, value]);
  return [value, setValue];
}

/* ── Hard reset — clears all persisted data ── */
function resetAllData() {
  buzz();
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("finred-") || k?.startsWith("calc-")) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
  notify("All calculator data reset.", "info");
  setTimeout(() => window.location.reload(), 800);
}

/* ── PWA Install Prompt ── */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div style={{ position: "fixed", bottom: "max(20px, env(safe-area-inset-bottom))", right: 20, zIndex: 100, display: "flex", gap: 6, animation: "fadeUp 0.4s ease-out", WebkitTransform: "translateZ(0)" }}>
      <button onClick={handleInstall} aria-label="Install Financial Readiness Navigator app"
        style={{ padding: "10px 16px", background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#F9FAFB", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
        <Ico label="Install">📲</Ico> Install App
      </button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss install prompt"
        style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, cursor: "pointer", fontSize: 13 }}>
        ✕
      </button>
    </div>
  );
}

/* ── Safe financial math helpers (Pure Functions) ── */
// FV = P × ((1+r)^n − 1) / r  (future value of annuity)
function fvAnnuity(pmt, r, n) {
  if (!isFinite(pmt) || !isFinite(r) || !isFinite(n) || n <= 0) return 0;
  if (r <= 0) return pmt * n;
  const result = pmt * ((Math.pow(1 + r, n) - 1) / r);
  return isFinite(result) ? result : 0;
}
// FV = PV × (1+r)^n  (future value of lump sum)
function fvLump(pv, r, n) {
  if (!isFinite(pv) || !isFinite(r) || !isFinite(n) || n <= 0) return pv;
  const result = pv * Math.pow(1 + r, n);
  return isFinite(result) ? result : pv;
}
// PMT = P × [r(1+r)^n] / [(1+r)^n − 1]  (loan payment)
function loanPmt(principal, r, n) {
  if (!isFinite(principal) || principal <= 0) return 0;
  if (!isFinite(r) || r <= 0) return n > 0 ? principal / n : 0;
  if (!isFinite(n) || n <= 0) return 0;
  const result = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return isFinite(result) ? result : 0;
}
// Safe number guard
function safe(n) { return (isFinite(n) && !isNaN(n)) ? n : 0; }
const SECTIONS = [
  {
    id: "foundations",
    icon: "💰",
    title: "Financial Foundations",
    subtitle: "Values, Planning & Financial Management",
    color: "#1B4332",
    accent: "#95D5B2",
    topics: [
      {
        title: "Need for Personal Financial Management",
        content: [
          "Personal financial management is not optional — it is a mission-critical skill for every service member. Your financial health directly impacts your readiness, your career, and your family's wellbeing.",
          "**Why financial management matters in the military:**",
          "• Financial problems are the #1 reason security clearances are denied or revoked",
          "• Per DoDI 1344.09, service members are required to pay their just (valid) debts",
          "• Financial stress reduces focus, increases risk of substance abuse, and degrades unit readiness",
          "• Commanders may take administrative or disciplinary action for financial irresponsibility",
          "**Your unique military financial environment:**",
          "• Guaranteed paycheck creates a false sense of security — expenses can still exceed income",
          "• Frequent PCS moves disrupt financial stability and create unexpected costs",
          "• Young service members are prime targets for predatory lenders near installations",
          "• Deployment, separation, and transition create financial pressure points",
          "**The good news:** You have access to free, confidential financial counseling from PFMs and PFCs at every installation. These credentialed professionals (AFC, CFP, ChFC) can help with budgets, debt plans, security clearance issues, and more — at no cost to you.",
          "**Bottom line:** Taking control of your finances is not about restriction — it's about freedom. Freedom to make choices, absorb emergencies, and build the future you want.",
        ],
        links: [
          { text: "Find a PFC", url: "https://finred.usalearning.gov/pfcMap" },
          { text: "FINRED Home", url: "https://finred.usalearning.gov" },
        ],
      },
      {
        title: "Financial Values",
        content: [
          "Your financial values are the beliefs and priorities that drive your spending, saving, and investing decisions. Understanding them is the first step to building a plan that actually works for you.",
          "**What are financial values?**",
          "• The things that matter most to you — security, freedom, family, experiences, generosity",
          "• They differ from person to person and from family to family",
          "• Conflict between partners' financial values is a leading cause of relationship stress",
          "**Why values matter for your finances:**",
          "• A spending plan that doesn't reflect your values won't stick",
          "• Impulse spending often happens when you haven't defined what matters",
          "• Financial goals built on your values create motivation to save and stay disciplined",
          "**How to identify your financial values:**",
          "• Ask: What would I do with a $10,000 windfall? The answer reveals priorities.",
          "• Review your last 3 months of spending — where does the money actually go?",
          "• Rank these: Security, Freedom, Family, Experiences, Giving, Status, Education",
          "• Discuss with your spouse or partner — alignment prevents conflict",
          "**Values in action:** Once you know your values, build your spending plan around them. Allocate money to what matters most FIRST, then fill in the rest. This is values-based budgeting.",
        ],
        links: [
          { text: "FINRED Touchpoints", url: "https://finred.usalearning.gov/MilitaryJourneyTouchpoints" },
        ],
      },
      {
        title: "My Ratings as a Money Manager",
        content: ["__INTERACTIVE_SELF_ASSESSMENT__"],
        links: [
          { text: "FINRED Well-Being Assessment", url: "https://finred.usalearning.gov/Assessment" },
          { text: "CFPB Financial Well-Being Scale", url: "https://www.consumerfinance.gov/consumer-tools/financial-well-being/" },
        ],
      },
      {
        title: "Spending Plan Worksheet",
        content: [
          "A spending plan is the foundation of your financial readiness. It tracks your income against your expenses so you know exactly where your money goes each month.",
          "**Why it matters:** Financial mismanagement can adversely impact your career and personal life — including your security clearance.",
          "**How to start:**",
          "• Calculate your total monthly income (base pay + BAH + BAS + special pays)",
          "• List all fixed expenses (rent/mortgage, car payment, insurance, phone)",
          "• List variable expenses (food, gas, entertainment, clothing)",
          "• Set SMART financial goals (Specific, Measurable, Achievable, Relevant, Time-bound)",
          "• Track the difference — income minus expenses should be positive",
          "**Methods:**",
          "• 50/30/20 Rule: 50% needs, 30% wants, 20% savings and debt payoff",
          "• Zero-Based Budget: Every dollar gets a job — income minus all allocations equals zero",
          "**Tips for military families:**",
          "• Use your LES to verify exact income amounts",
          "• BAH and BAS are not taxable — your take-home may be higher than you think",
          "• Budget for PCS, deployment, and seasonal expenses (holidays, APFT gear)",
          "• Automate savings with allotments — pay yourself first",
          "**Resource:** Download the FINRED Spending Plan Worksheet for a guided template.",
        ],
        links: [
          { text: "FINRED Spending Plan Worksheet", url: "https://finred.usalearning.gov/assets/downloads/FINRED-Spendingplan-TK.pdf" },
          { text: "Spending Plan Video", url: "https://finred.usalearning.gov/MilitaryJourneyTouchpoints/video/Creating-a-Spending-Plan" },
        ],
      },
      {
        title: "Financial Warning Signs & Military Risk Factors",
        content: [
          "Recognizing financial distress early can prevent it from becoming a career-ending crisis.",
          "**Warning signs to watch for:**",
          "• Living paycheck to paycheck with no savings buffer",
          "• Using credit cards for basic necessities (food, gas, bills)",
          "• Making only minimum payments on debts",
          "• Borrowing from payday lenders or title loan companies",
          "• Receiving calls from creditors or collection agencies",
          "• Avoiding looking at bank statements or bills",
          "• Hiding spending from your spouse or family",
          "• Repeatedly using emergency relief society loans",
          "**Military-specific risk factors:**",
          "• Young age at first enlistment with limited financial experience",
          "• Predatory lenders clustered near military installations",
          "• Frequent PCS moves disrupting financial stability",
          "• Deployment-related spending by spouses without a plan",
          "• Pressure to keep up with peers (vehicles, lifestyle)",
          "• Sudden income changes (bonus pay, loss of special pays)",
          "**Career impact:** Per DoDI 1344.09, financial irresponsibility can trigger security clearance reviews, administrative action, and career-ending consequences.",
          "**Get help now — it's free and confidential:**",
          "• Visit your installation PFM or PFC",
          "• Call Military OneSource: 800-342-9647",
          "• These services are available at no cost with no career impact",
        ],
        links: [
          { text: "Find a PFC", url: "https://finred.usalearning.gov/pfcMap" },
          { text: "Military OneSource", url: "https://www.militaryonesource.mil" },
        ],
      },
    ],
  },
  {
    id: "banking-credit",
    icon: "🏛️",
    title: "Banking & Credit",
    subtitle: "Banking, Credit Scores & Military Protections",
    color: "#0D3B66",
    accent: "#7FC8F8",
    topics: [
      {
        title: "Military Banking",
        content: [
          "Choosing the right financial institution is one of the first financial decisions you'll make in the military.",
          "**Banks vs. Credit Unions:**",
          "• Banks are for-profit institutions; credit unions are member-owned nonprofits",
          "• Credit unions often offer lower fees and better rates for service members",
          "• Both offer FDIC/NCUA insurance up to $250,000 per depositor",
          "**Key considerations:**",
          "• Understand common fees — monthly maintenance, ATM, overdraft, insufficient funds",
          "• Use electronic banking strategically — set up direct deposit, alerts, and auto-pay",
          "• Track deposits and expenditures against your bank statement",
          "• Know how to recognize and correct banking errors",
          "• Avoid overdraft fees — they add up fast",
          "**Military-friendly banking:** Many institutions waive fees for service members and offer early direct deposit. Research options before committing.",
          "**Banking products to understand:**",
          "• Checking accounts — for daily transactions",
          "• Savings accounts — for emergency funds and goals",
          "• Money market accounts — higher APY with limited transactions",
          "• Certificates of Deposit (CDs) — fixed rate for a set term",
          "**Caution:** Evaluate personal finance apps carefully before linking your accounts. Not all are secure or military-friendly.",
        ],
        links: [
          { text: "FINRED Home", url: "https://finred.usalearning.gov" },
          { text: "FDIC Money Smart", url: "https://playmoneysmart.fdic.gov/tools/105" },
        ],
      },
      {
        title: "Understanding Credit",
        content: [
          "Your credit score affects your ability to rent housing, get loans, obtain insurance, and maintain your security clearance.",
          "**Five components of your credit score:**",
          "• Payment history (35%) — Pay on time, every time",
          "• Amounts owed (30%) — Keep credit utilization below 30%",
          "• Length of credit history (15%) — Keep old accounts open",
          "• Credit mix (10%) — A healthy variety of credit types",
          "• New credit (10%) — Limit hard inquiries",
          "**Who views your credit and why:**",
          "• Creditors — loan and credit applications",
          "• Government agencies — security clearance adjudication",
          "• Insurance companies — determining premiums",
          "• Landlords — rental applications",
          "• Employers — hiring and promotions",
          "**Strategies to build and improve your score:**",
          "• Set up autopay for at least minimum payments",
          "• Keep credit card balances low relative to limits",
          "• Don't close old credit cards — length of history matters",
          "• Dispute errors on your credit report promptly under the FCRA",
          "• Avoid opening multiple new accounts at once",
          "**Monitor your credit:** Check reports free weekly at annualcreditreport.com. Review all three bureaus — TransUnion, Experian, and Equifax.",
          "**Caution:** Be wary of credit repair agencies — they require your PII and may not deliver. Many charge fees for things you can do yourself for free.",
        ],
        links: [
          { text: "Free Credit Reports", url: "https://www.annualcreditreport.com" },
          { text: "CFPB Credit Guide", url: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-get-and-keep-a-good-credit-score-en-318" },
          { text: "FINRED Credit History", url: "https://finred.usalearning.gov/Money/CreditHistory" },
        ],
      },
    ],
  },
  {
    id: "consumer-protection",
    icon: "🛡️",
    title: "Consumer Protection",
    subtitle: "SCRA, MLA & Sources of Help",
    color: "#2D6A4F",
    accent: "#74C69D",
    topics: [
      {
        title: "Servicemembers Civil Relief Act (SCRA)",
        content: [
          "The SCRA provides powerful legal and financial protections you can use right now to save money and protect your rights.",
          "**What SCRA can do for YOU:**",
          "• Cap interest at 6% on pre-service debts — mortgages, car loans, student loans, credit cards",
          "• Terminate your cell phone contract or car lease early without penalty when you receive PCS or deployment orders",
          "• Break your apartment lease with 30 days written notice plus a copy of your orders",
          "• Stop an eviction or foreclosure while you're on active duty",
          "• Postpone court proceedings that interfere with your service",
          "**How to claim the 6% interest rate cap (step by step):**",
          "• Write a letter to each creditor stating: \"I am requesting SCRA interest rate relief pursuant to 50 U.S.C. §3937\"",
          "• Include your name, account number, and effective date of active duty",
          "• Attach a copy of your orders (or DD-214 if retroactive)",
          "• Send by certified mail, return receipt requested — keep copies of everything",
          "• The creditor must respond within 30 days and retroactively apply the cap",
          "**How to terminate a lease:**",
          "• Deliver written notice to your landlord with a copy of orders showing PCS or deployment of 90+ days",
          "• For month-to-month: terminates 30 days after next rent due date",
          "• For fixed-term: terminates 30 days after next rent due date following notice",
          "**Common mistakes:**",
          "• Not sending written notice — verbal requests are not sufficient",
          "• Not including a copy of orders — the creditor needs proof",
          "• Waiting too long — SCRA protections have time limits after separation",
          "**If a creditor refuses:** Contact your installation legal assistance office immediately. SCRA violations carry penalties. Your JAG attorney can intervene at no cost.",
          "**Note:** The SCRA website (scra.dmdc.osd.mil) is used by creditors to verify your active-duty status. You do NOT need to use it yourself — your orders are your proof.",
        ],
        links: [
          { text: "Installation Legal Assistance", url: "https://legalassistance.law.af.mil" },
          { text: "SCRA Full Text (DOJ)", url: "https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra" },
          { text: "Military OneSource SCRA Guide", url: "https://www.militaryonesource.mil/financial-legal/legal/scra" },
        ],
      },
      {
        title: "Military Consumer Protection",
        content: [
          "Active-duty service members and their covered dependents have specific protections from predatory lending and unfair business practices.",
          "**Military Lending Act (MLA):**",
          "• Interest rate cap of 36% Military Annual Percentage Rate (MAPR) on most consumer loans",
          "• Prohibition on mandatory arbitration clauses",
          "• Prohibition on mandatory allotments to repay loans",
          "• Prohibition on prepayment penalties",
          "• Creditors cannot require you to waive SCRA rights",
          "**Covered products:** Payday loans, vehicle title loans, tax refund anticipation loans, and most credit cards.",
          "**Red flags of predatory lending near base:**",
          "• \"E-1 and above approved!\"",
          "• \"No credit check required\"",
          "• Interest rates that seem too good to be true",
          "• Pressure to sign immediately",
          "• Required allotments from your pay",
          "**Identity theft is a serious threat — over 1.1 million reports and $8.8 billion in losses per FTC data.**",
          "**Protect yourself:**",
          "• Safeguard your mail, wallet, receipts, and account statements",
          "• Place active-duty alerts or security freezes before deployment",
          "• Check credit reports regularly at annualcreditreport.com",
          "**If you're a victim:** File at IdentityTheft.gov, place fraud alerts, and file a police report.",
          "**Credit bureau contacts:** TransUnion: 1-800-680-7289 | Experian: 1-888-397-3742 | Equifax: 1-800-525-6285",
        ],
        links: [
          { text: "CFPB Office of Servicemember Affairs", url: "https://www.consumerfinance.gov/servicemembers/" },
          { text: "FTC Military Consumer", url: "https://www.militaryconsumer.gov" },
          { text: "FTC Identity Theft", url: "https://www.identitytheft.gov" },
          { text: "Free Credit Reports", url: "https://www.annualcreditreport.com" },
        ],
      },
      {
        title: "Sources of Help for Military Consumers",
        content: [
          "You have access to an array of free resources designed specifically for military consumers. Use them.",
          "**Personal Financial Counselors (PFCs):**",
          "• Free, credentialed (AFC, CFP, or ChFC) financial professionals",
          "• Available to all service members, all branches, all components",
          "• Services: individual counseling, group coaching, financial readiness briefings",
          "• Support extends up to 365 days post-separation",
          "**Service-Specific Financial Readiness Support:**",
          "• Army: Army Community Service (ACS) Centers — Financial Readiness Specialists",
          "• Navy: Fleet and Family Support Centers",
          "• Air Force: Military and Family Readiness Centers",
          "• Marines: Installation-level PFMs",
          "**Military OneSource:** 800-342-9647 — 24/7, free tax prep, financial counseling, worldwide",
          "**Emergency Relief Societies:**",
          "• Army Emergency Relief (AER): armyemergencyrelief.org",
          "• Navy-Marine Corps Relief Society (NMCRS): nmcrs.org",
          "• Air Force Aid Society (AFAS): afas.org",
          "• Coast Guard Mutual Assistance (CGMA): cgmahq.org",
          "**Legal assistance:** Free legal services at installation JAG offices for SCRA, MLA, consumer complaints, and debt issues.",
          "**CFPB:** The Consumer Financial Protection Bureau's Office of Servicemember Affairs provides resources and handles complaints for military families — visit consumerfinance.gov/servicemembers.",
        ],
        links: [
          { text: "Find a PFC", url: "https://finred.usalearning.gov/pfcMap" },
          { text: "Military OneSource", url: "https://www.militaryonesource.mil" },
          { text: "CFPB Military Resources", url: "https://www.consumerfinance.gov/servicemembers/" },
          { text: "MilSpouse Money Mission", url: "https://www.milspousemoneymission.org" },
        ],
      },
    ],
  },
  {
    id: "compensation",
    icon: "🎖️",
    title: "Compensation & Benefits",
    subtitle: "Pay, Allowances, TRICARE & Education",
    color: "#5C4033",
    accent: "#F4A261",
    topics: [
      {
        title: "Military Pay & Allowances",
        content: [
          "Understanding your total compensation is the first step to financial readiness.",
          "**Base Pay:** Determined by rank and years of service. Subject to federal (and sometimes state) income tax.",
          "**Tax-Free Allowances:**",
          "• BAH (Basic Allowance for Housing) — Based on rank, dependency status, and duty location ZIP code",
          "• BAS (Basic Allowance for Subsistence) — For food costs",
          "• Neither BAH nor BAS is taxable income",
          "**Special & Incentive Pays:**",
          "• Hostile Fire / Imminent Danger Pay (HFP/IDP)",
          "• Hardship Duty Pay (HDP)",
          "• Hazardous Duty Incentive Pay (HDIP)",
          "• Family Separation Allowance (FSA)",
          "• Cost of Living Allowance (COLA)",
          "**Understanding Your LES:**",
          "• Entitlements — Base pay, BAH, BAS, special pays",
          "• Deductions — Federal/state taxes, SGLI, TSP contributions",
          "• Allotments — Voluntary payments you've set up",
          "• TSP Section — Traditional and Roth contributions, Agency Auto (1%) and Matching",
          "• Remarks — Check this section FIRST if you have questions about changes",
          "**Action items:** Review your LES every pay period. Report errors to command admin or finance immediately.",
        ],
        links: [
          { text: "Military Pay Tables", url: "https://militarypay.defense.gov" },
          { text: "BAH Calculator", url: "https://www.defensetravel.dod.mil/site/bahCalc.cfm" },
          { text: "MyPay (DFAS)", url: "https://mypay.dfas.mil" },
        ],
      },
      {
        title: "Combat Zone Tax Exclusion (CZTE)",
        content: [
          "The CZTE exempts all or a portion of earnings from federal income taxes while deployed to a designated combat zone.",
          "**How it works:**",
          "• Enlisted / Warrant Officers: ALL military pay excluded from federal taxes each month in the combat zone",
          "• Commissioned Officers: Capped at highest enlisted rate + Hostile Fire Pay",
          "• CZTE adjustments are automatic — reflected on your LES and W-2",
          "**What's excluded:**",
          "• Basic Pay",
          "• Incentive Bonuses and Continuation Pay under BRS",
          "• Imminent Danger / Hostile Fire Pay",
          "• Student Loan Repayment (proportional to months in combat zone)",
          "• Accrued Leave Sold",
          "• Combat Zone Injury Income (up to 2 years after departing)",
          "**Higher TSP Limits:** When deployed to a combat zone, the IRS Annual Addition Limit IRC §415(c) applies instead of the normal Elective Deferral Limit IRC §402(g) — significantly increasing how much you can contribute.",
          "**Roth TSP + CZTE = Double Tax Benefit:** Roth contributions from tax-free combat pay grow tax-free AND are withdrawn tax-free. This is one of the most powerful wealth-building opportunities in military service.",
          "**Spousal IRA:** Your spouse can also contribute to a Spousal IRA using your combat zone income.",
          "**Note:** Medicare and Social Security taxes still apply. Tax rules are complex — consult a tax advisor if needed.",
        ],
        links: [
          { text: "IRS CZTE Guide", url: "https://www.irs.gov/individuals/military/tax-exclusion-for-combat-service" },
          { text: "DFAS CZTE Info", url: "https://www.dfas.mil/militarymembers/payentitlements/Pay-Tables/CZ1" },
          { text: "TSP Contribution Limits", url: "https://www.tsp.gov/making-contributions/contribution-limits" },
        ],
      },
      {
        title: "TRICARE Overview",
        content: [
          "TRICARE provides health coverage for service members and their families — one of the most valuable military benefits.",
          "**Active Duty:** Medical and dental at no cost. You MUST enroll eligible dependents — it's not automatic.",
          "**Key TRICARE plans:**",
          "• TRICARE Prime — HMO-style, lowest cost, assigned PCM",
          "• TRICARE Select — PPO-style, more provider choice, higher cost",
          "• TRICARE Reserve Select — For qualified Reserve/Guard members",
          "• TRICARE Young Adult — Dependents up to age 26",
          "**Guard/Reserve:**",
          "• Eligible for TRICARE Prime when activated for 30+ days",
          "• Post-deployment: TAMP for 180 days of transitional coverage",
          "**Action items:**",
          "• Enroll dependents in DEERS",
          "• Understand out-of-pocket costs for each plan option",
          "• Review coverage before and after PCS, deployment, and major life events",
          "• Factor healthcare's value into your total compensation — it's worth thousands annually",
        ],
        links: [
          { text: "TRICARE Plan Finder", url: "https://www.tricare.mil/Plans" },
        ],
      },
      {
        title: "Education Benefits & Savings",
        content: [
          "The military offers significant education benefits. Understanding them can save tens of thousands of dollars.",
          "**Available benefits:**",
          "• Post-9/11 GI Bill — Tuition, housing allowance, book stipend (transferable to dependents)",
          "• Montgomery GI Bill — Fixed monthly payment for education",
          "• Tuition Assistance (TA) — Up to $250/credit hour, $4,500/year",
          "• MyCAA — For military spouses pursuing portable career credentials",
          "• Grants and Scholarships — Many military-specific options",
          "**Free Application for Federal Student Aid (FAFSA):** Complete this annually — military families often qualify for more aid than they realize.",
          "**529 College Savings Plans:** Tax-advantaged education savings for children. Contributions grow tax-free when used for qualified education expenses.",
          "**Caution:** Understand terms and obligations before committing. Not all education programs provide equal return on investment. Research school outcomes and accreditation.",
        ],
        links: [
          { text: "GI Bill Info (VA)", url: "https://www.va.gov/education" },
          { text: "Federal Student Aid", url: "https://studentaid.gov" },
          { text: "MyCAA", url: "https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship" },
        ],
      },
      {
        title: "Paying Off Student Loans",
        content: [
          "Managing student loan debt while serving requires knowledge of military-specific options that can save you thousands.",
          "**Step 1 — Know where you stand:** Determine your total balance, identify all loan servicers, check variable due dates, and understand whether your loans are federal or private.",
          "**Federal loan types:** Direct Subsidized, Direct Unsubsidized, Direct PLUS, Direct Consolidation (also called Stafford Loans). Perkins Loans are smaller need-based loans from the school.",
          "**Private loans:** Offered by banks, credit unions, and colleges — usually more expensive and less flexible.",
          "**Military-specific management options:**",
          "• SCRA 6% Interest Cap — Caps interest at 6% on ALL pre-service debt (federal AND private student loans) during active duty",
          "• HEROES Act — Zero interest on federal student loans while receiving HFP/IDP",
          "• Public Service Loan Forgiveness (PSLF) — Military service qualifies. After 120 qualifying payments on an IDR plan, remaining balance forgiven",
          "• Income-Driven Repayment (IDR) — Payments based on income, not loan balance",
          "• Deferment — Loans may be deferred during certain periods of service",
          "**Key actions:**",
          "• Stay current with loan payments — delinquency and default hurt credit, housing, and security clearance",
          "• Set up automatic payments for a potential interest rate reduction",
          "• Build a spending plan that accounts for student loan payments",
          "• Contact your servicer to invoke SCRA or apply for IDR/PSLF",
        ],
        links: [
          { text: "Federal Student Aid", url: "https://studentaid.gov" },
          { text: "PSLF Info", url: "https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service" },
          { text: "SCRA for Student Loans", url: "https://www.militaryonesource.mil/financial-legal/legal/scra" },
        ],
      },
      {
        title: "Entitlement to Continuation Pay",
        content: [
          "Continuation Pay (CP) is a one-time midcareer bonus under the BRS, paid in exchange for additional obligated service.",
          "**Key details:**",
          "• Payable between 8 and 12 years of service (currently at year 12 for most services)",
          "• Each service determines the pay-rate multiplier and timing annually",
          "• It IS taxable earned income (federal, state, and local)",
          "• CZTE applies if received while deployed to a combat zone",
          "**What to do with your CP:**",
          "• Pay down high-interest debt",
          "• Build or strengthen your emergency fund",
          "• Invest it — TSP, IRA, or 529 college savings plan",
          "• Talk to a PFM/PFC about your specific situation",
          "**TSP considerations:** CP can be invested in TSP, but is NOT subject to matching contributions and cannot exceed the annual IRS contribution limit. Plan carefully to avoid exceeding limits for the year.",
          "**Warning:** Failure to complete obligated service or maintain skill qualifications may require repayment of some or all continuation pay.",
        ],
        links: [
          { text: "BRS Overview", url: "https://militarypay.defense.gov/BlendedRetirement" },
          { text: "TSP.gov", url: "https://www.tsp.gov" },
        ],
      },
    ],
  },
  {
    id: "saving-investing",
    icon: "📈",
    title: "Saving & Investing",
    subtitle: "TSP, Basic Investing & Wealth Building",
    color: "#1A535C",
    accent: "#4ECDC4",
    topics: [
      {
        title: "Thrift Savings Plan (TSP)",
        content: [
          "The TSP is a retirement savings and investment plan — like a civilian 401(k) — with some of the lowest fees in the industry.",
          "**TSP Funds:**",
          "• G Fund — Government securities (lowest risk, no market risk)",
          "• F Fund — Fixed income / bond index (Bloomberg U.S. Aggregate Bond)",
          "• C Fund — S&P 500 large/mid-cap stock index",
          "• S Fund — Small-cap stock index (Dow Jones U.S. Completion TSM)",
          "• I Fund — International stock index (MSCI EAFE)",
          "• L Funds — Lifecycle funds (auto-adjust allocation based on target retirement date)",
          "**Traditional vs. Roth TSP:**",
          "• Traditional: Pretax contributions, taxed at withdrawal",
          "• Roth: After-tax contributions, tax-free qualified withdrawals",
          "**BRS Matching (contribute 5% to maximize):**",
          "• 0% → 1% auto only | 3% → 7% total | 5% → 10% total",
          "**New features:** TSP mobile app, mutual fund window ($40K+ balance), biometric login.",
          "**Critical:** Auto enrollment is 5% of base pay. If you're not contributing at least 5%, you're leaving free money on the table.",
          "**Important:** This is educational information, not investment advice.",
        ],
        links: [
          { text: "TSP.gov", url: "https://www.tsp.gov" },
          { text: "TSP Fund Performance", url: "https://www.tsp.gov/fund-performance" },
          { text: "TSP How to Invest", url: "https://www.tsp.gov/how-to-invest" },
        ],
      },
      {
        title: "Basic Investing",
        content: [
          "Investing is using money to try to make a profit or produce income. It exposes money to risk in hopes of earning greater returns than savings alone.",
          "**Three basic investment types:**",
          "• Equities (Stocks) — Ownership in a company. Higher risk, higher potential return. Value may go up or down.",
          "• Bonds — Loans to governments or corporations. Lower risk, fixed interest. Corporate bonds pay more than government bonds.",
          "• Cash equivalents — Savings accounts, money markets, CDs. Lowest risk but may not keep up with inflation.",
          "**Investment funds:** Mutual funds and ETFs bundle many investments together, providing diversification. Professional managers select the mix.",
          "**The power of compound interest:** $200/month at 8% for 45 years (age 20-65) = $1,054,908. Starting at 35 instead? Only $298,072. Time is your greatest asset.",
          "**Helpful strategies:**",
          "• Dollar cost averaging — invest consistently regardless of market conditions",
          "• Invest for the long term — use time, not timing",
          "• Facts over emotion — don't let headlines drive decisions",
          "• Diversify — don't put all your eggs in one basket",
          "• Beware of risky investments until you have a solid foundation",
          "• Avoid chasing performance — last year's winner may be next year's loser",
          "• Evaluate annually — rebalance to match your goals and risk tolerance",
          "**Disclaimer:** This is general education, not investment advice or a recommendation of any specific securities.",
        ],
        links: [
          { text: "SEC Investor.gov", url: "https://www.investor.gov" },
          { text: "Compound Interest Calculator", url: "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator" },
          { text: "FINRA Investor Education", url: "https://www.finra.org" },
        ],
      },
    ],
  },
  {
    id: "retirement",
    icon: "📋",
    title: "Military Retirement",
    subtitle: "BRS, Legacy, SBP & Estate Planning",
    color: "#3C1642",
    accent: "#C77DFF",
    topics: [
      {
        title: "Military Retirement",
        content: [
          "The military offers retirement benefits through two systems. Understanding yours is critical.",
          "**Blended Retirement System (BRS) — Joined after Jan 1, 2018:**",
          "• Pension: 2.0% x Years Served x Avg Highest 36 Months Base Pay",
          "• TSP: 1% automatic + up to 4% matching (5% total when you contribute 5%)",
          "• Continuation Pay: One-time midcareer bonus",
          "• Lump-Sum Option: Elect 25% or 50% at retirement (reduced monthly pay until age 67)",
          "• ~85% of BRS members receive some retirement benefit (vs ~17% under Legacy)",
          "**Legacy High-3 System — Joined before Jan 1, 2018 (did not opt-in):**",
          "• Pension: 2.5% x Years Served x Avg Highest 36 Months Base Pay",
          "• Requires minimum 20 years for pension eligibility",
          "• No automatic or matching TSP contributions from government",
          "• TSP available but entirely self-funded",
          "**Guard/Reserve:** Generally eligible after 20 qualifying years at age 60. Points-based system. May qualify earlier based on active duty service.",
          "**COLA adjustments:** Pensions are adjusted annually for inflation, maintaining purchasing power.",
          "**Key message:** Start planning now — even if retirement seems distant. Time and compound growth are your greatest advantages.",
        ],
        links: [
          { text: "BRS Calculator", url: "https://militarypay.defense.gov/Calculators/BRS" },
          { text: "BRS Overview", url: "https://militarypay.defense.gov/BlendedRetirement" },
          { text: "Retirement Info", url: "https://militarypay.defense.gov/Pay/Retirement" },
        ],
      },
      {
        title: "Survivor Benefit Overview",
        content: [
          "The Survivor Benefit Plan (SBP) ensures your family continues to receive income if you die.",
          "**Active Duty SBP:**",
          "• Automatic, no-cost coverage while on active duty",
          "• Provides up to 55% of estimated retired pay to eligible beneficiaries",
          "• Reserve component members who die of a service-connected cause during inactive duty training are also covered",
          "**SBP at Retirement:**",
          "• You can purchase coverage — premiums deducted from pretax retired pay",
          "• Coverage provides up to 55% of retired pay to survivors",
          "• Election must be made at retirement — difficult to change later",
          "**SGLI (Servicemembers' Group Life Insurance):**",
          "• Up to $500,000 in coverage at very low cost",
          "• Keep beneficiary designations current — a will does NOT override SGLI",
          "• FSGLI for spouses — not automatic, cost varies by age",
          "**Key principles:**",
          "• Update beneficiaries after every major life event (marriage, divorce, birth, death)",
          "• SGLI and TSP beneficiary designations override your will",
          "• Review coverage annually and before deployments",
          "• Understand the difference between SGLI (active coverage) and VGLI (post-separation conversion)",
        ],
        links: [
          { text: "SBP Information", url: "https://militarypay.defense.gov/benefits/survivor-benefit-program" },
          { text: "SGLI Info (VA)", url: "https://www.va.gov/life-insurance/options-eligibility/sgli" },
        ],
      },
      {
        title: "Estate Planning",
        content: [
          "Estate planning isn't just for the wealthy — every service member needs these documents.",
          "**Essential documents:**",
          "• Will — Determines how your assets are distributed",
          "• Power of Attorney (POA) — Authorizes someone to act on your behalf",
          "• Healthcare Directive / Living Will — States your medical wishes",
          "• Trust — Can provide more control over asset distribution",
          "**Why it's urgent for military:**",
          "• Deployments can happen with little notice",
          "• SGLI and TSP beneficiary designations override your will",
          "• POAs are critical for spouses managing affairs during deployment",
          "• Update all documents after marriage, divorce, birth, or death",
          "**Action steps:**",
          "• Visit your installation legal assistance office (free)",
          "• Review and update beneficiary designations on ALL accounts",
          "• Ensure your spouse/designee has access to financial documents",
          "• Store originals securely and provide copies to trusted individuals",
          "• Reassess annually and after every major life event",
        ],
        links: [
          { text: "Legal Assistance Locator", url: "https://legalassistance.law.af.mil" },
          { text: "FINRED Estate Planning", url: "https://finred.usalearning.gov/Planning/POAMilitary" },
        ],
      },
    ],
  },
  {
    id: "major-purchases",
    icon: "🏠",
    title: "Major Purchases",
    subtitle: "Cars, Homes & Smart Buying",
    color: "#6B2737",
    accent: "#FF8FA3",
    topics: [
      {
        title: "Major Purchases & Car Buying",
        content: [
          "A vehicle is often the second-largest purchase you'll make. Smart strategies save thousands.",
          "**Before you shop:**",
          "• Know your budget — what monthly payment fits your spending plan?",
          "• Check your credit score — it directly affects your interest rate",
          "• Get pre-approved from your bank or credit union BEFORE visiting a dealer",
          "• Research the vehicle's fair market value",
          "**At the dealership:**",
          "• Negotiate the total price, not the monthly payment",
          "• Read every document before signing",
          "• Don't feel pressured — you can always walk away",
          "• Watch for overpriced add-ons: extended warranties, paint protection, gap insurance",
          "**New vs. Used:** New cars depreciate 20-30% in the first year. Certified pre-owned can be a good middle ground. For used: get a vehicle history report and independent inspection.",
          "**Financing red flags:**",
          "• Interest rates above 10%",
          "• Loan terms beyond 60 months — you'll likely be upside down",
          "• \"E-1 and above!\" dealers near base — often predatory",
          "**MLA protection:** Active-duty members cannot be charged more than 36% MAPR.",
        ],
        links: [
          { text: "FINRED Car Buying", url: "https://finred.usalearning.gov/Money/CarBuyingBasics" },
          { text: "FTC Used Car Guide", url: "https://consumer.ftc.gov/articles/buying-used-car-dealer" },
        ],
      },
      {
        title: "Five Rules of Buying a House",
        content: [
          "Home ownership can build wealth, but it's a major commitment requiring careful planning.",
          "**Rule 1 — Have an Emergency Fund:** Home ownership comes with unexpected costs. Have 3-6 months of expenses saved.",
          "**Rule 2 — Follow a Spending Plan:** A house isn't just swapping rent for a mortgage. Add property taxes, homeowners insurance, utilities, maintenance, and potentially life insurance.",
          "**Rule 3 — Save for a Down Payment:** Even with a VA loan (zero down), having savings builds equity and protects against owing more than the home is worth.",
          "**Rule 4 — Consider Job Security:** Limit housing to BAH or 25% of gross income. Military income is stable, but you may PCS.",
          "**Rule 5 — Keep the House Long-Term:** Getting stuck with a home during PCS is a major financial blow. Plan for 3-4+ years minimum.",
          "**VA Loan advantages:** No down payment, no PMI, competitive rates. But zero down means zero equity initially.",
          "**HUD Counseling:** Free or low-cost homebuyer counseling available nationwide.",
        ],
        links: [
          { text: "HUD Housing Counseling", url: "https://www.hud.gov/counseling" },
          { text: "VA Home Loans", url: "https://www.va.gov/housing-assistance/home-loans" },
        ],
      },
    ],
  },
  {
    id: "military-life",
    icon: "🌟",
    title: "Military Life Events",
    subtitle: "PCS, Deployment & Transition",
    color: "#2B2D42",
    accent: "#8D99AE",
    topics: [
      {
        title: "Estimated Travel Costs for a PCS Move",
        content: [
          "Understanding your PCS entitlements and estimating out-of-pocket costs prevents financial surprises.",
          "**PCS Income / Entitlements:**",
          "• Dislocation Allowance (DLA) — One-time payment to offset moving costs",
          "• Per Diem / Mileage (MALT rate) — Reimbursement for travel",
          "• Advance Pay — Up to 3 months base pay (must be repaid)",
          "• TLE (CONUS) / TLA (OCONUS) — Temporary lodging expenses",
          "• BAH at new duty station rate",
          "**Estimated expenses to budget:**",
          "• Pre-move: Cleaning, disconnecting services, pet shipping, vehicle prep",
          "• In transit: Fuel (~$21 per 100 miles), lodging ($120-150/night), meals (~$50/person/day)",
          "• At destination: Security deposits, utility deposits, restocking household supplies",
          "• Potential weight overages if exceeding authorized limits",
          "**PPM (Personally Procured Move):** You can earn money by moving yourself — get weight tickets and save all receipts. The reimbursement can be significant.",
          "**Save all receipts:** Some expenses may be reimbursable under the Joint Travel Regulations (JTR).",
        ],
        links: [
          { text: "Joint Travel Regulations", url: "https://www.defensetravel.dod.mil" },
          { text: "FINRED Home", url: "https://finred.usalearning.gov" },
        ],
      },
      {
        title: "Financial Planning Worksheet for a PCS Move",
        content: [
          "Use this framework to build a complete financial plan for your PCS move.",
          "**Step 1 — Estimate total PCS income:**",
          "• DLA amount (look up current rates by rank and dependency)",
          "• Per Diem and mileage for travel days",
          "• TLE/TLA days authorized",
          "• Any advance pay requested",
          "**Step 2 — Estimate total PCS expenses:**",
          "• Old location: Lease termination fees, cleaning, deposits lost, utility shutoffs, pet boarding/transport",
          "• Travel: Fuel, tolls, lodging, food, vehicle maintenance",
          "• New location: Security deposits, utility connections, restocking, temporary furniture, school registration fees",
          "**Step 3 — Calculate the gap:** Subtract expenses from income. If expenses exceed income, determine how to cover the gap (savings, credit, adjust plans).",
          "**Step 4 — Update your spending plan:** Your BAH, cost of living, utilities, and commute costs may all change. Rebuild your monthly budget from scratch at the new duty station.",
          "**Step 5 — Check credit before house hunting:** Pull your reports, dispute errors, and know your score before applying for leases or mortgages.",
          "**Pro tip:** Start planning financially for your PCS 60-90 days before your report date. The earlier you plan, the less stressful the move.",
        ],
        links: [
          { text: "BAH Calculator", url: "https://www.defensetravel.dod.mil/site/bahCalc.cfm" },
          { text: "FINRED Home", url: "https://finred.usalearning.gov" },
        ],
      },
      {
        title: "Deployment & Transition Planning",
        content: [
          "Deployment and transition are major financial events. Planning ahead protects your family and your future.",
          "**Pre-Deployment checklist:**",
          "• Update spending plan — estimate savings from reduced expenses",
          "• Set up automatic bill payments",
          "• Place active-duty alerts or credit freezes on credit reports",
          "• Update POAs, wills, and beneficiary designations",
          "• Ensure spouse/designee has account access and documents",
          "• Suspend services you won't use (gym, streaming, etc.)",
          "**CZTE opportunity:** In a combat zone, maximize Roth TSP — tax-free money that grows tax-free forever.",
          "**Transition from military:**",
          "• Build 6+ months emergency fund before separating",
          "• Healthcare is a major new expense — TAMP provides 180 days of transitional TRICARE",
          "• Don't cash out your TSP — roll it or leave it growing",
          "• Use cost-of-living calculators for your target civilian location",
          "• PFCs can work with you up to 365 days post-separation",
          "**TAP (Transition Assistance Program):** Mandatory for all separating members. Includes financial planning curriculum from OSD FINRED.",
          "**Check credit before transition:** Your score is critical for civilian housing, car loans, and employment.",
        ],
        links: [
          { text: "VA Benefits Overview", url: "https://www.va.gov/resources" },
          { text: "Military OneSource", url: "https://www.militaryonesource.mil" },
        ],
      },
    ],
  },
  {
    id: "security-clearance",
    icon: "🔐",
    title: "Security Clearance",
    subtitle: "Protecting Your Career & Clearance",
    color: "#212529",
    accent: "#ADB5BD",
    topics: [
      {
        title: "Finances & Your Security Clearance",
        content: [
          "Your financial behavior directly impacts your ability to obtain and maintain a security clearance.",
          "**Per DoDI 1344.09:** Service members must pay just debts. Financial irresponsibility raises concerns about reliability, trustworthiness, and capacity to safeguard classified information.",
          "**Behaviors that trigger concerns:**",
          "• Delinquent debts (collections, charge-offs)",
          "• Failure to file or pay taxes",
          "• Gambling issues",
          "• Pattern of emergency loans from relief societies",
          "**Mitigating factors:**",
          "• Financial problem was beyond your control (medical, divorce, identity theft)",
          "• You acted responsibly under the circumstances",
          "• You are receiving financial counseling and the problem is being resolved",
          "• You initiated good-faith efforts to repay creditors",
          "**Response timelines:** SIR/LOI/SOR/SSOR: 30 days. LOD/LOR: 10-day NOIA + 30-day appeal.",
          "**Critical:** Debts dropping off your credit report do NOT mitigate the concern. You must demonstrate active resolution.",
          "**Meet with a PFC immediately** if you receive any security inquiry — free, confidential help preparing your response.",
        ],
        links: [
          { text: "Find a PFC", url: "https://finred.usalearning.gov/pfcMap" },
          { text: "Free Credit Report", url: "https://www.annualcreditreport.com" },
        ],
      },
    ],
  },
  {
    id: "social-security",
    icon: "📞",
    title: "Social Security & Resources",
    subtitle: "SSA Benefits & Additional Support",
    color: "#023E8A",
    accent: "#48CAE4",
    topics: [
      {
        title: "Social Security & Military Service",
        content: [
          "Your military service counts toward Social Security benefits.",
          "**Key facts:**",
          "• You earn Social Security credits while on active duty (FICA taxes on base pay)",
          "• Special additional earnings credits may apply for service before 2002",
          "• You can receive both military retirement pay AND Social Security",
          "**When to start:**",
          "• Age 62: Earliest (reduced benefit)",
          "• Age 66-67: Full Retirement Age (depends on birth year)",
          "• Age 70: Maximum benefit (delayed retirement credits)",
          "**Disability:** Service-connected disability may qualify for SSDI in addition to VA disability. Wounded warriors receive expedited processing.",
          "**Check your estimate:** Create an account at ssa.gov/myaccount.",
        ],
        links: [
          { text: "SSA My Account", url: "https://www.ssa.gov/myaccount" },
          { text: "SSA Military Info", url: "https://www.ssa.gov/people/military" },
          { text: "SSA Retirement Estimator", url: "https://www.ssa.gov/prepare/plan-retirement" },
        ],
      },
    ],
  },
  {
    id: "digital-assets",
    icon: "₿",
    title: "Digital Assets & Precious Metals",
    subtitle: "Crypto, Gold, Silver & Sound Money",
    color: "#B45309",
    accent: "#F59E0B",
    topics: [
      {
        title: "Bitcoin & Cryptocurrency Education",
        content: [
          "Cryptocurrency is a rapidly evolving asset class. As a service member, understanding the basics protects you from scams and helps you make informed decisions.",
          "**What is Bitcoin?** Bitcoin was introduced in 2008 via a whitepaper by the pseudonymous Satoshi Nakamoto. It is a decentralized peer-to-peer electronic cash system — meaning no bank or government controls it.",
          "**Key concepts:**",
          "• Blockchain — A public, immutable ledger recording all transactions",
          "• Mining — The process of validating transactions and adding them to the blockchain",
          "• Wallets — Software or hardware that stores your private keys",
          "• Limited supply — Only 21 million Bitcoin will ever exist",
          "**Other cryptocurrencies:** Ethereum (smart contracts), stablecoins (pegged to USD), and thousands of altcoins with varying levels of risk.",
          "**Risks for service members:**",
          "• Extreme volatility — values can swing 20-50% in days",
          "• Scams targeting military members are increasing",
          "• Tax reporting requirements apply — the IRS treats crypto as property",
          "• Losses can impact your financial readiness and security clearance",
          "**Security clearance note:** Unreported crypto holdings or significant losses could raise concerns during clearance adjudication. Transparency is key.",
          "**Bottom line:** Crypto is speculative. Never invest money you cannot afford to lose. If you invest, use only a small percentage of your portfolio and understand the tax implications.",
          "**Read the original:** The Bitcoin whitepaper is freely available and is recommended reading for understanding the technology.",
        ],
        links: [
          { text: "Bitcoin Whitepaper (PDF)", url: "https://bitcoin.org/bitcoin.pdf" },
          { text: "SEC Crypto Investor Alerts", url: "https://www.sec.gov/spotlight/cybersecurity" },
          { text: "IRS Virtual Currency FAQ", url: "https://www.irs.gov/individuals/international-taxpayers/frequently-asked-questions-on-virtual-currency-transactions" },
          { text: "CFPB Crypto Warnings", url: "https://www.consumerfinance.gov/about-us/blog/what-know-about-cryptocurrency-and-scams/" },
        ],
      },
      {
        title: "Gold, Silver & Sound Money",
        content: [
          "Gold and silver have served as stores of value for over 5,000 years. Understanding their role can add perspective to your financial education.",
          "**Gold as money — a brief history:**",
          "• Ancient civilizations used gold as currency and a store of value",
          "• The U.S. dollar was backed by gold until 1971 (end of Bretton Woods)",
          "• Central banks worldwide still hold gold reserves (the U.S. holds ~8,133 tons at Fort Knox)",
          "• Gold has maintained purchasing power over centuries — an ounce of gold bought a quality suit in 1900 and still does today",
          "**Silver — the people's money:**",
          "• Silver has historically served as day-to-day currency (coins)",
          "• Industrial demand (electronics, solar panels) adds a unique demand component",
          "• More affordable entry point than gold for new investors",
          "**Why some investors hold precious metals:**",
          "• Hedge against inflation — historically holds value when currencies weaken",
          "• Portfolio diversification — often moves independently of stocks and bonds",
          "• No counterparty risk — physical metals have no default risk",
          "• Tangible asset — cannot be erased digitally",
          "**Considerations:**",
          "• Metals do NOT produce income (no dividends or interest)",
          "• Storage and insurance costs for physical metals",
          "• Price can be volatile in the short term",
          "• Premiums above spot price when buying physical coins/bars",
          "**Ways to invest:** Physical coins/bars, ETFs (like GLD, SLV), mining stocks. Each has different risk profiles.",
          "**Disclaimer:** This is educational information, not investment advice. Consult a qualified financial advisor before making investment decisions.",
        ],
        links: [
          { text: "US Mint", url: "https://www.usmint.gov" },
          { text: "Kitco Live Prices", url: "https://www.kitco.com" },
          { text: "World Gold Council", url: "https://www.gold.org" },
        ],
      },
    ],
  },
  {
    id: "rates-data",
    icon: "📊",
    title: "Rates & Market Data",
    subtitle: "Current Rates, Inflation & Economic Data",
    color: "#065F46",
    accent: "#34D399",
    topics: [
      {
        title: "Current Rates & Where to Compare",
        content: [
          "Knowing current rates helps you make informed decisions about saving, borrowing, and investing.",
          "**As of February 2026 (rates change daily — verify before acting):**",
          "• Federal Funds Rate: 3.50% - 3.75% (Fed held steady Jan 2026)",
          "• CPI Inflation Rate: 2.4% annual (Jan 2026 — lowest since May)",
          "• 30-Year VA Mortgage: ~5.25% - 6.30% depending on lender and credit",
          "• 15-Year VA Mortgage: ~4.75% - 5.63%",
          "• Best HYSA Rates: Up to 4.00% - 5.00% APY",
          "• 1-Year CD Rates: Up to 4.00% - 4.15% APY",
          "• National Savings Average: 0.39% APY (FDIC)",
          "**Key insight:** If your savings rate is below the inflation rate of 2.4%, your money is losing purchasing power. An HYSA or CD can help close that gap.",
          "**VA Loan advantage:** VA loans typically offer rates 0.25-0.50% lower than conventional mortgages, PLUS no PMI and no down payment required.",
          "**Where to compare rates:**",
          "• Bankrate.com — Comprehensive rate comparisons for mortgages, savings, CDs",
          "• NerdWallet.com — Side-by-side product comparisons",
          "• Investor.gov — SEC compound interest and savings calculators",
          "• FRED (Federal Reserve Economic Data) — Official economic data",
          "**HYSA vs. CD vs. Inflation:** Use the calculator in this app to compare how your savings grow at different rates against inflation.",
        ],
        links: [
          { text: "Bankrate Savings Rates", url: "https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts" },
          { text: "VA Loan Rates (Bankrate)", url: "https://www.bankrate.com/mortgages/va-loan-rates" },
          { text: "Bankrate CD Rates", url: "https://www.bankrate.com/banking/cds/best-cd-rates" },
          { text: "FRED Economic Data", url: "https://fred.stlouisfed.org" },
          { text: "US Debt Clock", url: "https://www.usdebtclock.org" },
          { text: "BLS Inflation Calculator", url: "https://www.bls.gov/data/inflation_calculator.htm" },
        ],
      },
    ],
  },
  {
    id: "credit-freeze",
    icon: "🧊",
    title: "Credit Bureau Actions",
    subtitle: "Freeze, Alerts & Direct Bureau Links",
    color: "#1E3A5F",
    accent: "#60A5FA",
    topics: [
      {
        title: "Credit Freeze & Fraud Alert Links",
        content: [
          "Protecting your credit is critical — especially before deployment. Here are the direct links to freeze your credit and set up fraud alerts at all three bureaus.",
          "**Credit Freeze (Security Freeze):**",
          "• Prevents new accounts from being opened in your name",
          "• FREE to place, temporarily lift, or remove since 2018",
          "• Does NOT affect your credit score",
          "• You MUST freeze at all three bureaus separately",
          "• Recommended before every deployment",
          "**Fraud Alert:**",
          "• Requires creditors to verify your identity before opening new accounts",
          "• Active-Duty Alert: FREE, lasts 1 year, renewable — designed for deploying service members",
          "• You only need to contact ONE bureau — they are required to notify the other two",
          "**Extended Fraud Alert:** For identity theft victims, lasts 7 years.",
          "**How to use these links below:**",
          "• Equifax: equifax.com/personal/credit-report-services/credit-freeze",
          "• Experian: experian.com/freeze/center.html",
          "• TransUnion: transunion.com/credit-freeze",
          "**Active-Duty Alerts contact numbers:**",
          "• Equifax: 1-800-525-6285",
          "• Experian: 1-888-397-3742",
          "• TransUnion: 1-800-680-7289",
          "**Pro tip:** Create accounts at all three bureaus NOW — don't wait until you need them. Set up free credit monitoring through your bank or military benefit programs.",
        ],
        links: [
          { text: "Equifax — Freeze Credit", url: "https://www.equifax.com/personal/credit-report-services/credit-freeze" },
          { text: "Experian — Freeze Credit", url: "https://www.experian.com/freeze/center.html" },
          { text: "TransUnion — Freeze Credit", url: "https://www.transunion.com/credit-freeze" },
          { text: "Free Credit Reports", url: "https://www.annualcreditreport.com" },
          { text: "FTC Identity Theft", url: "https://www.identitytheft.gov" },
        ],
      },
    ],
  },
];



/* ═══════════════════
   SEARCH ENGINE (weighted version below, near App component)
   ═══════════════════ */

/* ═══════════════════════════════════════
   CALCULATOR DEFINITIONS & COMPONENTS
   ═══════════════════════════════════════ */
const CALCS = [
  { id: "tsp", icon: "🏦", title: "TSP Growth Projector", desc: "See your TSP grow with BRS matching", color: "#1B4332", accent: "#95D5B2" },
  { id: "compound", icon: "📈", title: "Compound Interest", desc: "Visualize how your money multiplies", color: "#0D3B66", accent: "#7FC8F8" },
  { id: "debt", icon: "💳", title: "Debt Payoff Planner", desc: "Snowball or avalanche — crush your debt", color: "#6B2737", accent: "#FF8FA3" },
  { id: "loan", icon: "🚗", title: "Loan / Car Payment", desc: "Calculate your true monthly cost", color: "#5C4033", accent: "#F4A261" },
  { id: "emergency", icon: "🛟", title: "Emergency Fund Goal", desc: "How much safety net do you need?", color: "#1A535C", accent: "#4ECDC4" },
  { id: "roth", icon: "⚖️", title: "Roth vs Traditional TSP", desc: "Compare tax strategies side by side", color: "#3C1642", accent: "#C77DFF" },
  { id: "reserve", icon: "🎖️", title: "Reserve/Guard Retirement", desc: "Points-based retirement pay estimator", color: "#1e3a5f", accent: "#7FC8F8" },
  { id: "sdp", icon: "💰", title: "Savings Deposit Program", desc: "10% guaranteed return on combat savings", color: "#78350f", accent: "#F59E0B" },
  { id: "deployment", icon: "🪖", title: "Deployment Pay Estimator", desc: "Total compensation during deployment", color: "#14532d", accent: "#86efac" },
];

/* ── §992 Career Touchpoints — maps content to statutory training milestones ── */
const TOUCHPOINTS = [
  { id: "tp1", code: "TP1", title: "Initial Entry", sub: "Basic Training", calcs: ["emergency"], secs: ["foundations", "banking-credit"] },
  { id: "tp2", code: "TP2", title: "First Duty Station", sub: "Arrival at PDS", calcs: ["loan", "debt", "emergency"], secs: ["foundations", "major-purchases", "compensation"] },
  { id: "tp3", code: "TP3", title: "PCS Move", sub: "Permanent Change", calcs: ["emergency"], secs: ["military-life", "major-purchases"] },
  { id: "tp4", code: "TP4", title: "Promotion", sub: "Rank Advance", calcs: ["tsp", "compound"], secs: ["compensation", "saving-investing"] },
  { id: "tp5", code: "TP5", title: "TSP Vesting", sub: "2 Yrs Service", calcs: ["tsp", "roth"], secs: ["saving-investing", "retirement"] },
  { id: "tp6", code: "TP6", title: "Continuation Pay", sub: "8-12 Yrs", calcs: ["compound", "debt"], secs: ["compensation"] },
  { id: "tp7", code: "TP7", title: "Major Life Events", sub: "Marriage/Birth/Divorce", calcs: ["emergency", "loan"], secs: ["retirement", "foundations"] },
  { id: "tp8", code: "TP8", title: "Leadership Training", sub: "NCO/Officer", calcs: [], secs: ["security-clearance"] },
  { id: "tp9", code: "TP9", title: "Deployment", sub: "Pre/Post Cycle", calcs: ["roth", "debt"], secs: ["consumer-protection", "military-life"] },
  { id: "tp10", code: "TP10", title: "Transition", sub: "Separation/Retirement", calcs: ["tsp", "compound"], secs: ["retirement", "social-security"] },
];

/* ── xAPI Learning Record Store (LRS) ── */
function useLRS() {
  const [stmts, setStmts] = usePersistedState("lrs-v7", []);
  const record = useCallback((verb, objectId, ctx = {}) => {
    setStmts(prev => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), v: verb, o: objectId, c: ctx, ts: new Date().toISOString() }]);
  }, [setStmts]);
  return { stmts, record };
}

/* ── §992 Compliance Progress Engine ── */
function useProgress() {
  const { stmts, record } = useLRS();
  const completed = useMemo(() => {
    const set = new Set();
    stmts.forEach(s => { if (s.v === "completed") set.add(s.o); });
    return set;
  }, [stmts]);
  const toggle = useCallback((tpId, itemId) => {
    buzz();
    record("completed", itemId, { tp: tpId });
  }, [record]);
  const tpStats = useCallback((tp) => {
    const items = [...(tp.calcs || []).map(id => `calc:${id}`), ...(tp.secs || []).map(id => `sec:${id}`)];
    const done = items.filter(id => completed.has(id)).length;
    const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
    return { done, total: items.length, pct };
  }, [completed]);
  const globalScore = useCallback(() => {
    let tot = 0, done = 0;
    TOUCHPOINTS.forEach(tp => { const s = tpStats(tp); tot += s.total; done += s.done; });
    return tot > 0 ? Math.round((done / tot) * 100) : 0;
  }, [tpStats]);
  return { completed, toggle, tpStats, globalScore, record };
}
function fmt(n) { return n >= 1000000 ? "$" + (n / 1000000).toFixed(2) + "M" : "$" + Math.round(n).toLocaleString(); }
function fmtFull(n) { return "$" + Math.round(n).toLocaleString(); }

function NumInput({ label, value, onChange, prefix, suffix, min, max, step, theme }) {
  const [raw, setRaw] = useState(String(value));
  const [warn, setWarn] = useState("");
  const id = useMemo(() => "ni-" + label.replace(/\s+/g, "-").toLowerCase(), [label]);
  useEffect(() => { setRaw(String(value)); }, [value]);
  const handleChange = (e) => {
    const v = e.target.value;
    if (v !== "" && !/^-?\d*\.?\d*$/.test(v)) return;
    setRaw(v); setWarn("");
    if (v === "" || v === "-" || v === ".") return;
    const n = Number(v);
    if (!isNaN(n)) onChange(n);
  };
  const handleBlur = () => {
    if (raw === "" || raw === "-" || raw === ".") { onChange(min || 0); setRaw(String(min || 0)); }
    else {
      let n = Number(raw);
      if (isNaN(n)) { n = min || 0; setWarn("Invalid number"); }
      if (min !== undefined && n < min) { n = min; setWarn(`Min: ${min}`); }
      if (max !== undefined && n > max) { n = max; setWarn(`Max: ${max}`); }
      onChange(n); setRaw(String(n));
    }
  };
  const t = theme || {};
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, color: t.text3 || "#9CA3AF", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {prefix && <span aria-hidden="true" style={{ fontSize: 14, color: t.text2 || "#6B7280", fontWeight: 600 }}>{prefix}</span>}
        <input id={id} type="text" inputMode="decimal" value={raw} onChange={handleChange} onBlur={handleBlur}
          onFocus={e => e.target.select()}
          aria-label={`${label}${prefix ? ` in ${prefix === "$" ? "dollars" : prefix}` : ""}${suffix ? ` ${suffix}` : ""}`}
          aria-invalid={warn ? "true" : undefined}
          aria-describedby={warn ? `${id}-warn` : undefined}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: "inherit", outline: "none", width: "100%", background: t.inputBg, border: `1px solid ${t.inputBdr || "rgba(255,255,255,0.1)"}`, color: t.text }} />
        {suffix && <span aria-hidden="true" style={{ fontSize: 12, color: t.text2 || "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
      {warn && <div id={`${id}-warn`} role="alert" style={{ fontSize: 10, color: "#F59E0B", marginTop: 3 }}>{warn}</div>}
    </div>
  );
}

function ResultCard({ label, value, color, sub, theme }) {
  const t = theme || {};
  return (
    <div style={{ background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: t.text3 || "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--font-serif)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: t.text2 || "#6B7280", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data, colors, labels, maxVal, theme }) {
  const t = theme || {};
  const mx = maxVal || Math.max(...data, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
      {data.map((v, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: t.text3 || "#9CA3AF", marginBottom: 3 }}>
            <span>{labels[i]}</span><span style={{ fontWeight: 700, color: colors[i] }}>{fmtFull(v)}</span>
          </div>
          <div style={{ height: 8, background: t.inputBg || "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (v / mx) * 100)}%`, background: `linear-gradient(90deg, ${colors[i]}CC, ${colors[i]})`, borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── TSP Growth Calculator (memoized, inflation toggle, accessible chart) ── */
function CalcTSP({ theme }) {
  const [basePay, setBasePay] = usePersistedState("calc-tsp-pay", 3600);
  const [pct, setPct] = usePersistedState("calc-tsp-pct", 5);
  const [years, setYears] = usePersistedState("calc-tsp-yrs", 20);
  const [rate, setRate] = usePersistedState("calc-tsp-rate", 7);
  const [existing, setExisting] = usePersistedState("calc-tsp-bal", 0);
  const [inflAdj, setInflAdj] = usePersistedState("calc-tsp-infl", false);

  const calc = useMemo(() => {
    const mon = safe(basePay) * (safe(pct) / 100);
    const am = Math.min(safe(pct), 5);
    const mp = am <= 0 ? 0 : am <= 3 ? am : 3 + (am - 3) * 0.5;
    const gt = 1 + mp;
    const gm = safe(basePay) * (gt / 100);
    const tm = mon + gm;
    const effRate = inflAdj ? Math.max(0, safe(rate) - 2.5) : safe(rate);
    const r = effRate / 100 / 12;
    const n = safe(years) * 12;
    const fut = safe(fvLump(safe(existing), r, n) + fvAnnuity(tm, r, n));
    const tc = (mon * n) + safe(existing);
    const tg = gm * n;
    const cd = [];
    const step = Math.max(1, Math.floor(safe(years) / 15));
    for (let y = 0; y <= safe(years); y += step) {
      const nm = y * 12;
      cd.push({ year: `Yr ${y}`, balance: Math.round(safe(fvLump(safe(existing), r, nm) + fvAnnuity(tm, r, nm))), contributed: Math.round((mon * nm) + safe(existing) + (gm * nm)) });
    }
    if (cd.length && cd[cd.length - 1].year !== `Yr ${safe(years)}`) cd.push({ year: `Yr ${safe(years)}`, balance: Math.round(fut), contributed: Math.round(tc + tg) });
    return { future: fut, totalContrib: tc, totalGov: tg, growth: safe(fut - tc - tg), govTotal: gt, matchPct: mp, chartData: cd };
  }, [basePay, pct, years, rate, existing, inflAdj]);

  return (
    <div>
      <NumInput label="Monthly Base Pay" value={basePay} onChange={setBasePay} prefix="$" min={0} theme={theme} />
      <NumInput label="Your TSP Contribution %" value={pct} onChange={v => setPct(Math.min(100, Math.max(0, v)))} suffix="% of base pay" min={0} max={100} theme={theme} />
      <NumInput label="Years to Grow" value={years} onChange={setYears} min={1} max={45} suffix="years" theme={theme} />
      <NumInput label="Assumed Annual Return" value={rate} onChange={setRate} suffix="%" min={0} max={15} theme={theme} />
      <NumInput label="Current TSP Balance" value={existing} onChange={setExisting} prefix="$" min={0} theme={theme} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <div role="switch" aria-checked={inflAdj} aria-label="Adjust for inflation" tabIndex={0}
            onClick={() => setInflAdj(!inflAdj)} onKeyDown={e => e.key === "Enter" && setInflAdj(!inflAdj)}
            style={{ width: 38, height: 22, borderRadius: 11, background: inflAdj ? "#F59E0B" : "rgba(255,255,255,0.12)", padding: 2, transition: "all 0.2s", display: "flex", alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#F9FAFB", transform: inflAdj ? "translateX(16px)" : "translateX(0)", transition: "all 0.2s" }} />
          </div>
          <span>Inflation-adjusted (−2.5% real return)</span>
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        <ResultCard label={inflAdj ? "Real Value (Today's $)" : "Projected Balance"} value={fmt(calc.future)} color="#95D5B2" sub={`in ${years} years`} theme={theme} />
        <ResultCard label="Gov't Contribution" value={fmt(calc.totalGov)} color="#4ECDC4" sub={`${calc.govTotal.toFixed(1)}% of base pay`} theme={theme} />
      </div>
      <MiniBar data={[calc.totalContrib, calc.totalGov, calc.growth]} colors={["#95D5B2", "#4ECDC4", "#7FC8F8"]} labels={["Your Contributions", "Gov't Auto + Match", "Investment Growth"]} theme={theme} />
      {calc.chartData.length > 2 && (
        <ChartFigure label="TSP growth projection chart" summary={`TSP projected to ${fmt(calc.future)} over ${years} years.`}>
          <div style={{ marginTop: 16, height: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Growth Projection{inflAdj ? " (Inflation-Adjusted)" : ""}</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={calc.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs><linearGradient id="tspGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#95D5B2" stopOpacity={0.3}/><stop offset="95%" stopColor="#95D5B2" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: theme.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: theme.text3 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ background: theme.bg2, border: `1px solid ${theme.cardBdr}`, borderRadius: 8, fontSize: 11, color: theme.text }} formatter={v => ["$" + v.toLocaleString()]} />
                <Area type="monotone" dataKey="contributed" stroke="#4ECDC4" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Contributed" />
                <Area type="monotone" dataKey="balance" stroke="#95D5B2" fill="url(#tspGrad)" strokeWidth={2} name="Total Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFigure>
      )}
      <div style={{ marginTop: 14, padding: 10, background: "rgba(149,213,178,0.08)", borderRadius: 8, border: "1px solid rgba(149,213,178,0.15)" }}>
        <p style={{ fontSize: 11, color: "#95D5B2", fontWeight: 600, marginBottom: 4 }}><Ico label="tip">💡</Ico> BRS Matching Tip</p>
        <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>At {pct}% contribution, the government adds {calc.govTotal.toFixed(1)}% (1% auto + {calc.matchPct.toFixed(1)}% match). {pct < 5 ? `Increase to 5% to get the FULL 5% match!` : "You're maximizing your match — great work!"}</p>
      </div>
    </div>
  );
}

/* ── Compound Interest (memoized, accessible chart) ── */
function CalcCompound({ theme }) {
  const [initial, setInitial] = usePersistedState("calc-comp-init", 1000);
  const [monthly, setMonthly] = usePersistedState("calc-comp-mo", 200);
  const [years, setYears] = usePersistedState("calc-comp-yrs", 20);
  const [rate, setRate] = usePersistedState("calc-comp-rate", 7);

  const calc = useMemo(() => {
    const r = safe(rate) / 100 / 12;
    const n = safe(years) * 12;
    const bal = safe(fvLump(safe(initial), r, n) + fvAnnuity(safe(monthly), r, n));
    const totalIn = safe(initial) + (safe(monthly) * n);
    const earn = safe(bal - totalIn);
    const ms = [5, 10, 15, 20, 25, 30].filter(y => y <= safe(years)).map(y => {
      const nm = y * 12;
      return { y, b: safe(fvLump(safe(initial), r, nm) + fvAnnuity(safe(monthly), r, nm)) };
    });
    const cd = [];
    const step = Math.max(1, Math.floor(safe(years) / 12));
    for (let y = 0; y <= safe(years); y += step) {
      const nm = y * 12;
      cd.push({ year: `Yr ${y}`, balance: Math.round(safe(fvLump(safe(initial), r, nm) + fvAnnuity(safe(monthly), r, nm))), contributed: Math.round(safe(initial) + (safe(monthly) * nm)) });
    }
    if (cd.length && cd[cd.length - 1].year !== `Yr ${safe(years)}`) cd.push({ year: `Yr ${safe(years)}`, balance: Math.round(bal), contributed: Math.round(totalIn) });
    return { bal, totalIn, earnings: earn, milestones: ms, chartData: cd };
  }, [initial, monthly, years, rate]);

  return (
    <div>
      <NumInput label="Starting Amount" value={initial} onChange={setInitial} prefix="$" min={0} theme={theme} />
      <NumInput label="Monthly Contribution" value={monthly} onChange={setMonthly} prefix="$" min={0} theme={theme} />
      <NumInput label="Years" value={years} onChange={setYears} min={1} max={45} suffix="years" theme={theme} />
      <NumInput label="Annual Interest Rate" value={rate} onChange={setRate} suffix="%" min={0} max={30} theme={theme} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        <ResultCard label="Future Value" value={fmt(calc.bal)} color="#7FC8F8" sub={`after ${years} years`} theme={theme} />
        <ResultCard label="Interest Earned" value={fmt(calc.earnings)} color="#4ECDC4" sub={`${calc.totalIn > 0 ? ((calc.earnings / calc.totalIn) * 100).toFixed(0) : 0}% return`} theme={theme} />
      </div>
      <MiniBar data={[calc.totalIn, calc.earnings]} colors={["#7FC8F8", "#4ECDC4"]} labels={["Total Contributed", "Interest Earned"]} theme={theme} />
      {calc.milestones.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Growth Milestones</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {calc.milestones.map(m => (
              <div key={m.y} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", textAlign: "center", flex: "1 0 28%", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#6B7280" }}>Year {m.y}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7FC8F8" }}>{fmt(m.b)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {calc.chartData.length > 2 && (
        <ChartFigure label="Compound interest growth chart" summary={`Grows to ${fmt(calc.bal)} over ${years} years. ${fmt(calc.earnings)} is from compound interest.`}>
          <div style={{ marginTop: 16, height: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Compound Growth Curve</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={calc.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs><linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7FC8F8" stopOpacity={0.3}/><stop offset="95%" stopColor="#7FC8F8" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: theme.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: theme.text3 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ background: theme.bg2, border: `1px solid ${theme.cardBdr}`, borderRadius: 8, fontSize: 11, color: theme.text }} formatter={v => ["$" + v.toLocaleString()]} />
                <Area type="monotone" dataKey="contributed" stroke="#4ECDC4" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Contributed" />
                <Area type="monotone" dataKey="balance" stroke="#7FC8F8" fill="url(#compGrad)" strokeWidth={2} name="Total Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFigure>
      )}
    </div>
  );
}

/* ── Debt Payoff Planner (with error guard) ── */
function CalcDebt({ theme }) {
  const [balance, setBalance] = usePersistedState("calc-debt-bal", 8000);
  const [apr, setApr] = usePersistedState("calc-debt-apr", 18);
  const [payment, setPayment] = usePersistedState("calc-debt-pmt", 300);

  const calc = useMemo(() => {
    const r = safe(apr) / 100 / 12;
    const minPay = r > 0 ? safe(balance) * r * 1.01 : 1;
    const eff = Math.max(safe(payment), Math.ceil(minPay));
    let months = 0, totalPaid = 0, totalInt = 0, b = safe(balance);
    if (r > 0 && eff > safe(balance) * r) {
      const logVal = 1 - (safe(balance) * r / eff);
      months = logVal > 0 ? Math.ceil(-Math.log(logVal) / Math.log(1 + r)) : 999;
      if (months < 999) {
        for (let i = 0; i < months && b > 0; i++) { const ic = b * r; totalInt += ic; b = b + ic - eff; totalPaid += eff; }
        if (b > 0) { totalPaid += b; totalInt += b * r; }
      }
    } else if (r === 0 && eff > 0) { months = Math.ceil(safe(balance) / eff); totalPaid = safe(balance); }
    else { months = 999; }
    const extra50 = (() => { const ep = eff + 50; if (r > 0 && ep > safe(balance) * r) { const lv = 1 - (safe(balance) * r / ep); return lv > 0 ? Math.ceil(-Math.log(lv) / Math.log(1 + r)) : 999; } return ep > 0 ? Math.ceil(safe(balance) / ep) : 999; })();
    return { months: safe(months), totalInt: safe(totalInt), eff, minPay, saved: safe(months) - safe(extra50) };
  }, [balance, apr, payment]);

  const yrs = Math.floor(calc.months / 12);
  const mos = calc.months % 12;
  const timeStr = calc.months >= 999 ? "Never — increase payment!" : (yrs > 0 ? `${yrs}y ${mos}m` : `${mos} months`);

  return (
    <div>
      <NumInput label="Total Debt Balance" value={balance} onChange={setBalance} prefix="$" min={0} theme={theme} />
      <NumInput label="Interest Rate (APR)" value={apr} onChange={setApr} suffix="%" min={0} max={40} theme={theme} />
      <NumInput label="Monthly Payment" value={payment} onChange={setPayment} prefix="$" min={0} theme={theme} />
      {payment < calc.minPay && apr > 0 && <div role="alert" style={{ fontSize: 11, color: "#FF8FA3", marginBottom: 8 }}><Ico label="warning">⚠️</Ico> Payment too low — minimum ~{fmtFull(Math.ceil(calc.minPay))}/mo to make progress</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        <ResultCard label="Debt-Free In" value={timeStr} color="#FF8FA3" sub={calc.months < 999 ? `${calc.months} total months` : ""} theme={theme} />
        <ResultCard label="Total Interest Paid" value={calc.months < 999 ? fmtFull(calc.totalInt) : "∞"} color="#F4A261" sub={calc.months < 999 && balance > 0 ? `${((calc.totalInt / balance) * 100).toFixed(0)}% of principal` : ""} theme={theme} />
      </div>
      {calc.months < 999 && <MiniBar data={[balance, calc.totalInt]} colors={["#FF8FA3", "#F4A261"]} labels={["Principal", "Interest Cost"]} theme={theme} />}
      {calc.saved > 0 && calc.months < 999 && (
        <div style={{ marginTop: 14, padding: 10, background: "rgba(255,143,163,0.08)", borderRadius: 8, border: "1px solid rgba(255,143,163,0.15)" }}>
          <p style={{ fontSize: 11, color: "#FF8FA3", fontWeight: 600, marginBottom: 3 }}><Ico label="tip">💡</Ico> Add $50/month</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>Pay ${calc.eff + 50}/mo instead and you'll be debt-free {calc.saved} months sooner!</p>
        </div>
      )}
    </div>
  );
}

/* ── Loan / Car Payment (with safe math, fees/taxes option) ── */
function CalcLoan({ theme }) {
  const [price, setPrice] = usePersistedState("calc-loan-price", 25000);
  const [down, setDown] = usePersistedState("calc-loan-down", 3000);
  const [apr, setApr] = usePersistedState("calc-loan-apr", 6);
  const [term, setTerm] = usePersistedState("calc-loan-term", 60);
  const [fees, setFees] = usePersistedState("calc-loan-fees", 0);

  const calc = useMemo(() => {
    const principal = Math.max(0, safe(price) - safe(down) + safe(fees));
    const r = safe(apr) / 100 / 12;
    const pmt = loanPmt(principal, r, safe(term));
    const totalPaid = pmt * safe(term);
    const totalInt = safe(totalPaid - principal);
    const scenarios = [36, 48, 60, 72].map(t => {
      const p = loanPmt(principal, r, t);
      return { term: t, pmt: p, interest: safe((p * t) - principal) };
    });
    return { principal, pmt, totalPaid, totalInt, scenarios };
  }, [price, down, apr, term, fees]);

  return (
    <div>
      <NumInput label="Vehicle / Loan Price" value={price} onChange={setPrice} prefix="$" min={0} theme={theme} />
      <NumInput label="Down Payment" value={down} onChange={setDown} prefix="$" min={0} theme={theme} />
      <NumInput label="Taxes, Fees & Add-Ons" value={fees} onChange={setFees} prefix="$" min={0} theme={theme} />
      <NumInput label="Interest Rate (APR)" value={apr} onChange={setApr} suffix="%" min={0} max={40} theme={theme} />
      <NumInput label="Loan Term" value={term} onChange={setTerm} suffix="months" min={6} max={84} theme={theme} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        <ResultCard label="Monthly Payment" value={fmtFull(calc.pmt)} color="#F4A261" sub={`for ${term} months`} theme={theme} />
        <ResultCard label="Total Interest" value={fmtFull(calc.totalInt)} color="#FF8FA3" sub={`total cost: ${fmtFull(calc.totalPaid + safe(down))}`} theme={theme} />
      </div>
      <div role="table" aria-label="Loan term comparison" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Term Comparison</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {calc.scenarios.map(s => (
            <div key={s.term} role="row" style={{ background: s.term === term ? "rgba(244,162,97,0.12)" : "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", border: s.term === term ? "1px solid rgba(244,162,97,0.3)" : "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#6B7280" }}>{s.term} months</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.term === term ? "#F4A261" : "#D1D5DB" }}>{fmtFull(s.pmt)}</div>
              <div style={{ fontSize: 9, color: "#6B7280" }}>interest: {fmtFull(s.interest)}</div>
            </div>
          ))}
        </div>
      </div>
      {term > 60 && (
        <div role="alert" style={{ marginTop: 12, padding: 10, background: "rgba(255,143,163,0.08)", borderRadius: 8, border: "1px solid rgba(255,143,163,0.15)" }}>
          <p style={{ fontSize: 11, color: "#FF8FA3", fontWeight: 600 }}><Ico label="warning">⚠️</Ico> Caution: Loans over 60 months</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>You may be "upside down" (owe more than the vehicle is worth) for most of this loan. Consider a shorter term or larger down payment.</p>
        </div>
      )}
    </div>
  );
}

/* ── Emergency Fund Calculator (risk-aware suggestions) ── */
function CalcEmergency({ theme }) {
  const [rent, setRent] = usePersistedState("calc-ef-rent", 1200);
  const [utils, setUtils] = usePersistedState("calc-ef-util", 200);
  const [food, setFood] = usePersistedState("calc-ef-food", 500);
  const [transport, setTransport] = usePersistedState("calc-ef-trans", 300);
  const [insurance, setInsurance] = usePersistedState("calc-ef-ins", 200);
  const [other, setOther] = usePersistedState("calc-ef-other", 150);
  const [months, setMonths] = usePersistedState("calc-ef-mos", 3);
  const [saved, setSaved] = usePersistedState("calc-ef-saved", 500);
  const [monthlySave, setMonthlySave] = usePersistedState("calc-ef-mosave", 200);
  const [singleIncome, setSingleIncome] = usePersistedState("calc-ef-single", false);

  const total = safe(rent) + safe(utils) + safe(food) + safe(transport) + safe(insurance) + safe(other);
  const recMonths = singleIncome ? Math.max(months, 6) : months;
  const goal = total * recMonths;
  const remaining = Math.max(0, goal - safe(saved));
  const monthsToGoal = safe(monthlySave) > 0 ? Math.ceil(remaining / safe(monthlySave)) : 0;
  const pctFunded = goal > 0 ? Math.min(100, Math.round((safe(saved) / goal) * 100)) : 0;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Monthly Essential Expenses</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" }}>
        <NumInput label="Housing / Rent" value={rent} onChange={setRent} prefix="$" min={0} theme={theme} />
        <NumInput label="Utilities" value={utils} onChange={setUtils} prefix="$" min={0} theme={theme} />
        <NumInput label="Food / Groceries" value={food} onChange={setFood} prefix="$" min={0} theme={theme} />
        <NumInput label="Transportation" value={transport} onChange={setTransport} prefix="$" min={0} theme={theme} />
        <NumInput label="Insurance" value={insurance} onChange={setInsurance} prefix="$" min={0} theme={theme} />
        <NumInput label="Other Essentials" value={other} onChange={setOther} prefix="$" min={0} theme={theme} />
      </div>
      <NumInput label="Months of Coverage" value={months} onChange={v => setMonths(Math.min(12, Math.max(1, v)))} suffix="months" min={1} max={12} theme={theme} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <div role="switch" aria-checked={singleIncome} aria-label="Single income household" tabIndex={0}
            onClick={() => setSingleIncome(!singleIncome)} onKeyDown={e => e.key === "Enter" && setSingleIncome(!singleIncome)}
            style={{ width: 38, height: 22, borderRadius: 11, background: singleIncome ? "#F59E0B" : "rgba(255,255,255,0.12)", padding: 2, transition: "all 0.2s", display: "flex", alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#F9FAFB", transform: singleIncome ? "translateX(16px)" : "translateX(0)", transition: "all 0.2s" }} />
          </div>
          <span>Single-income household (6+ months recommended)</span>
        </label>
      </div>
      <NumInput label="Already Saved" value={saved} onChange={setSaved} prefix="$" min={0} theme={theme} />
      <NumInput label="Monthly Savings Amount" value={monthlySave} onChange={setMonthlySave} prefix="$" min={0} theme={theme} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        <ResultCard label="Your Goal" value={fmtFull(goal)} color="#4ECDC4" sub={`${recMonths} months × ${fmtFull(total)}`} theme={theme} />
        <ResultCard label="Time to Goal" value={monthlySave > 0 && remaining > 0 ? `${monthsToGoal} months` : remaining <= 0 ? "Done! ✓" : "Set savings"} color={remaining <= 0 ? "#95D5B2" : "#F4A261"} sub={remaining > 0 ? `${fmtFull(remaining)} remaining` : "You've reached your goal!"} theme={theme} />
      </div>
      <div style={{ marginTop: 14, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }} role="progressbar" aria-valuenow={pctFunded} aria-valuemin={0} aria-valuemax={100} aria-label={`Emergency fund ${pctFunded}% funded`}>
        <div style={{ height: "100%", width: `${pctFunded}%`, background: "linear-gradient(90deg, #4ECDC4, #95D5B2)", borderRadius: 5, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6B7280", marginTop: 4 }}>
        <span>{pctFunded}% funded</span><span>Goal: {fmtFull(goal)}</span>
      </div>
      {singleIncome && months < 6 && (
        <div role="alert" style={{ marginTop: 12, padding: 10, background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.15)" }}>
          <p style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}><Ico label="info">ℹ️</Ico> Adjusted to {recMonths} months</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>Single-income households should target at least 6 months of expenses for adequate protection.</p>
        </div>
      )}
    </div>
  );
}

/* ── Roth vs Traditional TSP (safe math, accessible toggle) ── */
function CalcRoth({ theme }) {
  const [basePay, setBasePay] = usePersistedState("calc-roth-pay", 3600);
  const [pct, setPct] = usePersistedState("calc-roth-pct", 10);
  const [taxNow, setTaxNow] = usePersistedState("calc-roth-taxnow", 12);
  const [taxRetire, setTaxRetire] = usePersistedState("calc-roth-taxret", 22);
  const [years, setYears] = usePersistedState("calc-roth-yrs", 20);
  const [rate, setRate] = usePersistedState("calc-roth-rate", 7);
  const [combatZone, setCombatZone] = usePersistedState("calc-roth-czte", false);

  const calc = useMemo(() => {
    const mon = safe(basePay) * (safe(pct) / 100);
    const r = safe(rate) / 100 / 12;
    const n = safe(years) * 12;
    const tradFut = safe(fvAnnuity(mon, r, n));
    const tradAfter = tradFut * (1 - safe(taxRetire) / 100);
    const rothFut = safe(fvAnnuity(mon, r, n));
    const rothAfter = rothFut; // All tax-free
    const winner = combatZone ? "roth" : (safe(taxRetire) > safe(taxNow) ? "roth" : safe(taxRetire) < safe(taxNow) ? "trad" : "tie");
    return { tradFut, tradAfter: safe(tradAfter), rothFut, rothAfter: safe(rothAfter), winner, advantage: safe(Math.abs(rothAfter - tradAfter)) };
  }, [basePay, pct, taxNow, taxRetire, years, rate, combatZone]);

  return (
    <div>
      <NumInput label="Monthly Base Pay" value={basePay} onChange={setBasePay} prefix="$" min={0} theme={theme} />
      <NumInput label="TSP Contribution %" value={pct} onChange={v => setPct(Math.min(100, Math.max(0, v)))} suffix="%" min={0} max={100} theme={theme} />
      <NumInput label="Current Tax Bracket" value={taxNow} onChange={setTaxNow} suffix="%" min={0} max={37} theme={theme} />
      <NumInput label="Expected Retirement Tax Bracket" value={taxRetire} onChange={setTaxRetire} suffix="%" min={0} max={37} theme={theme} />
      <NumInput label="Years to Retirement" value={years} onChange={setYears} suffix="years" min={1} max={45} theme={theme} />
      <NumInput label="Assumed Annual Return" value={rate} onChange={setRate} suffix="%" min={0} max={15} theme={theme} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <div role="switch" aria-checked={combatZone} aria-label="Combat Zone Tax Exclusion mode" tabIndex={0}
            onClick={() => setCombatZone(!combatZone)} onKeyDown={e => e.key === "Enter" && setCombatZone(!combatZone)}
            style={{ width: 38, height: 22, borderRadius: 11, background: combatZone ? "#4ECDC4" : "rgba(255,255,255,0.12)", padding: 2, transition: "all 0.2s", display: "flex", alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#F9FAFB", transform: combatZone ? "translateX(16px)" : "translateX(0)", transition: "all 0.2s" }} />
          </div>
          <span>Combat Zone (CZTE) — Tax-free Roth contributions</span>
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} role="region" aria-label="Traditional vs Roth comparison">
        <div style={{ background: calc.winner === "trad" ? "rgba(199,125,255,0.12)" : "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, textAlign: "center", border: calc.winner === "trad" ? "2px solid rgba(199,125,255,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Traditional</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>Pre-tax: {fmt(calc.tradFut)}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#C77DFF" }}>{fmt(calc.tradAfter)}</div>
          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>After {taxRetire}% tax</div>
          {calc.winner === "trad" && <div style={{ fontSize: 10, fontWeight: 700, color: "#C77DFF", marginTop: 4 }}>✓ BETTER BY {fmt(calc.advantage)}</div>}
        </div>
        <div style={{ background: calc.winner === "roth" ? "rgba(78,205,196,0.12)" : "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, textAlign: "center", border: calc.winner === "roth" ? "2px solid rgba(78,205,196,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Roth</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>Tax-free growth</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#4ECDC4" }}>{fmt(calc.rothAfter)}</div>
          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>All tax-free at withdrawal</div>
          {calc.winner === "roth" && <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECDC4", marginTop: 4 }}>✓ BETTER BY {fmt(calc.advantage)}</div>}
        </div>
      </div>
      {combatZone && (
        <div style={{ marginTop: 14, padding: 10, background: "rgba(78,205,196,0.08)", borderRadius: 8, border: "1px solid rgba(78,205,196,0.15)" }}>
          <p style={{ fontSize: 11, color: "#4ECDC4", fontWeight: 600, marginBottom: 3 }}><Ico label="military">🎖️</Ico> CZTE Advantage Active</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>In a combat zone, your Roth contributions are made with tax-free income AND grow tax-free — a rare double tax benefit. This is one of the most powerful wealth-building opportunities in military service.</p>
        </div>
      )}
      <div style={{ marginTop: 12, padding: 10, background: "rgba(107,114,128,0.06)", borderRadius: 8, border: "1px solid rgba(107,114,128,0.08)" }}>
        <p style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.5, textAlign: "center" }}><Ico label="warning">⚠️</Ico> Simplified comparison for educational purposes. Tax situations vary — consult a qualified tax professional.</p>
      </div>
    </div>
  );
}

const CALC_COMPONENTS = { tsp: CalcTSP, compound: CalcCompound, debt: CalcDebt, loan: CalcLoan, emergency: CalcEmergency, roth: CalcRoth, reserve: CalcReserve, sdp: CalcSDP, deployment: CalcDeployment };

/* ═══════════════════
   RICH TEXT RENDERER
   ═══════════════════ */
function RichLine({ text }) {
  const html = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  if (text.startsWith("•")) {
    return (
      <li style={{ paddingLeft: 4, marginBottom: 5, lineHeight: 1.65, listStyle: "none" }}>
        <span dangerouslySetInnerHTML={{ __html: html.slice(1).trim() }} />
      </li>
    );
  }
  return <p style={{ marginBottom: 7, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ═══════════════════
   SEARCH ENGINE
   ═══════════════════ */
function searchAllContent(q) {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const out = [];
  SECTIONS.forEach(sec => {
    sec.topics.forEach((topic, tIdx) => {
      let score = 0;
      if (topic.title.toLowerCase().includes(lower)) score += 10;
      const full = topic.content.join(" ").toLowerCase();
      if (full.includes(lower)) score += 5;
      const lnk = topic.links.map(l => l.text).join(" ").toLowerCase();
      if (lnk.includes(lower)) score += 3;
      if (score > 0) {
        const ct = topic.content.join(" ");
        const idx = ct.toLowerCase().indexOf(lower);
        let snippet = "";
        if (idx >= 0) {
          const s = Math.max(0, idx - 40), e = Math.min(ct.length, idx + q.length + 80);
          snippet = (s > 0 ? "…" : "") + ct.slice(s, e).replace(/\*\*/g, "") + (e < ct.length ? "…" : "");
        }
        out.push({ secId: sec.id, secIcon: sec.icon, secTitle: sec.title, topicIdx: tIdx, topicTitle: topic.title, snippet, score });
      }
    });
  });
  return out.sort((a, b) => b.score - a.score);
}


/* ═══════════════════════════════════════════════════
   NEW CALCULATORS: Reserve Retirement, SDP, Deployment Pay
   ═══════════════════════════════════════════════════ */

/* ── Reserve/Guard Retirement Points Calculator ── */

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE SELF-ASSESSMENT — "My Ratings as a Money Manager"
   Fillable 1-5 scoring with live total + personalized section recs
   ═══════════════════════════════════════════════════════════ */

const ASSESSMENT_ITEMS = [
  { id: "track",    label: "I track my income and expenses monthly",                      section: "foundations",        calc: null,       weight: "foundation" },
  { id: "plan",     label: "I have a written spending plan and follow it",                section: "foundations",        calc: null,       weight: "foundation" },
  { id: "bills",    label: "I pay all bills on time, every time",                         section: "banking-credit",     calc: null,       weight: "credit" },
  { id: "emergency",label: "I have an emergency fund of at least $1,000",                 section: "foundations",        calc: "emergency",weight: "safety" },
  { id: "tsp",      label: "I contribute to TSP and understand BRS matching",             section: "saving-investing",   calc: "tsp",      weight: "retirement" },
  { id: "les",      label: "I review my LES every pay period for errors",                 section: "compensation",       calc: null,       weight: "foundation" },
  { id: "credit",   label: "I check my credit report at least annually",                  section: "banking-credit",     calc: null,       weight: "credit" },
  { id: "insurance",label: "I have appropriate insurance (SGLI, renters, auto)",          section: "military-life",      calc: null,       weight: "protection" },
  { id: "estate",   label: "I have updated estate docs (will, POA, beneficiaries)",       section: "retirement",         calc: null,       weight: "protection" },
  { id: "debt",     label: "I avoid high-interest consumer debt (payday, title loans)",   section: "consumer-protection",calc: "debt",     weight: "debt" },
];

const SECTION_LABELS = {
  "foundations": "Financial Foundations",
  "banking-credit": "Banking & Credit",
  "saving-investing": "Saving & Investing",
  "compensation": "Military Compensation",
  "military-life": "Military Life",
  "consumer-protection": "Consumer Protection",
  "retirement": "Retirement Planning",
};

function SelfAssessment({ theme, goSection, goCalc }) {
  const T = theme;
  const [scores, setScores] = usePersistedState("finred-selfassess", {});
  const [showRecs, setShowRecs] = usePersistedState("finred-showrecs", false);

  const setScore = (id, val) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const total = useMemo(() => {
    return ASSESSMENT_ITEMS.reduce((sum, item) => sum + (scores[item.id] || 0), 0);
  }, [scores]);

  const maxScore = ASSESSMENT_ITEMS.length * 5; // 50
  const answered = ASSESSMENT_ITEMS.filter(item => scores[item.id] > 0).length;
  const pct = answered > 0 ? Math.round((total / (answered * 5)) * 100) : 0;

  const tier = total >= 40 ? "strong" : total >= 25 ? "good" : total >= 10 ? "developing" : "start";
  const tierConfig = {
    strong:     { label: "Strong Financial Manager",   color: "#10B981", bg: "rgba(16,185,129,0.1)",  icon: "💪", action: "Maintain and optimize. Focus on advanced investing and retirement planning." },
    good:       { label: "Good Foundation",             color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  icon: "📈", action: "You're doing well. Focus on your lowest-scored areas to reach the next level." },
    developing: { label: "Room for Improvement",       color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  icon: "🎯", action: "Schedule a free PFC appointment. Together you'll tackle the biggest gaps first." },
    start:      { label: "Just Getting Started",       color: "#EF4444", bg: "rgba(239,68,68,0.1)",   icon: "🚀", action: "Start with Financial Foundations. One step at a time — your PFC is ready to help." },
  };
  const tc = tierConfig[tier];

  // Build personalized recommendations — lowest-scored items with actionable links
  const recs = useMemo(() => {
    return ASSESSMENT_ITEMS
      .filter(item => scores[item.id] > 0 && scores[item.id] <= 3)
      .sort((a, b) => (scores[a.id] || 0) - (scores[b.id] || 0))
      .slice(0, 4);
  }, [scores]);

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 12.5, color: T.text2, marginBottom: 20, lineHeight: 1.65 }}>
        Rate yourself honestly on each area from <strong style={{ color: T.accent }}>1 (needs work)</strong> to <strong style={{ color: T.accent }}>5 (excellent)</strong>. Your scores stay private and help identify which sections to focus on.
      </p>

      {/* Score items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {ASSESSMENT_ITEMS.map((item, idx) => {
          const score = scores[item.id] || 0;
          const scoreColor = score >= 4 ? "#10B981" : score === 3 ? "#3B82F6" : score > 0 ? "#F59E0B" : T.text3;
          return (
            <div key={item.id} style={{ background: T.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${score > 0 ? scoreColor + "33" : T.cardBdr}`, transition: "border 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4, flex: 1, fontWeight: 500 }}>
                  <span style={{ color: T.text3, fontSize: 11, fontWeight: 700, marginRight: 6 }}>{idx + 1}.</span>
                  {item.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, minWidth: 28, textAlign: "right" }}>
                  {score > 0 ? score : "–"}
                </div>
              </div>
              {/* 1–5 tap buttons */}
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    onClick={() => { buzz(); setScore(item.id, score === n ? 0 : n); }}
                    aria-label={`Rate ${n} out of 5`}
                    aria-pressed={score === n}
                    style={{
                      flex: 1, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
                      background: score === n
                        ? (n >= 4 ? "#10B981" : n === 3 ? "#3B82F6" : "#F59E0B")
                        : score > 0 && n <= score ? (score >= 4 ? "rgba(16,185,129,0.2)" : score === 3 ? "rgba(59,130,246,0.2)" : "rgba(245,158,11,0.2)") : T.inputBg,
                      color: score === n ? "#fff" : T.text3,
                      fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                      transform: score === n ? "scale(1.08)" : "scale(1)",
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Total Score */}
      {answered > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${tc.color}22, ${tc.color}11)`, border: `2px solid ${tc.color}44`, borderRadius: 16, padding: "18px 16px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tc.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            {tc.icon} {tc.label}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: tc.color, lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 18, color: T.text3, fontWeight: 600 }}>/ {answered * 5}</span>
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 10 }}>
            {answered} of {ASSESSMENT_ITEMS.length} answered · {pct}% of max possible
          </div>
          {/* Progress bar */}
          <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${(total / maxScore) * 100}%`, background: tc.color, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{tc.action}</div>
        </div>
      )}

      {/* Personalized Recommendations */}
      {answered >= 5 && recs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => { buzz(); setShowRecs(r => !r); }}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${T.cardBdr}`, background: T.card, color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>💡 Your Personalized Recommendations ({recs.length})</span>
            <span style={{ color: T.text3 }}>{showRecs ? "▲" : "▼"}</span>
          </button>

          {showRecs && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {recs.map(item => (
                <div key={item.id} style={{ background: T.card, borderRadius: 12, padding: "14px 14px", border: `1px solid rgba(245,158,11,0.25)` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, flex: 1, paddingRight: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", background: "rgba(245,158,11,0.15)", padding: "2px 8px", borderRadius: 6 }}>
                      Scored {scores[item.id]}/5
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => { buzz(); goSection(item.section); }}
                      style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(78,205,196,0.15)", color: "#4ECDC4" }}>
                      📚 {SECTION_LABELS[item.section] || item.section}
                    </button>
                    {item.calc && (
                      <button onClick={() => { buzz(); goCalc(item.calc); }}
                        style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(149,213,178,0.15)", color: "#95D5B2" }}>
                        🧮 Open Calculator
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: T.text3, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.cardBdr}`, lineHeight: 1.6 }}>
                <strong>Free help available:</strong> Your installation Personal Financial Counselor (PFC) or ACS Financial Readiness Specialist can review your scores and build a plan with you — at no cost.
              </div>
            </div>
          )}
        </div>
      )}

      {answered === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: T.text3, fontSize: 12 }}>
          Tap a number (1–5) on any item above to begin your assessment.
        </div>
      )}

      {answered > 0 && answered < 5 && (
        <div style={{ textAlign: "center", padding: "12px", color: T.text3, fontSize: 12, background: T.card, borderRadius: 8 }}>
          Answer {5 - answered} more item{5 - answered === 1 ? "" : "s"} to unlock personalized recommendations.
        </div>
      )}
    </div>
  );
}


function CalcReserve({ theme }) {
  const T = theme;
  const [drillWkds, setDrillWkds] = usePersistedState("calc-res-drills", 48);
  const [annualTraining, setAnnualTraining] = usePersistedState("calc-res-at", 15);
  const [activeDays, setActiveDays] = usePersistedState("calc-res-active", 0);
  const [corrCourses, setCorrCourses] = usePersistedState("calc-res-corr", 0);
  const [honorGuard, setHonorGuard] = usePersistedState("calc-res-hg", 0);
  const [goodYears, setGoodYears] = usePersistedState("calc-res-gy", 0);
  const [highThree, setHighThree] = usePersistedState("calc-res-h3", 4500);
  const [retireSys, setRetireSys] = usePersistedState("calc-res-sys", "high3");

  const calc = useMemo(() => {
    const membership = 15;
    const drillPts = drillWkds; // 4 per weekend but user enters weekend count → 4 pts each
    const atPts = annualTraining;
    const adPts = activeDays;
    const corrPts = Math.floor(corrCourses / 3);
    const hgPts = honorGuard;
    const totalYear = membership + drillPts + atPts + adPts + corrPts + hgPts;
    const isGoodYear = totalYear >= 50;
    // Career totals
    const totalCareerPts = totalYear * goodYears;
    const credYears = totalCareerPts / 360;
    const multiplier = retireSys === "brs" ? 2.0 : 2.5;
    const monthlyPay = (credYears * multiplier / 100) * highThree;
    const annualPay = monthlyPay * 12;
    // Age 60 reduction for deployments
    return { totalYear, isGoodYear, totalCareerPts, credYears, multiplier, monthlyPay, annualPay };
  }, [drillWkds, annualTraining, activeDays, corrCourses, honorGuard, goodYears, highThree, retireSys]);

  const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "0 0 24px" }}>
      <p style={{ fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.6 }}>
        Estimate your Reserve/Guard retirement pay. Points ÷ 360 = creditable years × multiplier × High-3 pay.
      </p>
      {/* Retirement System */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Retirement System</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "high3", label: "High-3 (2.5%)" }, { id: "brs", label: "BRS (2.0%)" }].map(s => (
            <button key={s.id} onClick={() => setRetireSys(s.id)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${retireSys === s.id ? "#95D5B2" : T.cardBdr}`, background: retireSys === s.id ? "rgba(149,213,178,0.15)" : T.card, color: retireSys === s.id ? "#95D5B2" : T.text2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Annual Points Breakdown */}
      <div style={{ background: T.card, borderRadius: 12, padding: "14px 14px", marginBottom: 14, border: `1px solid ${T.cardBdr}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Annual Points (This Year)</div>
        <NumInput label="Drill Weekends" value={drillWkds} onChange={setDrillWkds} suffix="weekends × 4 pts" min={0} max={52} theme={T} />
        <NumInput label="Annual Training Days" value={annualTraining} onChange={setAnnualTraining} suffix="days" min={0} max={365} theme={T} />
        <NumInput label="Active Duty Days (orders, mobilization)" value={activeDays} onChange={setActiveDays} suffix="days" min={0} max={365} theme={T} />
        <NumInput label="Correspondence Course Credit Hours" value={corrCourses} onChange={setCorrCourses} suffix="hrs ÷ 3 = pts" min={0} max={200} theme={T} />
        <NumInput label="Funeral Honor Guard Days" value={honorGuard} onChange={setHonorGuard} suffix="days" min={0} max={50} theme={T} />
        {/* Point total badge */}
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: calc.isGoodYear ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${calc.isGoodYear ? "#10B981" : "#EF4444"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: calc.isGoodYear ? "#10B981" : "#EF4444" }}>
              {calc.isGoodYear ? "✓ QUALIFYING YEAR" : "✗ NOT A QUALIFYING YEAR"}
            </div>
            <div style={{ fontSize: 10, color: T.text3 }}>Min 50 points required · 15 membership pts included</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: calc.isGoodYear ? "#10B981" : "#EF4444" }}>{calc.totalYear}</div>
        </div>
      </div>

      {/* Career Totals */}
      <div style={{ background: T.card, borderRadius: 12, padding: "14px 14px", marginBottom: 14, border: `1px solid ${T.cardBdr}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Career Projection</div>
        <NumInput label="Good Years (qualifying years toward retirement)" value={goodYears} onChange={setGoodYears} suffix="years" min={0} max={40} theme={T} />
        <NumInput label="Estimated High-3 Monthly Base Pay at Retirement" value={highThree} onChange={setHighThree} prefix="$" min={0} theme={T} />
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <ResultCard label="Total Career Points" value={calc.totalCareerPts.toLocaleString()} color="#95D5B2" sub={`÷ 360 = ${calc.credYears.toFixed(1)} cred. yrs`} theme={T} />
          <ResultCard label="Retirement Multiplier" value={`${(calc.credYears * calc.multiplier).toFixed(1)}%`} color="#4ECDC4" sub={`of High-3 pay`} theme={T} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <ResultCard label="Est. Monthly Pay" value={fmt(calc.monthlyPay)} color="#95D5B2" sub="at age 60" theme={T} />
        <ResultCard label="Est. Annual Pay" value={fmt(calc.annualPay)} color="#7FC8F8" sub="before taxes" theme={T} />
      </div>
      <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.6, padding: "10px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.cardBdr}` }}>
        <strong>Key rules:</strong> Need 20+ qualifying years (50+ pts each). Age 60 receipt, reduced 3 months per 90 days of qualifying active duty post-Jan 28, 2008. Max inactive pts: 130/yr. Drill weekend = 4 pts (Fri–Sun) or 5 pts (Sat–Mon).
      </div>
    </div>
  );
}

/* ── Savings Deposit Program (SDP) Calculator ── */
function CalcSDP({ theme }) {
  const T = theme;
  const [deposit, setDeposit] = usePersistedState("calc-sdp-dep", 10000);
  const [deployMonths, setDeployMonths] = usePersistedState("calc-sdp-mo", 9);
  const [postDays, setPostDays] = usePersistedState("calc-sdp-post", 90);

  const calc = useMemo(() => {
    const principal = Math.min(deposit, 10000); // Only first $10K earns interest
    const excessDeposit = Math.max(0, deposit - 10000);
    const rate = 0.10; // 10% annual, compounding quarterly
    const qtrRate = rate / 4;
    // Deployment period (months → quarters)
    const deployQtrs = deployMonths / 3;
    // Post-deployment accrual (days → quarters, max 90 days)
    const postDaysActual = Math.min(postDays, 90);
    const postQtrs = postDaysActual / 91.25;
    const totalQtrs = deployQtrs + postQtrs;
    const finalBalance = principal * Math.pow(1 + qtrRate, totalQtrs);
    const interest = finalBalance - principal;
    const monthlyInterest = principal * (rate / 12);
    const vsHYSA = interest - (deposit * 0.045 * (deployMonths / 12)); // vs 4.5% HYSA
    return { principal, excessDeposit, finalBalance, interest, monthlyInterest, vsHYSA, totalQtrs };
  }, [deposit, deployMonths, postDays]);

  const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const fmt2 = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ padding: "0 0 24px" }}>
      <p style={{ fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.6 }}>
        The SDP offers a guaranteed <strong style={{ color: "#F59E0B" }}>10% annual return</strong> on up to $10,000 for service members in designated combat zones — one of the best risk-free investments available anywhere.
      </p>
      <NumInput label="Total Deposit Amount" value={deposit} onChange={setDeposit} prefix="$" min={0} max={50000} theme={T} />
      {deposit > 10000 && (
        <div style={{ fontSize: 11, color: "#F59E0B", marginBottom: 10, padding: "6px 10px", background: "rgba(245,158,11,0.1)", borderRadius: 6 }}>
          ⚠️ Only first $10,000 earns the 10% rate. ${(deposit - 10000).toLocaleString()} earns no interest.
        </div>
      )}
      <NumInput label="Deployment Duration" value={deployMonths} onChange={setDeployMonths} suffix="months" min={1} max={36} theme={T} />
      <NumInput label="Post-Deployment Accrual Period" value={postDays} onChange={setPostDays} suffix="days (max 90)" min={0} max={90} theme={T} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <ResultCard label="Total Interest Earned" value={fmt2(calc.interest)} color="#F59E0B" sub="10% APR · quarterly" theme={T} />
        <ResultCard label="Final Balance" value={fmt(calc.finalBalance)} color="#95D5B2" sub="principal + interest" theme={T} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <ResultCard label="Monthly Interest" value={fmt2(calc.monthlyInterest)} color="#4ECDC4" sub="on $10K" theme={T} />
        <ResultCard label="Advantage vs HYSA" value={fmt(calc.vsHYSA)} color="#C77DFF" sub="vs 4.5% savings" theme={T} />
      </div>
      <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.7, padding: "10px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.cardBdr}` }}>
        <strong>Rules:</strong> Must receive Hostile Fire/IDP pay · Deployed 30+ consecutive days or 1+ day in 3 consecutive months · Interest stops 90 days after redeployment · Account auto-closes 120 days post-deployment · Interest is taxable income (combat pay exclusion does not apply to SDP interest)
      </div>
    </div>
  );
}

/* ── Deployment Pay Estimator ── */
function CalcDeployment({ theme }) {
  const T = theme;
  const [grade, setGrade] = usePersistedState("calc-dep-grade", "E5");
  const [yos, setYos] = usePersistedState("calc-dep-yos", 6);
  const [hasBah, setHasBah] = usePersistedState("calc-dep-bah", true);
  const [bahAmt, setBahAmt] = usePersistedState("calc-dep-bahamt", 1800);
  const [hasBas, setHasBas] = usePersistedState("calc-dep-bas", true);
  const [getHFP, setGetHFP] = usePersistedState("calc-dep-hfp", true);
  const [getCFCZ, setGetCFCZ] = usePersistedState("calc-dep-cfcz", true);
  const [getSDP, setGetSDP] = usePersistedState("calc-dep-sdp", true);
  const [deployMonths, setDeployMonths] = usePersistedState("calc-dep-mo", 9);

  // Approximate 2024 base pay lookup (mid-range values for illustration)
  const BASE_PAY = {
    "E1": [1833, 1833, 1833, 1833, 1833, 1833],
    "E2": [2055, 2055, 2055, 2055, 2055, 2055],
    "E3": [2161, 2296, 2296, 2296, 2296, 2296],
    "E4": [2393, 2515, 2637, 2769, 2769, 2769],
    "E5": [2610, 2771, 2944, 3063, 3175, 3312],
    "E6": [2849, 3134, 3251, 3370, 3534, 3651],
    "E7": [3294, 3601, 3717, 3917, 4097, 4238],
    "E8": [4739, 4914, 5057, 5181, 5349, 5499],
    "E9": [5789, 5975, 6153, 6312, 6541, 6737],
    "W1": [3638, 3964, 4139, 4238, 4362, 4534],
    "W2": [4091, 4509, 4656, 4785, 4948, 5106],
    "W3": [4646, 5101, 5270, 5431, 5627, 5815],
    "W4": [5135, 5673, 5869, 6062, 6317, 6555],
    "W5": [0, 6942, 7200, 7462, 7722, 8049],
    "O1": [3637, 4044, 4850, 4850, 4850, 4850],
    "O2": [4186, 4759, 5494, 5657, 5657, 5657],
    "O3": [4851, 5487, 5948, 6479, 6784, 7035],
    "O4": [5520, 6390, 6822, 7220, 7631, 8045],
    "O5": [6421, 7458, 7964, 8376, 8811, 9256],
    "O6": [7704, 8467, 9031, 9031, 9355, 9793],
  };

  const calc = useMemo(() => {
    const yosIdx = Math.min(Math.floor(yos / 4), 5);
    const basePay = (BASE_PAY[grade] || BASE_PAY["E5"])[yosIdx];
    const bas = hasBas ? (grade.startsWith("O") || grade.startsWith("W") ? 311.68 : 460.25) : 0; // Officer vs enlisted BAS 2024
    const hfpIdp = getHFP ? 225 : 0; // Hostile Fire / IDP
    const bahHome = hasBah ? bahAmt : 0;
    // CFCZ: federal income tax exemption value (approx 22% effective rate on base pay)
    const cfczSavings = getCFCZ ? basePay * 0.22 : 0;
    const monthlyGross = basePay + bas + hfpIdp + bahHome;
    const monthlyAfterCFCZ = monthlyGross + cfczSavings;
    const totalDeployment = monthlyAfterCFCZ * deployMonths;
    // SDP maximum interest if maxed out
    const sdpInterest = getSDP ? 10000 * 0.10 * ((deployMonths + 3) / 12) : 0;
    const totalWithSDP = totalDeployment + sdpInterest;
    const vsHomeMonth = monthlyAfterCFCZ - (basePay + bas + bahHome);
    return { basePay, bas, hfpIdp, bahHome, cfczSavings, monthlyGross, monthlyAfterCFCZ, totalDeployment, sdpInterest, totalWithSDP, vsHomeMonth };
  }, [grade, yos, hasBah, bahAmt, hasBas, getHFP, getCFCZ, getSDP, deployMonths]);

  const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const GRADES = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","W1","W2","W3","W4","W5","O1","O2","O3","O4","O5","O6"];

  return (
    <div style={{ padding: "0 0 24px" }}>
      <p style={{ fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.6 }}>
        Estimate your total compensation during a deployment including pay changes, tax exclusions, and SDP earnings.
      </p>
      {/* Grade + YOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, fontWeight: 600 }}>Pay Grade</div>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.inputBdr}`, background: T.inputBg, color: T.text, fontSize: 14, cursor: "pointer" }}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <NumInput label="Years of Service" value={yos} onChange={setYos} suffix="yrs" min={0} max={30} theme={T} />
      </div>
      <NumInput label="Deployment Length" value={deployMonths} onChange={setDeployMonths} suffix="months" min={1} max={36} theme={T} />

      {/* Toggle switches */}
      <div style={{ background: T.card, borderRadius: 12, padding: "14px", marginBottom: 14, border: `1px solid ${T.cardBdr}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Pay Items</div>
        {[
          { key: "bah", label: "BAH (continuing to pay housing)", val: hasBah, set: setHasBah, sub: null },
          { key: "bas", label: "BAS", val: hasBas, set: setHasBas, sub: null },
          { key: "hfp", label: "Hostile Fire / IDP ($225/mo)", val: getHFP, set: setGetHFP, sub: null },
          { key: "cfcz", label: "Combat Zone Tax Exclusion", val: getCFCZ, set: setGetCFCZ, sub: "Federal income tax waived on base pay" },
          { key: "sdp", label: "Savings Deposit Program ($10K)", val: getSDP, set: setGetSDP, sub: "10% APR on up to $10K" },
        ].map(item => (
          <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.cardBdr}` }}>
            <div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 10, color: T.text3 }}>{item.sub}</div>}
            </div>
            <button onClick={() => { buzz(); item.set(v => !v); }}
              style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: item.val ? "#10B981" : T.cardBdr, transition: "background 0.2s", position: "relative" }}>
              <span style={{ position: "absolute", top: 3, left: item.val ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
          </div>
        ))}
        {hasBah && <NumInput label="Monthly BAH Amount" value={bahAmt} onChange={setBahAmt} prefix="$" min={0} theme={T} />}
      </div>

      {/* Pay Breakdown */}
      <div style={{ background: T.card, borderRadius: 12, padding: "14px", marginBottom: 12, border: `1px solid ${T.cardBdr}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Monthly Breakdown</div>
        {[
          { label: "Base Pay (approx)", val: calc.basePay, color: T.text },
          { label: "BAS", val: calc.bas, color: T.text2 },
          { label: "BAH", val: calc.bahHome, color: T.text2 },
          { label: "HFP / IDP", val: calc.hfpIdp, color: "#F59E0B" },
          { label: "Tax Exclusion Value", val: calc.cfczSavings, color: "#10B981" },
        ].filter(r => r.val > 0).map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: T.text3 }}>{row.label}</span>
            <span style={{ fontWeight: 700, color: row.color }}>{fmt(row.val)}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${T.cardBdr}`, marginTop: 6, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
          <span style={{ color: T.text }}>Total Monthly Value</span>
          <span style={{ color: "#95D5B2" }}>{fmt(calc.monthlyAfterCFCZ)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <ResultCard label={`${deployMonths}-Mo Total`} value={fmt(calc.totalDeployment)} color="#95D5B2" sub="all pay + exclusions" theme={T} />
        <ResultCard label="With SDP Max" value={fmt(calc.totalWithSDP)} color="#F59E0B" sub={getSDP ? `+${fmt(calc.sdpInterest)} interest` : "SDP off"} theme={T} />
      </div>
      <p style={{ fontSize: 10, color: T.text3, marginTop: 10, lineHeight: 1.6 }}>
        Base pay values are approximate 2024 figures. Actual pay depends on exact PEBD and current pay tables. Verify at <strong>militarypay.defense.gov</strong>
      </p>
    </div>
  );
}


/* ═══════════════════════════════════════
   §992 COMPLIANCE VIEWS
   TouchpointDetail + CommandDashboard
   ═══════════════════════════════════════ */

function TouchpointDetail({ tpId, onBack, goSection, goCalc, theme, progress }) {
  const T = theme;
  const { completed, toggle } = progress;
  const tp = TOUCHPOINTS.find(x => x.id === tpId);
  if (!tp) return null;
  const { pct, done, total } = progress.tpStats(tp);
  const relCalcs = CALCS.filter(c => tp.calcs.includes(c.id));
  const relSecs = SECTIONS.filter(s => tp.secs.includes(s.id));
  return (
    <div style={{ padding: "4px 18px 80px", animation: "fadeUp 0.3s ease-out" }}>
      <div style={{ padding: "18px 0 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.chart?.primary || "#95D5B2", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>10 U.S.C. §992 MANDATE</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 800, color: T.accent, marginBottom: 3 }}>{tp.code}: {tp.title}</h2>
        <p style={{ fontSize: 12, color: T.text2, marginBottom: 12 }}>{tp.sub}</p>
        <div style={{ height: 6, background: T.inputBg || "rgba(255,255,255,0.08)", borderRadius: 99, marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#eab308" : (T.chart?.secondary || "#4ECDC4"), borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        <div style={{ fontSize: 11, color: T.text3 }}>{done} of {total} complete — {pct}%</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: T.text3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Required Actions</h3>
        {relCalcs.map(c => {
          const id = `calc:${c.id}`, isDone = completed.has(id);
          return (
            <div key={c.id} role="button" tabIndex={0}
              onClick={() => { toggle(tp.id, id); goCalc(c.id); }}
              onKeyDown={e => e.key === "Enter" && (toggle(tp.id, id), goCalc(c.id))}
              aria-label={`${c.title}: ${isDone ? "completed" : "not completed"}`}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px", background: T.card, borderRadius: 12, marginBottom: 8, border: `1px solid ${isDone ? "#10B981" : T.cardBdr}`, cursor: "pointer", transition: "border-color 0.3s" }}>
              <div style={{ fontSize: 18 }}><Ico label={isDone ? "Done" : "Todo"}>{isDone ? "✅" : "⭕"}</Ico></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}><Ico>{c.icon}</Ico> {c.title}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>Interactive Calculator</div>
              </div>
            </div>
          );
        })}
        {relSecs.map(s => {
          const id = `sec:${s.id}`, isDone = completed.has(id);
          return (
            <div key={s.id} role="button" tabIndex={0}
              onClick={() => { toggle(tp.id, id); goSection(s.id); }}
              onKeyDown={e => e.key === "Enter" && (toggle(tp.id, id), goSection(s.id))}
              aria-label={`${s.title}: ${isDone ? "completed" : "not completed"}`}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px", background: T.card, borderRadius: 12, marginBottom: 8, border: `1px solid ${isDone ? "#10B981" : T.cardBdr}`, cursor: "pointer", transition: "border-color 0.3s" }}>
              <div style={{ fontSize: 18 }}><Ico label={isDone ? "Done" : "Todo"}>{isDone ? "✅" : "⭕"}</Ico></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}><Ico>{s.icon}</Ico> {s.title}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>Learning Module — {s.topics.length} topic{s.topics.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommandDashboard({ theme, progress, onBack }) {
  const T = theme;
  const [filter, setFilter] = useState("all");
  const statusColors = { complete: "#10B981", active: "#3B82F6", "not-started": "#6B7280" };
  const tpData = TOUCHPOINTS.map(tp => {
    const s = progress.tpStats(tp);
    const status = s.pct === 100 ? "complete" : s.done > 0 ? "active" : "not-started";
    return { ...tp, ...s, status };
  });
  const filtered = filter === "all" ? tpData : tpData.filter(t => t.status === filter);
  const overall = progress.globalScore();
  const completedCount = tpData.filter(t => t.status === "complete").length;
  const exportCSV = () => {
    const hdr = "Touchpoint,Title,Status,Done,Total,Completion\n";
    const rows = tpData.map(t => `${t.code},${t.title},${t.status},${t.done},${t.total},${t.pct}%`).join("\n");
    const blob = new Blob([hdr + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `READINESS_REPORT_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div style={{ padding: "4px 18px 80px", animation: "fadeUp 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => { buzz(); onBack(); }} className="bbtn" aria-label="Back to Home">← Home</button>
        <button onClick={exportCSV} aria-label="Export readiness report as CSV" style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Ico label="Download">⬇</Ico> CSV</button>
      </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.chart?.primary || "#95D5B2", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>§992 READINESS REPORTING</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 800, color: T.accent, marginBottom: 10 }}>Command Dashboard</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: `1px solid ${T.cardBdr}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.chart?.primary || "#95D5B2" }}>{overall}%</div>
            <div style={{ fontSize: 10, color: T.text3 }}>Overall</div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: `1px solid ${T.cardBdr}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>{completedCount}</div>
            <div style={{ fontSize: 10, color: T.text3 }}>Complete</div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: `1px solid ${T.cardBdr}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B" }}>{10 - completedCount}</div>
            <div style={{ fontSize: 10, color: T.text3 }}>Remaining</div>
          </div>
        </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ id: "all", label: "All" }, { id: "complete", label: "Complete" }, { id: "active", label: "In Progress" }, { id: "not-started", label: "Not Started" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: filter === f.id ? (statusColors[f.id] || T.text) : T.card,
              color: filter === f.id ? "#fff" : T.text2 }}>{f.label}</button>
        ))}
      </div>
      {filtered.map(tp => (
        <div key={tp.id} style={{ background: T.card, padding: "12px 14px", borderRadius: 12, marginBottom: 8, borderLeft: `4px solid ${statusColors[tp.status]}`, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.cardBdr}` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{tp.code}: {tp.title}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>{tp.done}/{tp.total} tasks</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: statusColors[tp.status] }}>{tp.pct}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════
   MAIN APP COMPONENT
   WCAG AA Accessible
   ═══════════════════ */
export default function App() {
  const [view, setView] = useState("home");
  const [sectionId, setSectionId] = useState(null);
  const [topicIdx, setTopicIdx] = useState(0);
  const [calcId, setCalcId] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = usePersistedState("finred-agreed", false);
  const [dark, setDark] = usePersistedState("finred-dark", true);
  const [fontScale, setFontScale] = usePersistedState("finred-fontscale", "normal"); // "normal" | "large" | "bold"
  const [showResourcesFor, setShowResourcesFor] = useState(null);
  const [toast, setToast] = useState(null);
  const [tpId, setTpId] = useState(null);
  const progress = useProgress();
  const warfighterScore = progress.globalScore();
  const scrollRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => { setReady(true); }, []);

  // Toast listener
  useEffect(() => {
    ToastBus.emit = (msg, type) => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      const t = setTimeout(() => { setResults(searchAllContent(query)); setSearching(true); }, 120);
      return () => clearTimeout(t);
    }
    setResults([]); setSearching(false);
  }, [query]);

  // Scroll to top + announce view change for screen readers
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "instant" });
  }, [view, sectionId, topicIdx, calcId]);

  // ── Browser History API — enables native back/forward button support ──
  const pushNav = useCallback((newView, state = {}) => {
    window.history.pushState({ view: newView, ...state }, "");
  }, []);

  const goHome = useCallback(() => {
    setView("home"); setSectionId(null); setTopicIdx(0); setCalcId(null); setQuery(""); setSearching(false);
    pushNav("home");
  }, [pushNav]);
  const goSection = useCallback((id) => {
    setSectionId(id); setTopicIdx(0); setCalcId(null); setQuery(""); setSearching(false); setView("section");
    pushNav("section", { sectionId: id });
  }, [pushNav]);
  const goTopic = useCallback((secId, idx) => {
    setSectionId(secId); setTopicIdx(idx); setCalcId(null); setQuery(""); setSearching(false); setView("topic");
    pushNav("topic", { sectionId: secId, topicIdx: idx });
  }, [pushNav]);
  const goCalcs = useCallback(() => {
    setView("calcs"); setCalcId(null); setSectionId(null); setQuery(""); setSearching(false);
    pushNav("calcs");
  }, [pushNav]);
  const goCalcDetail = useCallback((id) => {
    setCalcId(id); setView("calcDetail"); setQuery(""); setSearching(false);
    pushNav("calcDetail", { calcId: id });
  }, [pushNav]);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = (e) => {
      const s = e.state;
      if (!s || s.view === "home") {
        setView("home"); setSectionId(null); setTopicIdx(0); setCalcId(null); setQuery(""); setSearching(false);
      } else if (s.view === "section") {
        setView("section"); setSectionId(s.sectionId); setTopicIdx(0); setCalcId(null);
      } else if (s.view === "topic") {
        setView("topic"); setSectionId(s.sectionId); setTopicIdx(s.topicIdx ?? 0); setCalcId(null);
      } else if (s.view === "calcs") {
        setView("calcs"); setCalcId(null); setSectionId(null);
      } else if (s.view === "calcDetail") {
        setView("calcDetail"); setCalcId(s.calcId);
      } else if (s.view === "tpDetail") {
        setView("tpDetail"); setTpId(s.tpId);
      } else if (s.view === "command") {
        setView("command");
      }
    };
    window.addEventListener("popstate", onPop);
    // Push initial home state so back from first page works
    window.history.replaceState({ view: "home" }, "");
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Collect all unique links from a section (deduped by URL)
  const getAllResourcesForSection = useCallback((secId) => {
    const section = SECTIONS.find(s => s.id === secId);
    if (!section) return [];
    const allLinks = [];
    section.topics.forEach(topic => {
      topic.links.forEach(link => {
        if (!allLinks.some(l => l.url === link.url)) allLinks.push(link);
      });
    });
    return allLinks;
  }, []);

  const sec = SECTIONS.find(s => s.id === sectionId) || null;
  const topic = sec ? sec.topics[topicIdx] : null;
  const totalTopics = useMemo(() => SECTIONS.reduce((a, s) => a + s.topics.length, 0), []);

  /* ── WCAG AA-compliant theme (memoized, with chart palette) ── */
  const T = useMemo(() => dark ? {
    bg: "#0B0E14", bg2: "#141820", text: "#E5E7EB", text2: "#9CA3AF", text3: "#8B92A0",
    card: "rgba(255,255,255,0.035)", cardBdr: "rgba(255,255,255,0.06)", hdrBg: "#0B0E14",
    accent: "#F9FAFB", inputBg: "rgba(255,255,255,0.06)", inputBdr: "rgba(255,255,255,0.1)",
    linkColor: "#93C5FD", subText: "#A1A8B4",
    chart: { primary: "#95D5B2", secondary: "#4ECDC4", tertiary: "#7FC8F8" }
  } : {
    bg: "#F5F3EE", bg2: "#FFFFFF", text: "#1F2937", text2: "#374151", text3: "#4B5563",
    card: "rgba(0,0,0,0.03)", cardBdr: "rgba(0,0,0,0.08)", hdrBg: "#F5F3EE",
    accent: "#1F2937", inputBg: "rgba(0,0,0,0.04)", inputBdr: "rgba(0,0,0,0.12)",
    linkColor: "#1D4ED8", subText: "#4B5563",
    chart: { primary: "#2D6A4F", secondary: "#1A535C", tertiary: "#0D3B66" }
  }, [dark]);

  // Font scale helpers
  const fs = useMemo(() => ({
    base: fontScale === "large" ? 15 : 14,
    sm: fontScale === "large" ? 13 : 12,
    xs: fontScale === "large" ? 12 : 11,
    md: fontScale === "large" ? 17 : 15,
    lg: fontScale === "large" ? 20 : 18,
    xl: fontScale === "large" ? 24 : 22,
    weight: fontScale === "bold" ? 700 : (fontScale === "large" ? 500 : 400),
  }), [fontScale]);

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", height: "100dvh", minHeight: "-webkit-fill-available", background: T.bg, fontFamily: "var(--font-sans)", color: T.text, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Aurora background — decorative, hidden from screen readers */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: dark ? "radial-gradient(circle, rgba(78,205,196,0.08) 0%, transparent 70%)" : "radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)", top: "-10%", left: "-20%", animation: "auroraFloat1 18s ease-in-out infinite", willChange: "transform" }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: dark ? "radial-gradient(circle, rgba(149,213,178,0.06) 0%, transparent 70%)" : "radial-gradient(circle, rgba(149,213,178,0.05) 0%, transparent 70%)", top: "30%", right: "-25%", animation: "auroraFloat2 22s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: dark ? "radial-gradient(circle, rgba(199,125,255,0.05) 0%, transparent 70%)" : "radial-gradient(circle, rgba(199,125,255,0.04) 0%, transparent 70%)", bottom: "5%", left: "10%", animation: "auroraFloat3 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: dark ? "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" : "radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 70%)", top: "60%", left: "50%", animation: "auroraFloat1 25s ease-in-out infinite reverse" }} />
      </div>
      <style>{`
        :root {
          --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
          --font-serif: 'Playfair Display', Georgia, Cambria, 'Times New Roman', Times, serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        :focus-visible { outline: 2px solid #4ECDC4; outline-offset: 2px; border-radius: 4px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}; border-radius: 4px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideR { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes auroraFloat1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.1); } 66% { transform: translate(-15px, 25px) scale(0.95); } }
        @keyframes auroraFloat2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-40px, 30px) scale(1.15); } }
        @keyframes auroraFloat3 { 0%, 100% { transform: translate(0, 0) scale(1); } 40% { transform: translate(25px, -35px) scale(1.08); } 80% { transform: translate(-20px, 15px) scale(0.92); } }
        .hvr { transition: all 0.2s ease; cursor: pointer; }
        .hvr:hover { transform: translateY(-2px); box-shadow: 0 6px 24px ${dark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.1)"}; }
        .hvr:active { transform: translateY(0); }
        .tinp::placeholder { color: ${dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"}; }
        .tinp:focus { outline: none; border-color: rgba(78,205,196,0.5) !important; box-shadow: 0 0 0 3px rgba(78,205,196,0.12); }
        .trow { transition: all 0.18s ease; cursor: pointer; }
        .trow:hover { background: ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"} !important; }
        .bbtn { background: ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}; border: 1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; color: ${T.text}; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-family: var(--font-sans); font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .bbtn:hover { background: ${dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"}; }
        .lnk { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}; border-radius: 10px; color: ${T.linkColor}; text-decoration: none; font-size: 13px; font-family: var(--font-sans); border: 1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}; transition: all 0.2s; }
        .lnk:hover { background: ${dark ? "rgba(96,165,250,0.1)" : "rgba(37,99,235,0.08)"}; border-color: ${dark ? "rgba(96,165,250,0.25)" : "rgba(37,99,235,0.2)"}; }
        input[type=text][inputmode=decimal] { -moz-appearance: textfield; background: ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} !important; border: 1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} !important; color: ${T.text} !important; }
        input[type=text][inputmode=decimal]:focus { border-color: rgba(78,205,196,0.5) !important; box-shadow: 0 0 0 3px rgba(78,205,196,0.1); }
        .recharts-tooltip-wrapper { outline: none !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div role="alert" aria-live="polite" style={{ position: "fixed", top: "max(16px, env(safe-area-inset-top))", left: 16, right: 16, maxWidth: 448, margin: "0 auto", padding: "12px 16px", background: toast.type === "error" ? "#DC2626" : "#059669", color: "#FFFFFF", borderRadius: 12, zIndex: 9999, fontWeight: 600, fontSize: 13, textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease-out", fontFamily: "var(--font-sans)", WebkitTransform: "translateZ(0)" }}>
          {toast.msg}
        </div>
      )}

      {/* ─── Decorative BG gradients ─── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 15%, rgba(30,58,95,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 85%, rgba(30,70,50,0.18) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ─── DISCLAIMER MODAL ─── */}
      {!agreed && (
        <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, backdropFilter: "blur(8px)" }}>
          <div style={{ background: dark ? "#141820" : "#FFFFFF", borderRadius: 20, padding: 30, maxWidth: 400, width: "100%", border: `1px solid ${T.cardBdr}`, animation: "fadeUp 0.35s ease-out", boxShadow: dark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}><Ico label="Military service medal">🎖️</Ico></div>
              <h2 id="disclaimer-title" style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 800, color: T.accent, marginBottom: 6 }}>Financial Readiness Navigator</h2>
              <p style={{ fontSize: 12, color: T.text2 }}>Office of Financial Readiness</p>
            </div>
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <p style={{ fontSize: 11.5, color: "#F59E0B", fontWeight: 600, marginBottom: 6 }}><Ico label="warning">⚠️</Ico> Educational Resource — Not Financial Advice</p>
              <p style={{ fontSize: 11, color: T.text2, lineHeight: 1.65 }}>This app provides general financial education based on DoD FINRED approved materials. It does not constitute financial, investment, legal, or tax advice. For personalized guidance, consult your installation PFM/PFC or a qualified professional.</p>
            </div>
            <button onClick={() => setAgreed(true)} aria-label="Acknowledge disclaimer and enter app" style={{ width: "100%", padding: "13px 0", background: "linear-gradient(135deg, #1B4332, #2D6A4F)", color: "#F9FAFB", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              I Understand — Enter App
            </button>
          </div>
        </div>
      )}

      {/* ─── HEADER (sticky) ─── */}
      <header style={{ padding: "16px 18px 12px", position: "relative", zIndex: 10, background: T.hdrBg, flexShrink: 0, borderBottom: `1px solid ${T.cardBdr}`, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (view === "topic" || view === "calcDetail") ? 0 : 12 }}>
          {view === "home" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1B4332,#2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}><Ico label="Financial Readiness Navigator">🎖️</Ico></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-serif)", color: T.accent }}>Financial Readiness</div>
                <div style={{ fontSize: 9, color: T.text3, letterSpacing: 1.2, textTransform: "uppercase" }}>Navigator</div>
              </div>
            </div>
          ) : (
            <button className="bbtn" onClick={view === "topic" ? () => goSection(sectionId) : view === "calcDetail" ? goCalcs : view === "tpDetail" || view === "command" ? goHome : goHome}
              aria-label={`Back to ${view === "topic" ? "Topics" : view === "calcDetail" ? "Calculators" : view === "tpDetail" ? "Career Path" : "Home"}`}>
              ← {view === "topic" ? "Topics" : view === "calcDetail" ? "Calculators" : view === "tpDetail" ? "Career Path" : view === "command" ? "Home" : "Home"}
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => { buzz(); setFontScale(s => s === "normal" ? "large" : s === "large" ? "bold" : "normal"); }}
              aria-label="Cycle font size: normal, large, bold"
              title={`Font: ${fontScale}`}
              style={{ background: T.card, border: `1px solid ${T.cardBdr}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: T.text2, fontWeight: 600 }}>
              {fontScale === "normal" ? "Aa" : fontScale === "large" ? "A+" : <strong>A</strong>}
            </button>
            <button onClick={() => { buzz(); setDark(d => !d); }} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.cardBdr}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, transition: "all 0.3s" }}><Ico label={dark ? "Sun, switch to light mode" : "Moon, switch to dark mode"}>{dark ? "☀️" : "🌙"}</Ico></button>
            <button onClick={resetAllData} aria-label="Reset all saved data" title="Reset saved data" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.cardBdr}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, transition: "all 0.3s", opacity: 0.6 }}>↻</button>
            <div style={{ fontSize: 9, color: T.text3, textAlign: "right", lineHeight: 1.4 }}>OSD FINRED<br/>Approved</div>
          </div>
        </div>

        {/* Search bar */}
        {(view === "home" || view === "section") && (
          <div style={{ position: "relative" }} role="search">
            <label htmlFor="search-input" className="sr-only">Search topics, benefits, and protections</label>
            <input id="search-input" className="tinp" type="search" placeholder="Search topics, benefits, protections…" value={query} onChange={e => setQuery(e.target.value)}
              aria-label="Search financial readiness topics"
              style={{ width: "100%", padding: "12px 16px 12px 40px", background: T.inputBg, border: `1px solid ${T.inputBdr}`, borderRadius: 12, color: T.text, fontSize: 14, fontFamily: "var(--font-sans)", transition: "all 0.2s" }} />
            <span aria-hidden="true" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.35 }}>🔍</span>
            {query && (
              <button onClick={() => { setQuery(""); setSearching(false); }} aria-label="Clear search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: T.inputBg, border: "none", borderRadius: 7, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, cursor: "pointer", fontSize: 11 }}>✕</button>
            )}
          </div>
        )}
      </header>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }} aria-live="polite">

        {/* ═══ SEARCH RESULTS ═══ */}
        {searching && (
          <div style={{ padding: "12px 18px 80px" }} role="region" aria-label="Search results">
            <p style={{ fontSize: 12, color: T.text3, marginBottom: 10, fontWeight: 500 }} aria-live="polite">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
            {results.length === 0 && (
              <div style={{ textAlign: "center", padding: "36px 16px", color: T.text3 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}><Ico label="No results">🔍</Ico></div>
                <p style={{ fontSize: 13 }}>No results for "{query}"</p>
                <p style={{ fontSize: 11, marginTop: 6 }}>Try different keywords or browse sections below</p>
              </div>
            )}
            {results.map((r, i) => (
              <div key={i} className="hvr" role="button" tabIndex={0} onClick={() => goTopic(r.secId, r.topicIdx)} onKeyDown={e => e.key === "Enter" && goTopic(r.secId, r.topicIdx)}
                aria-label={`${r.topicTitle} in ${r.secTitle}`}
                style={{ padding: "13px 15px", background: T.card, borderRadius: 12, marginBottom: 7, border: `1px solid ${T.cardBdr}`, animation: `fadeUp 0.25s ease-out ${i * 0.04}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <Ico>{r.secIcon}</Ico>
                  <span style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5 }}>{r.secTitle}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.accent, marginBottom: 3 }}>{r.topicTitle}</p>
                {r.snippet && <p style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.45 }}>{r.snippet}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ═══ HOME VIEW ═══ */}
        {!searching && view === "home" && (
          <div style={{ padding: "4px 18px 80px" }}>
            {/* Hero */}
            <div style={{ padding: "20px 0 22px", animation: ready ? "fadeUp 0.5s ease-out" : "none" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 27, fontWeight: 900, color: T.accent, lineHeight: 1.2, marginBottom: 7 }}>
                Your Financial<br/><span style={{ background: "linear-gradient(135deg,#95D5B2,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Battle Plan</span>
              </h1>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.55, maxWidth: 330 }}>Mission-critical financial knowledge for every stage of your military career. Powered by DoD FINRED approved content.</p>
            </div>

            {/* §992 Warfighter Readiness Score */}
            <div role="region" aria-label="Financial readiness score" style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", borderRadius: 18, padding: "20px 22px", color: "#FFFFFF", marginBottom: 18, position: "relative", overflow: "hidden", animation: ready ? "fadeUp 0.5s ease-out 0.04s both" : "none" }}>
              <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, letterSpacing: 1, textTransform: "uppercase" }}>Warfighter Score</div>
                  <div style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--font-serif)", lineHeight: 1.1 }}>{warfighterScore}<span style={{ fontSize: 18, opacity: 0.7 }}>%</span></div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>§992 Readiness Index</div>
                </div>
                <div style={{ fontSize: 40 }}><Ico label="Shield">🛡️</Ico></div>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 99, marginTop: 14 }}>
                <div style={{ width: `${warfighterScore}%`, height: "100%", background: "#22c55e", borderRadius: 99, transition: "width 0.6s ease" }} role="progressbar" aria-valuenow={warfighterScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Readiness score ${warfighterScore} percent`} />
              </div>
            </div>

            {/* Career Touchpoint Carousel */}
            <div style={{ marginBottom: 20, animation: ready ? "fadeUp 0.5s ease-out 0.06s both" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 800, color: T.accent, margin: 0 }}>Career Path</h2>
                <button onClick={() => { buzz(); setView("command"); window.history.pushState({ view: "command" }, ""); }} aria-label="Open command dashboard" style={{ fontSize: 10, background: T.card, border: `1px solid ${T.cardBdr}`, color: T.text2, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Leader View →</button>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, WebkitOverflowScrolling: "touch" }} role="list" aria-label="Career touchpoints">
                {TOUCHPOINTS.map(tp => {
                  const { pct, done, total } = progress.tpStats(tp);
                  const full = pct === 100;
                  return (
                    <div key={tp.id} role="listitem" tabIndex={0}
                      onClick={() => { buzz(); setTpId(tp.id); setView("tpDetail"); window.history.pushState({ view: "tpDetail", tpId: tp.id }, ""); }}
                      onKeyDown={e => e.key === "Enter" && (buzz(), setTpId(tp.id), setView("tpDetail"), window.history.pushState({ view: "tpDetail", tpId: tp.id }, ""))}
                      aria-label={`${tp.code} ${tp.title}: ${done} of ${total} complete`}
                      style={{ minWidth: 120, background: T.card, borderRadius: 14, padding: "14px 12px", border: full ? "2px solid #eab308" : `1px solid ${T.cardBdr}`, cursor: "pointer", flexShrink: 0, position: "relative", transition: "border-color 0.3s" }}>
                      {full && <div style={{ position: "absolute", top: 6, right: 6, fontSize: 12 }}><Ico label="Complete">✅</Ico></div>}
                      <div style={{ fontSize: 12, fontWeight: 800, color: full ? "#eab308" : T.chart?.primary || "#95D5B2", marginBottom: 2 }}>{tp.code}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.3, marginBottom: 2 }}>{tp.title}</div>
                      <div style={{ fontSize: 10, color: T.text3, marginBottom: 8, height: 14, overflow: "hidden" }}>{tp.sub}</div>
                      <div style={{ height: 4, background: T.inputBg || "rgba(255,255,255,0.1)", borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: full ? "#eab308" : (T.chart?.secondary || "#4ECDC4"), borderRadius: 99, transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 9, color: T.text3, marginTop: 4 }}>{done}/{total}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resource shortcut boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24, animation: ready ? "fadeUp 0.5s ease-out 0.08s both" : "none" }} role="region" aria-label="Quick resource access by category">
              {[
                { icon: "💰", label: "Foundations", value: SECTIONS[0]?.topics.length || "?", color: "#95D5B2", section: "foundations" },
                { icon: "🏦", label: "Banking", value: "5+", color: "#7FC8F8", section: "banking-credit" },
                { icon: "🛡️", label: "Protections", value: "4+", color: "#FF8FA3", section: "consumer-protection" },
                { icon: "📈", label: "Saving & Retirement", value: "6+", color: "#4ECDC4", section: "saving-investing" },
              ].map((box, i) => (
                <div key={i} className="hvr" role="button" tabIndex={0}
                  onClick={() => setShowResourcesFor(box.section)}
                  onKeyDown={e => e.key === "Enter" && setShowResourcesFor(box.section)}
                  aria-label={`View ${box.label} resources`}
                  style={{ background: T.card, borderRadius: 12, padding: "14px 8px", textAlign: "center", border: `1px solid ${T.cardBdr}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}><Ico label={box.label}>{box.icon}</Ico></div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: box.color }}>{box.value}</div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{box.label}</div>
                </div>
              ))}
            </div>

            {/* Section cards */}
            <nav aria-label="Content sections">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="hvr" role="button" tabIndex={0} onClick={() => goSection(s.id)} onKeyDown={e => e.key === "Enter" && goSection(s.id)}
                aria-label={`${s.title}: ${s.subtitle}, ${s.topics.length} topics`}
                style={{ background: `linear-gradient(135deg, ${s.color}CC, ${s.color}99)`, borderRadius: 16, padding: "20px 18px", marginBottom: 10, border: `1px solid ${s.accent}25`, position: "relative", overflow: "hidden", animation: ready ? `fadeUp 0.4s ease-out ${0.12 + i * 0.05}s both` : "none" }}>
                <div aria-hidden="true" style={{ position: "absolute", right: -18, top: -18, fontSize: 72, opacity: 0.07, transform: "rotate(-12deg)" }}>{s.icon}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><Ico>{s.icon}</Ico></div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 3 }}>{s.title}</h3>
                    <p style={{ fontSize: 11.5, color: `${s.accent}CC`, marginBottom: 6 }}>{s.subtitle}</p>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>{s.topics.length} topic{s.topics.length !== 1 ? "s" : ""} →</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Calculator Hub Card */}
            <div className="hvr" role="button" tabIndex={0} onClick={goCalcs} onKeyDown={e => e.key === "Enter" && goCalcs()}
              aria-label={`Financial Calculators: ${CALCS.length} interactive tools including TSP Growth, Debt Payoff, and more`}
              style={{ background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)", borderRadius: 16, padding: "22px 18px", marginBottom: 10, marginTop: 6, border: "1px solid rgba(78,205,196,0.2)", position: "relative", overflow: "hidden", animation: ready ? `fadeUp 0.4s ease-out 0.6s both` : "none" }}>
              <div aria-hidden="true" style={{ position: "absolute", right: -10, top: -10, fontSize: 72, opacity: 0.06, transform: "rotate(-8deg)" }}>🧮</div>
              <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, right: 0, height: 3, background: "linear-gradient(90deg, #4ECDC4, #7FC8F8, #C77DFF, #FF8FA3, #F4A261, #95D5B2)", borderRadius: "16px 16px 0 0" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(78,205,196,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><Ico label="Calculators">🧮</Ico></div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 3 }}>Financial Calculators</h3>
                  <p style={{ fontSize: 11.5, color: "#4ECDC4", marginBottom: 6 }}>TSP Growth, Debt Payoff, Roth vs Traditional & More</p>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)" }}>{CALCS.length} interactive tools →</span>
                </div>
              </div>
            </div>
            </nav>

            {/* Section Resources Modal */}
            {showResourcesFor && (() => {
              const links = getAllResourcesForSection(showResourcesFor);
              const rSec = SECTIONS.find(s => s.id === showResourcesFor);
              return (
                <div role="dialog" aria-modal="true" aria-labelledby="resources-title"
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)", WebkitTransform: "translateZ(0)" }}
                  onClick={() => setShowResourcesFor(null)}>
                  <div style={{ background: T.bg2, borderRadius: 16, width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto", padding: 20, border: `1px solid ${T.cardBdr}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", animation: "fadeUp 0.25s ease-out" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 id="resources-title" style={{ margin: 0, color: T.accent, fontSize: 17, fontFamily: "var(--font-serif)" }}>
                        <Ico>{rSec?.icon}</Ico> {rSec?.title} Resources
                      </h3>
                      <button onClick={() => setShowResourcesFor(null)} aria-label="Close resources panel"
                        style={{ background: "none", border: "none", fontSize: 22, color: T.text3, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>×</button>
                    </div>

                    {links.length === 0 ? (
                      <p style={{ color: T.text2, textAlign: "center", padding: "20px 0" }}>No resources found in this section yet.</p>
                    ) : (
                      <nav aria-label={`${rSec?.title} resource links`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {links.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                            aria-label={`${link.text} (opens in new tab)`}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: T.card, borderRadius: 10, color: T.linkColor, textDecoration: "none", border: `1px solid ${T.cardBdr}`, fontSize: 13, transition: "all 0.2s" }}>
                            <span aria-hidden="true" style={{ fontSize: 16 }}>🔗</span>
                            <span style={{ flex: 1 }}>{link.text}</span>
                            <span aria-hidden="true" style={{ opacity: 0.5, fontSize: 14 }}>↗</span>
                          </a>
                        ))}
                      </nav>
                    )}

                    <button onClick={() => { goSection(showResourcesFor); setShowResourcesFor(null); }}
                      aria-label={`View full ${rSec?.title} section`}
                      style={{ marginTop: 16, width: "100%", padding: 12, background: `${rSec?.accent}18`, border: `1px solid ${rSec?.accent}30`, borderRadius: 10, color: rSec?.accent, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14 }}>
                      → View Full Section
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div style={{ marginTop: 22, padding: 14, background: "rgba(245,158,11,0.05)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.08)" }} role="contentinfo">
              <p style={{ fontSize: 10.5, color: T.text2, lineHeight: 1.65, textAlign: "center" }}>
                <Ico label="warning">⚠️</Ico> Educational content only — not financial, investment, legal, or tax advice. For personalized guidance, contact your PFM/PFC or call Military OneSource at <strong style={{ color: "#F59E0B" }}>800-342-9647</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ═══ SECTION VIEW (topic list) ═══ */}
        {!searching && view === "section" && sec && (
          <div style={{ padding: "4px 18px 80px" }}>
            <div style={{ padding: "14px 0 20px", animation: "slideR 0.25s ease-out" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: sec.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14, border: `1px solid ${sec.accent}25` }}><Ico label={sec.title}>{sec.icon}</Ico></div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 800, color: T.accent, marginBottom: 5 }}>{sec.title}</h2>
              <p style={{ fontSize: 13, color: sec.accent }}>{sec.subtitle}</p>
            </div>

            <nav aria-label={`${sec.title} topics`}>
            {sec.topics.map((t, i) => (
              <div key={i} className="trow" role="button" tabIndex={0} onClick={() => goTopic(sec.id, i)} onKeyDown={e => e.key === "Enter" && goTopic(sec.id, i)}
                aria-label={`Topic ${i + 1}: ${t.title}, ${t.links.length} resources`}
                style={{ padding: "16px 14px", background: T.card, borderRadius: 13, marginBottom: 7, border: `1px solid ${T.cardBdr}`, display: "flex", alignItems: "center", gap: 13, animation: `slideR 0.25s ease-out ${i * 0.04}s both` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${sec.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: sec.accent, flexShrink: 0 }} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{t.links.length} resource{t.links.length !== 1 ? "s" : ""}</p>
                </div>
                <span aria-hidden="true" style={{ color: T.text3, fontSize: 17 }}>›</span>
              </div>
            ))}
            </nav>
          </div>
        )}

        {/* ═══ TOPIC DETAIL VIEW ═══ */}
        {!searching && view === "topic" && sec && topic && (
          <div style={{ padding: "4px 18px 80px", animation: "slideR 0.25s ease-out" }}>
            {/* Breadcrumb */}
            <div style={{ padding: "12px 0 6px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: `${sec.accent}12`, borderRadius: 7, fontSize: 10.5, color: sec.accent, fontWeight: 600, letterSpacing: 0.3 }}>
                <Ico>{sec.icon}</Ico> {sec.title}
              </div>
            </div>
            {/* Title */}
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 800, color: T.accent, marginBottom: 5, marginTop: 10, lineHeight: 1.25 }}>{topic.title}</h2>
            <p style={{ fontSize: 11.5, color: T.text3, marginBottom: 18 }}>Topic {topicIdx + 1} of {sec.topics.length}</p>

            {/* Content — interactive self-assessment or rich text */}
            {topic.content[0] === "__INTERACTIVE_SELF_ASSESSMENT__" ? (
              <SelfAssessment theme={T} goSection={goSection} goCalc={goCalcDetail} />
            ) : (
              <article style={{ fontSize: fs.base, color: T.text2, lineHeight: 1.7, marginBottom: 20 }}>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {topic.content.map((line, i) => <RichLine key={i} text={line} />)}
                </ul>
              </article>
            )}

            {/* Resource Links */}
            {topic.links.length > 0 && (
              <nav aria-label="Resource links" style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}><Ico label="Links">🔗</Ico> Resources & Links</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topic.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="lnk" aria-label={`${link.text} (opens in new tab)`}>
                      <span aria-hidden="true" style={{ fontSize: 14 }}>↗</span>
                      <span>{link.text}</span>
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {/* Prev / Next nav */}
            <nav aria-label="Topic navigation" style={{ display: "flex", gap: 8 }}>
              {topicIdx > 0 && (
                <button className="bbtn" onClick={() => goTopic(sec.id, topicIdx - 1)} aria-label={`Previous topic: ${sec.topics[topicIdx - 1].title}`} style={{ flex: 1, justifyContent: "center" }}>← Previous</button>
              )}
              {topicIdx < sec.topics.length - 1 && (
                <button className="bbtn" onClick={() => goTopic(sec.id, topicIdx + 1)} aria-label={`Next topic: ${sec.topics[topicIdx + 1].title}`}
                  style={{ flex: 1, justifyContent: "center", background: `${sec.accent}18`, borderColor: `${sec.accent}28`, color: sec.accent }}>
                  Next Topic →
                </button>
              )}
            </nav>

            {/* Disclaimer */}
            <div style={{ marginTop: 20, padding: 11, background: "rgba(107,114,128,0.06)", borderRadius: 9, border: "1px solid rgba(107,114,128,0.08)" }}>
              <p style={{ fontSize: 10, color: T.text3, lineHeight: 1.55, textAlign: "center" }}>
                This information is educational and does not constitute professional financial, investment, legal, or tax advice. For personalized guidance, consult your installation PFM/PFC or a qualified professional.
              </p>
            </div>
          </div>
        )}

        {/* ═══ CALCULATORS HUB ═══ */}
        {!searching && view === "calcs" && (
          <div style={{ padding: "4px 18px 80px" }}>
            <div style={{ padding: "14px 0 20px", animation: "slideR 0.25s ease-out" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #0F2027, #2C5364)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14, border: "1px solid rgba(78,205,196,0.25)" }}><Ico label="Financial calculators">🧮</Ico></div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 800, color: T.accent, marginBottom: 5 }}>Financial Calculators</h2>
              <p style={{ fontSize: 13, color: "#4ECDC4" }}>Run the numbers — make smarter decisions</p>
            </div>

            <nav aria-label="Available calculators">
            {CALCS.map((c, i) => (
              <div key={c.id} className="trow" role="button" tabIndex={0} onClick={() => goCalcDetail(c.id)} onKeyDown={e => e.key === "Enter" && goCalcDetail(c.id)}
                aria-label={`${c.title}: ${c.desc}`}
                style={{ padding: "16px 14px", background: `linear-gradient(135deg, ${c.color}55, ${c.color}33)`, borderRadius: 13, marginBottom: 8, border: `1px solid ${c.accent}20`, display: "flex", alignItems: "center", gap: 13, animation: `slideR 0.25s ease-out ${i * 0.04}s both`, position: "relative", overflow: "hidden" }}>
                <div aria-hidden="true" style={{ position: "absolute", right: -8, top: -8, fontSize: 44, opacity: 0.06 }}>{c.icon}</div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}><Ico>{c.icon}</Ico></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: `${c.accent}CC`, marginTop: 2 }}>{c.desc}</p>
                </div>
                <span aria-hidden="true" style={{ color: T.text3, fontSize: 17 }}>›</span>
              </div>
            ))}
            </nav>

            <div style={{ marginTop: 16, padding: 11, background: "rgba(107,114,128,0.06)", borderRadius: 9, border: "1px solid rgba(107,114,128,0.08)" }}>
              <p style={{ fontSize: 10, color: T.text3, lineHeight: 1.55, textAlign: "center" }}>
                These calculators are educational tools providing estimates only. Results depend on assumptions you provide and should not be considered financial advice. Consult a qualified professional for personalized guidance.
              </p>
            </div>
          </div>
        )}

        {/* ═══ CALCULATOR DETAIL VIEW ═══ */}
        {!searching && view === "calcDetail" && calcId && (() => {
          const calc = CALCS.find(c => c.id === calcId);
          const CalcComponent = CALC_COMPONENTS[calcId];
          if (!calc || !CalcComponent) return null;
          return (
            <div style={{ padding: "4px 18px 80px", animation: "slideR 0.25s ease-out" }}>
              <div style={{ padding: "12px 0 18px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: `${calc.accent}12`, borderRadius: 7, fontSize: 10.5, color: calc.accent, fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>
                  <Ico label="Calculator">🧮</Ico> Calculators
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${calc.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><Ico label={calc.title}>{calc.icon}</Ico></div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 800, color: T.accent, lineHeight: 1.25 }}>{calc.title}</h2>
                    <p style={{ fontSize: 11.5, color: `${calc.accent}CC`, marginTop: 2 }}>{calc.desc}</p>
                  </div>
                </div>
              </div>

              <section aria-label={`${calc.title} calculator`} style={{ background: dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)", borderRadius: 14, padding: "20px 16px", border: `1px solid ${T.cardBdr}`, marginBottom: 18 }}>
                <CalcComponent theme={T} />
              </section>

              {/* Nav between calculators */}
              <nav aria-label="Calculator navigation" style={{ display: "flex", gap: 8 }}>
                {(() => {
                  const idx = CALCS.findIndex(c => c.id === calcId);
                  return (
                    <>
                      {idx > 0 && (
                        <button className="bbtn" onClick={() => goCalcDetail(CALCS[idx - 1].id)} aria-label={`Previous calculator: ${CALCS[idx - 1].title}`} style={{ flex: 1, justifyContent: "center" }}>← {CALCS[idx - 1].title.split(" ")[0]}</button>
                      )}
                      {idx < CALCS.length - 1 && (
                        <button className="bbtn" onClick={() => goCalcDetail(CALCS[idx + 1].id)} aria-label={`Next calculator: ${CALCS[idx + 1].title}`}
                          style={{ flex: 1, justifyContent: "center", background: `${calc.accent}18`, borderColor: `${calc.accent}28`, color: calc.accent }}>
                          {CALCS[idx + 1].title.split(" ")[0]} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </nav>

              <div style={{ marginTop: 20, padding: 11, background: "rgba(107,114,128,0.06)", borderRadius: 9, border: "1px solid rgba(107,114,128,0.08)" }}>
                <p style={{ fontSize: 10, color: T.text3, lineHeight: 1.55, textAlign: "center" }}>
                  Educational estimates only — not financial, investment, or tax advice. Actual results will vary. Consult your PFM/PFC or a qualified professional.
                </p>
              </div>
            </div>
          );
        })()}

        {/* ═══ TOUCHPOINT DETAIL VIEW ═══ */}
        {!searching && view === "tpDetail" && tpId && (
          <TouchpointDetail tpId={tpId} onBack={goHome}
            goSection={(id) => goSection(id)}
            goCalc={(id) => goCalcDetail(id)}
            theme={T} progress={progress} />
        )}

        {/* ═══ COMMAND DASHBOARD VIEW ═══ */}
        {!searching && view === "command" && (
          <CommandDashboard theme={T} progress={progress} onBack={goHome} />
        )}

      </main>
      {agreed && <InstallPrompt />}
    </div>
  );
}
