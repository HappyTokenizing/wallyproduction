import {cronAuthorized,flushSubmissionEmails} from '../lib/submission-emails.js';
export function createEmailCron({env=process.env,flush=flushSubmissionEmails}={}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'GET only'});
  if(!cronAuthorized(req,env))return res.status(401).json({error:'Unauthorized'});
  try{const result=await flush({env,limit:4});return res.status(result.configurationRequired?503:200).json(result);}
  catch{console.error('Submission email processing failed');return res.status(503).json({error:'Email processing unavailable.'});}
 };
}
export default createEmailCron();
