// Keep this allowlist server-side. Every code and session is tied to one address.
export const teamEmails = new Set(['dev@rwaf.xyz','happy@rwaf.xyz','zeus@rwaf.xyz','flynn@rwaf.xyz','ray@wallydao.xyz','ray@rwaf.xyz']);
export const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const allowedEmail = value => teamEmails.has(normalizeEmail(value));

export async function sendAccessCode({email,code,id},{env=process.env,fetchImpl=fetch}={}) {
  if(!allowedEmail(email)||!env.RESEND_API_KEY||!env.EMAIL_FROM||env.SITE_PUBLIC_API_ORIGIN)throw Error('Email sign-in is not configured');
  const response=await fetchImpl('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`rwaf-fast-access/${id}`},
    body:JSON.stringify({from:env.EMAIL_FROM,to:[normalizeEmail(email)],subject:'Your RWAF fast-submit code',text:`Your one-time RWAF fast-submit code is:\n\n${code}\n\nEnter it at https://www.rwaf.xyz/fast-submit/ using this email address. It expires in 10 minutes and remembers this browser for 30 days.\n\nIf you did not request this code, you can ignore this email.`}),
    signal:AbortSignal.timeout(10000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.id)throw Error('Email provider did not confirm acceptance');
}
