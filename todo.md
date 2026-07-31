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
