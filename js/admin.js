(() => {
 const $ = id => document.getElementById(id);
 const loginPanel=$('adminLoginPanel'), dashboard=$('adminDashboard'), loginForm=$('adminLoginForm'), message=$('adminLoginMessage');
 let client=null, allRows=[], visibleRows=[];
 const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function say(text,kind='info'){message.textContent=text;message.className='admin-message '+kind;}
 function getClient(){
  if(client)return client;
  if(!window.supabase?.createClient) throw new Error('No se pudo cargar la biblioteca de conexión. Verifica tu conexión a internet.');
  if(!window.C4_SUPABASE_URL || !window.C4_SUPABASE_ANON_KEY || window.C4_SUPABASE_ANON_KEY.includes('PEGA_AQUI')) throw new Error('Falta configurar la clave pública de Supabase en js/config.js. No uses una clave service_role.');
  client=window.supabase.createClient(window.C4_SUPABASE_URL,window.C4_SUPABASE_ANON_KEY);
  return client;
 }
 function adminMatch(rows,user){
  const email=(user.email||'').toLowerCase();
  return rows.some(row=>{
   const id=String(row.user_id ?? row.auth_user_id ?? row.uid ?? '');
   const rowEmail=String(row.email ?? row.user_email ?? '').toLowerCase();
   const active=row.is_active ?? row.active ?? row.enabled ?? true;
   return Boolean(active) && ((id && id===user.id) || (rowEmail && rowEmail===email));
  });
 }
 async function loadResults(){
  const db=getClient();
  const {data,error}=await db.from('c4_assessment_results').select('*').limit(5000);
  if(error) throw new Error('No fue posible consultar c4_assessment_results: '+error.message+'. Revisa las políticas RLS de lectura para administradores.');
  allRows=data||[]; renderRows();
  $('adminTotal').textContent=allRows.length;
  const personKeys=['operator_code','identification','document_number','participant_id','user_id','operator_id'];
  const people=new Set(allRows.map(r=>{const k=personKeys.find(x=>r[x]!==undefined && r[x]!==null);return k?String(r[k]):(r.operator_name||r.full_name||r.name||'');}).filter(Boolean));
  $('adminPeople').textContent=people.size||'—';
  const passed=allRows.filter(r=>{const v=String(r.status??r.result??r.outcome??'').toLowerCase();return r.passed===true || r.approved===true || ['approved','aprobado','aprobada','passed'].includes(v);}).length;
  $('adminPassed').textContent=passed;
  $('adminUpdated').textContent=new Date().toLocaleString('es-CO');
 }
 function moduleValue(row){const raw=String(row.module??row.module_id??row.assessment_type??row.evaluation??'').toLowerCase();if(raw.includes('final'))return 'final';if(raw.includes('m1')||raw.includes('modulo 1')||raw.includes('module 1'))return 'm1';if(raw.includes('m2')||raw.includes('modulo 2')||raw.includes('module 2'))return 'm2';return raw;}
 function isPassed(row){const v=String(row.status??row.result??row.outcome??'').toLowerCase();return row.passed===true||row.approved===true||['approved','aprobado','aprobada','passed'].includes(v);}
 function renderRows(){
  const q=$('adminSearch').value.trim().toLowerCase(), mod=$('adminModuleFilter').value, status=$('adminStatusFilter').value;
  visibleRows=allRows.filter(row=>{const hay=Object.values(row).join(' ').toLowerCase();return (!q||hay.includes(q))&&(!mod||moduleValue(row)===mod)&&(!status||(status==='approved'?isPassed(row):!isPassed(row)));});
  const keys=[...new Set(visibleRows.flatMap(r=>Object.keys(r)))];
  $('adminTableHead').innerHTML='<tr>'+keys.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr>';
  $('adminTableBody').innerHTML=visibleRows.length?visibleRows.map(row=>'<tr>'+keys.map(k=>'<td>'+esc(typeof row[k]==='object'?JSON.stringify(row[k]):row[k])+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="20">No hay registros que coincidan con los filtros.</td></tr>';
  $('adminRowCount').textContent=visibleRows.length+' de '+allRows.length+' registros';
 }
 async function enterAdmin(user){
  const db=getClient();
  const {data:admins,error}=await db.from('c4_admin_users').select('*').limit(1000);
  if(error) throw new Error('Autenticación correcta, pero no se pudo verificar el permiso en c4_admin_users: '+error.message+'. Revisa las políticas RLS.');
  if(!adminMatch(admins||[],user)) throw new Error('Tu cuenta inició sesión, pero no aparece como administradora activa en c4_admin_users. Solicita que el responsable te autorice.');
  loginPanel.hidden=true;dashboard.hidden=false;$('adminSessionLabel').textContent='Sesión activa: '+(user.email||'administrador');
  await loadResults();
 }
 loginForm.addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('adminLoginBtn');btn.disabled=true;btn.textContent='Verificando…';say('Validando credenciales y permisos…');
  try{const db=getClient();const {data,error}=await db.auth.signInWithPassword({email:$('adminEmail').value.trim(),password:$('adminPassword').value});if(error)throw error;await enterAdmin(data.user);}
  catch(err){say(err.message||'No fue posible iniciar sesión.','error');try{await client?.auth.signOut();}catch(_){}}
  finally{btn.disabled=false;btn.textContent='Ingresar';}
 });
 $('adminLogout').addEventListener('click',async()=>{await client?.auth.signOut();dashboard.hidden=true;loginPanel.hidden=false;allRows=[];say('Sesión cerrada.','info');});
 $('adminRefresh').addEventListener('click',async()=>{try{await loadResults();say('Registros actualizados.','success');}catch(e){say(e.message,'error');}});
 ['adminSearch','adminModuleFilter','adminStatusFilter'].forEach(id=>$(id).addEventListener(id==='adminSearch'?'input':'change',renderRows));
 function exportRows(format){if(!visibleRows.length){say('No hay registros para exportar con los filtros actuales.','error');return;}const date=new Date().toISOString().slice(0,10);if(format==='csv'){const keys=[...new Set(visibleRows.flatMap(r=>Object.keys(r)))];const csv=[keys,...visibleRows.map(r=>keys.map(k=>r[k]??''))].map(row=>row.map(v=>'"'+String(typeof v==='object'?JSON.stringify(v):v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='resultados_capacitacion_C4_'+date+'.csv';a.click();URL.revokeObjectURL(a.href);}else{if(!window.XLSX){say('No se pudo cargar el componente de Excel.','error');return;}const ws=XLSX.utils.json_to_sheet(visibleRows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Resultados');XLSX.writeFile(wb,'resultados_capacitacion_C4_'+date+'.xlsx');}}
 $('exportCsv').addEventListener('click',()=>exportRows('csv'));$('exportXlsx').addEventListener('click',()=>exportRows('xlsx'));
 // Reanudar una sesión válida si existe; de todos modos se vuelve a comprobar el rol administrativo.
 document.querySelector('[data-view="admin"]')?.addEventListener('click',async()=>{try{const db=getClient();const {data}=await db.auth.getSession();if(data.session?.user){await enterAdmin(data.session.user);}}catch(e){say(e.message,'error');}});
})();
