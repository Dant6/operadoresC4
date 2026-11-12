(() => {
 const $=id=>document.getElementById(id);
 const loginPanel=$('adminLoginPanel'),dashboard=$('adminDashboard'),loginForm=$('adminLoginForm'),message=$('adminLoginMessage');
 let client=null,allRows=[],visibleRows=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function say(t,k='info'){message.textContent=t;message.className='admin-message '+k;}
 function getClient(){
  if(client)return client;
  if(!window.supabase?.createClient)throw new Error('No se pudo cargar Supabase. Verifica la conexión a internet.');
  if(!window.C4_SUPABASE_URL||!window.C4_SUPABASE_ANON_KEY||window.C4_SUPABASE_ANON_KEY.includes('PEGA_AQUI'))throw new Error('Falta configurar la clave pública de Supabase en js/config.js. No uses service_role.');
  client=window.supabase.createClient(window.C4_SUPABASE_URL,window.C4_SUPABASE_ANON_KEY);return client;
 }
 function moduleValue(r){const v=String(r.module_code||'').toLowerCase();if(v==='emotions'||v==='m1')return 'm1';if(v==='communication'||v==='m2')return 'm2';return v;}
 function isPassed(r){return Number(r.score)>=70;}
 function normalized(r){return {...r,participant_code:r.answers?.identification_code||'',module_label:moduleValue(r)==='m1'?'Módulo 1 · Emociones':moduleValue(r)==='m2'?'Módulo 2 · Comunicación':r.module_code,approval:isPassed(r)?'Aprobado':'No aprobado'};}
 async function loadResults(){
  const {data,error}=await getClient().from('c4_assessment_results').select('id,participant_name,participant_email,module_code,correct_answers,total_questions,score,answers,created_at').order('created_at',{ascending:false}).limit(5000);
  if(error)throw new Error('No fue posible consultar los resultados: '+error.message+'. Verifica las políticas RLS para administradores.');
  allRows=(data||[]).map(normalized);renderRows();
  $('adminTotal').textContent=allRows.length;
  $('adminPeople').textContent=new Set(allRows.map(r=>r.participant_email).filter(Boolean)).size;
  $('adminPassed').textContent=allRows.filter(isPassed).length;
  $('adminUpdated').textContent=new Date().toLocaleString('es-CO');
 }
 function renderRows(){
  const q=$('adminSearch').value.trim().toLowerCase(),mod=$('adminModuleFilter').value,status=$('adminStatusFilter').value;
  visibleRows=allRows.filter(r=>{const hay=[r.participant_name,r.participant_email,r.participant_code,r.module_label,r.score,r.approval].join(' ').toLowerCase();return(!q||hay.includes(q))&&(!mod||moduleValue(r)===mod)&&(!status||(status==='approved'?isPassed(r):!isPassed(r)));});
  const columns=[['participant_name','Participante'],['participant_code','Identificación / código'],['participant_email','Correo'],['module_label','Evaluación'],['correct_answers','Respuestas correctas'],['total_questions','Total preguntas'],['score','Puntaje (%)'],['approval','Estado'],['created_at','Fecha']];
  $('adminTableHead').innerHTML='<tr>'+columns.map(c=>'<th>'+c[1]+'</th>').join('')+'</tr>';
  $('adminTableBody').innerHTML=visibleRows.length?visibleRows.map(r=>'<tr>'+columns.map(c=>'<td>'+esc(c[0]==='created_at'&&r[c[0]]?new Date(r[c[0]]).toLocaleString('es-CO'):r[c[0]])+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="9">No hay registros que coincidan con los filtros.</td></tr>';
  $('adminRowCount').textContent=visibleRows.length+' de '+allRows.length+' registros';
 }
 async function enterAdmin(user){
  const {data,error}=await getClient().from('c4_admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error)throw new Error('No se pudo verificar el permiso administrativo: '+error.message+'. Revisa RLS en c4_admin_users.');
  if(!data)throw new Error('La cuenta inició sesión, pero no está autorizada en c4_admin_users.');
  loginPanel.hidden=true;dashboard.hidden=false;$('adminSessionLabel').textContent='Sesión activa: '+(user.email||'administrador');await loadResults();
 }
 loginForm.addEventListener('submit',async e=>{e.preventDefault();const btn=$('adminLoginBtn');btn.disabled=true;btn.textContent='Verificando…';say('Validando credenciales y permisos…');try{const {data,error}=await getClient().auth.signInWithPassword({email:$('adminEmail').value.trim(),password:$('adminPassword').value});if(error)throw error;await enterAdmin(data.user);}catch(err){say(err.message||'No fue posible iniciar sesión.','error');try{await client?.auth.signOut();}catch(_){}}finally{btn.disabled=false;btn.textContent='Ingresar';}});
 $('adminLogout').addEventListener('click',async()=>{await client?.auth.signOut();dashboard.hidden=true;loginPanel.hidden=false;allRows=[];say('Sesión cerrada.','info');});
 $('adminRefresh').addEventListener('click',async()=>{try{await loadResults();say('Registros actualizados.','success');}catch(e){say(e.message,'error');}});
 ['adminSearch','adminModuleFilter','adminStatusFilter'].forEach(id=>$(id).addEventListener(id==='adminSearch'?'input':'change',renderRows));
 function exportRows(format){if(!visibleRows.length){say('No hay registros para exportar con los filtros actuales.','error');return;}const rows=visibleRows.map(({id,answers,...r})=>({...r,respuestas:JSON.stringify(answers||{})}));const date=new Date().toISOString().slice(0,10);if(format==='csv'){const keys=Object.keys(rows[0]);const csv=[keys,...rows.map(r=>keys.map(k=>r[k]??''))].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='resultados_capacitacion_C4_'+date+'.csv';a.click();URL.revokeObjectURL(a.href);}else{if(!window.XLSX){say('No se pudo cargar el componente de Excel.','error');return;}const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Resultados');XLSX.writeFile(wb,'resultados_capacitacion_C4_'+date+'.xlsx');}}
 $('exportCsv').addEventListener('click',()=>exportRows('csv'));$('exportXlsx').addEventListener('click',()=>exportRows('xlsx'));
 document.querySelector('[data-view="admin"]')?.addEventListener('click',async()=>{try{const {data}=await getClient().auth.getSession();if(data.session?.user)await enterAdmin(data.session.user);}catch(e){say(e.message,'error');}});
})();
