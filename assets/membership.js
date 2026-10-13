import {membershipFields,membershipSections,fieldApplies,validateMembership} from './membership-model.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fieldHTML(field){
 const key=field.key,id='member-'+key,required=field.required?' <span aria-label="required">*</span>':'',hint=field.hint?`<p class="membership-hint" id="${id}-hint">${escape(field.hint)}</p>`:'';
 let input;
 if(field.type==='choices'||field.type==='yesno'){
  const choices=field.type==='yesno'?['Yes','No']:field.choices;
  input=`<fieldset><legend>${escape(field.label)}${required}</legend>${hint}<div class="membership-choices">${choices.map((value,i)=>`<label><input type="${field.multiple?'checkbox':'radio'}" name="${key}" value="${escape(value)}" aria-describedby="${id}-error"> <span>${escape(value)}</span></label>`).join('')}</div>${choices.includes('Other')?`<label class="membership-other" hidden>Describe your Other selection<input name="${key}Other" maxlength="500" aria-describedby="${id}-error"></label>`:''}</fieldset>`;
 }else{
  const attrs=`id="${id}" name="${key}" maxlength="${field.max}"${field.required?' required':''} aria-describedby="${id}-error${field.hint?' '+id+'-hint':''}"`;
  input=`<label for="${id}">${escape(field.label)}${required}</label>${hint}`+(field.type==='textarea'?`<textarea ${attrs} rows="4"></textarea>`:`<input ${attrs} type="${field.type}"${field.type==='url'?' placeholder="https://"':''}${['firstName','lastName','email','company'].includes(key)?' autocomplete="'+({firstName:'given-name',lastName:'family-name',email:'email',company:'organization'}[key])+'"':''}>`);
 }
 return `<div class="membership-field" data-member-field="${key}">${input}<p class="membership-error" id="${id}-error" aria-live="polite"></p></div>`;
}
export function mountMembership(mount){
 let step=0,busy=false;
 mount.innerHTML=`<form class="membership-form" novalidate><ol class="membership-steps" aria-label="Application steps">${membershipSections.map((name,i)=>`<li><span>${i+1}</span>${escape(name)}</li>`).join('')}</ol><p class="membership-progress" role="status"></p><p class="membership-required">* Required. Your responses stay private with the RWAF team.</p><div class="membership-trap" aria-hidden="true"><label>Leave empty<input name="websiteConfirm" tabindex="-1" autocomplete="off"></label></div>${membershipSections.map((name,i)=>`<section data-member-step="${i}"><h2 tabindex="-1">${escape(name)}</h2>${membershipFields.filter(field=>field.section===i).map(fieldHTML).join('')}</section>`).join('')}<p class="membership-status" role="status" aria-live="polite"></p><div class="membership-actions"><button type="button" class="btn btn-outline" data-member-back>Back</button><button type="submit" class="btn btn-orange" data-member-next>Continue <span aria-hidden="true">→</span></button></div><p class="membership-note">After submission, we’ll email a confirmation that we received your application. Our team will review it internally and reach back out with next steps.</p></form><div class="membership-success" tabindex="-1" hidden role="status"><span class="membership-kicker">APPLICATION RECEIVED</span><h2>Thank you for applying.</h2><p>Your membership application has been received. A confirmation email will be sent to the address you provided. The RWA Foundation team is reviewing your application internally and will reach back out with next steps.</p><a class="btn btn-orange" href="/members/">Back to our members <span aria-hidden="true">→</span></a></div>`;
 const form=mount.querySelector('form'),status=mount.querySelector('.membership-status');
 function values(){const data=new FormData(form),out=Object.fromEntries(data);for(const field of membershipFields.filter(f=>f.type==='choices'))out[field.key]=data.getAll(field.key);return out;}
 function showStep(focus=false){
  mount.querySelectorAll('[data-member-step]').forEach(el=>el.hidden=Number(el.dataset.memberStep)!==step);
  mount.querySelectorAll('.membership-steps li').forEach((el,i)=>{el.classList.toggle('active',i===step);if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  mount.querySelector('.membership-progress').textContent=`Step ${step+1} of ${membershipSections.length} · ${membershipSections[step]}`;
  mount.querySelector('[data-member-back]').hidden=step===0;
  mount.querySelector('[data-member-next]').textContent=step===membershipSections.length-1?'Submit application':'Continue →';
  syncFields();if(focus)mount.querySelector(`[data-member-step="${step}"] h2`).focus();
 }
 function syncFields(){const answers=values();for(const field of membershipFields){const el=mount.querySelector(`[data-member-field="${field.key}"]`),show=fieldApplies(field,answers);el.hidden=!show;el.querySelectorAll('input,textarea').forEach(input=>input.disabled=!show||busy);const other=el.querySelector('.membership-other');if(other){other.hidden=!(answers[field.key]||[]).includes('Other');other.querySelector('input').disabled=!show||other.hidden||busy;}}}
 function markErrors(errors){for(const field of membershipFields){const el=mount.querySelector(`[data-member-field="${field.key}"]`),error=errors[field.key]||'';el.querySelector('.membership-error').textContent=error;el.querySelectorAll('input,textarea').forEach(input=>input.setAttribute('aria-invalid',error?'true':'false'));}}
 form.addEventListener('change',()=>{if(!busy)syncFields();});
 mount.querySelector('[data-member-back]').addEventListener('click',()=>{if(busy)return;step--;status.textContent='';showStep(true);});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const application=values(),validation=validateMembership(application),errors=validation.errors||{};
  const currentErrors=Object.fromEntries(Object.entries(errors).filter(([key])=>membershipFields.find(f=>f.key===key)?.section===step));markErrors(currentErrors);
  if(Object.keys(currentErrors).length){status.textContent='Please check the highlighted fields.';mount.querySelector('[aria-invalid="true"]')?.focus();return;}
  if(step<membershipSections.length-1){step++;status.textContent='';showStep(true);return;}
  if(validation.error){step=membershipFields.find(f=>errors[f.key]).section;showStep();markErrors(errors);status.textContent=validation.error;mount.querySelector('[aria-invalid="true"]')?.focus();return;}
  busy=true;form.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=true);status.textContent='Submitting your application…';
  try{const response=await fetch('/api/membership',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',application}),signal:AbortSignal.timeout(20000)});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'The server did not confirm receipt. Keep this page open and retry.');form.hidden=true;const success=mount.querySelector('.membership-success');success.hidden=false;success.focus();}
  catch(error){status.textContent=error.name==='TimeoutError'?'The request timed out. Your answers are still here. Please retry.':error.message;}
  finally{busy=false;form.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=false);syncFields();}
 });
 showStep();
}
const mount=document.querySelector('#membershipMount');if(mount)mountMembership(mount);
