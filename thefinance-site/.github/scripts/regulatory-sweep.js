/**
 * ARTISAN BITCOIN INC. — Regulatory Intelligence Weekly Sweep
 * Agent 1 Lite: Monitors bill status, regulatory rules, DTCC milestones
 * Runs every Monday 7AM CT via GitHub Actions
 * Outputs: sweep-report.md (saved as artifact, reviewed by Todd)
 *
 * APIs used (all free, no key required):
 *  - api.congress.gov — bill tracking
 *  - federalregister.gov — FDIC/FinCEN rule tracking
 */

const https = require('https')
const fs    = require('fs')

const TODAY = new Date().toISOString().split('T')[0]

// ── Tracked legislation ──────────────────────────────────────────────────────
const BILLS = [
  {
    id:       'hr3633-119',
    label:    'CLARITY Act (H.R. 3633)',
    congress: 119,
    type:     'hr',
    number:   3633,
    module:   'clarity',
    note:     'Passed committee 15-9. Watch for Senate floor vote.',
  },
  {
    id:       's954-119',
    label:    'BITCOIN Act — S.954 (Lummis)',
    congress: 119,
    type:     's',
    number:   954,
    module:   'bitcoin_reserve',
    note:     'Codifies Strategic Bitcoin Reserve EO. 1M BTC / 20-year hold.',
  },
  {
    id:       'hr-arma-119',
    label:    'ARMA — American Reserve Modernization Act',
    congress: 119,
    type:     'hr',
    number:   0,    // Update when assigned — introduced May 21 2026
    module:   'bitcoin_reserve',
    note:     '17+ bipartisan co-sponsors. Begich/Golden. Mirrors S.954.',
  },
  {
    id:       'hr-genius-119',
    label:    'GENIUS Act (Payment Stablecoin)',
    congress: 119,
    type:     's',
    number:   394,
    module:   'genius',
    note:     'Active — Pub. L. 119-27. Monitor implementing regulations.',
  },
]

// ── Tracked Federal Register searches ───────────────────────────────────────
const FR_SEARCHES = [
  {
    label:  'FDIC AML/CFT Final Rule (RIN 3064-AG19)',
    query:  'FDIC AML CFT digital asset',
    module: 'fdic',
    note:   'Watch for final rule publication — comment period closed.',
  },
  {
    label:  'FinCEN Digital Asset Guidance',
    query:  'FinCEN digital asset cryptocurrency',
    module: 'fincen',
    note:   'Monitor for new SAR threshold guidance on tokenized securities.',
  },
  {
    label:  'OCC / SEC Tokenized Securities',
    query:  'tokenized securities blockchain settlement custody',
    module: 'clarity',
    note:   'DTCC October 2026 launch will force regulatory guidance.',
  },
]

// ── DTCC Milestone tracker ───────────────────────────────────────────────────
const DTCC_MILESTONES = [
  { date: '2026-07-01', label: 'DTCC pilot launch — live blockchain settlement begins',    status: 'UPCOMING' },
  { date: '2026-10-01', label: 'DTCC full launch — Russell 1000, ETFs, Treasuries on-chain', status: 'UPCOMING' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'ArtisanBitcoin-RegulatoryIntelligence/1.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({ _raw: data, _status: res.statusCode }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function impactFlag(days) {
  if (days < 0)   return '✅ PASSED'
  if (days < 14)  return '🔴 IMMINENT'
  if (days < 45)  return '🟡 APPROACHING'
  return '⚪ UPCOMING'
}

// ── Main sweep ───────────────────────────────────────────────────────────────
async function runSweep() {
  const report = []
  const issues = []

  report.push(`# Artisan Bitcoin — Regulatory Intelligence Weekly Sweep`)
  report.push(`**Date:** ${TODAY} | **Agent:** Regulatory Sweep v1.0 | **Review required before any platform update**\n`)
  report.push(`---\n`)

  // ── 1. DTCC Milestone Countdown ──────────────────────────────────────────
  report.push(`## ⏱ DTCC Milestone Countdown\n`)
  for (const m of DTCC_MILESTONES) {
    const days  = daysUntil(m.date)
    const flag  = impactFlag(days)
    const label = days < 0 ? `${Math.abs(days)} days ago` : `${days} days away`
    report.push(`- ${flag} **${m.label}**`)
    report.push(`  - Target: ${m.date} (${label})`)
    if (days < 30 && days > 0) issues.push(`DTCC milestone in ${days} days: "${m.label}" — update Timeline module`)
  }
  report.push('')

  // ── 2. Bill Status (Congress.gov API) ────────────────────────────────────
  report.push(`## 🏛️ Legislative Tracker\n`)
  for (const bill of BILLS) {
    report.push(`### ${bill.label}`)
    report.push(`- Platform module: \`${bill.module}\``)
    report.push(`- Standing note: ${bill.note}`)

    if (bill.number === 0) {
      report.push(`- ⚠️ Bill number not yet assigned — monitor Congress.gov manually`)
      report.push('')
      continue
    }

    const url = `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type}/${bill.number}?format=json&api_key=DEMO_KEY`
    try {
      const data = await fetch(url)
      if (data.bill) {
        const b          = data.bill
        const latestAction = b.latestAction?.text || 'No recent action'
        const actionDate   = b.latestAction?.actionDate || 'Unknown'
        const introduced   = b.introducedDate || 'Unknown'

        report.push(`- **Latest Action:** ${latestAction}`)
        report.push(`- **Action Date:** ${actionDate}`)
        report.push(`- **Introduced:** ${introduced}`)
        report.push(`- **Sponsor:** ${b.sponsors?.[0]?.fullName || 'Unknown'}`)

        // Flag if action was in last 7 days
        const actionAge = daysUntil(actionDate)
        if (actionAge > -8 && actionAge <= 0) {
          issues.push(`🔴 NEW ACTION on ${bill.label}: "${latestAction}" (${actionDate}) — review platform module \`${bill.module}\``)
        }
      } else if (data._status === 429) {
        report.push(`- ⚠️ Rate limited by Congress.gov — check manually at congress.gov`)
      } else {
        report.push(`- ⚠️ Could not retrieve bill data — verify bill number or check congress.gov`)
      }
    } catch (err) {
      report.push(`- ⚠️ API error: ${err.message} — check manually`)
    }
    report.push('')
  }

  // ── 3. Federal Register Sweep ────────────────────────────────────────────
  report.push(`## 📋 Federal Register — Recent Regulatory Activity\n`)
  for (const search of FR_SEARCHES) {
    report.push(`### ${search.label}`)
    report.push(`- Platform module: \`${search.module}\``)
    report.push(`- Watch for: ${search.note}`)

    const encoded = encodeURIComponent(search.query)
    const url     = `https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=${encoded}&per_page=3&order=newest&fields%5B%5D=title&fields%5B%5D=publication_date&fields%5B%5D=document_number&fields%5B%5D=type&fields%5B%5D=abstract`

    try {
      const data = await fetch(url)
      if (data.results?.length > 0) {
        report.push(`- **Recent Federal Register entries:**`)
        for (const doc of data.results) {
          const age = daysUntil(doc.publication_date)
          const isNew = age > -14 && age <= 0
          const marker = isNew ? '🆕 ' : '   '
          report.push(`  ${marker}[${doc.publication_date}] ${doc.type}: ${doc.title}`)
          if (isNew) {
            issues.push(`📋 New Federal Register entry relevant to \`${search.module}\`: "${doc.title}" (${doc.publication_date})`)
          }
        }
      } else {
        report.push(`- No recent entries found`)
      }
    } catch (err) {
      report.push(`- ⚠️ API error: ${err.message}`)
    }
    report.push('')
  }

  // ── 4. Action Items Summary ──────────────────────────────────────────────
  report.push(`## 🎯 Action Items for Todd\n`)
  if (issues.length === 0) {
    report.push(`✅ No urgent updates detected this week. Platform content appears current.\n`)
    report.push(`Routine check: verify DTCC pilot launch status as July 2026 approaches.\n`)
  } else {
    report.push(`**${issues.length} item(s) require your review before updating the platform:**\n`)
    for (const issue of issues) {
      report.push(`- ${issue}`)
    }
    report.push(`\n**How to update:** Open \`thefinance-site/components/RegulatoryIntelligencePlatform.jsx\``)
    report.push(`in Claude Code and say: "Update the [module name] module with: [what changed]"`)
    report.push(`Claude drafts the edit. You review. Merge to main. Netlify deploys automatically.\n`)
  }

  // ── 5. Agent System Status Reminder ─────────────────────────────────────
  report.push(`## 🤖 Agent System Integration Status\n`)
  report.push(`- **Current mode:** Agent 1 Lite (automated monitoring, manual update workflow)`)
  report.push(`- **Next upgrade:** Agent 1 Full — drafts exact JSX edits as GitHub PRs (requires Claude API key in secrets)`)
  report.push(`- **Agent system repo:** github.com/Financial-Bootcamp/agent-system`)
  report.push(`- **OBBBA QSB Deadline:** July 4, 2026 — ${daysUntil('2026-07-04')} days away. CPA gate required before election.`)
  report.push(`- **SAM.gov renewal:** Monitor — confirmed active as of 2026-05-30`)
  report.push(`\n---`)
  report.push(`*This report is produced by automated sweep. All content changes require Todd Maki review before publication.*`)
  report.push(`*AFC® scope-of-practice boundaries and Bitcoin-only enforcement are maintained in all platform content.*`)

  // ── Write report ─────────────────────────────────────────────────────────
  const reportText = report.join('\n')
  fs.writeFileSync('sweep-report.md', reportText)
  console.log(reportText)
  console.log(`\n✅ Sweep complete. Report saved to sweep-report.md`)
  console.log(`Action items found: ${issues.length}`)
}

runSweep().catch(err => {
  console.error('Sweep failed:', err)
  fs.writeFileSync('sweep-report.md', `# Sweep Failed\n\nError: ${err.message}\n\nDate: ${TODAY}\n\nCheck GitHub Actions logs.`)
  process.exit(1)
})
