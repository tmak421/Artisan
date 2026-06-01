'use client'
import Image from 'next/image'
import { useState } from 'react'

// ── Assessment questions ───────────────────────────────────────
const QUESTIONS = [
  {
    q: "Do you know exactly how much BAH you receive and how it's calculated?",
    options: ["Yes — I know the exact amount and zip-code basis", "Roughly, but not the details", "Not really"],
    scores: [2, 1, 0],
  },
  {
    q: "Do you have 3–6 months of expenses saved as an emergency fund?",
    options: ["Yes — fully funded", "Partially — less than 3 months", "No emergency fund"],
    scores: [2, 1, 0],
  },
  {
    q: "Are you contributing to TSP? If so, at minimum enough to get the full government match?",
    options: ["Yes — at or above the match threshold", "Contributing, but below the match", "Not contributing"],
    scores: [2, 1, 0],
  },
  {
    q: "Do you have any high-interest debt (credit cards, payday loans, car notes above 10% APR)?",
    options: ["No high-interest debt", "Some — working on it", "Yes — it's a problem"],
    scores: [2, 1, 0],
  },
  {
    q: "Do you track your monthly spending — and does your spending match your plan?",
    options: ["Yes — I track and stick to it", "I track but often go over", "No budget or tracking"],
    scores: [2, 1, 0],
  },
  {
    q: "Do you know what the Savings Deposit Program (SDP) is and have you used it on a deployment?",
    options: ["Yes — used it or know exactly how", "Heard of it but don't know details", "Never heard of it"],
    scores: [2, 1, 0],
  },
  {
    q: "If you received PCS orders tomorrow, are your finances ready for the move?",
    options: ["Yes — I have a PCS fund and a plan", "Partially — some gaps", "Not ready at all"],
    scores: [2, 1, 0],
  },
]

const TOTAL_MAX = QUESTIONS.length * 2

function getTier(score) {
  const pct = score / TOTAL_MAX
  if (pct >= 0.75) return 'GREEN'
  if (pct >= 0.4)  return 'AMBER'
  return 'RED'
}

const TIER_DATA = {
  RED: {
    label: 'RED — Immediate Action Required',
    color: 'text-red-500',
    border: 'border-red-500',
    bg: 'bg-red-950/30',
    msg: "Your financial position has critical gaps that can affect your career, your clearance, and your family. This isn't a judgment — it's a mission brief. You need a battle plan, not another budgeting tip. Warrior Personal Finance gives you the system to fix this, chapter by chapter, action step by action step.",
    cta: 'Start Here. Get the Field Manual.',
  },
  AMBER: {
    label: 'AMBER — Exposed. Close the Gaps.',
    color: 'text-yellow-400',
    border: 'border-yellow-400',
    bg: 'bg-yellow-950/20',
    msg: "You're not in crisis — but you're exposed. One PCS, one deployment, one unexpected bill away from a problem. You have the right instincts but gaps in execution. Warrior Personal Finance will close those gaps with specific, actionable plans built for your pay grade and your military reality.",
    cta: 'Close the Gaps. Get the Field Manual.',
  },
  GREEN: {
    label: 'GREEN — Solid Foundation. Now Optimize.',
    color: 'text-green-400',
    border: 'border-green-400',
    bg: 'bg-green-950/20',
    msg: "Strong foundation. You're ahead of most of the formation. Now it's time to optimize — advanced TSP strategy, transition preparation, protecting your clearance, and building real wealth on a military timeline. Warrior Personal Finance gives you the advanced tactics to go from stable to financially free.",
    cta: 'Optimize and Advance. Get the Field Manual.',
  },
}

// ── Assessment component ───────────────────────────────────────
function Assessment() {
  const [answers, setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = Object.keys(answers).length === QUESTIONS.length

  function submit() {
    if (allAnswered) setSubmitted(true)
  }

  if (submitted) {
    const score = Object.values(answers).reduce((a, b) => a + b, 0)
    const tier  = getTier(score)
    const td    = TIER_DATA[tier]
    return (
      <div className={`border ${td.border} ${td.bg} p-8 max-w-2xl mx-auto`}>
        <div className={`font-mono font-bold text-lg mb-2 ${td.color}`}>
          READINESS SCORE: {score}/{TOTAL_MAX}
        </div>
        <div className={`font-mono font-bold text-2xl mb-4 ${td.color}`}>
          ▌ {td.label}
        </div>
        <p className="text-txt-primary mb-6 leading-relaxed">{td.msg}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#buy"
            className="bg-accent-green text-black font-bold py-4 px-8 text-center uppercase tracking-widest text-sm hover:brightness-110 transition-all">
            {td.cta}
          </a>
          <button onClick={() => { setAnswers({}); setSubmitted(false) }}
            className="border border-border-sub text-txt-primary py-4 px-8 uppercase tracking-widest text-sm hover:border-accent-green transition-colors">
            Retake Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {QUESTIONS.map((q, qi) => (
        <div key={qi} className="mb-8">
          <div className="font-mono text-accent-green text-sm mb-2 uppercase tracking-widest">
            Question {qi + 1} / {QUESTIONS.length}
          </div>
          <p className="text-txt-heading font-bold text-lg mb-3">{q.q}</p>
          {q.options.map((opt, oi) => (
            <button key={oi}
              className={`q-option ${answers[qi] === q.scores[oi] ? 'chosen' : ''}`}
              onClick={() => setAnswers(prev => ({ ...prev, [qi]: q.scores[oi] }))}>
              {opt}
            </button>
          ))}
        </div>
      ))}
      <button
        onClick={submit}
        disabled={!allAnswered}
        className={`w-full py-4 font-bold uppercase tracking-widest text-sm transition-all mt-4 ${
          allAnswered
            ? 'bg-accent-green text-black hover:brightness-110 cursor-pointer'
            : 'bg-border-sub text-gray-600 cursor-not-allowed'
        }`}>
        {allAnswered ? 'Get My Readiness Score →' : `Answer All ${QUESTIONS.length} Questions to Score`}
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="bg-bg-primary min-h-screen">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border-sub">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-patch.png" alt="Artisan Bitcoin" width={32} height={32} className="rounded" />
            <span className="font-mono text-accent-gold font-bold tracking-widest text-sm uppercase">
              YourFinance.ai
            </span>
          </div>
          <a href="#buy"
            className="bg-accent-green text-black text-xs font-bold uppercase tracking-widest px-5 py-2 hover:brightness-110 transition-all">
            Get the Book
          </a>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        {/* Topographic grid overlay effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{backgroundImage:'repeating-linear-gradient(0deg,#00CC66,#00CC66 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#00CC66,#00CC66 1px,transparent 1px,transparent 60px)'}} />

        <div className="relative">
          <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
            ▌ FINANCIAL READINESS FIELD MANUAL — BOOK 1
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-txt-heading leading-none tracking-tight mb-6 uppercase">
            Your Financial<br />
            Readiness Starts<br />
            <span className="text-accent-green">Here.</span>
          </h1>
          <p className="text-xl text-txt-primary mb-2 max-w-xl leading-relaxed">
            Not with a budget app. Not with a 15-minute in-processing briefing.
          </p>
          <p className="text-xl font-bold text-txt-heading mb-8 max-w-xl">
            With a battle plan.
          </p>
          <p className="text-txt-primary mb-10 max-w-lg leading-relaxed">
            From an AFC®-credentialed military financial counselor who has been exactly where you are — and fought his way out. Written for Active Duty, Guard, and Reservists at every pay grade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#buy"
              className="bg-accent-green text-black font-black uppercase tracking-widest text-sm py-5 px-10 text-center hover:brightness-110 transition-all">
              Get the Field Manual — $4.99
            </a>
            <a href="#assessment"
              className="border border-accent-green text-accent-green font-bold uppercase tracking-widest text-sm py-5 px-10 text-center hover:bg-accent-green hover:text-black transition-all">
              Check Your Readiness Score →
            </a>
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── SECTION 2: THE PROBLEM ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
          ▌ SITUATION REPORT
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-txt-heading uppercase tracking-tight mb-8">
          The System Failed to Prepare You.
        </h2>

        {/* [TODD: STORY — Your opening scenario. 2-3 sentences from your experience. Placeholder below.] */}
        <p className="text-txt-primary mb-8 max-w-2xl leading-relaxed text-lg border-l-2 border-accent-green pl-6 italic">
          "I've sat across the desk from an E-4 with a $32,000 car loan on a $2,400 monthly paycheck.
          That's not a financial problem. That's a system that never gave him the tools to make a
          different decision."
        </p>
        <p className="text-sm text-accent-gold font-mono mb-10">— Todd Maki, AFC® &nbsp;|&nbsp; [TODD: Personalize this opening story with your voice]</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { label: 'Nobody taught you how military pay actually works.', detail: 'BAH, BAS, COLA, SDP, SCRA — these aren\'t acronyms. They\'re money on the table you\'re walking past every month.' },
            { label: 'FINRED briefings check a box. They don\'t change behavior.', detail: 'One slide deck during in-processing isn\'t financial education. It\'s compliance theater. You deserved more.' },
            { label: 'Predatory lenders know your BAH better than you do.', detail: 'Every car lot, payday lender, and rent-to-own store near every gate is staffed by people who studied your LES before you did.' },
            { label: 'The military rewards physical readiness. Financial readiness is on you.', detail: 'There\'s no APFT for your bank account. No one flags you when your net worth goes negative. That changes today.' },
          ].map((item, i) => (
            <div key={i} className="callout">
              <p className="font-bold text-txt-heading mb-1">{item.label}</p>
              <p className="text-txt-primary text-sm leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* [TODD: LOCAL INSIGHT — Optional Fort Bliss/El Paso reference if you want it. Remove flag to skip.] */}
        <div className="bg-bg-surface border border-border-sub p-6">
          <div className="font-mono text-accent-amber text-xs uppercase tracking-widest mb-2">⚠ MISSION INTEL</div>
          <p className="text-txt-primary leading-relaxed">
            The average service member loses an estimated <span className="font-mono font-bold text-accent-amber">$72,000</span> over a 20-year career to preventable financial decisions — car loans, missed TSP matching, payday debt, and PCS moves without a cash reserve. This book exists to stop that bleeding.
          </p>
          <p className="text-xs text-gray-500 mt-2 font-mono">[TODD: STAT/SOURCE — Replace with a verified FINRA/NFCS or DoD statistic before launch]</p>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── SECTION 3: BOOK SHOWCASE ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
          ▌ THE SOLUTION
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Book cover */}
          <div className="flex justify-center">
            {/* [TODD: Replace placeholder with actual book cover — save as book-cover.png in public/] */}
            <div className="w-64 h-80 bg-bg-elevated border border-border-sub flex flex-col items-center justify-center text-center p-6">
              <div className="font-mono text-accent-green text-xs tracking-widest mb-4 uppercase">Book 1</div>
              <div className="font-black text-txt-heading text-xl uppercase leading-tight mb-2">
                Warrior Personal Finance
              </div>
              <div className="text-accent-gold font-mono text-sm mb-4">The Military Money Manual</div>
              <div className="border-t border-border-sub pt-4 w-full">
                <div className="text-txt-primary text-sm">Todd Maki, AFC®</div>
                <div className="text-gray-500 text-xs mt-1">Artisan Bitcoin Inc.</div>
              </div>
              <div className="text-xs text-gray-600 mt-4 font-mono italic">[Replace with final cover art]</div>
            </div>
          </div>

          {/* Book details */}
          <div>
            <h2 className="text-3xl font-black text-txt-heading uppercase tracking-tight mb-2">
              Warrior Personal Finance
            </h2>
            <div className="font-mono text-accent-gold text-sm mb-6">
              The Military Money Manual — Book 1 of 9
            </div>
            <p className="text-txt-primary mb-6 leading-relaxed">
              This is not a civilian finance book with the word "military" added to the title.
              It is built from the ground up for the BAH, deployment pay, PCS moves, SCRA,
              SDP, and transition realities that no civilian author has ever lived.
            </p>

            <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-3">
              Mission Objectives:
            </div>
            {[
              'Decode your LES and stop leaving money on the table',
              'Build a deployment savings strategy using the SDP',
              'Set up TSP contributions that actually compound',
              'Kill predatory debt before it kills your career',
              'Execute a PCS move without going broke',
              'Build your transition plan 24 months out — not 24 days',
            ].map((obj, i) => (
              <div key={i} className="flex items-start gap-3 mb-2">
                <span className="text-accent-green font-mono text-sm mt-0.5">▸</span>
                <span className="text-txt-primary text-sm leading-relaxed">{obj}</span>
              </div>
            ))}

            <div className="mt-6 border-t border-border-sub pt-6">
              <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-1">Author</div>
              <div className="text-txt-heading font-bold">Todd Maki, AFC®</div>
              <div className="text-txt-primary text-sm">Retired U.S. Army 1LT · Accredited Financial Counselor®</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── SECTION 4: ASSESSMENT ── */}
      <section id="assessment" className="py-20 px-6 bg-bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
            ▌ FINANCIAL READINESS SELF-ASSESSMENT
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-txt-heading uppercase tracking-tight mb-4">
            What's Your Readiness Score?
          </h2>
          <p className="text-txt-primary mb-10 max-w-xl leading-relaxed">
            7 questions. 2 minutes. You'll get a RED / AMBER / GREEN readiness tier —
            and a specific action plan based on where you actually stand.
          </p>
          <Assessment />
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── SECTION 5: ABOUT THE AUTHOR ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
          ▌ ABOUT THE AUTHOR
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <Image
              src="/plaque.png"
              alt="Todd Maki AFC® — Artisan Bitcoin Inc."
              width={480}
              height={480}
              className="w-full rounded"
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-txt-heading uppercase tracking-tight mb-4">
              Todd Maki, AFC®
            </h2>

            {/* [TODD: STORY — 2-3 sentences on your personal why. Why you wrote this book. Placeholder below.] */}
            <p className="text-txt-primary mb-4 leading-relaxed border-l-2 border-accent-green pl-4 italic">
              "The first time I watched a brother-in-arms financially destroy himself, I stood by and said nothing.
              I was wrong. That moment — and the dozens like it I witnessed over the next two decades —
              is why this book exists."
            </p>
            <p className="text-xs text-accent-gold font-mono mb-6">[TODD: Replace with your exact voice from the intro chapter]</p>

            <p className="text-txt-primary mb-6 leading-relaxed text-sm">
              Todd has supported service members and families across Army installations in the United States
              and Germany, building a career at the intersection of military service and financial readiness.
              He came to the AFC® credential the hard way — broke, figuring it out through free resources,
              one repetition at a time.
            </p>

            <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-3">
              Credentials:
            </div>
            {[
              'Accredited Financial Counselor® (AFC®) — AFCPE®',
              'Retired U.S. Army First Lieutenant (Field Artillery)',
              '20+ years military financial counseling — Active, Guard, Reserve',
              'MPA — University of Texas at El Paso',
              'MA Human Resource Management — Hawaii Pacific University',
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3 mb-2">
                <span className="text-accent-gold font-mono text-sm">▸</span>
                <span className="text-txt-primary text-sm">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── SECTION 6: BUY THE BOOK ── */}
      <section id="buy" className="py-20 px-6 bg-bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-4">
            ▌ EXECUTE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-txt-heading uppercase tracking-tight mb-4">
            Get the Field Manual
          </h2>
          <p className="text-txt-primary mb-10 max-w-xl leading-relaxed">
            Two paths. One mission. Pick the channel that works for you.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {/* Direct purchase */}
            <div className="border border-accent-green bg-bg-elevated p-8">
              <div className="font-mono text-accent-green text-xs uppercase tracking-widest mb-2">Recommended</div>
              <div className="text-2xl font-black text-txt-heading mb-1">Buy Direct</div>
              <div className="font-mono text-accent-green text-3xl font-bold mb-2">$4.99</div>
              <div className="text-txt-primary text-sm mb-1">eBook — instant download</div>
              <div className="text-gray-500 text-xs font-mono mb-6">Print edition: $14.99</div>
              <p className="text-txt-primary text-sm mb-6 leading-relaxed">
                Higher margin supports the mission directly. You own the purchase — no Amazon account required.
              </p>
              {/* [TODD: Wire Stripe checkout link here after CPA sign-off] */}
              <button
                className="w-full bg-accent-green text-black font-black uppercase tracking-widest text-sm py-4 hover:brightness-110 transition-all">
                Buy Now — $4.99 eBook
              </button>
              <p className="text-xs text-gray-600 font-mono mt-3 text-center">[Stripe checkout — activate after CPA review]</p>
            </div>

            {/* Amazon */}
            <div className="border border-border-sub bg-bg-elevated p-8">
              <div className="font-mono text-gray-500 text-xs uppercase tracking-widest mb-2">Also Available</div>
              <div className="text-2xl font-black text-txt-heading mb-1">Buy on Amazon</div>
              <div className="font-mono text-txt-primary text-3xl font-bold mb-2">$4.99</div>
              <div className="text-txt-primary text-sm mb-1">Kindle eBook</div>
              <div className="text-gray-500 text-xs font-mono mb-6">Print: $14.99 — Prime eligible</div>
              <p className="text-txt-primary text-sm mb-6 leading-relaxed">
                Prefer Amazon? Reviews and discoverability help the series grow — and help the next service member find it.
              </p>
              {/* [TODD: Replace # with your Amazon KDP listing URL once live] */}
              <a href="#"
                className="block w-full border border-txt-primary text-txt-heading font-black uppercase tracking-widest text-sm py-4 text-center hover:border-accent-green hover:text-accent-green transition-colors">
                Buy on Amazon →
              </a>
              <p className="text-xs text-gray-600 font-mono mt-3 text-center">[TODD: Add Amazon KDP URL before launch]</p>
            </div>
          </div>

          {/* Series teaser */}
          <div className="border border-border-sub p-6 bg-bg-primary">
            <div className="font-mono text-accent-gold text-xs uppercase tracking-widest mb-2">Coming Soon</div>
            <p className="text-txt-primary text-sm leading-relaxed">
              <span className="text-txt-heading font-bold">Part of the 9-Volume Financial Bootcamp Series.</span>{' '}
              Book 1 is your foundation. Books 2–9 cover the full lifecycle: TSP optimization, transition
              income strategy, real estate, veteran benefits, and building generational wealth on a military timeline.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border-sub py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="font-mono text-accent-gold font-bold text-sm uppercase tracking-widest mb-1">
              YourFinance.ai
            </div>
            <div className="text-gray-600 text-xs">
              © {new Date().getFullYear()} Artisan Bitcoin Inc. · El Paso, TX · All rights reserved.
            </div>
          </div>
          <div className="text-right">
            <a href="https://artisanbitcoin.com"
              className="text-accent-green text-xs font-mono hover:underline">
              artisanbitcoin.com →
            </a>
            <div className="text-gray-600 text-xs mt-1 max-w-xs text-right leading-relaxed">
              Educational content only. Not financial advice. Todd Maki is an AFC®, not a registered investment advisor.
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
