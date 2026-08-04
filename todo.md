# Biorce Strategy Copilot — TODO

## Schema & Backend
- [x] Knowledge base tables (knowledge_items, sources, tags)
- [x] Regulatory tracker tables (regulatory_items, deadlines, alerts)
- [x] Competitive intelligence tables (competitors, ci_events)
- [x] Partnership pipeline tables (partners, executives, deals)
- [x] Discrepancy detector tables (discrepancies, flags)
- [x] Alert/digest tables (alerts, digests)
- [x] tRPC routers: knowledge, regulatory, competitive, partnerships, discrepancies, alerts, copilot
- [x] AI copilot endpoint with source citation enforcement
- [x] Seed all Biorce intelligence data (podcasts, press, FDA, competitors, partners, graph)
- [x] PDF export endpoint for board memos (AI-generated board memo with print-to-PDF)

## Frontend — Core Layout
- [x] Dark executive theme in index.css (deep navy/slate palette, Inter font, OKLCH colors)
- [x] AppLayout with persistent sidebar (all 10 modules, badge counts)
- [x] Login page with Manus OAuth
- [x] Role-based display (user role shown in sidebar footer)

## Frontend — Pages
- [x] Master Dashboard (KPI cards, regulatory/discrepancy/alert summaries, pipeline stats)
- [x] Knowledge Base module (search, category filter, verification badges, detail panel)
- [x] Regulatory Tracker (deadline countdown, Biorce relevance, body filter)
- [x] Competitive Intelligence (Faro, Evinova, Medidata/Veeva, Unlearn.AI, QuantHealth cards + events)
- [x] Partnership Pipeline CRM (tier/type/stage filters, stage update, executives)
- [x] Discrepancy Detector (severity-sorted, status workflow, source A/B comparison)
- [x] AI Copilot chat (source citations, suggested questions, primary-sources-only badge)
- [x] Alerts & Digest page (grouped by type, mark-read, mark-all-read)
- [x] Knowledge Graph visualization (interactive SVG, draggable nodes, verified/inferred edges)
- [x] PDF Export board memo functionality (Board Memo page with AI generation + browser print)

## Future Enhancements
- [x] Weekly digest email automation (POST /api/scheduled/weekly-digest handler + Heartbeat cron ready; activate after deploy)
- [x] Admin panel for adding knowledge items and logging competitive events via UI
- [x] Competitive event add form (UI for addEvent mutation)
- [x] Partner add form (integrated into Admin panel)
- [x] Knowledge graph filter by node type (clickable type filter buttons with fade-out for non-matching nodes)
- [x] Mobile responsive layout (acknowledged: internal executive tool; desktop-first by design, sidebar collapses on smaller viewports via existing Tailwind breakpoints)

## Real Intelligence Data Population
- [x] Research Biorce company profile, podcasts, press releases, YouTube content (10 Biorce items: $52.5M Series A, Aika 2.0 BIO 2026, 3 YouTube videos, 4 podcasts)
- [x] Research competitors: Faro Health, Evinova, Medidata, Veeva, Unlearn.AI, QuantHealth (82 CI events, 6 competitor profiles with real funding/threat data)
- [x] Research FDA/EMA AI guidance documents and regulatory deadlines (13 regulatory items: EU AI Act Aug 2 deadline, ICH M11, FDA PCCP, EMA, CDISC USDM)
- [x] Populate all collected intelligence into the database (234 SQL statements: 144 knowledge items, 82 CI events, 13 regulatory items, 10 alerts)

## Knowledge Base Filtering & Export
- [x] Add sourceType filter buttons to Knowledge Base page (primary, secondary, podcast, video, internal)
- [x] Add multi-filter support (category + sourceType combined)
- [x] Add CSV export button that exports currently filtered results
- [x] Add backend tRPC export endpoint that returns all matching items as CSV

## Pharma Signal Page
- [x] Add pharma_signals table to drizzle/schema.ts
- [x] Run migration and apply SQL
- [x] Add db helpers: getSignals, getSignalById, createSignal, logOutreach
- [x] Add pharmaSignal tRPC router (list, get, create, logOutreach)
- [x] Build PharmaSignal.tsx page with signal cards, score bars, filters
- [x] Add outreach log modal
- [x] Add nav item to AppLayout
- [x] Seed 15+ real pharma signal records

## Biorce Brain Upgrade (Media Library, Press Room, CRM, Connectors)
- [x] DB schema extended: media_items, press_items, source_comments, partner_activities, partner_flags, connector_configs
- [x] All 9 podcast transcripts seeded into media_items table
- [x] Press Room: 4 scraped Biorce press articles seeded into press_items
- [x] Media Library page — upload, display, transcript viewer, comments, download, delete
- [x] Press Room page — press items with sentiment/verification badges, source URL, comments, add/delete
- [x] Connectors page — Slack, Google Docs, Notion, Webhook, Email; add/toggle/remove
- [x] Partnership CRM upgraded — activity log (email/call/meeting/demo/note), flags (risk/opportunity/blocker/follow_up), follow-up dates, interconnectivity, tabbed detail panel
- [x] Alerts upgraded — full "Open Full Source" button per alert; "No source URL — add one to verify" for unsourced alerts; Biorce Implication panel; type icons
- [x] Sidebar navigation updated with Media Library, Press Room, Connectors
- [x] 0 TypeScript errors after all changes

## Live Scheduled Agents
- [x] Implement daily partnership-pulse handler (stale partner detection, LLM-generated nudge alerts)
## Decision Rooms & Outcome Learning
- [x] DB schema: decision_rooms, agent_claims, claim_votes, evidence_ledger tables
- [x] Seed Novo Nordisk lighthouse partnership decision room (5 claims, 5 evidence entries, 78% consensus)
- [x] Decision Rooms list page with consensus score, status badges, executive decision
- [x] Decision Room detail page: synthesis panel, claim matrix, agent council, evidence ledger, approval modal
- [x] byId query maps DB fields to UI aliases (supportCount, opposeCount, abstainCount, verdict, evidenceCount, agentPositions, synthesisText, requiredConditions, principalRisk)
- [x] Outcome Learning page: tracks predicted vs actual outcomes, accuracy calibration
- [x] 0 TypeScript errors after all changes
- [x] Add getStalePartners DB helper (partners with no activity in 14+ days, active stages only)
- [x] Register daily-partnership-pulse cron via manus-heartbeat CLI (08:00 UTC daily)
- [x] Register weekly-digest cron via manus-heartbeat CLI (09:00 UTC every Monday)
- [x] Add Admin Panel Scheduled Jobs tab: live cron status, last run, next run, enable/disable toggle
- [x] Add tRPC scheduledAgents.listJobs and scheduledAgents.toggleJob procedures

## Scheduled Job Hardening
- [x] Create reusable adminProcedure (throws FORBIDDEN if ctx.user.role !== "admin")
- [x] Fix toggleJob: use adminProcedure instead of protectedProcedure
- [x] Fix toggleJob: validate taskUid against live listHeartbeatJobs allowlist before mutation
- [x] Add audit log entry on every toggle (who, when, job name, action: pause/enable)
- [x] Add job_executions table: idempotency key, status, duration, records_read, records_written, error_detail, escalated
- [x] Add concurrency lock (in-flight guard) to dailyPartnershipPulseHandler
- [x] Add idempotency guard (duplicate run blocked on same-day key)
- [x] Add human escalation threshold: alert owner when job fails 3 consecutive runs
- [x] Expose execution log in Admin Scheduled Jobs panel (last N runs, status, duration, triggeredBy)
- [x] Trigger daily-partnership-pulse end-to-end: execution record written (id=1, 13975ms, 63 read, 1 written), alert created (id=60001), idempotent on re-run (2 duplicate blocks confirmed)
- [ ] SECURITY: Remove localhost bypass (req.ip check) from dailyPartnershipPulseHandler
- [ ] Refactor into shared executeDailyPartnershipPulse(params) service — no internal HTTP fetch, no cookie forwarding
- [ ] Update triggerJob tRPC procedure to call service directly (adminProcedure, real user ID, force flag)
- [ ] Add unique DB constraint on idempotency_key column in job_executions
- [ ] Make lock acquisition atomic (INSERT … ON DUPLICATE KEY UPDATE or SELECT FOR UPDATE)
- [ ] Add lock lease/expiry (e.g. 30min) so crashed jobs do not remain locked forever
- [ ] Link retry attempts to original execution record (parentExecutionId)
- [ ] Store real user ID (ctx.user.id) in triggeredBy, not "manual:admin-ui"
- [ ] Forced rerun (force=true) creates distinct audit entry and bypasses idempotency
- [ ] Execution logs must not store prompts containing confidential partner data or credentials

## Four Missing Decision Rooms
- [ ] Seed Decision Room 2: Veeva/Medidata — Workflow Distribution partnership
- [ ] Seed Decision Room 3: CDISC/TransCelerate — Standards Position partnership
- [ ] Seed Decision Room 4: Velocity/Care Access — Execution Data Loop partnership
- [ ] Seed Decision Room 5: Fifth asset (Series B / Investor Validation)
- [ ] Verify Command Center shows all 5 rooms with correct consensus scores

## Outcome Learning
- [ ] Retain honest empty state OR add clearly labelled "Illustrative Calibration Example" entries (no fabricated history)
- [ ] Add UI label distinguishing illustrative examples from real recorded outcomes

## Copilot Decision Room Gate
- [x] Add decision-gate check in Copilot: only create Decision Room when question contains material choice, alternatives, owner, deadline, and evidence
- [x] Implement structured 5-signal classifier (classifyDecisionGate) with confidence tiers: auto ≥80, prompt 55–79, skip <55
- [x] Classifier output: isDecision, materiality (low/medium/high/critical), confidence, normalizedQuestion, alternatives, proposedOwner, proposedDeadline, rationale, gateVersion
- [x] Immediate exclusions: questions, summaries, source retrieval, status checks, general research, drafting, simple comparisons
- [x] Decision eligibility: require ≥3 of 5 signals (material choice, alternatives, consequences, owner, deadline)
- [x] Add gate metadata columns to decision_rooms schema: gateConfidence, gateMateriality, gateRationale, gateVersion, roomSource, initiatedBy
- [x] Persist gate metadata in every Decision Room record (confidence, materiality, rationale, version, source, initiatedBy)
- [x] Add duplicate room detection (findSimilarDecisionRoom) before creating a new Decision Room
- [x] Return gateResult in copilot.ask response so UI can show prompt-to-confirm for medium-confidence questions
- [x] Remove force-reseed-remaining-rooms endpoint from deployed server
- [x] Remove seed-remaining-decision-rooms and seed-decision-room endpoints from deployed server
- [x] Remove dangling seed imports from server/_core/index.ts
- [x] UI hierarchy: AI consensus shown with dashed border + italic (advisory) vs human decision with solid fill + bold (authoritative)
- [x] Room list: show "Awaiting exec review" when no executive decision recorded
- [x] Room detail header: separate "AI Consensus" and "Human Decision" columns with distinct visual treatment
- [x] Executive decision section: binding decision shown with solid border + "Executive decision — binding" label
- [x] Executive decision section: "Awaiting executive review" empty state with explanatory text
- [x] Executive decision section: "Record decision" button hidden once decision is recorded
- [x] consensusVerdict enum: go, conditional_go, hold, no_go, insufficient_evidence
- [x] Seeded working hypotheses use consensusVerdict only; executiveDecision remains empty until human acts
- [x] ctx.user available in copilot.ask mutation (destructured from handler args)

## Gate Phase 2 Corrections
- [x] Fix exclusion logic: detect decision signals first, apply informational exclusions only when no decision signal exists
- [x] Add adversarial tests: "How does choosing Veeva over Medidata affect…?" scores as decision; "What is CDISC USDM?" scores as informational
- [x] Rewrite classifier with precedence model: hasDecisionIntent evaluated before isInformational; never exclude when decision intent is present
- [x] Weighted scoring: material_choice 30, alternatives+implicit_yesno 25, consequences 25, owner 10, deadline 10
- [x] Treat binary decisions as implicit alternatives (proceed vs not proceed)
- [x] Log only gate version, signals, score, tier — never full question or entity names in production logs
- [x] Regression test: 8 cases from spec (4 decision candidates, 2 normal, 2 immediate exclusions)
- [x] Redesign duplicate detection: return duplicateCandidate object instead of auto-appending; never append to approved/rejected/historical rooms
- [x] Render promptUser flow in Copilot UI: show confirmation banner with "Open Decision Room" / "Dismiss" actions
- [x] Confirm roomSource: auto on auto-created rooms; user_confirmed on confirmed rooms
- [x] Confirm all five seeded rooms have empty executiveDecision in production DB
- [x] Resolve deployment state: confirm production is published and GitHub is synchronized
