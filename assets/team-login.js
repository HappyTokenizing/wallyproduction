export async function teamRequest(body) {
  const response=await fetch('/api/fast-submit?session=1',{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'Could not verify team access. Please retry.');
  return data;
}
export function mountTeamLogin(root,onAuthenticated) {
  root.innerHTML='<div class="adm-gate"><h3>RWA Foundation console</h3><p>Sign in with your approved team email. One code unlocks Admin and Fast Submit for 30 days in this browser.</p><form data-email-form><div class="field"><label for="admEmail">Team email</label><input id="admEmail" type="email" autocomplete="email" required maxlength="254" placeholder="you@rwaf.xyz"></div><button class="btn btn-orange" type="submit" style="width:100%;margin:12px 0">Email me a code</button></form><form data-code-form hidden><div class="field"><label for="admCode">One-time code</label><input id="admCode" autocomplete="one-time-code" required maxlength="30" placeholder="Code from your email or admin"></div><button class="btn btn-orange" type="submit" style="width:100%;margin-top:12px">Sign in</button></form><button class="adm-btn" data-existing style="margin-top:12px">I already have an admin-issued code</button><p data-status role="status" aria-live="polite"></p></div>';
  const email=root.querySelector('#admEmail'),code=root.querySelector('#admCode'),codeForm=root.querySelector('[data-code-form]'),status=root.querySelector('[data-status]');
  let challenge=null,busy=false;
  try{const saved=JSON.parse(sessionStorage.getItem('rwaf-admin-challenge')||'null');if(saved&&Date.parse(saved.expires)>Date.now()){challenge=saved;email.value=saved.email;codeForm.hidden=false;}}catch{}
  function save(){try{if(challenge)sessionStorage.setItem('rwaf-admin-challenge',JSON.stringify(challenge));else sessionStorage.removeItem('rwaf-admin-challenge');}catch{}}
  async function run(message,work){if(busy)return;busy=true;status.textContent=message;root.querySelectorAll('button,input').forEach(x=>x.disabled=true);try{await work();}catch(e){status.textContent=e.message;}finally{busy=false;root.querySelectorAll('button,input').forEach(x=>x.disabled=false);if(!codeForm.hidden)code.focus();}}
  email.oninput=()=>{challenge=null;save();codeForm.hidden=true;code.value='';status.textContent='';};
  root.querySelector('[data-email-form]').onsubmit=e=>{e.preventDefault();const address=email.value.trim().toLowerCase();run('Sending your code…',async()=>{const result=await teamRequest({action:'request_code',email:address});challenge={id:result.challenge,email:address,expires:result.expires};save();codeForm.hidden=false;status.textContent='Code sent. Check your inbox and spam folder. It expires in 10 minutes.';});};
  root.querySelector('[data-existing]').onclick=()=>{if(!email.reportValidity())return;challenge=null;save();codeForm.hidden=false;code.focus();status.textContent='Enter the one-time code your admin gave you.';};
  codeForm.onsubmit=e=>{e.preventDefault();if(!email.reportValidity())return;run('Checking your code…',async()=>{await teamRequest({action:'redeem',email:email.value.trim().toLowerCase(),code:code.value,...(challenge?{challenge:challenge.id}:{})});challenge=null;save();status.textContent='Signed in.';onAuthenticated();});};
}
