import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const items = [
  // Section 1 - Board Thesis
  {
    title: "Biorce Series A: $52.5M led by DST Global (February 2026)",
    content: "Biorce raised $52.5 million in a Series A led by DST Global in February 2026, bringing total funding to over $60 million. DST Global's participation signals confidence in the commercial model at infrastructure scale.",
    category: "company_intel",
    sourceType: "press_release",
    sourceUrl: "https://biorce.com",
    verificationStatus: "verified",
    relevanceScore: 10,
    tags: JSON.stringify(["funding", "DST Global", "Series A", "Biorce"])
  },
  {
    title: "Biorce Revenue: €10M+ in 2024, 200% above target in 2025",
    content: "Biorce self-reports revenue exceeding €10 million in 2024 and ending 2025 approximately 200% above its revenue target. Approximately 50 pharmaceutical clients secured. These are self-reported claims not independently validated.",
    category: "company_intel",
    sourceType: "podcast",
    sourceUrl: "https://biorce.com",
    verificationStatus: "self_reported",
    relevanceScore: 9,
    tags: JSON.stringify(["revenue", "growth", "clients", "Biorce"])
  },
  {
    title: "Aika 2.0 launched at ASCO 2026, expanded at BIO 2026",
    content: "Biorce launched Aika 2.0 at ASCO 2026 in May and expanded the platform at BIO 2026 in June. Aika generates regulator-ready protocols in 90 seconds with 86% accuracy, trained on over one million clinical trials (all self-reported claims).",
    category: "company_intel",
    sourceType: "press_release",
    sourceUrl: "https://biorce.com",
    verificationStatus: "self_reported",
    relevanceScore: 9,
    tags: JSON.stringify(["Aika 2.0", "ASCO", "BIO", "product launch"])
  },
  // Section 5 - Blind Spots
  {
    title: "ICH M11 Final Guidance Published May 22, 2026 — Protocol Generation Commoditisation Risk",
    content: "ICH M11 (CeSHarP) was adopted at Step 4 in November 2025. FDA published final guidance on May 22, 2026. EMA adopted December 15, 2025. These standards provide a structured template and machine-readable format that any sufficiently capable language model can use as a scaffold. This creates a commoditisation risk for AI protocol generation within 12-18 months.",
    category: "regulatory",
    sourceType: "regulatory_filing",
    sourceUrl: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/m11-clinical-electronic-structured-harmonised-protocol",
    verificationStatus: "verified",
    relevanceScore: 10,
    tags: JSON.stringify(["ICH M11", "CeSHarP", "FDA", "EMA", "protocol standards", "commoditisation"])
  },
  {
    title: "EU AI Act Annex III Enforcement Active from August 2, 2026",
    content: "EU AI Act enforcement for high-risk AI systems under Annex III began August 2, 2026. Clinical AI systems used in drug development that influence patient selection, protocol design, or regulatory submissions may qualify as high-risk AI under Annex III, Article 6. Biorce must complete a legal assessment of whether any current EU customer deployment triggers Annex III obligations within 5 days.",
    category: "regulatory",
    sourceType: "regulatory_filing",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    verificationStatus: "verified",
    relevanceScore: 10,
    tags: JSON.stringify(["EU AI Act", "Annex III", "high-risk AI", "compliance", "August 2026"])
  },
  {
    title: "CDISC USDM v4.0 Live — Standards-Based Switching Cost Opportunity",
    content: "CDISC USDM (Unified Study Definitions Model) v4.0 is live with an implementation guide. The first production-grade clinical AI platform to publicly document a native ICH M11 and CDISC USDM implementation will have a first-mover advantage in enterprise procurement. Faro Health won the CDISC AI Innovation Challenge in September 2025.",
    category: "regulatory",
    sourceType: "regulatory_filing",
    sourceUrl: "https://www.cdisc.org/standards/foundational/usdm",
    verificationStatus: "verified",
    relevanceScore: 9,
    tags: JSON.stringify(["CDISC", "USDM", "standards", "interoperability", "Faro Health"])
  },
  // Competitors
  {
    title: "Faro Health: $38.3M total funding, BMS partnership March 2026",
    content: "Faro Health has $38.3M total funding. In March 2026, Faro Health announced a partnership with Bristol Myers Squibb. In January 2025, Faro Health partnered with Recursion. Faro Health won the TransCelerate Protocol Review Challenge in January 2026 and the CDISC AI Innovation Challenge in September 2025. CEO: Scott Chetham. CSO: Vivian DeWoskin.",
    category: "competitor_intel",
    sourceType: "press_release",
    sourceUrl: "https://farohealth.com",
    verificationStatus: "verified",
    relevanceScore: 10,
    tags: JSON.stringify(["Faro Health", "BMS", "TransCelerate", "CDISC", "competitor"])
  },
  {
    title: "Evinova: AstraZeneca-backed, partnerships with Astellas, BMS, Parexel, Fortrea, Accenture, AWS",
    content: "Evinova is AstraZeneca's clinical AI platform, launched November 2023. President: Cristina Duran. Evinova has signed partnerships with Astellas, Bristol Myers Squibb, Parexel, Fortrea, Accenture, and AWS. Evinova is a direct competitor to Biorce for enterprise pharma accounts. AstraZeneca accounts are not addressable for Biorce.",
    category: "competitor_intel",
    sourceType: "press_release",
    sourceUrl: "https://evinova.com",
    verificationStatus: "verified",
    relevanceScore: 10,
    tags: JSON.stringify(["Evinova", "AstraZeneca", "Astellas", "BMS", "competitor"])
  },
  {
    title: "Novo Nordisk: NovoScribe reduces document production time by 70%, OpenAI partnership April 2026",
    content: "Novo Nordisk's NovoScribe platform reduces document production time by 70% internally (self-reported). Novo Nordisk partnered with OpenAI on April 14, 2026 for enterprise-wide AI integration. Novo Nordisk also operates the Gefion AI supercomputer. Key contacts: Faisal M. Khan, Ph.D. (Corporate VP AI & Analytics, US R&D); Seth Freund (Head of Data, Digital & IT, North America). Gap: NovoScribe covers document automation but not full clinical orchestration.",
    category: "competitor_intel",
    sourceType: "press_release",
    sourceUrl: "https://novonordisk.com",
    verificationStatus: "verified",
    relevanceScore: 9,
    tags: JSON.stringify(["Novo Nordisk", "NovoScribe", "OpenAI", "internal build", "pharma"])
  },
  {
    title: "Novartis: Vas Narasimhan joined Anthropic board April 15, 2026",
    content: "Novartis CEO Vas Narasimhan joined Anthropic's board on April 15, 2026, signalling openness to external AI partnerships. Novartis uses AI for site selection across 460,000 clinical trials via its Unified Ontology digital twin. Novartis has not announced a protocol generation platform — this is a gap Biorce can address.",
    category: "competitor_intel",
    sourceType: "press_release",
    sourceUrl: "https://novartis.com",
    verificationStatus: "verified",
    relevanceScore: 9,
    tags: JSON.stringify(["Novartis", "Anthropic", "Vas Narasimhan", "pharma", "lighthouse target"])
  },
  // Strategic Programmes
  {
    title: "Strategic Programme 1: Lighthouse Pharma Adoption — Tier 0 Targets",
    content: "Tier 0 lighthouse pharma targets for immediate activation: (1) Novo Nordisk — gap between NovoScribe and full clinical orchestration; contact Faisal M. Khan PhD. (2) Bayer — active €50M RFP for clinical AI. (3) Novartis — protocol generation gap; Vas Narasimhan on Anthropic board signals AI openness. (4) Sanofi — Muse covers discovery, orchestration is a gap. (5) Boehringer Ingelheim — known openness to external digital partnerships. Proposed offer: 90-day paid pilot at €150K-€250K.",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 10,
    tags: JSON.stringify(["lighthouse", "pharma", "Novo Nordisk", "Bayer", "Novartis", "Sanofi", "pilot"])
  },
  {
    title: "Strategic Programme 2: Independent Evidence — Tufts CSDD and CTTI as Validation Partners",
    content: "Key validation partners for independent evidence programme: (1) Tufts Center for the Study of Drug Development (CSDD) — most widely cited independent source of clinical development benchmarks. A Tufts CSDD study validating Aika's impact on protocol amendment rates would be cited in every procurement evaluation. (2) Clinical Trials Transformation Initiative (CTTI) — public-private partnership between FDA and Duke University. (3) TransCelerate BioPharma — Faro Health won their Protocol Review Challenge; Biorce should participate in next challenge.",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 9,
    tags: JSON.stringify(["evidence", "validation", "Tufts CSDD", "CTTI", "TransCelerate", "academic"])
  },
  {
    title: "Strategic Programme 3: Standards — CDISC DDF Solution Showcase and TransCelerate DDF Working Group",
    content: "Biorce must publicly document its ICH M11 and CDISC USDM implementation within 60 days. Key actions: (1) Submit case study to CDISC DDF Solution Showcase. (2) Join TransCelerate DDF working group as implementation partner. (3) Develop USDM-format API for downstream systems. Named CDISC contacts: David Iberson-Hurst (Partner, data4knowledge); Nick Halsey (Data Analytics and Methods Task Force, EMA). ICH M11 EWG: Jacqueline Corrigan-Curay (FDA); Ron Fitzmartin (FDA); Noémie Manent (EMA).",
    category: "regulatory",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 9,
    tags: JSON.stringify(["CDISC", "TransCelerate", "DDF", "M11", "USDM", "standards"])
  },
  {
    title: "Strategic Programme 4: Execution-Data Feedback — TriNetX and Flatiron Health as Partners",
    content: "Key execution-data feedback partners: (1) TriNetX — global federated health data network with 250M+ patient records. CEO: August Calhoun; CSO: Elizabeth Schwert. Announced Regeneron collaboration April 2026. (2) Flatiron Health — deep oncology RWD expertise. CEO: Carolyn Starrett; CCO: Ben Jones. Roche reportedly considering sale at $10-15B valuation. (3) NHS Clinical Research Network — 1,000+ research-active sites. (4) Trialbee — AI patient recruitment; CEO Matt Walz; received strategic investment January 2026.",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 9,
    tags: JSON.stringify(["TriNetX", "Flatiron", "NHS", "Trialbee", "execution data", "RWD"])
  },
  {
    title: "Strategic Programme 5: Regulatory Credibility — FDA Pre-Submission and EMA Innovation Task Force",
    content: "Regulatory engagement roadmap: (1) EU AI Act legal assessment within 5 days (enforcement active August 2, 2026). (2) Retain regulatory advisory firm by Week 4 (Halloran Consulting Group, Ropes & Gray, or Covington & Burling). (3) Submit FDA CDER pre-submission meeting request by Week 10. (4) Submit EMA Innovation Task Force application by Week 12. (5) Complete EU AI Act conformity assessment by Month 3. FDA contacts: Jacqueline Corrigan-Curay (Director, Office of Medical Policy); Ron Fitzmartin (ICH M11 EWG). EMA contact: Noémie Manent (Data Analytics Task Force).",
    category: "regulatory",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 10,
    tags: JSON.stringify(["FDA", "EMA", "regulatory", "pre-submission", "EU AI Act", "context of use"])
  },
  // Contractual Red Lines
  {
    title: "Partnership Red Lines: 10 Clauses Biorce Must Never Concede",
    content: "Non-negotiable clauses in all Biorce partnership agreements: (1) Derived-data rights — Biorce retains right to use aggregated anonymised derived intelligence. (2) Model weight ownership — never transfer. (3) No exclusivity in any therapeutic area or geography. (4) No white-labelling that removes Biorce branding. (5) No partner ownership of workflow or standards mappings. (6) Liability cap at annual contract value. (7) Source code escrow only on insolvency or material breach. (8) Audit rights require 30 days notice. (9) Annual price escalation rights. (10) Integration connectors built by Biorce are Biorce IP.",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 10,
    tags: JSON.stringify(["red lines", "contract", "IP", "data rights", "exclusivity", "legal"])
  },
  // Malena Network
  {
    title: "Malena Cutuli Network Activation: NVIDIA Inception, BSC AI Factory, Eko Board Advisory",
    content: "Malena Cutuli's strongest immediate network activation routes for Biorce: (1) NVIDIA Inception — direct membership; activate compute partnership and co-marketing for Biorce. (2) Barcelona Supercomputing Center AI Factory — direct affiliation; activate EU AI Act compliance support and compute access. (3) Eko (Board Advisor) — direct relationship; leverage for health system introductions. (4) Helvetic Investment Group (Executive Board Member) — European pharma introductions. (5) Novartis — established professional relationship (verify current contacts before outreach).",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "verified",
    relevanceScore: 9,
    tags: JSON.stringify(["Malena Cutuli", "NVIDIA", "BSC", "Eko", "Helvetic", "network"])
  },
  // Day 100 Commitments
  {
    title: "Day-100 Commitments: Five Deal Rooms, Two Signed Agreements, One Paid Pilot",
    content: "VP Partnerships Day-100 deliverables: (1) Five active deal rooms open (Novo Nordisk, Bayer, Novartis, Sanofi, Boehringer Ingelheim). (2) Two signed lighthouse agreements with data rights. (3) One paid validation pilot active (€150K-€250K). (4) One regulatory advisory firm retained. (5) One standards sandbox initiated (CDISC DDF). (6) One board dashboard live with five strategic programme KPIs. (7) Claims governance process live. (8) Partnership operating model documented.",
    category: "partnership_intel",
    sourceType: "internal_analysis",
    sourceUrl: "https://biorce.com",
    verificationStatus: "inference",
    relevanceScore: 10,
    tags: JSON.stringify(["100 days", "deliverables", "deal rooms", "lighthouse", "KPIs"])
  },
  // FDA/EMA Joint Statement
  {
    title: "FDA-EMA Joint Statement: 10 Principles for AI in Drug Development (January 14, 2026)",
    content: "FDA and EMA issued a joint statement of 10 principles for AI in drug development on January 14, 2026. This represents the first formal joint regulatory framework for AI in clinical development. Biorce must align its regulatory engagement strategy with these 10 principles. The principles cover transparency, human oversight, validation, and accountability for AI-enabled drug development tools.",
    category: "regulatory",
    sourceType: "regulatory_filing",
    sourceUrl: "https://www.fda.gov/news-events/press-announcements/fda-and-ema-issue-joint-statement-artificial-intelligence",
    verificationStatus: "verified",
    relevanceScore: 9,
    tags: JSON.stringify(["FDA", "EMA", "joint statement", "AI principles", "drug development"])
  },
  // Tempus competitive context
  {
    title: "Tempus Q2 2026: $382.5M Revenue (+22% YoY), Full Year Guidance $1.6B",
    content: "Tempus reported Q2 2026 total revenue of $382.5 million, up 22% year-over-year. Full year 2026 revenue guidance increased to $1.595-$1.605 billion (~25% annual growth). Tempus delivered the first version of its Oncology Foundation Model to AstraZeneca. Key contacts: Eric Lefkofsky (CEO); Ryan Fukushima (CEO, Data & Apps); Kate Sasser PhD (CSO). Tempus represents the scale that clinical AI platforms can reach with the right data strategy.",
    category: "competitor_intel",
    sourceType: "press_release",
    sourceUrl: "https://tempus.com",
    verificationStatus: "verified",
    relevanceScore: 8,
    tags: JSON.stringify(["Tempus", "revenue", "oncology", "AstraZeneca", "foundation model"])
  }
];

let inserted = 0;
for (const item of items) {
  try {
    await conn.execute(
      `INSERT INTO knowledge_items (title, content, category, sourceType, sourceUrl, verificationStatus, relevanceScore, tags, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [item.title, item.content, item.category, item.sourceType, item.sourceUrl, item.verificationStatus, item.relevanceScore, item.tags]
    );
    inserted++;
    console.log(`✓ Inserted: ${item.title.substring(0, 60)}...`);
  } catch (e) {
    console.error(`✗ Failed: ${item.title.substring(0, 60)} — ${e.message}`);
  }
}

await conn.end();
console.log(`\nDone: ${inserted}/${items.length} items inserted`);
