import {STATE_PATH,SESSION_COOKIE,digest} from '../lib/fast-submit-store.js';
export const testToken='a'.repeat(32);
export const testCookie=`${SESSION_COOKIE}=${testToken}`;
export const accessState=()=>({version:1,codes:[],sessions:[{id:digest(testToken),email:'happy@rwaf.xyz',expires:Date.now()+365*86400000,requests:[]}],lock:null});
export function withTeamSession(storage){return {...storage,async get(path,options){return path===STATE_PATH?{stream:new Response(JSON.stringify(accessState())).body,blob:{etag:'auth-1'}}:storage.get(path,options);}};}
