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
