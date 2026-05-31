import { useState } from "react";
import "./App.css";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#contracting", label: "Federal" },
  { href: "#tools", label: "Tools" },
  { href: "#contact", label: "Contact" },
];

const SERVICES = [
  {
    icon: "🏛️",
    title: "Federal Financial Readiness",
    desc: "TAP/FINRED-aligned financial readiness programs for active duty, veterans, and transitioning service members. Delivered by an Accredited Financial Counselor® (AFC®).",
  },
  {
    icon: "₿",
    title: "Bitcoin Education & Softwar Thesis",
    desc: "Institutional-grade Bitcoin education grounded in the Softwar thesis — Bitcoin as strategic national asset, cryptographic deterrent, and long-duration store of value.",
  },
  {
    icon: "📋",
    title: "Federal Contracting & Capture",
    desc: "SAM.gov-registered (Active), CAGE-coded, SDVOSB-eligible contracting entity pursuing DoD, VA, and federal agency opportunities in financial education and advisory services.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Workflows",
    desc: "Agentic business systems for proposal writing, procurement capture, R&D documentation, and compliance monitoring — built on Claude Code and trained on our institutional knowledge base.",
  },
];

const NAICS_CODES = [
  { code: "541715", desc: "R&D in Computer Science / AI" },
  { code: "541511", desc: "Custom Computer Programming" },
  { code: "611430", desc: "Professional & Management Development Training" },
  { code: "611710", desc: "Educational Support Services" },
  { code: "624310", desc: "Vocational Rehabilitation Services" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="ab-site">
      {/* ── Nav ── */}
      <header className="nav">
        <div className="nav-inner">
          <a href="#top" className="nav-logo">
            <img src="/logo-patch.png" alt="Artisan Bitcoin" className="nav-logo-img" />
            <span className="logo-text">ARTISAN <strong>BITCOIN</strong></span>
          </a>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="#contact" className="nav-cta" onClick={() => setMenuOpen(false)}>
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="hero">
        <div className="hero-content">
          <div className="hero-badge">🎖️ Service-Disabled Veteran-Owned Small Business</div>
          <h1 className="hero-title">
            Bitcoin-Native.<br />
            Veteran-Built.<br />
            <span className="accent">Mission-Ready.</span>
          </h1>
          <p className="hero-sub">
            Artisan Bitcoin Inc. delivers institutional-grade financial readiness education,
            Bitcoin-informed advisory frameworks, and AI-powered federal contracting — rooted
            in the Softwar thesis and built for the modern defense ecosystem.
          </p>
          <div className="hero-actions">
            <a href="#services" className="btn-primary">Explore Services</a>
            <a href="#contracting" className="btn-ghost">Federal Contracting →</a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-val">AFC®</span>
              <span className="stat-label">Accredited</span>
            </div>
            <div className="stat">
              <span className="stat-val">SAM.gov</span>
              <span className="stat-label">Registered</span>
            </div>
            <div className="stat">
              <span className="stat-val">SDVOSB</span>
              <span className="stat-label">Veteran-Owned</span>
            </div>
            <div className="stat">
              <span className="stat-val">El Paso</span>
              <span className="stat-label">Texas</span>
            </div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img src="/hero-gold-bitcoin.png" alt="Artisan Bitcoin Inc." className="hero-logo-img" />
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="section services-section">
        <div className="section-inner">
          <div className="section-label">What We Do</div>
          <h2 className="section-title">Services Built for the Mission</h2>
          <p className="section-sub">
            From individual financial readiness to federal procurement, every service
            Artisan Bitcoin delivers is grounded in accountability, compliance, and
            long-term thinking.
          </p>
          <div className="services-grid">
            {SERVICES.map((s) => (
              <div key={s.title} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="section about-section">
        <div className="section-inner about-grid">
          <div className="about-text">
            <div className="section-label">About</div>
            <h2 className="section-title">Built by a Warfighter, for the Mission</h2>
            <p>
              Artisan Bitcoin Inc. is a C-Corp founded by Todd Maki, AFC® — an Army veteran
              and Accredited Financial Counselor with over a decade of service and financial
              education experience. The company was built on one conviction: that Bitcoin,
              understood correctly through the Softwar lens, is not speculation — it is
              strategic infrastructure.
            </p>
            <p>
              We operate at the intersection of financial readiness, federal contracting, and
              AI-accelerated business systems. Our TAP/FINRED-aligned programs have been
              designed to meet DoD and VA standards. Our R&amp;D program documents every
              development session for IRS §41 credit eligibility. Our governance is structured
              around an institutional Council framework — not trend-chasing.
            </p>
            <p>
              We are pre-revenue, NOL-carryforward active, and aggressively building. The
              SDVOSB certification process is underway. The SBA relationship is active.
              The pipeline is real.
            </p>
            <div className="about-tags">
              <span>C-Corp Year 2</span>
              <span>El Paso, TX</span>
              <span>UEI: HL1CLL6N9QJ5</span>
              <span>CAGE: 12BX1</span>
              <span>NOL Carryforward Active</span>
              <span>§41 R&amp;D Credit Eligible</span>
            </div>
          </div>
          <div className="about-right">
            <img src="/hero-plaque.png" alt="Todd Maki AFC® — Artisan Bitcoin Inc." className="plaque-img" />
            <div className="about-values">
            <div className="value-card">
              <span className="value-icon">⚔️</span>
              <h4>Veteran-Led</h4>
              <p>Army veteran. Service-disabled. SDVOSB certification in progress with SBA.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">📐</span>
              <h4>Institutionally Rigorous</h4>
              <p>AFC® credentialed. Council-gated decisions. CPA-reviewed financials. IRS-compliant R&D logs.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🔗</span>
              <h4>Bitcoin-Native</h4>
              <p>Bitcoin-only. No altcoins. No speculation. Softwar thesis as the analytical foundation.</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🤖</span>
              <h4>AI-Accelerated</h4>
              <p>Four-agent Claude Code system for capture, proposals, ops, and R&D documentation.</p>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── Federal Contracting ── */}
      <section id="contracting" className="section federal-section">
        <div className="section-inner">
          <div className="section-label">Federal Contracting</div>
          <h2 className="section-title">SAM.gov Registered &amp; Capture-Ready</h2>
          <p className="section-sub">
            Artisan Bitcoin Inc. is a registered federal contractor pursuing opportunities
            in financial education, transition assistance, and AI-enabled program delivery
            across DoD, VA, and civilian agency channels.
          </p>
          <div className="federal-grid">
            <div className="federal-info">
              <h3>Contractor Profile</h3>
              <table className="fed-table">
                <tbody>
                  <tr><td>Entity</td><td>Artisan Bitcoin Inc.</td></tr>
                  <tr><td>UEI</td><td>HL1CLL6N9QJ5</td></tr>
                  <tr><td>CAGE</td><td>12BX1</td></tr>
                  <tr><td>State</td><td>Texas (El Paso)</td></tr>
                  <tr><td>Business Type</td><td>C-Corp | SDVOSB (pending)</td></tr>
                  <tr><td>SAM.gov</td><td>✓ Active</td></tr>
                  <tr><td>SDVOSB</td><td>In Process — SBA VetCert</td></tr>
                </tbody>
              </table>
            </div>
            <div className="federal-naics">
              <h3>NAICS Codes</h3>
              <ul className="naics-list">
                {NAICS_CODES.map((n) => (
                  <li key={n.code}>
                    <span className="naics-code">{n.code}</span>
                    <span className="naics-desc">{n.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="federal-targets">
              <h3>Target Agencies</h3>
              <ul className="agency-list">
                <li>Army MICC (TAP/FINRED recompete)</li>
                <li>OUSD Personnel &amp; Readiness</li>
                <li>OSD FINRED Program Office</li>
                <li>Air Force / Space Force TAP</li>
                <li>VA Transition Assistance</li>
                <li>SBIR / STTR Phase I</li>
                <li>Defense Innovation Unit (DIU)</li>
              </ul>
            </div>
          </div>
          <div className="federal-cta">
            <p>Contracting officers and teaming partners: capability statement available on request.</p>
            <a href="#contact" className="btn-primary">Request Capability Statement</a>
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section id="tools" className="section tools-section">
        <div className="section-inner">
          <div className="section-label">Technology</div>
          <h2 className="section-title">Tools Built on the Mission</h2>
          <div className="tools-grid">
            <div className="tool-card featured">
              <div className="tool-badge">Live</div>
              <div className="tool-icon">🛡️</div>
              <h3>Warfighter Finance Navigator</h3>
              <p>
                A FINRED/§992-compliant financial readiness tool for service members.
                13 sections, 31+ topics, 80+ resources, 6 interactive calculators.
                Reserve, SDP, and deployment pay calculators included. WCAG AA accessible.
              </p>
              <a href="https://tmak421.github.io/Artisan" className="tool-link" target="_blank" rel="noreferrer">
                Launch App →
              </a>
            </div>
            <div className="tool-card coming-soon">
              <div className="tool-badge coming">Coming Soon</div>
              <div className="tool-icon">🧠</div>
              <h3>YourFinance.ai</h3>
              <p>
                AI-powered personal finance platform designed for veterans and their families.
                Personalized financial readiness scoring, budget modeling, and AFC®-informed
                coaching workflows.
              </p>
              <span className="tool-link muted">In Development</span>
            </div>
            <div className="tool-card coming-soon">
              <div className="tool-badge coming">Coming Soon</div>
              <div className="tool-icon">💡</div>
              <h3>TheFinance.ai</h3>
              <p>
                Institutional financial intelligence platform. Bitcoin-informed macro
                analysis, Cantillon Effect modeling, and advisory frameworks for
                defense contractors and institutional clients.
              </p>
              <span className="tool-link muted">In Development</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="section contact-section">
        <div className="section-inner contact-grid">
          <div className="contact-info">
            <div className="section-label">Contact</div>
            <h2 className="section-title">Ready to Work Together</h2>
            <p>
              Whether you are a contracting officer, a transitioning veteran, a teaming
              partner, or an investor — we want to hear from you.
            </p>
            <div className="contact-details">
              <div className="contact-item">
                <span>📍</span>
                <span>El Paso, Texas</span>
              </div>
              <div className="contact-item">
                <span>🌐</span>
                <span>artisanbitcoin.com</span>
              </div>
              <div className="contact-item">
                <span>🏛️</span>
                <span>SAM.gov: HL1CLL6N9QJ5</span>
              </div>
            </div>
          </div>
          <div className="contact-form-wrap">
            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✅</div>
                <h3>Message Received</h3>
                <p>We will be in touch within one business day.</p>
              </div>
            ) : (
              <form className="contact-form" name="contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit}>
                <input type="hidden" name="form-name" value="contact" />
                <p hidden><input name="bot-field" /></p>
                <div className="form-group">
                  <label htmlFor="inquiry">Inquiry Type</label>
                  <select id="inquiry" name="inquiry" required>
                    <option value="">Select one...</option>
                    <option value="Contracting / Capability Statement">Contracting / Capability Statement</option>
                    <option value="Teaming Partner">Teaming Partner</option>
                    <option value="Financial Readiness Services">Financial Readiness Services</option>
                    <option value="Bitcoin Education">Bitcoin Education</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Contracting inquiry, capability statement request, teaming interest..."
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary full-width">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo-icon.jpeg" alt="" className="nav-logo-img" />
            <span className="logo-text">ARTISAN <strong>BITCOIN</strong> INC.</span>
          </div>
          <div className="footer-info">
            <p>C-Corp · El Paso, TX · UEI: HL1CLL6N9QJ5 · CAGE: 12BX1</p>
            <p>Service-Disabled Veteran-Owned Small Business (SDVOSB) · SAM.gov Registered</p>
            <p>AFC® Financial Counseling · FINRED/§992 Compliant · Bitcoin-Only</p>
            <p><a href="mailto:info@artisanbitcoin.com" style={{color:"var(--bitcoin)"}}>info@artisanbitcoin.com</a></p>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} Artisan Bitcoin Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
