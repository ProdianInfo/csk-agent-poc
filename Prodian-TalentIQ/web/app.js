/* TalentIQ UI — deliberately dependency-free for easy offline setup. */
const root=document.getElementById('root');
const state={page:'dashboard',user:null,candidates:[],jobs:[],candidateSearch:{q:'',skills:'',min_years:'',location:''}};
const E=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const enc=encodeURIComponent;
const $=(q)=>document.querySelector(q);
const $$=(q)=>[...document.querySelectorAll(q)];
function flash(text,isError=false){document.querySelector('.toast')?.remove();const box=document.createElement('div');box.className='toast'+(isError?' error':'');box.textContent=text;document.body.appendChild(box);setTimeout(()=>box.remove(),4200)}
async function api(url,opts={}){
  const resp=await fetch(url,{credentials:'same-origin',...opts,headers:{...(opts.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(opts.headers||{})}});
  if(resp.status===401){state.user=null;loginScreen();throw Error('Please sign in again')}
  let data;try{data=await resp.json()}catch{data={}}
  if(!resp.ok)throw Error(typeof data.detail==='string'?data.detail:`Request failed (${resp.status})`);
  return data;
}
const post=(url,data)=>api(url,{method:'POST',body:JSON.stringify(data)});
const nav=[['dashboard','▦','Overview'],['candidates','♧','Candidate Search'],['import','⇧','Import Center'],['jobs','▤','Job Requirements'],['pipeline','◫','Recruitment Pipeline'],['lab','⌘','TELA Lab']];
function shell(){const current=nav.find(x=>x[0]===state.page)||nav[0];root.innerHTML=`<div class="app"><aside class="sidebar">
<div class="logo"><div class="logo-mark">T</div><div><div class="logo-title">TalentIQ</div><div class="logo-sub">BY PRODIAN</div></div></div>
<div class="menu-label">WORKSPACE</div>${nav.map(x=>`<button class="nav-item ${x[0]===state.page?'active':''}" data-nav="${x[0]}"><span class="nav-icon">${x[1]}</span><span class="nav-text">${x[2]}</span></button>`).join('')}
<div class="sidebar-footer"><span class="env-pill">● LOCAL POC</span><div style="font-weight:800;font-size:12px">TELA integration lab</div><div class="tiny" style="margin-top:6px;line-height:1.6">Privacy-first demonstration. Synthetic candidate data preloaded.</div></div>
</aside><div class="main"><header class="topbar"><div class="topbar-left"><span style="color:#acb5c7;font-size:12px">Workspace</span><span style="color:#cad0de">/</span><div class="crumb"><strong>${current[2]}</strong></div></div><div class="top-actions"><span class="badge-spot">● Local workspace</span><button class="icon-btn" id="refresh-btn" title="Refresh">↻</button><div class="user-bubble">${E((state.user?.username||'H').slice(0,1))}</div><div class="user-meta"><strong>${E(state.user?.username||'HR')} User</strong><span>${E(state.user?.role||'HR')} role</span></div><button class="btn sm" id="signout">Sign out</button></div></header>
<main class="content" id="page-body"></main></div></div><nav class="mobile-nav">${nav.slice(0,5).map(x=>`<button title="${x[2]}" data-nav="${x[0]}">${x[1]}</button>`).join('')}</nav>`}
function heading(title,sub,action=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div><div class="actions">${action}</div></div>`}
function candidateTags(skills,max=3){let ss=Array.isArray(skills)?skills:String(skills||'').split(',').map(s=>s.trim());return ss.slice(0,max).map(s=>`<span class="tag purple">${E(s)}</span>`).join('')+(ss.length>max?`<span class="tag">+${ss.length-max}</span>`:'')}
function pill(stage){const classes={New:'blue',Shortlisted:'purple',Interview:'amber',Selected:'green',Rejected:'red'};return `<span class="tag ${classes[stage]||''}">${E(stage)}</span>`}
function avatar(name){return `<div class="avatar">${E((name||'?').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase())}</div>`}
async function render(){shell();try{
 switch(state.page){case 'dashboard':await dashboard();break;case 'candidates':await candidates();break;case 'import':await importCenter();break;case 'jobs':await jobs();break;case 'pipeline':await pipeline();break;case 'lab':await lab();break;}
}catch(e){$('#page-body').innerHTML=`${heading('Unable to load','Please try refreshing the page')}<div class="sugg">${E(e.message)}</div>`}}
async function dashboard(){const x=await api('/api/dashboard');$('#page-body').innerHTML=`
${heading(`Good day, ${E(state.user.username)} 👋`,'Here is a snapshot of Prodian’s talent pool and recruitment activities.','<button class="btn soft" data-nav="lab">⌘ Explore TELA Lab</button><button class="btn primary" data-nav="import">⇧ Import Resumes</button>')}
<div class="hero"><div style="position:relative;z-index:1"><h2>Meet your talent intelligence workspace</h2><p>Search your candidate pool, find skills faster, manage recruitment pipelines and explore how TELA can understand and support this application.</p><button class="btn" data-nav="candidates" style="margin-top:18px;background:white;border-color:white;color:#5640bf">Explore candidate pool →</button></div><div class="hero-symbol">✧</div></div>
<div class="grid">${[
['Total Candidates',x.total_candidates,'♙','#edeaff','#7054e1','Sample candidate repository'],
['Open Positions',x.open_jobs,'▤','#eaf4ff','#4c91d4','Active job requirements'],
['Shortlisted',x.shortlisted,'✓','#e6f8f1','#1dad80','Profiles in shortlist'],
['In Interviews',x.interviews,'☷','#fff5e6','#e0a04a','Candidates in progress']
].map(s=>`<div class="stat"><div class="stat-head">${s[0]}<span class="stat-icon" style="background:${s[3]};color:${s[4]}">${s[2]}</span></div><div class="stat-number">${s[1]}</div><div class="stat-foot">${s[5]}</div></div>`).join('')}</div>
<div class="columns"><section class="panel"><div class="panel-head"><div><h3 class="panel-title">Talent distribution by skills</h3><div class="panel-sub">Skills identified in candidate records</div></div><button class="btn sm" data-nav="candidates">View profiles →</button></div><div class="panel-body">${x.skill_distribution.map(s=>`<div class="bar-row"><span class="bar-label">${E(s.skill)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,Math.round(100*s.count/(x.total_candidates||1)))}%"></div></div><span class="bar-num">${s.count}</span></div>`).join('')}</div></section>
<section class="panel"><div class="panel-head"><div><h3 class="panel-title">Getting started</h3><div class="panel-sub">Your first TalentIQ + TELA journey</div></div></div><div class="panel-body"><div class="timeline">${[
['01 · Import resumes','Upload local PDFs, scanned PDFs, DOCX or an entire folder.'],
['02 · Search & shortlist','Match candidates to requirements with reasons.'],
['03 · Onboard into TELA','Register this application’s source, API, schema and runbooks.'],
['04 · Inject a lab incident','Generate a traceable test issue and evaluate TELA Triage/Impact.']
].map(s=>`<div class="timeline-item"><strong>${s[0]}</strong><p>${s[1]}</p></div>`).join('')}</div></div></section></div>
<div class="sugg mt">✦ <strong>POC safety:</strong> All 48 preloaded candidates are fictional and use non-deliverable email addresses. Before importing actual profiles, configure identity management, consent/retention, backups and access policies.</div>`}
async function candidates(){const params=new URLSearchParams();for(const [k,v] of Object.entries(state.candidateSearch))if(v)params.set(k,v);const result=await api('/api/candidates?'+params);state.candidates=result.items;
$('#page-body').innerHTML=`${heading('Candidate Search','Find the best available talent across uploaded CVs, candidate lists and your internal repository.','<button class="btn soft" data-nav="import">⇧ Import Resumes</button><button class="btn primary" id="add-candidate">＋ Add Candidate</button>')}
<div class="panel"><form class="filters" id="search-form">
<div class="field grow"><label>Search by name or keyword</label><div class="searchbox"><span style="font-size:17px;color:#a5aec2">⌕</span><input name="q" placeholder="Search candidate name, role or keyword…" value="${E(state.candidateSearch.q)}"/></div></div>
<div class="field grow"><label>Required skills</label><input class="input" name="skills" placeholder="Java, Spring Boot, PostgreSQL" value="${E(state.candidateSearch.skills)}"/></div>
<div class="field"><label>Minimum experience</label><input class="input" name="min_years" type="number" min="0" max="50" placeholder="Years" value="${E(state.candidateSearch.min_years)}"/></div>
<div class="field"><label>Location</label><input class="input" name="location" placeholder="Chennai" value="${E(state.candidateSearch.location)}"/></div>
<button class="btn primary" type="submit">⌕ Find Matches</button><button class="btn" type="button" id="clear-search">Clear</button></form>
<div class="panel-head"><div><h3 class="panel-title">${result.total} matching candidates</h3><div class="panel-sub">Transparent skills-first ranking · HR review required</div></div><span class="tag green">65% Skills · 20% Experience · 15% Other</span></div>
<div class="overscroll"><table class="list-table"><thead><tr><th>Candidate</th><th>Primary skills</th><th>Experience</th><th>Status</th><th>Match score</th><th>Action</th></tr></thead><tbody>
${result.items.map(c=>`<tr><td><div class="person">${avatar(c.name)}<div><strong>${E(c.name)}</strong><small>${E(c.location||'Not specified')} · ${E(c.availability)}</small></div></div></td><td>${candidateTags(c.skills)}</td><td><strong>${E(c.years)} yrs${c.review_needed && Number(c.years)===0?' · verify':''}</strong></td><td>${pill(c.status)}</td><td><div class="score">${c.score===null?'—':c.score+'%'}<div class="matchbar"><div style="width:${c.score??0}%"></div></div></div></td><td><button class="btn sm" data-candidate="${c.id}">View →</button></td></tr>`).join('')||'<tr><td colspan="6"><div class="empty"><div class="big">⌕</div>No candidates match. Try fewer requirements.</div></td></tr>'}
</tbody></table></div></div><p class="help mt">Match score is an explainable heuristic, not a candidate competency assessment. Scores never use age, gender or other protected attributes. Candidate details are restricted by role.</p>`}
function modal(title,body,footer=''){closeModal();const m=document.createElement('div');m.className='modal-backdrop';m.id='modal';m.innerHTML=`<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" id="close-modal" aria-label="Close">×</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-foot">${footer}</div>`:''}</div>`;document.body.appendChild(m)}
function closeModal(){$('#modal')?.remove()}
async function showCandidate(id){try{const c=await api(`/api/candidates/${id}`);const m=state.candidates.find(x=>x.id===id);
  modal('Candidate profile',`<div class="detail-head">${avatar(c.name)}<div><h3>${E(c.name)}</h3><p>${E(c.years)} years experience · ${E(c.location||'Location not set')}</p></div></div>
  <div class="divider"></div><div class="form-grid"><div><div class="tiny">EMAIL</div><strong>${E(c.email||'Not available')}</strong></div><div><div class="tiny">CONTACT</div><strong>${E(c.phone||'Not available')}</strong></div><div><div class="tiny">AVAILABILITY</div><strong>${E(c.availability)}</strong></div><div><div class="tiny">SOURCE</div><strong>${E(c.source)}</strong></div></div>
  <div class="divider"></div><strong>Skills</strong><div style="margin-top:10px">${candidateTags(c.skills,30)}</div>
  ${m?`<div class="divider"></div><strong>Why this candidate matched</strong><p class="help">Matched: ${E(m.matched_skills.join(', ')||'No required skills selected')}<br>Missing: ${E(m.missing_skills.join(', ')||'None')}<br>Score breakdown: skills ${m.breakdown.skills}/65, experience ${m.breakdown.experience}/20, location ${m.breakdown.location}/10, availability ${m.breakdown.availability}/5.</p>`:''}
  ${c.review_needed?'<div class="sugg mt">⚠ Extracted data needs HR verification against the resume before any hiring decision.</div>':''}
  <div class="divider"></div><label class="tiny">PIPELINE STATUS</label><select class="select" id="candidate-stage" ${state.user.role==='lead'?'disabled':''} style="margin-top:7px">${['New','Shortlisted','Interview','Selected','Rejected','On Hold'].map(x=>`<option ${c.status===x?'selected':''}>${x}</option>`).join('')}</select>`,
  `<button class="btn" id="close-candidate">Close</button>${state.user.role==='lead'?'':`${c.source==='resume'?`<a class="btn" href="/api/candidates/${c.id}/resume" target="_blank" rel="noopener">Original CV</a>`:''}<button class="btn" data-edit-candidate="${c.id}">Review / Edit details</button><button class="btn primary" data-save-stage="${c.id}">Save status</button>`}`)
}catch(e){flash(e.message,true)}}
async function editCandidate(id){
 try{
  const c=await api(`/api/candidates/${id}`);
  modal('Review and correct imported profile',`<p class="help">Compare fields against the original resume before saving. A successful save marks this profile HR-verified.</p>
  <form class="form-grid" id="candidate-edit" data-id="${id}">
  <div class="field"><label>Candidate full name *</label><input class="input" name="name" required minlength="2" value="${E(c.name)}"/></div>
  <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${E(c.email||'')}"/></div>
  <div class="field"><label>Phone</label><input class="input" name="phone" value="${E(c.phone||'')}"/></div>
  <div class="field"><label>Experience (years) *</label><input class="input" name="years" type="number" min="0" max="60" step=".01" required value="${E(c.years)}"/></div>
  <div class="field"><label>Location</label><input class="input" name="location" value="${E(c.location||'')}"/></div>
  <div class="field"><label>Availability</label><input class="input" name="availability" value="${E(c.availability||'30 days')}"/></div>
  <div class="field" style="grid-column:1/-1"><label>Skills (comma-separated)</label><input class="input" name="skills" value="${E(c.skills.join(', '))}"/></div>
  <div class="field" style="grid-column:1/-1"><label><input type="checkbox" name="confirmed_against_resume" required/> I have checked and corrected these fields against the original resume.</label></div>
  <div style="grid-column:1/-1" class="actions">${c.source==='resume'?`<a class="btn" href="/api/candidates/${id}/resume" target="_blank" rel="noopener">Open original CV</a>`:''}<button type="submit" class="btn primary">Save verified profile</button></div>
  </form>`);
 }catch(err){flash(err.message,true)}
}
function addCandidate(){modal('Add candidate',`<form id="candidate-create" class="form-grid"><div class="field"><label>Full name *</label><input class="input" name="name" required minlength="2"/></div><div class="field"><label>Email</label><input class="input" type="email" name="email"/></div><div class="field"><label>Phone</label><input class="input" name="phone"/></div><div class="field"><label>Experience (years)</label><input class="input" type="number" min="0" max="60" step=".5" name="years" value="3"/></div><div class="field"><label>Location</label><input class="input" name="location" placeholder="Chennai"/></div><div class="field"><label>Availability</label><select class="select" name="availability"><option>Immediate</option><option>15 days</option><option selected>30 days</option><option>60 days</option></select></div><div class="field" style="grid-column:1/-1"><label>Skills (comma-separated)</label><input class="input" name="skills" placeholder="Java, Spring Boot, SQL"/></div><button class="btn primary" style="grid-column:1/-1" type="submit">Save Candidate</button></form>`)}
async function importCenter(){let history={items:[]};try{history=await api('/api/imports')}catch(e){if(state.user.role==='lead')return $('#page-body').innerHTML=heading('Restricted','Only HR or Admin can import candidate data')}
$('#page-body').innerHTML=`${heading('Resume Import Center','Bulk upload documents from your PC, a Windows folder, or an approved export.','<span class="tag green">Local OCR available</span>')}
<div class="panel"><div class="panel-body"><div class="upload-area" id="dropzone"><div class="upload-icon">☁</div><h3>Drag and drop your resumes here</h3><p>Or choose files / a folder on your computer</p><div class="actions" style="justify-content:center;margin-top:16px"><button class="btn primary" id="select-files">＋ Choose Files</button><button class="btn" id="select-folder">▤ Select Folder</button></div><p class="help">PDF, scanned PDF, DOCX, DOC, PNG, JPG, TXT, CSV · 10 MB per document · 80 files per upload</p></div>
<input type="file" id="file-picker" multiple accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt,.csv" hidden/><input type="file" id="folder-picker" webkitdirectory directory multiple hidden/>
<div id="upload-status" class="mt"></div></div></div>
<div class="import-features">${[['▣','PDF & Word','Selectable PDFs and Word documents are extracted locally.'],['◉','Scanned Document OCR','Tesseract OCR reads scanned PDFs and images if installed.'],['✓','Duplicate Detection','File hashes and email identities reduce repeated candidate records.']].map(x=>`<div class="mini-feature"><span>${x[0]}</span><h4>${x[1]}</h4><p>${x[2]}</p></div>`).join('')}</div>
<div class="panel"><div class="panel-head"><div><h3 class="panel-title">Recent import activity</h3><div class="panel-sub">Review failed files, OCR method and duplicates</div></div><button class="btn sm" id="refresh-imports">↻ Refresh</button></div>
<div class="overscroll"><table class="list-table"><thead><tr><th>File</th><th>Source</th><th>Result</th><th>Extraction</th><th>Date</th></tr></thead><tbody>${history.items.slice(0,30).map(x=>`<tr><td><strong>${E(x.filename)}</strong><br><small>${E(x.detail||'')}</small></td><td>${E(x.source)}</td><td>${pill(x.result)}</td><td>${E(x.method||'—')}</td><td>${E(x.created_at)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No imports yet. Upload your first resume.</td></tr>'}</tbody></table></div></div>
<div class="sugg mt">✦ <strong>How folder import works:</strong> Use <b>Select Folder</b> to pick a Windows folder in the browser (Chrome/Edge). The browser uploads selected files; the server does not access arbitrary files on your computer. Documents remain within your configured TalentIQ data directory.</div>`}
async function processFiles(files){if(!files?.length)return;const list=[...files].filter(f=>/\.(pdf|docx|doc|txt|png|jpg|jpeg|tif|tiff|csv)$/i.test(f.name));if(!list.length)return flash('No supported files selected',true);let results=[];
const status=$('#upload-status');status.innerHTML=`<div class="sugg">Importing ${list.length} files in batches of 80. Large scanned PDFs may take longer while OCR runs.</div>`;
for(let i=0;i<list.length;i+=80){const batch=list.slice(i,i+80);const fd=new FormData();batch.forEach(f=>fd.append('files',f));try{const x=await api('/api/imports/upload',{method:'POST',body:fd});results.push(...x.items);status.innerHTML=`<div class="sugg">Processed ${Math.min(i+80,list.length)} / ${list.length} files…</div>`;}catch(e){flash(e.message,true)}}
const success=results.filter(x=>x.result==='imported').length;const failures=results.filter(x=>x.result!=='imported');status.innerHTML=`<div class="sugg"><strong>Import complete:</strong> ${success} imported · ${failures.length} failed / duplicated. ${failures.length?`<details><summary>Review file issues</summary>${failures.slice(0,30).map(x=>`<p>${E(x.filename)} — ${E(x.detail||x.result)}</p>`).join('')}</details>`:''}<div style="margin-top:10px"><button class="btn sm" data-nav="candidates">View candidates →</button><button class="btn sm" id="refresh-imports">Refresh log</button></div></div>`;
flash(`${success} profiles imported, ${failures.length} need review`)}
async function jobs(){const data=await api('/api/jobs');state.jobs=data.items;
$('#page-body').innerHTML=`${heading('Job Requirements','Create requirements and compare them with your current candidate repository.','<button class="btn primary" id="add-job">＋ New Requirement</button>')}
<div class="sugg mb">✦ <strong>Explainable JD matching:</strong> each job searches the existing repository by technical skills, experience and location. A hiring specialist must review every shortlist.</div>
<div class="jobs">${data.items.map(j=>`<div class="job"><div class="between mb"><span class="tag green">${E(j.status)}</span><span class="tiny">REQ-${String(j.id).padStart(3,'0')}</span></div><h3>${E(j.title)}</h3><p>${E(j.description||'Search your candidate repository for matching talent.')}</p><div class="tags">${candidateTags(j.skills,5)}</div><div class="job-bottom"><div class="tiny">${E(j.min_years)}–${E(j.max_years??'∞')} yrs · ${E(j.location||'Any location')}</div><button class="btn sm primary" data-job="${j.id}">Find matches →</button></div></div>`).join('')}</div>`}
function addJob(){modal('New Job Requirement',`<form id="job-create" class="form-grid"><div class="field" style="grid-column:1/-1"><label>Job title *</label><input class="input" name="title" required minlength="3" placeholder="Java Backend Developer"/></div><div class="field" style="grid-column:1/-1"><label>Required technical skills *</label><input class="input" name="skills" required placeholder="Java, Spring Boot, PostgreSQL, REST API"/></div><div class="field"><label>Minimum years</label><input class="input" name="min_years" type="number" min="0" value="3"/></div><div class="field"><label>Maximum years</label><input class="input" name="max_years" type="number" min="0" value="7"/></div><div class="field" style="grid-column:1/-1"><label>Preferred location</label><input class="input" name="location" placeholder="Chennai"/></div><div class="field" style="grid-column:1/-1"><label>Description</label><textarea class="textarea" name="description"></textarea></div><button class="btn primary" type="submit" style="grid-column:1/-1">Create Requirement</button></form>`)}
async function showJobMatches(id){const job=state.jobs.find(j=>j.id===id);try{const results=await api(`/api/jobs/${id}/matches`);modal(`${E(job.title)} — Matches`,`<p class="help">Required: ${E(job.skills)} · ${E(job.min_years)}–${E(job.max_years||'∞')} years · ${E(job.location||'Any location')}</p><div class="divider"></div>${results.items.slice(0,15).map((c,i)=>`<div class="between" style="padding:12px 0;border-bottom:1px solid #edf0f5;gap:12px"><div class="person">${avatar(c.name)}<div><strong>${E(c.name)}</strong><small>${E(c.years)} yrs · ${E(c.matched_skills.join(', '))}</small></div></div><div style="display:flex;align-items:center;gap:8px"><span class="score">${c.score}%</span><button class="btn sm" data-candidate="${c.id}">View</button></div></div>`).join('')||'<p>No candidates found.</p>'}`)}catch(e){flash(e.message,true)}}
async function pipeline(){const data=await api('/api/pipeline');$('#page-body').innerHTML=`${heading('Recruitment Pipeline','Move profiles from the initial shortlist through interview and selection.','<button class="btn" data-nav="candidates">⌕ Find Candidates</button>')}
<div class="board">${Object.entries(data.stages).map(([stage,candidates])=>`<div class="lane"><div class="lane-top"><strong>${E(stage)}</strong><span>${candidates.length}</span></div>${candidates.map(c=>`<div class="mini-candidate" data-candidate="${c.id}"><strong>${E(c.name)}</strong><p>${E(c.years)} yrs · ${E(c.location)}</p>${candidateTags(c.skills,2)}</div>`).join('')||'<p class="help">No candidates</p>'}</div>`).join('')}</div>`}
async function lab(){let incidents={items:[]};try{incidents=await api('/api/ops/incidents')}catch{};
$('#page-body').innerHTML=`${heading('TELA Integration Lab','Explore the source-to-incident journey with safe, synthetic test failures.','<span class="tag purple">Admin-only fault injection</span>')}
<div class="hero" style="background:linear-gradient(110deg,#243158,#5144a3)"><div><h2>Learn TELA by breaking things safely.</h2><p>Onboard code, documentation and APIs into TELA. Inject controlled test issues, capture trace IDs, examine dependencies and evaluate Assist, Triage and Impact.</p></div><div class="hero-symbol">⌘</div></div>
<div class="lab-grid"><div class="panel"><div class="panel-head"><div><h3 class="panel-title">1 · Simulated incidents</h3><div class="panel-sub">Produces lab incidents and structured diagnostic evidence</div></div></div><div class="panel-body">
${[['resume_parser_error','OCR extraction fails','Examine parser module, document format and import path'],['search_500','Candidate Search HTTP 500','Inspect search API, SQL queries and trace ID'],['schema_drift','Database schema mismatch','Map table changes to search and matching modules'],['search_latency','Search response slows down','Evaluate indexing, queries and operational SLOs']].map(x=>`<div class="fault"><div><strong>${x[1]}</strong><p>${x[2]}</p></div><div class="actions"><button class="btn sm danger" data-inject="${x[0]}" ${state.user.role!=='admin'?'disabled':''}>Create incident</button><button class="btn sm" data-reproduce="${x[0]}" ${state.user.role!=='admin'?'disabled':''}>Reproduce HTTP</button></div></div>`).join('')}</div></div>
<div class="panel"><div class="panel-head"><div><h3 class="panel-title">2 · TELA evaluation checklist</h3><div class="panel-sub">Tests to perform within your actual TELA environment</div></div></div><div class="panel-body"><button class="btn soft mb" id="show-schema-form">✧ Preview schema-driven search form</button><div class="timeline">${[
['Knowledge','Ingest README, technical documentation, source code and schema.'],
['Assist','Ask which API and table are responsible for candidate search.'],
['Insight / Triage','Read lab incident and trace; validate evidence-backed analysis.'],
['Impact','Map failing API to backend modules and downstream HR screen.'],
['Agents','Request, approve and execute a restricted test resolution action.']
].map(x=>`<div class="timeline-item"><strong>${x[0]}</strong><p>${x[1]}</p></div>`).join('')}</div>
<div class="sugg" style="margin-top:15px">TELA integration is <strong>not automatically connected</strong>. Configure the secure tool endpoint and onboarding flow in <code>docs/TELA_INTEGRATION.md</code>. This page only prepares test evidence.</div></div></div></div>
<div class="panel mt"><div class="panel-head"><div><h3 class="panel-title">3 · Incident evidence</h3><div class="panel-sub">Synthetic events for investigation and impact analysis</div></div><button class="btn sm" id="reload-incidents">↻ Refresh</button></div>
<div class="overscroll"><table class="list-table"><thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Trace ID</th><th>Time</th></tr></thead><tbody>${incidents.items.map(i=>`<tr><td><strong>${E(i.title)}</strong><br><small>${E(i.kind)} · LAB INJECTED</small></td><td>${pill(i.severity)}</td><td>${pill(i.status)}</td><td><span class="trace">${E(i.trace_id)}</span></td><td>${E(i.created_at)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No incidents yet. Inject a test fault.</td></tr>'}</tbody></table></div></div>`}
async function openSchemaForm(){
 try{const schema=await api('/api/form-definitions/candidate-search');
 const fields=schema.fields.filter(f=>['skills','min_years','max_years','location'].includes(f.name));
 modal('Schema-driven Search Form',`<p class="help">Built at runtime from the server's validated CandidateSearch JSON schema. This form demonstrates the renderer TELA can eventually supply approved schemas to; it is not TELA-generated today.</p>
 <form id="schema-search" class="form-grid">${fields.map(f=>`<div class="field"><label>${E(f.label)}</label><input class="input" name="${E(f.name)}" type="${f.type==='number'?'number':'text'}" ${f.type==='number'?'min="0"':''} placeholder="${f.name==='skills'?'Java, Spring Boot':''}"/></div>`).join('')}
 <button type="submit" class="btn primary" style="grid-column:1/-1">⌕ Run candidate search</button></form><div id="schema-results" class="mt"></div>`)
 }catch(err){flash(err.message,true)}
}
function loginScreen(){root.innerHTML=`<div class="login-page"><div class="login-left"><div class="logo" style="padding:0"><div class="logo-mark">T</div><div><div class="logo-title">TalentIQ</div><div class="logo-sub">BY PRODIAN</div></div></div><div><h1>Better recruiting.<br>Brighter talent insights.</h1><p>One modern workspace for candidate sourcing, intelligent matching and recruitment delivery — ready to explore with TELA.</p><div class="login-art">◎</div></div><div style="color:#9eaad3;font-size:12px">© Prodian · Talent intelligence POC</div></div><div class="login-right"><div class="login-card"><span class="tag purple" style="margin-bottom:23px">LOCAL DEMONSTRATION</span><h2>Welcome back 👋</h2><p>Sign in to your TalentIQ workspace.</p><form id="login-form"><div class="field"><label>Demo username</label><select class="select" name="username"><option value="admin">admin — Administrator</option><option value="hr">hr — Recruiter</option><option value="lead">lead — Delivery Lead</option></select></div><div class="field"><label>Demo password</label><input class="input" name="password" type="password" required placeholder="Enter your local demo password"/></div><button class="btn primary" type="submit" style="margin-top:24px;width:100%">Sign In →</button></form><div class="login-note">Local-only POC credentials are described in README.md. Do not use these accounts for real candidate information; implement Entra ID or Keycloak SSO first.</div></div></div></div>`}
async function init(){try{state.user=await api('/api/auth/me');render()}catch{loginScreen()}}
document.addEventListener('click',async e=>{
 const navBtn=e.target.closest('[data-nav]');if(navBtn){state.page=navBtn.dataset.nav;render();return}
 if(e.target.closest('#signout')){try{await api('/api/auth/logout',{method:'POST'});state.user=null;loginScreen()}catch(e){flash(e.message,true)};return}
 if(e.target.closest('#refresh-btn')||e.target.closest('#reload-incidents')||e.target.closest('#refresh-imports')){render();return}
 if(e.target.closest('#add-candidate'))return addCandidate();
 const edit=e.target.closest('[data-edit-candidate]');if(edit)return editCandidate(+edit.dataset.editCandidate);
 if(e.target.closest('#show-schema-form'))return openSchemaForm();
 if(e.target.closest('#add-job'))return addJob();
 if(e.target.closest('#close-modal')||e.target.closest('#close-candidate')||e.target.id==='modal'){closeModal();return}
 const c=e.target.closest('[data-candidate]');if(c)return showCandidate(+c.dataset.candidate);
 const j=e.target.closest('[data-job]');if(j)return showJobMatches(+j.dataset.job);
 if(e.target.closest('#clear-search')){state.candidateSearch={q:'',skills:'',min_years:'',location:''};return render()}
 if(e.target.closest('#select-files')){$('#file-picker')?.click();return}
 if(e.target.closest('#select-folder')){$('#folder-picker')?.click();return}
 const reproduce=e.target.closest('[data-reproduce]');if(reproduce){
  if(!confirm('Execute an isolated lab HTTP test request? This does not break the recruitment API.'))return;
  const started=performance.now();
  try{const response=await fetch('/api/ops/lab/reproduce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:reproduce.dataset.reproduce})});
   const body=await response.json();flash(`Lab HTTP ${response.status} · ${Math.round(performance.now()-started)} ms · trace ${body.trace_id||response.headers.get('X-Request-ID')}` ,response.status>=400)}
  catch(err){flash(err.message,true)}return;
 }
 const inject=e.target.closest('[data-inject]');if(inject){if(!confirm(`Inject synthetic ${inject.dataset.inject} incident into the local test lab?`))return;try{const x=await post('/api/ops/inject',{kind:inject.dataset.inject});flash(`Lab incident #${x.id} created`);render()}catch(err){flash(err.message,true)};return}
 const stage=e.target.closest('[data-save-stage]');if(stage){try{const x=await api(`/api/candidates/${stage.dataset.saveStage}/stage`,{method:'PATCH',body:JSON.stringify({status:$('#candidate-stage').value})});closeModal();flash('Candidate status updated');render()}catch(err){flash(err.message,true)};return}
});
document.addEventListener('submit',async e=>{
 if(!['login-form','search-form','candidate-create','candidate-edit','job-create','schema-search'].includes(e.target.id))return;
 e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{
 if(e.target.id==='login-form'){state.user=await post('/api/auth/login',d);flash('Signed in to local demo');render()}
 else if(e.target.id==='search-form'){state.candidateSearch=d;render()}
 else if(e.target.id==='schema-search'){const qs=new URLSearchParams(d);const matches=await api('/api/candidates?'+qs);$('#schema-results').innerHTML='<strong>'+matches.total+' matches found</strong>'+matches.items.slice(0,8).map(c=>'<div class="between" style="border-bottom:1px solid #eee;padding:10px"><span>'+E(c.name)+' · '+E(c.years)+' yrs</span><strong>'+E(c.score)+'%</strong></div>').join('');}
 else if(e.target.id==='candidate-create'){d.years=Number(d.years||0);await post('/api/candidates',d);closeModal();flash('Candidate created');render()}
 else if(e.target.id==='candidate-edit'){d.years=Number(d.years||0);d.confirmed_against_resume=d.confirmed_against_resume==='on';await api(`/api/candidates/${e.target.dataset.id}`,{method:'PATCH',body:JSON.stringify(d)});closeModal();flash('Candidate details verified and saved');render()}
 else if(e.target.id==='job-create'){d.min_years=Number(d.min_years||0);d.max_years=d.max_years?Number(d.max_years):null;await post('/api/jobs',d);closeModal();flash('Job requirement created');render()}
 }catch(err){flash(err.message,true)}
});
document.addEventListener('change',e=>{if(e.target.id==='file-picker'||e.target.id==='folder-picker')processFiles(e.target.files)});
document.addEventListener('dragover',e=>{if(e.target.closest('#dropzone')){e.preventDefault();$('#dropzone')?.classList.add('drag')}});
document.addEventListener('dragleave',e=>{if(e.target.closest('#dropzone'))$('#dropzone')?.classList.remove('drag')});
document.addEventListener('drop',e=>{if(e.target.closest('#dropzone')){e.preventDefault();$('#dropzone')?.classList.remove('drag');processFiles(e.dataTransfer.files)}});
init();
