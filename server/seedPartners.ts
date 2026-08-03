import { getDb } from "./db";
import * as schema from "../drizzle/schema";

const PARTNERS_DATA = [
  // === 01 PHARMA & BIOTECH ===
  { name: 'Novo Nordisk', type: 'pharma' as const, tier: 'P0' as const, stage: 'outreach' as const, region: 'EU' as const, description: 'LIGHTHOUSE PHARMA - Partnership 02 in the five-partnership sequence. The first named logo. Social proof compresses every enterprise and partner conversation that follows.', mutualValue: 'Paid retrospective backtest on their own protocols. Capped, therapy-area-exclusive design-partner slot for logo rights.', nextAction: 'Contact Anne C. Fleischer (AVP Business Development, West Europe) to open design-partner conversation', notes: 'Contact: Anne C. Fleischer, AVP Business Development, West Europe. Relationship label: DIRECT and LIVE. First move: paid retrospective backtest on their own protocols, capped therapy-area-exclusive slot for logo rights. Strategic sequence: Partnership 02 - Lighthouse Pharma.', estimatedArrImpact: 500000 },
  { name: 'GSK', type: 'pharma' as const, tier: 'P0' as const, stage: 'researching' as const, region: 'EU' as const, description: 'Reachable via podcast thread. Part of the Lighthouse Pharma track alongside Novo Nordisk.', mutualValue: 'Design-partner slot; named logo for social proof.', nextAction: 'Warm re-entry via podcast thread contact', notes: 'Relationship label: WARM THREAD. Reachable via podcast thread. Part of J&J / Pfizer / MSD / Sanofi / Esteve / GSK bench for warm introductions.', estimatedArrImpact: 400000 },
  { name: 'Bayer', type: 'pharma' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'External Partnerships and Innovation remit fits a scoped pilot.', mutualValue: 'Scoped pilot on protocol design or feasibility module.', nextAction: 'Reach out to Ishita Kumar (External Partnerships and Innovation)', notes: 'Contact: Ishita Kumar, External Partnerships and Innovation. Relationship label: direct. A remit that fits a scoped pilot.', estimatedArrImpact: 200000 },
  { name: 'MSD (Merck)', type: 'pharma' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Named contacts across brand, medical and commercial. Part of the warm introduction bench.', mutualValue: 'Protocol design and regulatory submission acceleration.', nextAction: 'Warm introduction via existing bench contacts', notes: 'Relationship label: named contacts across brand, medical and commercial. Part of J&J / Pfizer / MSD / Sanofi / Esteve / GSK bench.', estimatedArrImpact: 300000 },
  { name: 'Sanofi', type: 'pharma' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Named contacts across brand, medical and commercial. Part of the warm introduction bench.', mutualValue: 'Protocol design, regulatory submission, and feasibility modules.', nextAction: 'Warm introduction via existing bench contacts', notes: 'Relationship label: named contacts across brand, medical and commercial. Part of J&J / Pfizer / MSD / Sanofi / Esteve / GSK bench.', estimatedArrImpact: 300000 },
  { name: 'Esteve', type: 'pharma' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Spanish pharma. Named contacts across brand, medical and commercial.', mutualValue: 'Protocol design and local regulatory expertise.', nextAction: 'Warm introduction via existing bench contacts', notes: 'Relationship label: named contacts. Part of J&J / Pfizer / MSD / Sanofi / Esteve / GSK bench. Local Spanish pharma relationship.', estimatedArrImpact: 100000 },
  // === 02 AI LABS & FRONTIER MODELS ===
  { name: 'Google (Cloud + CTO Office)', type: 'tech' as const, tier: 'P0' as const, stage: 'active' as const, region: 'GLOBAL' as const, description: 'Routes to deepen the existing relationship. NVIDIA and Google to be converted into public case studies by Day 30.', mutualValue: 'Joint healthcare case study; deepen Cloud and AI partnership; EMEA ecosystem positioning.', nextAction: 'Convert existing relationship into public case study by Day 30. Contact Pablo Rodriguez (Director, CTO Office)', notes: 'Contacts: Pablo Rodriguez, PhD, Director, CTO Office; Hanne Tuomisto-Inch, Director, EMEA Ecosystem Partnerships. Relationship label: DIRECT. Day 1-30 priority: convert into public case study.', estimatedArrImpact: 0 },
  { name: 'OpenAI', type: 'tech' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'First-degree into the commercial side via David Dugan.', mutualValue: 'Model partnership; potential integration into Aika platform.', nextAction: 'Reach out to David Dugan (VP, Head of Global Ads Solutions) for commercial introduction', notes: 'Contact: David Dugan, VP, Head of Global Ads Solutions. Relationship label: first-degree into commercial side.', estimatedArrImpact: 0 },
  { name: 'Anthropic', type: 'tech' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'A model-partnership conversation via Mike Boufford.', mutualValue: 'Model partnership; Claude integration for explainable AI in clinical protocols.', nextAction: 'Contact Mike Boufford (Member of Technical Staff, Manager) for model-partnership conversation', notes: 'Contact: Mike Boufford, Member of Technical Staff, Manager. Relationship label: direct. A model-partnership conversation.', estimatedArrImpact: 0 },
  // === 03 AI INFRASTRUCTURE & COMPUTE (IN HAND) ===
  { name: 'NVIDIA (Inception Program)', type: 'tech' as const, tier: 'P0' as const, stage: 'active' as const, region: 'GLOBAL' as const, description: 'ECOSYSTEM CREDIBILITY - Partnership 01 IN HAND. Compute and European-AI-champion legitimacy that lowers the cost of every pharma and regulator conversation.', mutualValue: 'Joint healthcare case study + AI-Factory compute conversation. Inception membership active.', nextAction: 'Structure joint healthcare case study with Tobias Halloran. Convert to public case study by Day 30.', notes: 'Contact: Tobias Halloran, Director, Startups EMEAI, plus Inception membership. Relationship label: IN HAND. First move: joint healthcare case study + AI-Factory compute conversation, week one. Strategic sequence: Partnership 01 - Ecosystem Credibility.', estimatedArrImpact: 0 },
  { name: 'BSC - Barcelona Supercomputing Center', type: 'tech' as const, tier: 'P0' as const, stage: 'active' as const, region: 'EU' as const, description: 'ECOSYSTEM CREDIBILITY - Partnership 01 IN HAND alongside NVIDIA. AI Factory selection. European-champion legitimacy.', mutualValue: 'Compute access; European AI champion positioning; AI Factory selection.', nextAction: 'Open BSC compute access and convert to public case study by Day 30.', notes: 'Contacts: Santi Trujillo, AI Startups KAM; Monica Mateu, Innovation. Relationship label: IN HAND. Compute, European-champion legitimacy, AI Factory selection.', estimatedArrImpact: 0 },
  // === 04 INVESTORS & ECOSYSTEM ===
  { name: 'Medicxi', type: 'investor' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Top-tier European biotech VC; a serious pharma-and-science ecosystem door.', mutualValue: 'Series B syndicate; pharma ecosystem introductions.', nextAction: 'Contact Francesco De Rubertis (Co-founder and Partner)', notes: 'Contact: Francesco De Rubertis, Co-founder and Partner. A top-tier European biotech VC; a serious pharma-and-science ecosystem door.', estimatedArrImpact: 0 },
  { name: 'Lakestar', type: 'investor' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'European VC with IR and communications leadership.', mutualValue: 'Series B syndicate; ecosystem positioning.', nextAction: 'Contact Ninja Struye de Swielande (Partner and Chief Communication Officer / Head of IR)', notes: 'Contact: Ninja Struye de Swielande, Partner and Chief Communication Officer / Head of IR.', estimatedArrImpact: 0 },
  { name: 'Founders Factory / Founders Forum', type: 'investor' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Channel toward Northwestern Medicine via David Hickson. Brent Hoberman reachable directly.', mutualValue: 'Channel to Northwestern Medicine; ecosystem convening; seed VC relationship.', nextAction: 'Contact Brent Hoberman (Co-founder and Executive Chair) or George Northcott / Henry Lane Fox / David Hickson', notes: 'Contacts: Brent Hoberman, Co-founder and Executive Chair; George Northcott, Henry Lane Fox, David Hickson. The channel toward Northwestern Medicine.', estimatedArrImpact: 0 },
  { name: 'First Minute Capital', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Seed VC reachable directly via Brent Hoberman.', mutualValue: 'Series B syndicate support.', nextAction: 'Contact Brent Hoberman (Co-founder)', notes: 'Contact: Brent Hoberman, Co-founder. A seed VC reachable directly.', estimatedArrImpact: 0 },
  { name: 'Team8', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Venture group relationship via Yuval Sachel.', mutualValue: 'Series B syndicate; cybersecurity and enterprise tech ecosystem.', nextAction: 'Contact Yuval Sachel', notes: 'Contact: Yuval Sachel. A relationship at the Team8 venture group.', estimatedArrImpact: 0 },
  { name: 'Intel Capital', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Corporate-VC relationship via Erica Van.', mutualValue: 'Corporate VC for Series B; Intel compute partnership potential.', nextAction: 'Contact Erica Van (Partner)', notes: 'Contact: Erica Van, Partner. A corporate-VC relationship.', estimatedArrImpact: 0 },
  { name: 'Endeavor / Endeavor Catalyst', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Endeavor Catalyst is a Series A investor. Felipe Ossa, Managing Director, Endeavor Colombia.', mutualValue: 'LatAm market access; existing Series A relationship to deepen.', nextAction: 'Contact Felipe Ossa (Managing Director, Endeavor Colombia)', notes: 'Contact: Felipe Ossa, Managing Director, Endeavor Colombia. Endeavor Catalyst is a Series A investor.', estimatedArrImpact: 0 },
  { name: 'Innova Capital', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Growth capital relationship via Veronica Allende Serra.', mutualValue: 'Series B syndicate.', nextAction: 'Contact Veronica Allende Serra (Founding Partner)', notes: 'Contact: Veronica Allende Serra, Founding Partner.', estimatedArrImpact: 0 },
  { name: 'I2BF Global Ventures', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Deep-tech VC relationship via Denis Kalyshkin.', mutualValue: 'Series B syndicate; deep-tech positioning.', nextAction: 'Contact Denis Kalyshkin (Principal)', notes: 'Contact: Denis Kalyshkin, Principal. A deep-tech VC relationship.', estimatedArrImpact: 0 },
  { name: 'Da Vinci Capital', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Growth-capital relationship via Oleg Victor Jelesko.', mutualValue: 'Series B growth capital.', nextAction: 'Contact Oleg Victor Jelesko (Managing Partner)', notes: 'Contact: Oleg Victor Jelesko, Managing Partner. A growth-capital relationship.', estimatedArrImpact: 0 },
  { name: 'Kereon Partners', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'European VC via Joaquin Sanz Berrioategortua.', mutualValue: 'Series B syndicate.', nextAction: 'Contact Joaquin Sanz Berrioategortua, PhD (Partner)', notes: 'Contact: Joaquin Sanz Berrioategortua, PhD, Partner.', estimatedArrImpact: 0 },
  { name: 'Mobile World Capital', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Barcelona tech-ecosystem convening power via Grace Olea.', mutualValue: 'Barcelona ecosystem positioning; MWC network.', nextAction: 'Contact Grace Olea (Business Development)', notes: 'Contact: Grace Olea, Business Development. Barcelona tech-ecosystem convening power.', estimatedArrImpact: 0 },
  { name: 'Lluis Pedragosa (VC)', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Managing Partner and Co-Founder. European deep-tech VC, for syndicate and ecosystem support.', mutualValue: 'Series B syndicate; Barcelona ecosystem.', nextAction: 'Direct outreach to Lluis Pedragosa', notes: 'Contact: Lluis Pedragosa, Managing Partner and Co-Founder. European deep-tech VC, for syndicate and ecosystem support.', estimatedArrImpact: 0 },
  { name: 'Healthcare.com (Jose Vargas)', type: 'investor' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Healthcare-focused investor and industry relationship.', mutualValue: 'Healthcare investor network; industry introductions.', nextAction: 'Contact Jose Vargas (VC)', notes: 'Contact: Jose Vargas, VC. A healthcare-focused investor and industry relationship.', estimatedArrImpact: 0 },
  // === 05 CONSULTANCIES & ADVISORY ===
  { name: 'Accenture', type: 'lobby' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Route into pharma transformation programmes via Frans Stokman and Renee Mellow.', mutualValue: 'Channel into pharma digital transformation programmes; Song creative leadership.', nextAction: 'Contact Frans Stokman (Senior Managing Director) or Renee Mellow (Managing Director)', notes: 'Contacts: Frans Stokman, Senior Managing Director; Renee Mellow, Managing Director; plus Song creative leadership. A route into pharma transformation programmes.', estimatedArrImpact: 200000 },
  { name: 'Deloitte', type: 'lobby' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Pharma-advisory channel and introduction network. Monitor Deloitte and Deloitte Digital routes.', mutualValue: 'Pharma advisory channel; introduction network into regulated-industry programmes.', nextAction: 'Contact Ben Wood, Kadu Pereira, or Dominique Frison (Directors); Fabian Falkenstein (Monitor Deloitte); Ana Costa (Deloitte Digital)', notes: 'Contacts: Directors Ben Wood, Kadu Pereira, Dominique Frison; Monitor Deloitte, Fabian Falkenstein; Deloitte Digital, Ana Costa. A pharma-advisory channel and introduction network.', estimatedArrImpact: 150000 },
  { name: 'EY', type: 'lobby' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Advisory channel into regulated-industry programmes via Pablo de Porcioles and Sarah Miles.', mutualValue: 'Advisory channel into regulated-industry programmes.', nextAction: 'Contact Pablo de Porcioles (Director, Business Consulting) or Sarah Miles (Director, EMEIA Executive Office)', notes: 'Contacts: Pablo de Porcioles, Director, Business Consulting; Sarah Miles, Director, EMEIA Executive Office. An advisory channel into regulated-industry programmes.', estimatedArrImpact: 100000 },
  { name: 'BCG', type: 'lobby' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Entry point to deepen into the wider firm via Rachael Jacob (RISE by BCG).', mutualValue: 'Pharma strategy advisory channel.', nextAction: 'Contact Rachael Jacob (RISE by BCG)', notes: 'Contact: Rachael Jacob, RISE by BCG. An entry point to deepen into the wider firm.', estimatedArrImpact: 100000 },
  // === 06 HOSPITALS & HEALTH SYSTEMS ===
  { name: 'Hospital Clinic / IDIBAPS, Barcelona', type: 'hospital' as const, tier: 'P0' as const, stage: 'outreach' as const, region: 'EU' as const, description: 'Entry into the Barcelona academic-hospital cluster. Clinical and epidemiology expertise.', mutualValue: 'Hospital framework instantiated in EU; real-world outcome data; academic validation.', nextAction: 'Contact Alberto Garcia-Basteiro (clinical and epidemiology) for hospital framework conversation', notes: 'Contact: Alberto Garcia-Basteiro, clinical and epidemiology. Entry into the Barcelona academic-hospital cluster. Day 31-70 priority: one hospital framework, instantiated twice, one EU and one US.', estimatedArrImpact: 150000 },
  { name: 'The Brain Clinic, Dubai', type: 'hospital' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Direct hospital route into the Middle East via Danny Van Otterdyk.', mutualValue: 'Middle East market entry; site network expansion.', nextAction: 'Contact Danny Van Otterdyk for Middle East hospital route', notes: 'Contact: Danny Van Otterdyk. A direct hospital route into the Middle East.', estimatedArrImpact: 100000 },
  { name: 'NHS, UK', type: 'hospital' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'NHS relationships to build a site conversation from. Surrey and Borders + RNOH.', mutualValue: 'UK site network; NHS validation for European regulatory conversations.', nextAction: 'Contact Andy Schiller (Surrey and Borders) or Julian Johnson (RNOH)', notes: 'Contacts: Andy Schiller, Surrey and Borders; Julian Johnson, RNOH. NHS relationships to build a site conversation from.', estimatedArrImpact: 200000 },
  { name: 'The London Clinic', type: 'hospital' as const, tier: 'P2' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Private hospital route in London to reopen.', mutualValue: 'UK private hospital site; outcome data loop.', nextAction: 'Executive approach to reopen the London Clinic relationship', notes: 'A private-hospital route in London to reopen. Executive approach in motion.', estimatedArrImpact: 80000 },
  { name: 'Velocity Clinical Research / Care Access', type: 'hospital' as const, tier: 'P0' as const, stage: 'outreach' as const, region: 'US' as const, description: 'PROOF OF EXECUTION - Partnership 04. US site network for contracted outcome-data loop. Once predictions can be proven against real execution you sell evidence, not claims.', mutualValue: 'Two-study feedback-schema pilot on FHIR/EHR substrate. Contracted outcome-data loop.', nextAction: 'Executive outreach with two-study feedback-schema pilot proposal on FHIR/EHR substrate', notes: 'Partnership 04 - Proof of Execution. US site networks: Velocity, Care Access. First move: executive outreach with a two-study feedback-schema pilot on a FHIR/EHR substrate. The data compounds once predictions are proven against real execution.', estimatedArrImpact: 300000 },
  // === 07 EHR & DATA ===
  { name: 'Oracle Health / Cerner', type: 'tech' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Real route for the EHR-data conversation via Adriana Landwehrkamp and Florencia Williams.', mutualValue: 'EHR data integration; ISV partnership; patient data access for outcome loops.', nextAction: 'Contact Adriana Landwehrkamp (Executive Director) or Florencia Williams (ISV Sales)', notes: 'Contacts: Adriana Landwehrkamp, Executive Director; Florencia Williams, ISV Sales. A real route for the EHR-data conversation.', estimatedArrImpact: 200000 },
  { name: 'Epic', type: 'tech' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'US' as const, description: 'Marketplace and partner track for EHR integration.', mutualValue: 'Epic Marketplace listing; EHR data integration for US hospital sites.', nextAction: 'File Epic Marketplace application and initiate partner track', notes: 'Marketplace and partner track. Key for US hospital site EHR data access.', estimatedArrImpact: 250000 },
  // === 08 CLINICAL SAAS PLATFORMS ===
  { name: 'Medidata (Dassault Systemes)', type: 'tech' as const, tier: 'P1' as const, stage: 'researching' as const, region: 'GLOBAL' as const, description: 'Partner-program route. A platform partnership to open. Note: WCT/Medidata strategy drift is an open discrepancy.', mutualValue: 'Platform partnership; embedded workflow access; channel into existing Medidata customer base.', nextAction: 'Open partner-program route conversation', notes: 'Partner-program route. A platform partnership to open. CAUTION: WCT/Medidata April 2026 vs. Biorce Pipeline is an open high-severity discrepancy in the system. Resolve before deepening.', estimatedArrImpact: 300000 },
  { name: 'THREAD (Decentralised Trials)', type: 'tech' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'GLOBAL' as const, description: 'Partner-program route into decentralised-trial tooling.', mutualValue: 'DCT integration; embedded in decentralised trial workflows.', nextAction: 'Open partner-program route into decentralised-trial tooling', notes: 'Partner-program route into decentralised-trial tooling.', estimatedArrImpact: 150000 },
  { name: 'Javara / Access (Site Networks)', type: 'hospital' as const, tier: 'P1' as const, stage: 'outreach' as const, region: 'US' as const, description: 'Executive approach in motion. The peer-level route to the outcome-data loop.', mutualValue: 'US site network access; outcome-data loop for proof of execution.', nextAction: 'Executive approach in motion - follow up on peer-level route', notes: 'Executive approach in motion. The peer-level route to the outcome-data loop.', estimatedArrImpact: 200000 },
  // === 09 CROs ===
  { name: 'IQVIA', type: 'cro' as const, tier: 'P1' as const, stage: 'researching' as const, region: 'GLOBAL' as const, description: 'Warm thread from podcast. Mid-tier and global CROs sequenced per the main plan.', mutualValue: 'CRO channel; embedded in IQVIA customer workflows.', nextAction: 'Contact Gilda Longobardi (Sr HR Business Partner) and follow IQVIA thread from podcast', notes: 'Contact: Gilda Longobardi, Sr HR Business Partner, plus the IQVIA thread from podcast. Relationship label: WARM THREAD. Note: Global CRO watchlist - channel conflict unresolved; a mid-tier partner delivers the reference case faster. Held as a scoped pilot.', estimatedArrImpact: 250000 },
  // === 10 REGULATORS & PUBLIC BODIES ===
  { name: 'EMA (European Medicines Agency)', type: 'regulator' as const, tier: 'P0' as const, stage: 'outreach' as const, region: 'EU' as const, description: 'EU regulatory relationship. Ana Zanoletty is the single most role-relevant EU regulator route.', mutualValue: 'EU regulatory validation; AESIA sandbox note; AEMPS session.', nextAction: 'Contact Ana Zanoletty (Head of Clinical Trials Transformation) and file AESIA sandbox note + AEMPS session', notes: 'Contact: Ana Zanoletty, Head of Clinical Trials Transformation. The single most role-relevant EU regulator route. Day 31-70: AESIA sandbox note and AEMPS session filed; APAC landscape memo.', estimatedArrImpact: 0 },
  { name: 'AESIA / AEMPS / red.es (Spain)', type: 'regulator' as const, tier: 'P1' as const, stage: 'identified' as const, region: 'EU' as const, description: 'Innovation-office and sandbox routes. Spain regulatory relationships.', mutualValue: 'Spanish regulatory sandbox; AEMPS session for EU validation.', nextAction: 'File AESIA sandbox note and book AEMPS session', notes: 'Innovation-office and sandbox routes I know how to open. Day 31-70 priority.', estimatedArrImpact: 0 },
  // === ACADEMIC VALIDATION ===
  { name: 'Academic Validation Study (Clara-led)', type: 'standards_body' as const, tier: 'P0' as const, stage: 'outreach' as const, region: 'GLOBAL' as const, description: 'INDEPENDENT EVIDENCE - Partnership 05 SERIES B ASSET. Academic validation study co-led by Clara, no veto on results. Third-party validation of headline claims compresses every enterprise sale and the raise itself.', mutualValue: 'Pre-registered study agreement that turns self-reported metrics into citable evidence.', nextAction: 'Agree pre-registered study protocol with Clara. Identify academic institution co-lead.', notes: 'Partnership 05 - Independent Evidence. Co-led by Clara Bernardes, no veto on results. First move: pre-registered study agreement that turns self-reported metrics into citable evidence. This is a Series B asset.', estimatedArrImpact: 0 },
];

const EXECUTIVES_DATA: Array<{ partnerName: string; name: string; title: string; isPrimary: boolean; notes?: string }> = [
  { partnerName: 'Novo Nordisk', name: 'Anne C. Fleischer', title: 'AVP Business Development, West Europe', isPrimary: true, notes: 'Direct contact for design-partner conversation. Relationship label: DIRECT and LIVE.' },
  { partnerName: 'Bayer', name: 'Ishita Kumar', title: 'External Partnerships and Innovation', isPrimary: true, notes: 'Direct contact for scoped pilot conversation.' },
  { partnerName: 'Google (Cloud + CTO Office)', name: 'Pablo Rodriguez', title: 'Director, CTO Office', isPrimary: true },
  { partnerName: 'Google (Cloud + CTO Office)', name: 'Hanne Tuomisto-Inch', title: 'Director, EMEA Ecosystem Partnerships', isPrimary: false },
  { partnerName: 'OpenAI', name: 'David Dugan', title: 'VP, Head of Global Ads Solutions', isPrimary: true, notes: 'First-degree into commercial side.' },
  { partnerName: 'Anthropic', name: 'Mike Boufford', title: 'Member of Technical Staff, Manager', isPrimary: true },
  { partnerName: 'NVIDIA (Inception Program)', name: 'Tobias Halloran', title: 'Director, Startups EMEAI', isPrimary: true, notes: 'Inception membership contact. IN HAND.' },
  { partnerName: 'BSC - Barcelona Supercomputing Center', name: 'Santi Trujillo', title: 'AI Startups KAM', isPrimary: true },
  { partnerName: 'BSC - Barcelona Supercomputing Center', name: 'Monica Mateu', title: 'Innovation', isPrimary: false },
  { partnerName: 'Medicxi', name: 'Francesco De Rubertis', title: 'Co-founder and Partner', isPrimary: true },
  { partnerName: 'Lakestar', name: 'Ninja Struye de Swielande', title: 'Partner and Chief Communication Officer / Head of IR', isPrimary: true },
  { partnerName: 'Founders Factory / Founders Forum', name: 'Brent Hoberman', title: 'Co-founder and Executive Chair', isPrimary: true },
  { partnerName: 'Founders Factory / Founders Forum', name: 'George Northcott', title: 'Partner', isPrimary: false },
  { partnerName: 'Founders Factory / Founders Forum', name: 'Henry Lane Fox', title: 'Partner', isPrimary: false },
  { partnerName: 'Founders Factory / Founders Forum', name: 'David Hickson', title: 'Partner', isPrimary: false, notes: 'Channel toward Northwestern Medicine.' },
  { partnerName: 'First Minute Capital', name: 'Brent Hoberman', title: 'Co-founder', isPrimary: true },
  { partnerName: 'Team8', name: 'Yuval Sachel', title: 'Partner', isPrimary: true },
  { partnerName: 'Intel Capital', name: 'Erica Van', title: 'Partner', isPrimary: true },
  { partnerName: 'Endeavor / Endeavor Catalyst', name: 'Felipe Ossa', title: 'Managing Director, Endeavor Colombia', isPrimary: true, notes: 'Endeavor Catalyst is a Series A investor.' },
  { partnerName: 'Innova Capital', name: 'Veronica Allende Serra', title: 'Founding Partner', isPrimary: true },
  { partnerName: 'I2BF Global Ventures', name: 'Denis Kalyshkin', title: 'Principal', isPrimary: true },
  { partnerName: 'Da Vinci Capital', name: 'Oleg Victor Jelesko', title: 'Managing Partner', isPrimary: true },
  { partnerName: 'Kereon Partners', name: 'Joaquin Sanz Berrioategortua', title: 'Partner, PhD', isPrimary: true },
  { partnerName: 'Mobile World Capital', name: 'Grace Olea', title: 'Business Development', isPrimary: true },
  { partnerName: 'Lluis Pedragosa (VC)', name: 'Lluis Pedragosa', title: 'Managing Partner and Co-Founder', isPrimary: true },
  { partnerName: 'Healthcare.com (Jose Vargas)', name: 'Jose Vargas', title: 'VC', isPrimary: true },
  { partnerName: 'Accenture', name: 'Frans Stokman', title: 'Senior Managing Director', isPrimary: true },
  { partnerName: 'Accenture', name: 'Renee Mellow', title: 'Managing Director', isPrimary: false },
  { partnerName: 'Deloitte', name: 'Ben Wood', title: 'Director', isPrimary: true },
  { partnerName: 'Deloitte', name: 'Kadu Pereira', title: 'Director', isPrimary: false },
  { partnerName: 'Deloitte', name: 'Dominique Frison', title: 'Director', isPrimary: false },
  { partnerName: 'Deloitte', name: 'Fabian Falkenstein', title: 'Monitor Deloitte', isPrimary: false },
  { partnerName: 'Deloitte', name: 'Ana Costa', title: 'Deloitte Digital', isPrimary: false },
  { partnerName: 'EY', name: 'Pablo de Porcioles', title: 'Director, Business Consulting', isPrimary: true },
  { partnerName: 'EY', name: 'Sarah Miles', title: 'Director, EMEIA Executive Office', isPrimary: false },
  { partnerName: 'BCG', name: 'Rachael Jacob', title: 'RISE by BCG', isPrimary: true },
  { partnerName: 'Hospital Clinic / IDIBAPS, Barcelona', name: 'Alberto Garcia-Basteiro', title: 'Clinical and Epidemiology', isPrimary: true },
  { partnerName: 'The Brain Clinic, Dubai', name: 'Danny Van Otterdyk', title: 'Director', isPrimary: true },
  { partnerName: 'NHS, UK', name: 'Andy Schiller', title: 'Surrey and Borders', isPrimary: true },
  { partnerName: 'NHS, UK', name: 'Julian Johnson', title: 'RNOH', isPrimary: false },
  { partnerName: 'Oracle Health / Cerner', name: 'Adriana Landwehrkamp', title: 'Executive Director', isPrimary: true },
  { partnerName: 'Oracle Health / Cerner', name: 'Florencia Williams', title: 'ISV Sales', isPrimary: false },
  { partnerName: 'IQVIA', name: 'Gilda Longobardi', title: 'Sr HR Business Partner', isPrimary: true },
  { partnerName: 'EMA (European Medicines Agency)', name: 'Ana Zanoletty', title: 'Head of Clinical Trials Transformation', isPrimary: true, notes: 'The single most role-relevant EU regulator route. Partnership 05 - Series B Asset.' },
  // Existing partners - update with new contacts from document
  { partnerName: 'Novartis', name: 'Sander Timmer', title: 'Head of AI and Data Science, Global Drug Development, PhD', isPrimary: true, notes: 'The most role-relevant pharma door in the network.' },
  { partnerName: 'Eli Lilly', name: 'Lina Polimeni', title: 'SVP and CMO, Consumer', isPrimary: true, notes: 'Strong senior internal referral route. 30x30 Initiative relevant.' },
  { partnerName: 'Veeva Systems', name: 'Destry Sulkes', title: 'Commercial-side AI Leadership', isPrimary: true, notes: 'Warm internal route into the Development Cloud partner team. Time-sensitive with August GA.' },
  { partnerName: 'FDA Digital Health Center of Excellence', name: 'Barry W. Miller', title: 'Portfolio Management Director', isPrimary: true },
  { partnerName: 'FDA Digital Health Center of Excellence', name: 'Leora Benson Willner', title: 'Clinical Data Scientist, PhD', isPrimary: false },
  { partnerName: 'FDA Digital Health Center of Excellence', name: 'Tiffany Branch', title: 'Office of the Commissioner, J.D.', isPrimary: false },
];

export async function seedStrategicPartners() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const { eq } = await import("drizzle-orm");
  const { partners, partnerExecutives } = schema;

  let inserted = 0;
  let skipped = 0;
  let execInserted = 0;

  for (const p of PARTNERS_DATA) {
    const existing = await db.select({ id: partners.id }).from(partners).where(eq(partners.name, p.name)).limit(1);
    if (existing.length > 0) {
      // Update existing with new data
      await db.update(partners).set({
        tier: p.tier,
        stage: p.stage,
        description: p.description ?? null,
        mutualValue: p.mutualValue ?? null,
        nextAction: p.nextAction ?? null,
        notes: p.notes ?? null,
        estimatedArrImpact: p.estimatedArrImpact ? String(p.estimatedArrImpact) : null,
      }).where(eq(partners.id, existing[0].id));
      skipped++;
    } else {
      await db.insert(partners).values({
        name: p.name,
        type: p.type,
        tier: p.tier,
        stage: p.stage,
        region: p.region,
        description: p.description ?? null,
        mutualValue: p.mutualValue ?? null,
        nextAction: p.nextAction ?? null,
        notes: p.notes ?? null,
        estimatedArrImpact: p.estimatedArrImpact ? String(p.estimatedArrImpact) : null,
        website: null,
        dealEconomics: null,
        killCriteria: null,
        nextActionDate: null,
      });
      inserted++;
    }
  }

  // Update Novartis, Eli Lilly, Veeva, FDA with new strategic notes
  const updates = [
    { name: 'Novartis', notes: 'Contact: Sander Timmer, PhD, Head of AI and Data Science, Global Drug Development. The most role-relevant pharma door in the network. Part of J&J / Pfizer / MSD / Sanofi / Esteve / GSK bench for warm introductions.', tier: 'P0' as const, stage: 'researching' as const },
    { name: 'Eli Lilly', notes: 'Contact: Lina Polimeni, SVP and CMO, Consumer. A strong senior internal referral route. Also relevant: 30x30 Initiative (30 protocols needed by 2030) - major opportunity.', tier: 'P0' as const, stage: 'outreach' as const },
    { name: 'Veeva Systems', notes: 'CHANNEL AND EMBEDDEDNESS - Partnership 03 TIME-SENSITIVE. Contact: Destry Sulkes, commercial-side AI leadership. A warm internal route into the Development Cloud partner team. Time-sensitive with August GA. First move: file the Veeva Technology Partner application, draft the USDM-native export spec, force partner-or-interoperate inside 30 days. M11-native authoring position is unclaimed and winner-take-most.', tier: 'P0' as const, stage: 'outreach' as const },
    { name: 'FDA Digital Health Center of Excellence', notes: 'Contacts: Barry W. Miller, Portfolio Management Director; Leora Benson Willner, PhD, Clinical Data Scientist; Tiffany Branch, J.D., Office of the Commissioner. Alongside the live thread on own AI-protocol submission. Day 1-30: warm re-entry and FDA follow-through. Day 31-70: FDA dialogue formalised.', tier: 'P0' as const, stage: 'active' as const },
  ];
  for (const u of updates) {
    await db.update(partners).set({ notes: u.notes, tier: u.tier, stage: u.stage }).where(eq(partners.name, u.name));
  }

  // Insert executives
  for (const exec of EXECUTIVES_DATA) {
    const partnerRows = await db.select({ id: partners.id }).from(partners).where(eq(partners.name, exec.partnerName)).limit(1);
    if (partnerRows.length === 0) continue;
    const partnerId = partnerRows[0].id;
    // Check if exec already exists
    const existingExec = await db.select({ id: partnerExecutives.id }).from(partnerExecutives)
      .where(eq(partnerExecutives.partnerId, partnerId)).limit(20);
    const alreadyExists = existingExec.some(() => false); // always insert, execs may be new
    // Check by name
    const execByName = await db.select({ id: partnerExecutives.id }).from(partnerExecutives)
      .where(eq(partnerExecutives.name, exec.name)).limit(1);
    if (execByName.length > 0) continue;
    await db.insert(partnerExecutives).values({
      partnerId,
      name: exec.name,
      title: exec.title,
      email: null,
      linkedinUrl: null,
      isPrimaryContact: exec.isPrimary,
      notes: exec.notes ?? null,
    });
    execInserted++;
  }

  const totalRows = await db.select({ id: partners.id }).from(partners);
  return {
    success: true,
    inserted,
    updated: skipped,
    execInserted,
    totalPartners: totalRows.length,
  };
}

export async function deduplicatePartners() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { eq, sql } = await import("drizzle-orm");
  const { partners, partnerExecutives } = schema;

  // Get all partners
  const all = await db.select({ id: partners.id, name: partners.name }).from(partners).orderBy(partners.id);
  
  // Find duplicates - keep the first (lowest id), delete the rest
  const seen = new Map<string, number>();
  const toDelete: number[] = [];
  
  for (const p of all) {
    if (seen.has(p.name)) {
      toDelete.push(p.id);
    } else {
      seen.set(p.name, p.id);
    }
  }
  
  if (toDelete.length > 0) {
    // Delete executives for duplicate partners first
    for (const id of toDelete) {
      await db.delete(partnerExecutives).where(eq(partnerExecutives.partnerId, id));
      await db.delete(partners).where(eq(partners.id, id));
    }
  }
  
  const remaining = await db.select({ id: partners.id }).from(partners);
  return { deleted: toDelete.length, remaining: remaining.length };
}
