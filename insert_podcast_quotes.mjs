import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const quotes = [
  {
    title: "Clara Bernardes (Verbatim): On European regulation as bottleneck for innovation",
    content: "CLARA BERNARDES (verbatim, Aulium Interview): If you think about it, it's a great thing that Europe is so regulated, but it's also a very bad thing sometimes that Europe is so regulated. Because for innovation purposes, it's extremely hard to do something different, something innovative, something that hasn't been done before in Europe, in an extremely regulated market space, because of that. Because there's so many... there's so many bottlenecks, there's so many blocks, there's so many things that you need to surpass that it becomes almost impossible to develop such things in Europe. If it's possible, of course, you just need to make sure that you're compliant with it, which is something that we are. But then obviously I think that... when you look at the space, there's a lot of companies that are moving to the US for exactly that reason, which is that, um, Europe regulations are great, uh, for safety purposes, for, um, getting everyone down to earth purposes, but it's also, uh, a bottleneck for companies that are trying to innovate.",
    summary: "Clara verbatim: EU regulation is great for safety but a bottleneck for innovation; companies moving to US.",
    sourceUrl: "https://www.youtube.com/watch?v=Lx750S1UNhs",
    sourceName: "Aulium Interview (YouTube)",
    tags: '["Clara Bernardes","EU regulation","innovation","bottleneck","verbatim"]',
    entities: '["Clara Bernardes","Biorce"]'
  },
  {
    title: "Clara Bernardes (Verbatim): On the cost of EU AI Act compliance for startups",
    content: "CLARA BERNARDES (verbatim, Aulium Interview): For you to be fully compliant with all of the AI regulations in Europe, it costs you a little bit over the average of a, um, pre-seed round in Europe. And that was like... it's not a per year situation, it's a bulk. But if you raise a pre-seed and you spend everything in just getting compliant, then how do you do everything else?",
    summary: "Clara verbatim: Full EU AI compliance costs more than an average pre-seed round — a bulk, not annual cost.",
    sourceUrl: "https://www.youtube.com/watch?v=Lx750S1UNhs",
    sourceName: "Aulium Interview (YouTube)",
    tags: '["Clara Bernardes","EU AI Act","compliance cost","pre-seed","verbatim"]',
    entities: '["Clara Bernardes","Biorce"]'
  },
  {
    title: "Clara Bernardes (Verbatim): On Biorce platform scope — study startup, clinical only",
    content: "CLARA BERNARDES (verbatim, Jamil Interview): So at Bio-os, like you said, we are almost two years old. We will be two years in January. Currently, what we do is we have a harmonized platform, AI-based, to solve all the pain points in the pharmaceutical industry. We focus mainly on study startup. So we only work on focus on the clinical side. So no preclinical, no little white mice in labs, and no post-market. Um, so we focus on the clinical side.",
    summary: "Clara verbatim: Biorce is AI-based harmonized platform for pharma pain points, focused on study startup, clinical side only.",
    sourceUrl: "https://www.youtube.com/watch?v=EeOvHwCWiLI",
    sourceName: "Jamil Interview (YouTube)",
    tags: '["Clara Bernardes","platform scope","study startup","clinical trials","verbatim"]',
    entities: '["Clara Bernardes","Biorce"]'
  },
  {
    title: "Pedro Coelho (Verbatim): Biorce founding story — from consulting to building",
    content: "PEDRO COELHO (verbatim, Spread Love and Organizations Podcast): Host introduction: After years advising pharma and biotech companies as a strategy consultant in the life sciences sector, Pedro saw firsthand how inefficiencies in the clinical research process were slowing access to lifesaving treatments. The consequences were not just operational; they were human. Drugs were too expensive, timelines too long, and too many patients were left behind. In 2024, he founded BioRce to change that. BioRce, short for Biology's Force, is building the world's first true AI assistant for clinical trials. Pedro: Thank you Naji, it's a pleasure to be here. Looking forward to this discussion.",
    summary: "Pedro origin story: strategy consultant who saw clinical inefficiencies firsthand; founded Biorce 2024 to fix them.",
    sourceUrl: "https://www.youtube.com/watch?v=MVdIIDhgQt4",
    sourceName: "Spread Love and Organizations Podcast (YouTube)",
    tags: '["Pedro Coelho","founding story","origin","clinical trials","verbatim"]',
    entities: '["Pedro Coelho","Biorce"]'
  }
];

let ok = 0;
for (const q of quotes) {
  try {
    await conn.execute(
      `INSERT INTO knowledge_items (title, content, summary, category, sourceType, sourceName, verificationStatus, sourceUrl, tags, entities, isConfidential, createdAt, updatedAt)
       VALUES (?, ?, ?, 'podcast', 'primary', ?, 'verified', ?, ?, ?, 0, NOW(), NOW())`,
      [q.title, q.content, q.summary, q.sourceName, q.sourceUrl, q.tags, q.entities]
    );
    ok++;
    console.log(`OK: ${q.title.substring(0, 70)}`);
  } catch(e) {
    console.error(`FAIL: ${q.title.substring(0, 70)} — ${e.message}`);
  }
}

await conn.end();
console.log(`\nInserted ${ok}/${quotes.length}`);
