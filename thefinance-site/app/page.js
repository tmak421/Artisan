'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const MODULES = [
  {
    id: 'bitcoin_reserve',
    icon: '₿',
    label: 'Strategic Bitcoin Reserve',
    badge: 'new',
    badgeText: 'NEW — MAY 2026',
    status: 'S.954 (BITCOIN Act) + ARMA — 1M BTC / 20-year hold',
    summary: 'Parallel Senate and House legislation to codify the US Strategic Bitcoin Reserve. 17+ bipartisan House co-sponsors. Direct national security and monetary policy implications for every institutional client.',
    color: '#C8A951',
  },
  {
    id: 'clarity',
    icon: '⚡',
    label: 'CLARITY Act',
    badge: 'critical',
    badgeText: 'CRITICAL',
    status: 'H.R. 3633 — Passed Committee 15–9 — Senate Floor Pending',
    summary: 'Digital commodity vs. security classification. SEC/CFTC jurisdiction split. DTCC October 2026 live launch forces Senate action. The most consequential near-term legislative tracker.',
    color: '#C8A951',
  },
  {
    id: 'genius',
    icon: '§',
    label: 'GENIUS Act',
    badge: null,
    status: 'Active — Pub. L. 119-27',
    summary: 'Payment stablecoin definition, reserve requirements, and supervisory framework. Governs dollar-pegged instruments only. Bitcoin structurally exempt from GENIUS Act scope.',
    color: '#1A3A5C',
  },
  {
    id: 'fdic',
    icon: '⚖',
    label: 'FDIC AML/CFT NPRM',
    badge: 'elevated',
    badgeText: 'HIGH',
    status: 'Comment Period Closed — Final Rule Pending',
    summary: 'Risk-based AML/CFT replacing categorical de-risking. Tokenized deposits treated as deposits under FDI Act. DTCC participant banks (JPMorgan, Citi, BofA) directly affected.',
    color: '#1A4A3A',
  },
  {
    id: 'fincen',
    icon: '⬡',
    label: 'FinCEN Priorities',
    badge: null,
    status: 'Active — 2024 National Priorities',
    summary: 'BSA compliance, digital asset MSB registration, beneficial ownership under CTA. On-chain settlement does not reduce FinCEN reporting obligations.',
    color: '#555555',
  },
  {
    id: 'dtcc',
    icon: '🔗',
    label: 'DTCC Digital Launchpad',
    badge: 'critical',
    badgeText: 'CRITICAL',
    status: 'July 2026 Pilot · October 2026 Full Launch',
    summary: '50 firms signed at launch. Russell 1000 equities, ETFs, and Treasuries moving to blockchain settlement. The most significant infrastructure shift in post-trade history. Cantillon-neutral — does not fix monetary expansion.',
    color: '#4B5320',
  },
]

const CANTILLON = [
  {
    label: 'First Receiver Advantage',
    desc: 'New money created by central banks reaches financial institutions and government first. By the time it reaches individuals, prices have already adjusted upward. The purchasing power loss is invisible but structural.',
  },
  {
    label: 'Bitcoin as Structural Remedy',
    desc: 'Bitcoin\'s fixed supply of 21 million — enforced by mathematical protocol, not policy — is the only monetary instrument immune to Cantillon dynamics. No entity can expand the supply. No proximity to issuance confers advantage.',
  },
  {
    label: 'The DTCC Distinction',
    desc: 'Faster blockchain settlement modernizes infrastructure but does not alter who creates the dollar or the rate of monetary expansion. Infrastructure efficiency ≠ monetary neutrality. Bitcoin remains the only structurally sound store of value.',
  },
  {
    label: 'Softwar Grounding',
    desc: 'MAJ Jason Lowery\'s 2023 MIT thesis under DoD sponsorship reframes Bitcoin not as financial technology but as electro-cyber power projection — converting real-world energy into physical security constraints on cyberspace. ADM Paparo\'s April 2026 congressional testimony independently reached the same conclusion.',
  },
]

const TIMELINE = [
  { date: 'Mar 2025',  label: 'BITCOIN Act (S.954) reintroduced — Lummis', type: 'reserve', impact: 'HIGH' },
  { date: 'May 4, 2026',  label: 'DTCC Digital Launchpad announced — 50 firms', type: 'dtcc', impact: 'HIGH' },
  { date: 'May 14, 2026', label: 'CLARITY Act passes committee 15–9', type: 'clarity', impact: 'CRITICAL' },
  { date: 'May 21, 2026', label: 'ARMA introduced — 17+ bipartisan House co-sponsors', type: 'reserve', impact: 'CRITICAL' },
  { date: 'Jul 2026',  label: 'DTCC pilot launch — live blockchain settlement', type: 'dtcc', impact: 'CRITICAL' },
  { date: 'Q3 2026',   label: 'CLARITY Act Senate floor vote', type: 'clarity', impact: 'HIGH' },
  { date: 'Oct 2026',  label: 'DTCC full launch — Russell 1000, ETFs, Treasuries on-chain', type: 'dtcc', impact: 'CRITICAL' },
]

const typeColor = { reserve: '#C8A951', dtcc: '#4B5320', clarity: '#8B1A1A', regulatory: '#555' }
const impactBg  = { CRITICAL: '#8B1A1A', HIGH: '#4B5320', MEDIUM: '#555' }

export default function Home() {
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyDone, setNotifyDone]   = useState(false)

  return (
    <main style={{ background: 'var(--navy)', minHeight: '100vh', color: 'var(--text)' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(13,14,20,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo-icon.jpeg" alt="Artisan Bitcoin" width={30} height={30} style={{ borderRadius: 4, filter: 'sepia(1) saturate(3) hue-rotate(5deg)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              TheFinance.ai
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#platform" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              Platform
            </a>
            <a href="#thesis" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              Thesis
            </a>
            <a href="#access" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              Access
            </a>
            <Link href="/platform" className="btn-gold" style={{ padding: '9px 20px', fontSize: '0.75rem' }}>
              Open Platform →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, padding: '120px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Alert banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(139,26,26,0.15), rgba(139,26,26,0.08))',
          border: '1px solid rgba(139,26,26,0.4)',
          padding: '10px 20px',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          maxWidth: 820,
        }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#FF6B6B', letterSpacing: '0.08em' }}>
            ⚡ CLARITY ACT PASSED COMMITTEE 15–9
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Senate floor vote pending. ARMA introduced May 21 — 1M BTC sovereign reserve target. DTCC pilot: July 2026.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center', maxWidth: 1000 }}>
          <div>
            <div className="section-label">Institutional Bitcoin Intelligence</div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', marginBottom: 24 }}>
              The Monetary Intelligence<br />
              Platform for<br />
              <span style={{ color: 'var(--gold)' }}>Decision-Makers.</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 540, lineHeight: 1.75, marginBottom: 16 }}>
              Six live regulatory modules. A 2026 legislative calendar. Cantillon Effect analysis.
              Softwar thesis grounding. Built for DoD contractors, defense firms, credit unions,
              and institutional clients who need to understand Bitcoin's strategic and regulatory
              position — not just its price.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 540, lineHeight: 1.7, marginBottom: 36 }}>
              Bitcoin-only. No altcoins. No stablecoins. No speculation.
              The analytical foundation is MAJ Lowery's Softwar thesis and Mises/Hayek Austrian monetary theory.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/platform" className="btn-gold">
                Open the Platform →
              </Link>
              <a href="#access" className="btn-outline">
                Request Institutional Access
              </a>
            </div>
          </div>

          {/* Stats panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, minWidth: 240 }}>
            {[
              { val: '6', label: 'Active Modules' },
              { val: '2026', label: 'DTCC Launch' },
              { val: 'CRITICAL', label: 'CLARITY Status' },
              { val: '1M BTC', label: 'Reserve Target' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--navy2)', border: '1px solid var(--border)',
                padding: '20px 16px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)' }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── PLATFORM PREVIEW ── */}
      <section id="platform" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="section-label">Regulatory Intelligence Platform</div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Six Modules. One Platform.
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 560, lineHeight: 1.7, marginBottom: 48 }}>
          Every active regulatory framework that touches institutional Bitcoin — tracked, analyzed,
          and cross-referenced against DTCC milestones and the Cantillon Effect.
          Updated continuously as legislation moves.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 40 }}>
          {MODULES.map(m => (
            <div key={m.id} className="intel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{m.label}</span>
                </div>
                {m.badge === 'critical' && <span className="critical-badge">{m.badgeText}</span>}
                {m.badge === 'elevated' && <span className="elevated-badge">{m.badgeText}</span>}
                {m.badge === 'new'      && <span className="new-badge">{m.badgeText}</span>}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--gold)', marginBottom: 10, opacity: 0.8 }}>
                {m.status}
              </div>
              <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                {m.summary}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/platform" className="btn-gold" style={{ fontSize: '0.9rem', padding: '16px 48px' }}>
            Open Full Platform — All 6 Modules →
          </Link>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── 2026 TIMELINE ── */}
      <section style={{ padding: '80px 24px', background: 'var(--navy2)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="section-label">2026 Regulatory Calendar</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 40 }}>
            Critical Milestones
          </h2>
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
            {TIMELINE.map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: i === TIMELINE.length - 1 ? 0 : 28, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  position: 'absolute', left: -27, top: 6, width: 16, height: 16,
                  borderRadius: '50%', background: typeColor[item.type] || '#555',
                  border: '3px solid var(--navy2)', zIndex: 2,
                }} />
                <div style={{ flex: 1, background: 'var(--navy3)', border: '1px solid var(--border)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--gold)', marginBottom: 5 }}>{item.date}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.4 }}>{item.label}</div>
                    </div>
                    <span style={{
                      flexShrink: 0, background: impactBg[item.impact] || '#555',
                      color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                      padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                      {item.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── SOFTWAR + CANTILLON ── */}
      <section id="thesis" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

          {/* Softwar */}
          <div>
            <div className="section-label">The Softwar Thesis</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Bitcoin as National Security Infrastructure
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 16, fontSize: '0.95rem' }}>
              MAJ Jason P. Lowery (USSF) submitted his MIT master's thesis under DoD National Defense
              Fellowship sponsorship in February 2023. His central argument: proof-of-work is a
              cyber-security mechanism that converts real-world electrical power into physical security
              constraints — making cyberspace attacks thermodynamically prohibitive rather than merely
              logically prohibited.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24, fontSize: '0.95rem' }}>
              ADM Paparo, Commander IndoPaCom, reached the same conclusion independently in April 2026
              congressional testimony. Two senior military officials. One convergent finding. The
              United States must lead in Bitcoin understanding and adoption or forfeit strategic advantage.
            </p>
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderLeft: '4px solid var(--gold)', padding: '18px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "Bitcoin is not a financial curiosity. It is an electro-cyber power projection technology
                with direct national security implications, and the United States must lead in its
                understanding and adoption."
              </p>
              <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>
                — MAJ Jason P. Lowery, USSF · Softwar Thesis · MIT 2023
              </div>
            </div>
          </div>

          {/* Cantillon */}
          <div>
            <div className="section-label">Cantillon Effect Analysis</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Why Bitcoin. Not Blockchain.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CANTILLON.map((c, i) => (
                <div key={i} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: 8 }}>
                    {c.label}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── WHO IT'S FOR ── */}
      <section style={{ padding: '80px 24px', background: 'var(--navy2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="section-label">Who This Is For</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 40 }}>
            Institutional. Government. Defense.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {[
              { icon: '🏛️', title: 'DoD Program Managers', desc: 'Understand Bitcoin\'s strategic and regulatory position before it appears in your contracting officer\'s questions.' },
              { icon: '⚖️', title: 'Defense Contractors', desc: 'Know the CLARITY Act, DTCC timeline, and GENIUS Act before your institutional clients ask. Track it so you don\'t have to.' },
              { icon: '🏦', title: 'Credit Unions & Banks', desc: 'The FDIC AML/CFT final rule is coming. Tokenized deposits, on-chain settlement, and Bitcoin custody — tracked in one place.' },
              { icon: '📋', title: 'Congressional Staff', desc: 'CLARITY Act, BITCOIN Act (S.954), ARMA — the full legislative picture with real analysis, not headlines.' },
              { icon: '🔐', title: 'Compliance Officers', desc: 'FinCEN BSA obligations don\'t change with on-chain settlement. Know exactly where the regulatory lines are.' },
              { icon: '🎖️', title: 'Veteran-Led Enterprises', desc: 'SDVOSB and SDVOB firms building in the defense ecosystem need this intelligence before it\'s in RFP language.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--navy)', border: '1px solid var(--border)', padding: '28px 22px' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: 8 }}>{item.title}</div>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── ABOUT ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div className="section-label">The Analyst</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>
              Todd Maki, AFC®
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 16, fontSize: '0.95rem' }}>
              Retired U.S. Army First Lieutenant. Accredited Financial Counselor®. Founder of
              Artisan Bitcoin Inc. — a Texas C-Corp and SAM.gov-registered federal contractor
              pursuing SDVOSB certification.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24, fontSize: '0.95rem' }}>
              The Regulatory Intelligence Platform was built to fill a gap that no competitor
              occupies: institutional-grade Bitcoin analysis grounded in Austrian monetary theory,
              the Softwar thesis, and DoD FINRED program experience — delivered by someone with
              the credentials, the clearance awareness, and the operational context to make it
              actionable for government and defense audiences.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'AFC® (AFCPE®) — Accredited Financial Counselor',
                'Retired U.S. Army 1LT — Field Artillery, OCS Fort Benning',
                'SAM.gov Registered — UEI: HL1CLL6N9QJ5 · CAGE: 12BX1',
                'SDVOSB — In Process, SBA VetCert',
                'MPA — UTEP · MAHRM — Hawaii Pacific',
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', marginTop: 1 }}>›</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', padding: '36px 32px' }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Compliance Boundaries</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 16 }}>
              All content on TheFinance.ai is institutional education and regulatory intelligence.
              It does not constitute personalized investment advice, securities recommendations,
              or legal counsel.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 16 }}>
              Todd Maki holds the AFC® credential. AFC® scope-of-practice limits are enforced
              across all Artisan Bitcoin Inc. platforms. No content on this platform constitutes
              investment advice, allocation recommendations, or price targets of any kind.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 0 }}>
              Bitcoin-only. No altcoins, stablecoins, or proof-of-stake protocols are analyzed
              or recommended on this platform.
            </p>
          </div>
        </div>
      </section>

      <div className="gold-rule" />

      {/* ── ACCESS / CTA ── */}
      <section id="access" style={{ padding: '80px 24px', background: 'var(--navy2)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Institutional Access</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Request Platform Access
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            The platform is currently in controlled release. Institutional licensing and custom
            briefing packages available for defense contractors, credit unions, congressional
            staff, and DoD program offices.
          </p>

          {notifyDone ? (
            <div style={{ background: 'var(--navy)', border: '1px solid var(--border)', padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>Request Received</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>We will be in touch within one business day.</div>
            </div>
          ) : (
            <form
              name="access-request"
              method="POST"
              data-netlify="true"
              style={{ background: 'var(--navy)', border: '1px solid var(--border)', padding: '40px 36px' }}
              onSubmit={e => { e.preventDefault(); setNotifyDone(true) }}
            >
              <input type="hidden" name="form-name" value="access-request" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Name</label>
                  <input type="text" name="name" required placeholder="Your name"
                    style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', padding: '11px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Organization</label>
                  <input type="text" name="organization" placeholder="Agency / Firm / Institution"
                    style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', padding: '11px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Email</label>
                <input type="email" name="email" required placeholder="your@organization.gov"
                  style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', padding: '11px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Use Case</label>
                <select name="use_case"
                  style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', padding: '11px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Select...</option>
                  <option value="DoD / Federal Program Office">DoD / Federal Program Office</option>
                  <option value="Defense Contractor">Defense Contractor / Prime</option>
                  <option value="Credit Union / Bank">Credit Union / Bank</option>
                  <option value="Congressional / Legislative Staff">Congressional / Legislative Staff</option>
                  <option value="Legal / Compliance">Legal / Compliance</option>
                  <option value="Veteran-Led Enterprise">Veteran-Led Enterprise</option>
                  <option value="Other Institutional">Other Institutional</option>
                </select>
              </div>
              <button type="submit" className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: '16px' }}>
                Request Institutional Access
              </button>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
                Institutional licensing: from $25K/year · Custom briefing packages available
              </p>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/platform" style={{ color: 'var(--gold)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
              Preview the platform for free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px', background: 'var(--navy)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-icon.jpeg" alt="" width={24} height={24} style={{ borderRadius: 3, filter: 'sepia(1) saturate(3) hue-rotate(5deg)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              TheFinance.ai · Artisan Bitcoin Inc.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="https://artisanbitcoin.com" style={{ color: 'var(--gold)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>ArtisanBitcoin.com</a>
            <a href="https://yourfinance.ai" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>YourFinance.ai</a>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 600, lineHeight: 1.7 }}>
            © {new Date().getFullYear()} Artisan Bitcoin Inc. · El Paso, TX · UEI: HL1CLL6N9QJ5 · CAGE: 12BX1<br />
            Educational content only. Not investment advice. Todd Maki is an AFC®, not a registered investment advisor.
            Bitcoin-only. No altcoins. No stablecoins.
          </div>
        </div>
      </footer>
    </main>
  )
}
