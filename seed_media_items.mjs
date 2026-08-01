import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Load the parallel transcription results
const data = JSON.parse(fs.readFileSync('/home/ubuntu/transcribe_biorce_podcasts.json', 'utf8'));
const v1 = fs.readFileSync('/home/ubuntu/transcript_video1_FINAL.md', 'utf8');
const v2 = fs.readFileSync('/home/ubuntu/transcript_video2_FINAL.md', 'utf8');

const urlLabels = {
  "https://www.youtube.com/watch?v=QCPlIkB-OkA": "Video 1 — Las farmacéuticas pagan decenas de millones por esta IA | Biorce",
  "https://www.youtube.com/watch?v=-M-mb_IW3Kw&t=12s": "Video 2 — Cómo escalar una startup de SALUD desde España al mundo | Pedro Coelho",
  "https://www.youtube.com/watch?v=Jj_KMeriBRs": "Video 3 — Why Drug Trials Take 12 Years and How Biorce Cuts That to 4 | Clara Bernardes",
  "https://www.youtube.com/watch?v=EeOvHwCWiLI&t=19s": "Video 4 — Jamil Interview — Clara Bernardes",
  "https://www.youtube.com/watch?v=4qHtPbWVvGk&t=19s": "Video 5 — How AI Could Cut Clinical Trials From 11 Years to 5 | Clara Bernardes",
  "https://www.youtube.com/watch?v=QY-LyR190IY&t=9s": "Video 6 — Biorce Founders Live on Ventures",
  "https://www.youtube.com/watch?v=tOel2eeI0Sc": "Video 7 — Biorce Podcast: Matteo Talotta on Clinical Innovation",
  "https://www.youtube.com/watch?v=Lx750S1UNhs": "Video 8 — Clara Bernardes on Aulium",
  "https://www.youtube.com/watch?v=MVdIIDhgQt4": "Video 9 — Pedro Coelho On AI in Clinical Development | Spread Love and Organizations Podcast",
};

let inserted = 0;

// Insert the two newly transcribed videos first
const newVideos = [
  {
    title: "Las farmacéuticas pagan decenas de millones por esta IA | Biorce",
    externalUrl: "https://www.youtube.com/watch?v=QCPlIkB-OkA",
    source: "Itnig Podcast",
    speakers: JSON.stringify(["Pedro Coelho"]),
    language: "es",
    durationSeconds: 7304,
    transcriptText: v1.substring(0, 65000), // mediumtext limit safe
    tags: JSON.stringify(["Pedro Coelho","Itnig","Spanish","podcast","fundraising","clinical trials"]),
    verificationStatus: "verified",
    sourceOfTruth: "primary",
  },
  {
    title: "Why Drug Trials Take 12 Years and How Biorce Cuts That to 4 | Clara Bernardes",
    externalUrl: "https://www.youtube.com/watch?v=Jj_KMeriBRs",
    source: "YouTube Interview",
    speakers: JSON.stringify(["Clara Bernardes"]),
    language: "en",
    durationSeconds: 3439,
    transcriptText: v2.substring(0, 65000),
    tags: JSON.stringify(["Clara Bernardes","clinical trials","drug development","AI","podcast"]),
    verificationStatus: "verified",
    sourceOfTruth: "primary",
  }
];

for (const v of newVideos) {
  try {
    await conn.execute(
      `INSERT INTO media_items (title, mediaType, externalUrl, source, speakers, language, durationSeconds, transcriptText, tags, verificationStatus, sourceOfTruth, isPublic, createdAt, updatedAt)
       VALUES (?, 'video', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [v.title, v.externalUrl, v.source, v.speakers, v.language, v.durationSeconds, v.transcriptText, v.tags, v.verificationStatus, v.sourceOfTruth]
    );
    inserted++;
    console.log('OK:', v.title.substring(0, 60));
  } catch(e) {
    console.error('FAIL:', v.title.substring(0, 60), '-', e.message.slice(0, 80));
  }
}

// Insert the 7 parallel-transcribed videos
for (const r of data.results) {
  if (r.error) continue;
  const o = r.output;
  const title = o.video_title || urlLabels[r.input] || 'Untitled';
  const dur = Math.round((o.duration_minutes || 0) * 60);
  const speakers = JSON.stringify((o.speakers_identified || '').split(',').map(s => s.trim()).filter(Boolean));
  const transcript = (o.transcript || '').substring(0, 65000);
  const lang = (o.speakers_identified || '').toLowerCase().includes('pedro') ? 'es' : 'en';
  try {
    await conn.execute(
      `INSERT INTO media_items (title, mediaType, externalUrl, source, speakers, language, durationSeconds, transcriptText, tags, verificationStatus, sourceOfTruth, isPublic, createdAt, updatedAt)
       VALUES (?, 'video', ?, 'YouTube Podcast', ?, ?, ?, ?, '["Biorce","podcast","verbatim"]', 'verified', 'primary', 1, NOW(), NOW())`,
      [title, r.input, speakers, lang, dur, transcript]
    );
    inserted++;
    console.log('OK:', title.substring(0, 60));
  } catch(e) {
    console.error('FAIL:', title.substring(0, 60), '-', e.message.slice(0, 80));
  }
}

await conn.end();
console.log(`\nTotal inserted: ${inserted}`);
