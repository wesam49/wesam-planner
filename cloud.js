import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.includes('HIER_EINTRAGEN');
const statusEl=()=>document.getElementById('cloudStatus');
const badgeEl=()=>document.getElementById('cloudSyncBadge');
const firstRow=()=>document.getElementById('cloudFirstSyncRow');
let auth,db,user,unsubscribe=null,uploadTimer=null,remoteApplying=false,initialChoiceDone=false,lastRemoteUpdatedAt=0;

function setStatus(text,badge){ if(statusEl()) statusEl().textContent=text; if(badgeEl()&&badge) badgeEl().textContent=badge; }
function cloudDoc(){ return user ? doc(db,'users',user.uid,'planner','main') : null; }
function validState(s){ return s && Array.isArray(s.events) && Array.isArray(s.finance) && Array.isArray(s.goals); }
function updateUserUI(){
  const title=document.getElementById('cloudUserTitle'),signIn=document.getElementById('cloudSignInBtn'),signOutBtn=document.getElementById('cloudSignOutBtn');
  if(!configured){ if(title)title.textContent='Firebase noch nicht eingerichtet'; if(signIn)signIn.disabled=true; setStatus('Trage zuerst deine Firebase-Konfiguration in firebase-config.js ein.','Setup'); return; }
  if(user){ if(title)title.textContent=user.displayName||user.email||'Angemeldet'; if(signIn)signIn.style.display='none'; if(signOutBtn)signOutBtn.style.display='inline-block'; }
  else { if(title)title.textContent='Nicht angemeldet'; if(signIn)signIn.style.display='inline-block'; if(signOutBtn)signOutBtn.style.display='none'; if(firstRow())firstRow().style.display='none'; setStatus('Lokale Daten bleiben auf diesem Gerät gespeichert.','Aus'); }
}
async function inspectCloud(){
  const snap=await getDoc(cloudDoc());
  if(!snap.exists()){ firstRow().style.display='flex'; setStatus('Cloud ist leer. Lade deine aktuellen lokalen Daten hoch.','Auswahl'); return; }
  const data=snap.data();
  const chosen=localStorage.getItem(`wesamCloudChosen:${user.uid}`)==='1';
  if(!chosen){ firstRow().style.display='flex'; setStatus('Cloud-Daten gefunden. Wähle einmalig Cloud oder lokale Daten.','Auswahl'); return; }
  initialChoiceDone=true; firstRow().style.display='none'; startLiveSync(); setStatus('Synchronisierung aktiv.','Aktiv');
}
async function uploadLocal(force=false){
  if(!user||!window.wesamPlanner) return;
  if(!force&&!initialChoiceDone) return;
  const state=window.wesamPlanner.getState();
  await setDoc(cloudDoc(),{state,appVersion:'16.1',schemaVersion:4,updatedAt:serverTimestamp(),updatedAtClient:Date.now()},{merge:true});
  setStatus('Änderungen wurden synchronisiert.','Aktiv');
}
async function downloadCloud(){
  const snap=await getDoc(cloudDoc());
  if(!snap.exists()||!validState(snap.data().state)) return alert('Keine gültigen Cloud-Daten gefunden.');
  remoteApplying=true; window.wesamPlanner.replaceState(snap.data().state,{fromCloud:true}); remoteApplying=false;
  completeChoice();
}
function completeChoice(){ localStorage.setItem(`wesamCloudChosen:${user.uid}`,'1'); initialChoiceDone=true; firstRow().style.display='none'; startLiveSync(); setStatus('Synchronisierung aktiv.','Aktiv'); }
function startLiveSync(){
  unsubscribe?.();
  unsubscribe=onSnapshot(cloudDoc(),snap=>{
    if(!snap.exists()||!initialChoiceDone||remoteApplying) return;
    const d=snap.data(),clientStamp=Number(d.updatedAtClient||0);
    if(!validState(d.state)||clientStamp<=lastRemoteUpdatedAt) return;
    lastRemoteUpdatedAt=clientStamp; remoteApplying=true; window.wesamPlanner.replaceState(d.state,{fromCloud:true}); remoteApplying=false; setStatus('Cloud-Änderung übernommen.','Aktiv');
  },err=>setStatus(`Synchronisierungsfehler: ${err.message}`,'Fehler'));
}
window.wesamCloud={
  scheduleUpload(state){ if(!user||!initialChoiceDone||remoteApplying)return; clearTimeout(uploadTimer); uploadTimer=setTimeout(()=>uploadLocal(false).catch(e=>setStatus(`Upload fehlgeschlagen: ${e.message}`,'Fehler')),700); },
  markRemoteApplied(){ remoteApplying=false; }
};

const signInBtn=document.getElementById('cloudSignInBtn');
const signOutBtn=document.getElementById('cloudSignOutBtn');
const uploadBtn=document.getElementById('cloudUploadLocalBtn');
const downloadBtn=document.getElementById('cloudDownloadBtn');
if(configured){
  const app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app);
  getRedirectResult(auth).catch(e=>setStatus(`Anmeldung fehlgeschlagen: ${e.message}`,'Fehler'));
  window.addEventListener('online',()=>{ if(user&&initialChoiceDone) uploadLocal(false).catch(()=>{}); });
  window.addEventListener('offline',()=>setStatus('Offline: Änderungen bleiben lokal und werden später synchronisiert.','Offline'));
  signInBtn.onclick=async()=>{ const provider=new GoogleAuthProvider(); try{ await signInWithPopup(auth,provider); }catch(e){ if(/popup|blocked|cancelled/i.test(e.code||e.message)) await signInWithRedirect(auth,provider); else { setStatus(`Anmeldung fehlgeschlagen: ${e.message}`,'Fehler'); alert(`Google-Anmeldung fehlgeschlagen: ${e.message}`); } } };
  signOutBtn.onclick=()=>signOut(auth);
  uploadBtn.onclick=async()=>{ if(!confirm('Lokale Daten in die Cloud hochladen und eventuell vorhandene Cloud-Daten ersetzen?'))return; await uploadLocal(true); completeChoice(); };
  downloadBtn.onclick=async()=>{ if(!confirm('Lokale Daten durch die Cloud-Daten ersetzen?'))return; await downloadCloud(); };
  onAuthStateChanged(auth,async u=>{ user=u; initialChoiceDone=false; unsubscribe?.(); unsubscribe=null; updateUserUI(); if(user) try{await inspectCloud()}catch(e){setStatus(`Cloud konnte nicht geladen werden: ${e.message}`,'Fehler')} });
}else updateUserUI();
