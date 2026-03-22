// ── STATE ──
let resumeData = {};
let jobs = [];
let results = [];
let currentPlatform = 'LinkedIn';

// ── GROQ API KEY — loaded from config.js (gitignored, never in source control) ──
const GROQ_API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.GROQ_API_KEY) ? CONFIG.GROQ_API_KEY : '';

// ── DRAG & DROP ──
const uz = document.getElementById('uploadZone');
uz.addEventListener('dragover', e => { e.preventDefault(); uz.classList.add('over'); });
uz.addEventListener('dragleave', () => uz.classList.remove('over'));
uz.addEventListener('drop', e => {
  e.preventDefault(); uz.classList.remove('over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) await processFile(file);
}

async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  let text = '';

  try {
    if (ext === 'txt') {
      text = await file.text();
    } else if (ext === 'docx' || ext === 'doc') {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      text = result.value;
    } else if (ext === 'pdf') {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        let fullText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        text = fullText.trim();
        if (!text) throw new Error('No text found in PDF');
      } catch (pdfErr) {
        showFileLoaded(file.name, file.size, null, true);
        return;
      }
    } else {
      text = await file.text();
    }

    document.getElementById('resumeText').value = text;
    showFileLoaded(file.name, file.size, text, false);
  } catch (err) {
    alert('File read karne mein error. Please text directly paste karo!');
  }
}

function showFileLoaded(name, size, text, isPdf) {
  const fl = document.getElementById('fileLoaded');
  const kb = (size / 1024).toFixed(1);
  fl.style.display = 'block';
  fl.innerHTML = `
    <div class="resume-loaded">
      <div class="resume-loaded-icon">✅</div>
      <div>
        <div class="resume-loaded-name">${name}</div>
        <div class="resume-loaded-size">${kb} KB</div>
      </div>
    </div>
    ${isPdf ? `<div class="alert alert-warn">⚠️ PDF direct extract nahi ho sakta browser mein. Kripya PDF se text copy karke neeche paste karo.</div>` : ''}
    ${text ? `<div class="resume-preview">${text.substring(0, 500)}...</div>` : ''}
  `;
  document.getElementById('uploadZone').style.display = 'none';
}

function onResumeTextInput() {
  // auto-hide file zone if text is pasted
}

// ── NAVIGATION ──
function goStep(n) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.prog-step').forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  document.getElementById('pill-' + n).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tryGoStep(n) {
  if (n <= getCurrentStep()) goStep(n);
}

function getCurrentStep() {
  for (let i = 4; i >= 1; i--) {
    if (document.getElementById('step-' + i).classList.contains('active')) return i;
  }
  return 1;
}

// ── STEP 1 ──
function step1Next() {
  const resume = document.getElementById('resumeText').value.trim();
  const name   = document.getElementById('userName').value.trim();
  const role   = document.getElementById('userRole').value.trim();
  const target = document.getElementById('userTarget').value.trim();

  if (!resume && !document.getElementById('fileLoaded').style.display !== 'none') {
    return alert('Pehle apna resume paste karo ya upload karo!');
  }
  if (!resume) return alert('Resume text khaali hai! Please paste karo.');
  if (!name)   return alert('Apna naam daalo!');
  if (!role)   return alert('Apna role / field daalo!');

  resumeData = {
    resume, name, role, target,
    email: document.getElementById('userEmail').value.trim(),
    city:  document.getElementById('userCity').value.trim(),
    exp:   document.getElementById('userExp').value
  };

  document.getElementById('pill-1').classList.add('done');
  goStep(2);
}

// ── STEP 2 ──
function selectPlatform(el) {
  currentPlatform = el.value;
  document.querySelectorAll('.platform-pill').forEach(p => p.classList.remove('checked'));
  el.closest('.platform-pill').classList.add('checked');
}

function addJob() {
  const title   = document.getElementById('jTitle').value.trim();
  const company = document.getElementById('jCompany').value.trim();
  const jd      = document.getElementById('jJD').value.trim();
  const hm      = document.getElementById('jHM').value.trim();
  const hmEmail = document.getElementById('jEmail').value.trim();

  if (!title)   return alert('Job title daalo!');
  if (!company) return alert('Company ka naam daalo!');
  if (!jd)      return alert('Job description paste karo!');

  jobs.push({ id: Date.now(), title, company, jd, hm, hmEmail, platform: currentPlatform });

  ['jTitle', 'jCompany', 'jJD', 'jHM', 'jEmail'].forEach(id => document.getElementById(id).value = '');
  renderJobsList();
}

function removeJob(id) {
  jobs = jobs.filter(j => j.id !== id);
  renderJobsList();
}

function renderJobsList() {
  const container = document.getElementById('jobsAdded');
  if (jobs.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="alert alert-success">✅ ${jobs.length} job(s) add ho gayi — aur add karo ya analyse karo</div>
    ${jobs.map(j => `
      <div class="job-pill">
        <div>
          <div class="job-pill-title">${j.title} @ ${j.company}</div>
          <div class="job-pill-meta">${j.platform} ${j.hm ? '· Contact: ' + j.hm : ''}</div>
        </div>
        <button class="btn btn-red-soft" onclick="removeJob(${j.id})">Hatao ×</button>
      </div>
    `).join('')}
  `;
}

function step2Next() {
  if (jobs.length === 0) return alert('Kam se kam ek job add karo!');
  document.getElementById('pill-2').classList.add('done');
  goStep(3);
  runAnalysis();
}

// ── ANALYSIS ──
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768'
];

async function callGroqModel(key, model, system, user) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user }
      ],
      max_tokens: 2048,
      temperature: 0.7
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '';
}

async function callGroq(system, user) {
  const key = GROQ_API_KEY;
  if (!key) throw new Error('Groq API key set karo!');

  for (const model of GROQ_MODELS) {
    try {
      document.getElementById('analysisStep').textContent += ` [${model}]`;
      const result = await callGroqModel(key, model, system, user);
      return result;
    } catch (err) {
      const isRateLimit = err.message.includes('rate_limit') || err.message.includes('quota') || err.message.includes('limit');
      if (isRateLimit && GROQ_MODELS.indexOf(model) < GROQ_MODELS.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

// Escapes control characters only inside JSON string values
function sanitizeJSON(str) {
  let out = '', inStr = false, esc = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i], code = str.charCodeAt(i);
    if (esc) { out += c; esc = false; continue; }
    if (c === '\\' && inStr) { out += c; esc = true; continue; }
    if (c === '"') { inStr = !inStr; out += c; continue; }
    if (inStr && code < 0x20) {
      if      (code === 0x0a) out += '\\n';
      else if (code === 0x0d) out += '\\r';
      else if (code === 0x09) out += '\\t';
      continue;
    }
    out += c;
  }
  return out;
}

function parseJSON(raw) {
  let cleaned = raw.replace(/```json|```/g, '').trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) cleaned = m[0];
  try { return JSON.parse(cleaned); }
  catch {
    try { return JSON.parse(sanitizeJSON(cleaned)); }
    catch { return null; }
  }
}

function setProgress(current, total, stepText) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = `${current} / ${total} jobs processed`;
  document.getElementById('analysisStep').textContent = stepText;
}

async function runAnalysis() {
  results = [];
  const total = jobs.length;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    setProgress(i, total, `Job ${i + 1}/${total}: "${job.title} @ ${job.company}" analyse ho raha hai...`);
    document.getElementById('analysisTitle').textContent = `AI Kaam Kar Raha Hai... (${i + 1}/${total})`;

    try {
      const sys = `You are an expert career coach, ATS resume specialist, and business communication expert. You help Indian job seekers craft tailored, powerful job applications. Return ONLY valid JSON, no markdown, no extra text.`;

      const prompt = `
CANDIDATE PROFILE:
Name: ${resumeData.name}
Role: ${resumeData.role}
Target: ${resumeData.target || resumeData.role}
Experience Level: ${resumeData.exp}
Location: ${resumeData.city || 'India'}
Email: ${resumeData.email || ''}

RESUME:
${resumeData.resume}

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Platform: ${job.platform}
Hiring Manager: ${job.hm || 'Not specified'}
Hiring Manager Email: ${job.hmEmail || 'Not specified'}

JOB DESCRIPTION:
${job.jd}

Return a JSON object with these exact fields:
{
  "matchScore": <number 0-100>,
  "matchLabel": <"Excellent Match" | "Good Match" | "Partial Match">,
  "fitSummary": "<3-4 sentences in English explaining why this candidate fits. Be specific to this JD.>",
  "keySkills": ["<5-7 skills from resume that match this JD>"],
  "missingSkills": ["<2-4 important JD requirements the candidate lacks>"],
  "atsKeywords": ["<6-8 important ATS keywords from the JD to include>"],
  "tailoredSummary": "<Write a 4-6 line ATS-optimized professional summary for this specific job. Start strong, use JD keywords, mention measurable impact if possible. Write in third person.>",
  "tailoredBullets": ["<5 powerful bullet points from the candidate's experience most relevant to this role. Start with action verbs. Include numbers/metrics where possible. Make each bullet 1-2 lines.>"],
  "linkedinDM": "<Write a warm, natural, SHORT LinkedIn DM to ${job.hm || 'the hiring manager'} at ${job.company}. MAX 4 short paragraphs. Mention the role title, show genuine interest in ${job.company} specifically, reference 1 specific requirement from the JD, and end with a clear soft ask (like asking if they're open to a quick chat). Sign off as ${resumeData.name}. DO NOT make it sound like a template. Keep it conversational and human.>",
  "coldEmail": "<Write a persuasive cold email to ${job.hm || 'the hiring manager'} at ${job.company}. Subject line first (on its own line, prefixed 'Subject: '), then the email body. 4-5 short paragraphs. Open with a strong hook mentioning the role, reference a specific detail about ${job.company} or the JD, highlight the candidate's most relevant achievement with a number, and end with a confident CTA. Professional but not stiff. Sign off as ${resumeData.name}${resumeData.email ? ' (' + resumeData.email + ')' : ''}.>"
}`;

      const raw    = await callGroq(sys, prompt);
      const parsed = parseJSON(raw);
      if (parsed) results.push({ job, analysis: parsed });
      else        results.push({ job, error: 'Parse error — retry karo' });
    } catch (err) {
      results.push({ job, error: err.message });
    }
  }

  setProgress(total, total, 'Sab complete! Results taiyaar hain.');
  results.sort((a, b) => (b.analysis?.matchScore || 0) - (a.analysis?.matchScore || 0));
  document.getElementById('pill-3').classList.add('done');
  renderResults();
  goStep(4);
}

// ── RESULTS ──
function renderResults() {
  const c = document.getElementById('resultsContainer');
  if (!results.length) {
    c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">😕</div><div class="empty-state-text">Koi result nahi mila.</div></div>';
    return;
  }

  c.innerHTML = results.map((r, i) => {
    if (r.error) return `<div class="result-card"><div class="result-header"><div><div class="result-job-title">${r.job.title}</div><div class="result-company">${r.job.company}</div></div></div><div style="padding:20px;color:#d4500a;">❌ Error: ${r.error}</div></div>`;

    const a  = r.analysis;
    const s  = a.matchScore || 0;
    const sc = s >= 70 ? 'score-high' : s >= 45 ? 'score-med' : 'score-low';

    const resumeContent = `PROFESSIONAL SUMMARY (Is Job Ke Liye)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${a.tailoredSummary || ''}

KEY EXPERIENCE HIGHLIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(a.tailoredBullets || []).map(b => '• ' + b).join('\n\n')}

ATS KEYWORDS TO INCLUDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(a.atsKeywords || []).join(' | ')}`;

    return `
    <div class="result-card">
      <div class="result-header">
        <div>
          <div class="result-job-title">${r.job.title}</div>
          <div class="result-company">${r.job.company} · ${r.job.platform}${r.job.hm ? ' · ' + r.job.hm : ''}</div>
        </div>
        <div class="score-badge ${sc}">
          <span class="score-num">${s}%</span>
          <span class="score-label">${a.matchLabel || 'Match'}</span>
        </div>
      </div>

      <div class="tabs">
        <div class="tab active" onclick="switchTab(${i},'fit',this)">🎯 Fit Analysis</div>
        <div class="tab" onclick="switchTab(${i},'resume',this)">📄 Tailored Resume</div>
        <div class="tab" onclick="switchTab(${i},'linkedin',this)">💼 LinkedIn DM</div>
        <div class="tab" onclick="switchTab(${i},'email',this)">📧 Cold Email</div>
      </div>

      <!-- FIT -->
      <div class="tab-content active" id="tc-${i}-fit">
        <p class="fit-summary">${a.fitSummary || ''}</p>
        <div class="two-col">
          <div>
            <div class="content-label" style="color:var(--accent2);margin-top:16px;">✅ Aapke paas hain</div>
            <div class="skill-grid" style="margin-top:8px;">${(a.keySkills || []).map(s => `<span class="skill-tag skill-have">${s}</span>`).join('')}</div>
          </div>
          <div>
            <div class="content-label" style="color:var(--accent);margin-top:16px;">⚠️ Seekhna padega / Address karo</div>
            <div class="skill-grid" style="margin-top:8px;">${(a.missingSkills || []).map(s => `<span class="skill-tag skill-gap">${s}</span>`).join('')}</div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <div class="content-label">🔑 ATS Keywords (resume mein zaroor daalo)</div>
          <div class="skill-grid" style="margin-top:8px;">${(a.atsKeywords || []).map(s => `<span class="skill-tag" style="background:var(--tag-bg);border-color:var(--border);color:var(--ink2);">${s}</span>`).join('')}</div>
        </div>
      </div>

      <!-- RESUME -->
      <div class="tab-content" id="tc-${i}-resume">
        <div class="alert alert-info">📌 Yeh content apne resume ke top mein paste karo. Apne original bullets replace karo in highlighted ones se.</div>
        <div class="content-label">TAILORED RESUME CONTENT — ${r.job.title.toUpperCase()} @ ${r.job.company.toUpperCase()}</div>
        <div class="content-box" id="res-${i}">${resumeContent}</div>
        <button class="copy-btn" onclick="copyIt('res-${i}',this)">📋 Copy Karo</button>
      </div>

      <!-- LINKEDIN -->
      <div class="tab-content" id="tc-${i}-linkedin">
        <div class="alert alert-info">💼 Yeh message LinkedIn pe ${r.job.hm || 'hiring manager'} ko send karo. Bhejne se pehle 1-2 personal details add karo.</div>
        <div class="content-label">LINKEDIN DM — ${r.job.hm ? r.job.hm.toUpperCase() : 'HIRING MANAGER'} KO</div>
        <div class="content-box" id="li-${i}">${a.linkedinDM || ''}</div>
        <button class="copy-btn" onclick="copyIt('li-${i}',this)">📋 Copy Karo</button>
      </div>

      <!-- EMAIL -->
      <div class="tab-content" id="tc-${i}-email">
        <div class="alert alert-info">📧 Yeh cold email directly bhejo${r.job.hmEmail ? ' ' + r.job.hmEmail + ' pe' : r.job.hm ? ' ' + r.job.hm + ' ko' : ' recruiter ko'}. Subject line already include hai.</div>
        <div class="content-label">COLD EMAIL${r.job.hmEmail ? ' — ' + r.job.hmEmail.toUpperCase() : ''}</div>
        <div class="content-box" id="em-${i}">${a.coldEmail || ''}</div>
        <button class="copy-btn" onclick="copyIt('em-${i}',this)">📋 Copy Karo</button>
      </div>
    </div>`;
  }).join('');
}

function switchTab(jobIdx, tab, el) {
  const card = el.closest('.result-card');
  card.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  card.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const tc = document.getElementById(`tc-${jobIdx}-${tab}`);
  if (tc) tc.classList.add('active');
}

function copyIt(id, btn) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copy Ho Gaya!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy Karo'; btn.classList.remove('copied'); }, 2500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    btn.textContent = '✅ Copy Ho Gaya!';
    setTimeout(() => { btn.textContent = '📋 Copy Karo'; }, 2500);
  });
}

function resetAll() {
  jobs = []; results = []; resumeData = {};
  document.getElementById('resumeText').value = '';
  document.getElementById('userName').value   = '';
  document.getElementById('userRole').value   = '';
  document.getElementById('userEmail').value  = '';
  document.getElementById('userCity').value   = '';
  document.getElementById('userTarget').value = '';
  document.getElementById('fileLoaded').style.display  = 'none';
  document.getElementById('uploadZone').style.display  = 'block';
  document.getElementById('jobsAdded').innerHTML = '';
  document.querySelectorAll('.prog-step').forEach(p => p.classList.remove('done', 'active'));
  goStep(1);
}
