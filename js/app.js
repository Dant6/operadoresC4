
const $ = s => document.querySelector(s);
const pages = [...document.querySelectorAll('.page')];
function showPage(id){
  pages.forEach(p=>p.classList.toggle('active-page',p.id===id));
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
  history.replaceState(null,'','#'+id);
  $('#sidebar')?.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showPage(a.getAttribute('href').slice(1));}));
$('#menuToggle')?.addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
const moduleNames={emotions:'Habilidades emocionales',communication:'Habilidades comunicativas'};
const questionContainers={emotions:'#quizEmotion',communication:'#quizCommunication'};
const supabaseReady=()=>window.supabase && window.C4_SUPABASE_URL && window.C4_SUPABASE_ANON_KEY &&
 !window.C4_SUPABASE_URL.includes('PEGA_AQUI') && !window.C4_SUPABASE_ANON_KEY.includes('PEGA_AQUI');
let sb=null;
if(supabaseReady()) sb=window.supabase.createClient(window.C4_SUPABASE_URL,window.C4_SUPABASE_ANON_KEY);

function renderQuiz(module){
 const host=$(questionContainers[module]), qs=window.C4_QUESTIONS[module];
 host.innerHTML='';
 const form=document.createElement('form'); form.id='form-'+module;
 form.innerHTML=`<p>Responde las 10 preguntas. Cada pregunta tiene una única respuesta correcta. Al finalizar verás tu resultado.</p>
 <div class="participant-fields"><label>Nombre completo<input required name="participant_name" minlength="2" maxlength="120" autocomplete="name"></label><label>Correo electrónico<input required name="participant_email" type="email" maxlength="254" autocomplete="email"></label></div>
 <div class="quiz-progress"><span id="progress-${module}" style="width:0%"></span></div><p id="count-${module}" class="status">0 de 10 preguntas respondidas</p>`;
 qs.forEach((q,i)=>{
   const field=document.createElement('fieldset'); field.className='question'; field.style.border='0'; field.style.padding='18px 0'; field.innerHTML=`<h3>${i+1}. ${q[0]}</h3>`;
   q[1].forEach((opt,j)=>{
     const lab=document.createElement('label');lab.className='option';
     lab.innerHTML=`<input type="radio" name="q${i}" value="${j}" required><span>${String.fromCharCode(65+j)}. ${opt}</span>`;
     field.appendChild(lab);
   });
   form.appendChild(field);
 });
 const submit=document.createElement('button');submit.className='btn primary';submit.type='submit';submit.textContent='Finalizar y calcular nota';
 form.appendChild(submit);
 const feedback=document.createElement('div');feedback.id='feedback-'+module;feedback.className='status';form.appendChild(feedback);
 host.appendChild(form);
 form.addEventListener('change',()=>{
   const n=qs.filter((_,i)=>form.querySelector(`input[name="q${i}"]:checked`)).length;
   $(`#progress-${module}`).style.width=(n*10)+'%';$(`#count-${module}`).textContent=`${n} de 10 preguntas respondidas`;
 });
 form.addEventListener('submit',async e=>{
   e.preventDefault();
   const data=new FormData(form), name=String(data.get('participant_name')).trim(), email=String(data.get('participant_email')).trim();
   const answers={}; let correct=0;
   qs.forEach((q,i)=>{const v=Number(data.get('q'+i));answers['q'+(i+1)]=v;if(v===q[2])correct++;});
   const score=Number((correct*0.5).toFixed(1));
   const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Guardando resultado…';
   let saveMsg='';
   if(sb){
     const {error}=await sb.from('c4_assessment_results').insert({
       participant_name:name,participant_email:email,module_code:module,
       correct_answers:correct,total_questions:10,score,answers
     });
     if(error){saveMsg='No fue posible guardar el resultado en la base de datos: '+error.message;btn.disabled=false;btn.textContent='Reintentar guardar';}
     else {saveMsg='Resultado guardado correctamente en el registro central.';}
   } else {
     saveMsg='La conexión con Supabase aún no está configurada. La nota se calculó, pero no se guardó centralmente.';
     btn.disabled=false;btn.textContent='Volver a intentar después de configurar';
   }
   const review=qs.map((q,i)=>`<p><b>${i+1}. ${answers['q'+(i+1)]===q[2]?'Correcta':'Revisar'}:</b> ${q[3]}</p>`).join('');
   const result=document.createElement('section');result.className='result-box';
   result.innerHTML=`<div class="eyebrow">RESULTADO DE LA EVALUACIÓN</div><div class="result-score">${score.toFixed(1)} / 5.0</div><b>${correct} de 10 respuestas correctas · ${correct*10}%</b><p>${saveMsg}</p><h3>Retroalimentación</h3>${review}<button class="btn secondary" onclick="location.hash='assessments';location.reload()">Volver a evaluaciones</button>`;
   form.replaceWith(result);
 });
}
renderQuiz('emotions');renderQuiz('communication');

async function isAdmin(){
 if(!sb)return false;
 const {data:{user}}=await sb.auth.getUser();
 if(!user)return false;
 const {data,error}=await sb.from('c4_admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 return !error && !!data;
}
async function loadResults(){
 const msg=$('#resultsMessage');msg.textContent='Consultando resultados…';
 const {data,error}=await sb.from('c4_assessment_results').select('*').order('created_at',{ascending:false});
 if(error){msg.textContent='No se pudieron consultar los resultados: '+error.message;return;}
 const rows=data||[];
 const avg=rows.length? (rows.reduce((a,r)=>a+Number(r.score),0)/rows.length).toFixed(2):'—';
 $('#resultsSummary').innerHTML=`<div class="summary-item"><small>Evaluaciones registradas</small><strong>${rows.length}</strong></div><div class="summary-item"><small>Participantes únicos (correo)</small><strong>${new Set(rows.map(r=>r.participant_email.toLowerCase())).size}</strong></div><div class="summary-item"><small>Promedio general</small><strong>${avg}</strong></div>`;
 $('#resultsTable tbody').innerHTML=rows.map(r=>`<tr><td>${escapeHtml(r.participant_name)}</td><td>${escapeHtml(r.participant_email)}</td><td>${moduleNames[r.module_code]||r.module_code}</td><td>${r.correct_answers}/10</td><td>${Number(r.score).toFixed(1)}</td><td>${new Date(r.created_at).toLocaleString('es-CO')}</td></tr>`).join('');
 msg.textContent=rows.length?'Resultados cargados.':'Aún no hay evaluaciones registradas.';
 window.C4_RESULTS=rows;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('#adminLoginBtn')?.addEventListener('click',async()=>{
 const msg=$('#adminMessage');msg.textContent='';
 if(!sb){msg.textContent='Primero configura la URL y la clave anon/public de Supabase en js/supabase-config.js.';return;}
 const email=$('#adminEmail').value.trim(),password=$('#adminPassword').value;
 const {error}=await sb.auth.signInWithPassword({email,password});
 if(error){msg.textContent='No se pudo iniciar sesión: '+error.message;return;}
 if(!(await isAdmin())){await sb.auth.signOut();msg.textContent='Esta cuenta no tiene permisos de administración.';return;}
 $('#adminLogin').hidden=true;$('#adminDashboard').hidden=false;await loadResults();
});
$('#refreshResults')?.addEventListener('click',loadResults);
$('#logoutAdmin')?.addEventListener('click',async()=>{await sb?.auth.signOut();$('#adminDashboard').hidden=true;$('#adminLogin').hidden=false;});
$('#exportResults')?.addEventListener('click',()=>{
 const rows=window.C4_RESULTS||[];if(!rows.length)return;
 const cols=['participant_name','participant_email','module_code','correct_answers','score','created_at'];
 const csv=[cols.join(','),...rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='resultados_capacitacion_C4.csv';a.click();URL.revokeObjectURL(url);
});
