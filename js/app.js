const views=[...document.querySelectorAll('.view')], nav=[...document.querySelectorAll('.nav')];
function show(id){views.forEach(v=>v.classList.toggle('active',v.id===id));nav.forEach(n=>n.classList.toggle('active',n.dataset.view===id));document.body.classList.remove('aside-open');window.scrollTo({top:0,behavior:'smooth'});if(id==='m1'||id==='m2') localStorage.setItem('c4_last_module',id);}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
nav.forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
document.getElementById('menuBtn').addEventListener('click',()=>document.body.classList.toggle('aside-open'));
document.querySelectorAll('.check').forEach(btn=>btn.addEventListener('click',()=>{const q=btn.closest('.quiz'),selected=q.querySelector('input:checked'),feedback=q.querySelector('.feedback');if(!selected){feedback.textContent='Selecciona una respuesta para continuar.';feedback.style.color='#b7791f';return;}const correct=selected.value===btn.dataset.answer;feedback.textContent=correct?'✓ ¡Correcto! '+(btn.dataset.module==='m1'?'Gestionar es reconocer y elegir una respuesta consciente.':'Clarificar permite comprender el significado antes de asumir.'):'✕ Revisa el contenido del módulo e inténtalo nuevamente.';feedback.style.color=correct?'#148d80':'#b64a4a';if(correct){localStorage.setItem('c4_'+btn.dataset.module+'_practice','done');updateProgress();}}));
function updateProgress(){const count=['m1','m2'].filter(m=>localStorage.getItem('c4_'+m+'_practice')==='done').length;document.getElementById('progressLabel').textContent=count+' de 2 prácticas completadas';}
updateProgress();
// Cada módulo presenta sus temáticas como apartados seleccionables.
document.querySelectorAll('.view[id^="m"] .lesson-list').forEach((list)=>{
  const section=list.closest('.view');
  const filter=section.querySelector('.topic-filter');
  const lessons=[...list.querySelectorAll('.lesson')];
  if(!filter || !lessons.length) return;
  list.classList.add('topic-mode');
  const count=document.createElement('p'); count.className='topic-count'; count.setAttribute('aria-live','polite');
  filter.after(count);
  function selectTopic(index){
    lessons.forEach((lesson,i)=>lesson.classList.toggle('topic-active',i===index));
    [...filter.querySelectorAll('button')].forEach((button,i)=>{button.classList.toggle('active',i===index);button.setAttribute('aria-pressed',i===index?'true':'false');});
    count.textContent=`Temática ${index+1} de ${lessons.length}`;
  }
  lessons.forEach((lesson,index)=>{
    const title=lesson.querySelector('h3')?.textContent?.trim() || `Temática ${index+1}`;
    const button=document.createElement('button');button.type='button';button.textContent=`${String(index+1).padStart(2,'0')} · ${title}`;
    button.addEventListener('click',()=>selectTopic(index));filter.appendChild(button);
  });
  selectTopic(0);
});

// Registro local del participante y evaluaciones de 10 preguntas por módulo.
const profileName=document.getElementById('operatorName');
const profileCode=document.getElementById('operatorCode');
const profileStatus=document.getElementById('profileStatus');
const savedProfile=JSON.parse(localStorage.getItem('c4_profile')||'{}');
if(profileName) profileName.value=savedProfile.name||'';
if(profileCode) profileCode.value=savedProfile.code||'';
if(profileStatus && savedProfile.name) profileStatus.textContent='Participante registrado en este navegador: '+savedProfile.name;
document.getElementById('saveProfile')?.addEventListener('click',()=>{
  const name=profileName.value.trim(), code=profileCode.value.trim();
  if(!name||!code){profileStatus.textContent='Completa el nombre y la identificación o código para continuar.';profileStatus.style.color='#b64a4a';return;}
  localStorage.setItem('c4_profile',JSON.stringify({name,code}));
  profileStatus.textContent='Datos guardados en este navegador. Puedes continuar con los módulos.';
  profileStatus.style.color='#148d80';
});
const exams={
 m1:[
 ['¿Cuál es la función general de las emociones?',['Impedir que actuemos','Ayudarnos a interpretar situaciones y prepararnos para responder','Demostrar debilidad'],1],
 ['¿Cuál conjunto corresponde a las emociones básicas del material?',['Ira, tristeza, alegría, sorpresa, asco y miedo','Culpa, orgullo, celos, alivio, vergüenza y frustración','Ansiedad, calma, orgullo, culpa, alivio y sorpresa'],0],
 ['¿Qué significa reconocer una emoción?',['Eliminarla rápidamente','Identificar qué emoción aparece y cómo se manifiesta','Explicar la conducta de otra persona'],1],
 ['¿Qué señales pueden ayudar a reconocer una emoción?',['Solo las palabras','Sensaciones corporales, pensamientos, tono de voz y comportamiento','Únicamente la expresión facial'],1],
 ['En el modelo R.E.G., ¿qué significa la letra R?',['Responder','Regular','Reconocer'],2],
 ['¿Qué busca la etapa Explorar?',['Profundizar en la situación, pensamientos, reacciones y necesidades','Evitar pensar en lo ocurrido','Clasificar al ciudadano'],0],
 ['¿Cuál pregunta corresponde a la exploración emocional?',['¿Qué necesito?','¿Quién tiene la culpa?','¿Cómo hago para que no sienta nada?'],0],
 ['Gestionar una emoción significa:',['Reprimirla','Reconocerla y elegir una respuesta consciente','Ignorarla hasta que desaparezca'],1],
 ['¿Cuál es una herramienta de gestión mencionada en el material?',['Respiración diafragmática','Interrumpir la llamada','Acelerar el habla'],0],
 ['¿Qué debe recordar el operador ante la emoción de un ciudadano?',['Debe asumir la causa de la emoción','Debe diagnosticar al ciudadano','Puede reconocer señales sin asumir ni diagnosticar'],2]
 ],
 m2:[
 ['¿Qué es la comunicación interpersonal?',['Intercambio de información, pensamientos y emociones','Hablar sin escuchar','Transmitir instrucciones únicamente'],0],
 ['¿Por qué es importante escuchar activamente en una llamada?',['Para terminar más rápido','Para comprender el reporte e identificar información relevante','Para evitar hacer preguntas'],1],
 ['¿Cuál es la primera etapa de escucha descrita?',['Analizar','Responder','Recepcionar'],2],
 ['¿Qué implica comprender?',['Interpretar sin juzgar ni asumir información no entregada','Completar los datos con suposiciones','Interrumpir para corregir'],0],
 ['¿Qué significa recordar dentro de la escucha?',['Repetir toda la llamada','Identificar los datos importantes del relato','Memorizar palabras irrelevantes'],1],
 ['¿Qué se realiza al analizar la información?',['Clasificarla objetivamente','Cambiar el relato','Dar por hecho lo que no se dijo'],0],
 ['Una persona utiliza una palabra ambigua. ¿Qué conviene hacer?',['Adivinar el significado','Ignorarla','Preguntar para clarificar qué quiere decir'],2],
 ['¿Qué caracteriza un lenguaje claro?',['Mensajes concisos que evitan ambigüedades','Expresiones vagas','Uso de tecnicismos innecesarios'],0],
 ['¿Qué significa ser específico al preguntar?',['Hacer preguntas generales','Solicitar información concreta y pertinente','Hacer varias preguntas a la vez sin orden'],1],
 ['¿Qué es congruencia en el lenguaje verbal?',['Hablar siempre fuerte','Usar palabras técnicas','Mantener coherencia entre contenido, tono, volumen y velocidad'],2]
 ]
};
function renderExam(moduleId){
 const root=document.getElementById('assessment-'+moduleId); if(!root)return;
 const questions=exams[moduleId];
 root.innerHTML='<div class="eyebrow">EVALUACIÓN DEL MÓDULO</div><h2>Comprueba tus aprendizajes</h2><p>Responde las 10 preguntas. Se requiere un resultado mínimo del 70 % para registrar la aprobación.</p>';
 const form=document.createElement('form');form.className='exam-form';
 questions.forEach((q,i)=>{
   const field=document.createElement('fieldset');field.className='exam-question';
   const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+q[0];field.appendChild(legend);
   q[1].forEach((option,j)=>{const label=document.createElement('label');label.className='exam-option';label.innerHTML='<input type="radio" name="'+moduleId+'_'+i+'" value="'+j+'"> <span></span>';label.querySelector('span').textContent=option;field.appendChild(label);});
   form.appendChild(field);
 });
 const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='Calificar evaluación';
 const feedback=document.createElement('div');feedback.className='exam-result';feedback.setAttribute('aria-live','polite');
 form.append(submit,feedback);form.addEventListener('submit',e=>{
   e.preventDefault();let score=0,answered=0;
   questions.forEach((q,i)=>{const selected=form.querySelector('input[name="'+moduleId+'_'+i+'"]:checked');if(selected){answered++;if(Number(selected.value)===q[2])score++;}});
   if(answered!==questions.length){feedback.textContent='Responde las 10 preguntas antes de calificar. Llevas '+answered+'/10.';feedback.className='exam-result warning';return;}
   const percent=Math.round(score/questions.length*100),passed=percent>=70;
   const result={score,percent,passed,date:new Date().toISOString()};
   localStorage.setItem('c4_exam_'+moduleId,JSON.stringify(result));
   feedback.className='exam-result '+(passed?'success':'warning');
   feedback.innerHTML='<strong>Resultado: '+score+'/10 ('+percent+' %)</strong><p>'+(passed?'¡Módulo aprobado! Ya puedes continuar.':'Aún no alcanzas el 70 %. Repasa las temáticas y vuelve a intentarlo.')+'</p>';
   updateFinalAvailability();
 });
 root.appendChild(form);
 const previous=JSON.parse(localStorage.getItem('c4_exam_'+moduleId)||'null');
 if(previous){const note=document.createElement('p');note.className='small-note';note.textContent='Último intento guardado: '+previous.percent+' % · '+(previous.passed?'Aprobado':'No aprobado');root.appendChild(note);}
}
renderExam('m1');renderExam('m2');
function updateFinalAvailability(){
 const a=JSON.parse(localStorage.getItem('c4_exam_m1')||'null'),b=JSON.parse(localStorage.getItem('c4_exam_m2')||'null');
 const btn=document.getElementById('startFinal');
 if(btn)btn.disabled=!(a?.passed&&b?.passed);
 const label=document.getElementById('progressLabel');
 if(label)label.textContent=(a?.passed?1:0)+(b?.passed?1:0)+' de 2 módulos aprobados';
}
updateFinalAvailability();
const finalQuestions=[
 ['Ante una llamada con una persona angustiada, ¿qué combinación es más adecuada?',['Escuchar, clarificar y mantener una comunicación respetuosa','Interrumpir y apresurar el relato','Suponer la información faltante'],0],
 ['¿Qué propone el modelo R.E.G.?',['Recepcionar, explicar y gestionar','Reconocer, explorar y gestionar','Repetir, escuchar y guardar'],1],
 ['Reconocer una emoción implica:',['Identificarla y observar cómo se manifiesta','Juzgar si es correcta','Eliminarla'],0],
 ['Explorar una emoción considera:',['Solo la conducta','Situación, pensamientos, reacciones y necesidades','Únicamente el tono de voz'],1],
 ['Gestionar una emoción busca:',['Reprimirla','Responder impulsivamente','Elegir una respuesta consciente'],2],
 ['¿Cuál es la secuencia de escucha del material?',['Recepcionar, comprender, recordar, analizar y responder','Hablar, clasificar, interrumpir, cerrar y transferir','Recordar, responder, suponer, corregir y finalizar'],0],
 ['¿Qué hacer ante una expresión ambigua?',['Interpretar según la experiencia propia','Solicitar una aclaración concreta','Cambiar de tema'],1],
 ['La especificidad del lenguaje consiste en:',['Hablar más rápido','Usar frases largas','Solicitar información precisa'],2],
 ['La congruencia comunicativa relaciona:',['Palabras, tono, volumen y velocidad','Solo el volumen','Únicamente la gramática'],0],
 ['¿Qué orienta la clasificación y gestión del incidente?',['Opiniones personales','Información recopilada y protocolos institucionales','Suposiciones sobre el ciudadano'],1]
];
document.getElementById('startFinal')?.addEventListener('click',()=>{
 const root=document.getElementById('finalAssessment');root.innerHTML='<h3>Evaluación final integradora</h3><p>Responde las 10 preguntas. Aprobación: 70 % o más.</p>';
 const form=document.createElement('form');form.className='exam-form';
 finalQuestions.forEach((q,i)=>{const field=document.createElement('fieldset');field.className='exam-question';const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+q[0];field.appendChild(legend);q[1].forEach((o,j)=>{const l=document.createElement('label');l.className='exam-option';l.innerHTML='<input type="radio" name="final_'+i+'" value="'+j+'"><span></span>';l.querySelector('span').textContent=o;field.appendChild(l);});form.appendChild(field);});
 const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='Calificar evaluación final';const result=document.createElement('div');result.className='exam-result';form.append(submit,result);
 form.addEventListener('submit',e=>{e.preventDefault();let score=0,answered=0;finalQuestions.forEach((q,i)=>{const v=form.querySelector('input[name="final_'+i+'"]:checked');if(v){answered++;if(Number(v.value)===q[2])score++;}});if(answered!==10){result.textContent='Responde las 10 preguntas. Llevas '+answered+'/10.';result.className='exam-result warning';return;}const percent=Math.round(score/10*100),passed=percent>=70;const data={score,percent,passed,date:new Date().toISOString()};localStorage.setItem('c4_final_exam',JSON.stringify(data));result.className='exam-result '+(passed?'success':'warning');result.innerHTML='<strong>Resultado final: '+score+'/10 ('+percent+' %)</strong><p>'+(passed?'¡Felicitaciones! Aprobaste la capacitación.':'No alcanzaste el 70 %. Puedes repasar y volver a presentar la evaluación.')+'</p>';if(passed)renderCertificate(data);});
 root.appendChild(form);root.scrollIntoView({behavior:'smooth',block:'start'});
});
function renderCertificate(data){
 const profile=JSON.parse(localStorage.getItem('c4_profile')||'{}'),area=document.getElementById('certificateArea');
 area.innerHTML='<div class="certificate"><div class="eyebrow">CONSTANCIA DE RESULTADO · C4</div><h2>Capacitación psicosocial</h2><p>Se deja constancia de que</p><h3></h3><p>identificado(a) con código o documento <strong class="code"></strong>, aprobó la evaluación final de familiarización psicosocial para operadores de la Línea de Emergencias 123.</p><div class="certificate-score">Resultado: '+data.percent+' %</div><small>Fecha: '+new Date(data.date).toLocaleDateString('es-CO')+'</small><p class="disclaimer">Constancia generada localmente para fines de práctica. No constituye certificado institucional validado.</p><button class="primary" onclick="window.print()">Imprimir / Guardar como PDF</button></div>';
 area.querySelector('h3').textContent=profile.name||'Participante';area.querySelector('.code').textContent=profile.code||'No registrado';
}
const priorFinal=JSON.parse(localStorage.getItem('c4_final_exam')||'null');if(priorFinal?.passed)renderCertificate(priorFinal);
