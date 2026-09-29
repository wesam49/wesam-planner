import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// 16.21: Firebase config is intentionally included in the client bundle.
// Firebase Web API keys are public identifiers; access is protected by Auth + Firestore rules.
const firebaseConfig = {
  apiKey: "AIzaSyDTGM9wNjL-jvOcevrerLp0aNriCfDFJIM",
  authDomain: "wesam-planner.firebaseapp.com",
  projectId: "wesam-planner",
  storageBucket: "wesam-planner.firebasestorage.app",
  messagingSenderId: "317894742894",
  appId: "1:317894742894:web:2cd82d3d5ad984442e677f",
  measurementId: "G-F0FT98KLZR"
};

const statusEl=()=>document.getElementById('cloudStatus');
const badgeEl=()=>document.getElementById('cloudSyncBadge');
const firstRow=()=>document.getElementById('cloudFirstSyncRow');
let auth,db,user,unsubscribe=null,uploadTimer=null,remoteApplying=false,initialChoiceDone=false,lastRemoteUpdatedAt=0;

function setStatus(text,badge){ if(statusEl()) statusEl().textContent=text; if(badgeEl()&&badge) badgeEl().textContent=badge; }
function cloudDoc(){ return user ? doc(db,'users',user.uid,'planner','main') : null; }
function validState(s){ return s && Array.isArray(s.events) && Array.isArray(s.finance) && Array.isArray(s.goals); }
function friendlyAuthError(e){
  const code=String(e?.code||'');
  const msg=String(e?.message||e||'Unbekannter Fehler');
  if(code.includes('unauthorized-domain')) return 'Diese Website ist in Firebase noch nicht als erlaubte Domain eingetragen. Füge in Firebase Authentication → Settings → Authorized domains die Domain wesam49.github.io hinzu.';
  if(code.includes('popup-blocked')) return 'Chrome hat das Google-Anmeldefenster blockiert. Erlaube Pop-ups für wesam49.github.io und versuche es erneut.';
  if(code.includes('popup-closed-by-user')) return 'Das Google-Anmeldefenster wurde geschlossen.';
  if(code.includes('network-request-failed')) return 'Die Anmeldung konnte das Google/Firebase-Netzwerk nicht erreichen. Prüfe Internet, VPN oder Blocker.';
  return `Google-Anmeldung fehlgeschlagen: ${msg}`;
}
function showAuthError(e){
  const text=friendlyAuthError(e);
  setStatus(text,'Fehler');
  try{ alert(text); }catch(_){ }
}
function updateUserUI(){
  const title=document.getElementById('cloudUserTitle'),signIn=document.getElementById('cloudSignInBtn'),signOutBtn=document.getElementById('cloudSignOutBtn');
  if(signIn){
    signIn.type='button';
    signIn.disabled=false;
    signIn.style.pointerEvents='auto';
    signIn.style.cursor='pointer';
    signIn.style.position='relative';
    signIn.style.zIndex='5';
    signIn.setAttribute('aria-disabled','false');
  }
  if(signOutBtn) signOutBtn.type='button';
  if(user){
    if(title)title.textContent=user.displayName||user.email||'Angemeldet';
    if(signIn)signIn.style.display='none';
    if(signOutBtn)signOutBtn.style.display='inline-block';
  } else {
    if(title)title.textContent='Nicht angemeldet';
    if(signIn)signIn.style.display='inline-block';
    if(signOutBtn)signOutBtn.style.display='none';
    if(firstRow())firstRow().style.display='none';
    setStatus('Lokale Daten bleiben auf diesem Gerät gespeichert.','Aus');
  }
}
async function inspectCloud(){
  const snap=await getDoc(cloudDoc());
  if(!snap.exists()){ firstRow().style.display='flex'; setStatus('Cloud ist leer. Lade deine aktuellen lokalen Daten hoch.','Auswahl'); return; }
  const chosen=localStorage.getItem(`wesamCloudChosen:${user.uid}`)==='1';
  if(!chosen){ firstRow().style.display='flex'; setStatus('Cloud-Daten gefunden. Wähle einmalig Cloud oder lokale Daten.','Auswahl'); return; }
  initialChoiceDone=true; firstRow().style.display='none'; startLiveSync(); setStatus('Synchronisierung aktiv.','Aktiv');
}
async function uploadLocal(force=false){
  if(!user||!window.wesamPlanner) return;
  if(!force&&!initialChoiceDone) return;
  const state=window.wesamPlanner.getState();
  await setDoc(cloudDoc(),{state,appVersion:'16.21',schemaVersion:8,updatedAt:serverTimestamp(),updatedAtClient:Date.now()},{merge:true});
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
  scheduleUpload(){ if(!user||!initialChoiceDone||remoteApplying)return; clearTimeout(uploadTimer); uploadTimer=setTimeout(()=>uploadLocal(false).catch(e=>setStatus(`Upload fehlgeschlagen: ${e.message}`,'Fehler')),700); },
  markRemoteApplied(){ remoteApplying=false; }
};

const signInBtn=document.getElementById('cloudSignInBtn');
const signOutBtn=document.getElementById('cloudSignOutBtn');
const uploadBtn=document.getElementById('cloudUploadLocalBtn');
const downloadBtn=document.getElementById('cloudDownloadBtn');

const app=initializeApp(firebaseConfig);
auth=getAuth(app);
db=getFirestore(app);
auth.languageCode='de';

async function startGoogleSignIn(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if(!signInBtn) return;
  signInBtn.disabled=true;
  signInBtn.setAttribute('aria-disabled','true');
  setStatus('Google-Anmeldung wird geöffnet …','Anmeldung');
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    // Desktop Chrome: popup is initiated directly from this user click.
    await signInWithPopup(auth,provider);
  }catch(e){
    const code=String(e?.code||e?.message||'');
    if(code.includes('popup-blocked')){
      try{
        setStatus('Popup blockiert – Weiterleitung zu Google …','Anmeldung');
        await signInWithRedirect(auth,provider);
        return;
      }catch(e2){ showAuthError(e2); }
    } else {
      showAuthError(e);
    }
  } finally {
    if(signInBtn && !user){
      signInBtn.disabled=false;
      signInBtn.setAttribute('aria-disabled','false');
    }
  }
}

// Capture-phase listener makes the button clickable even if another script attaches a bubbling handler.
if(signInBtn){
  signInBtn.type='button';
  signInBtn.disabled=false;
  signInBtn.style.pointerEvents='auto';
  signInBtn.style.cursor='pointer';
  signInBtn.style.position='relative';
  signInBtn.style.zIndex='5';
  signInBtn.addEventListener('click',startGoogleSignIn,{capture:true});
}
if(signOutBtn){ signOutBtn.type='button'; signOutBtn.onclick=()=>signOut(auth); }
if(uploadBtn) uploadBtn.onclick=async()=>{ if(!confirm('Lokale Daten in die Cloud hochladen und eventuell vorhandene Cloud-Daten ersetzen?'))return; await uploadLocal(true); completeChoice(); };
if(downloadBtn) downloadBtn.onclick=async()=>{ if(!confirm('Lokale Daten durch die Cloud-Daten ersetzen?'))return; await downloadCloud(); };

getRedirectResult(auth).then(result=>{
  if(result?.user) setStatus('Google-Anmeldung erfolgreich. Cloud wird geladen …','Aktiv');
}).catch(showAuthError);
window.addEventListener('online',()=>{ if(user&&initialChoiceDone) uploadLocal(false).catch(()=>{}); });
window.addEventListener('offline',()=>setStatus('Offline: Änderungen bleiben lokal und werden später synchronisiert.','Offline'));
onAuthStateChanged(auth,async u=>{
  user=u; initialChoiceDone=false; unsubscribe?.(); unsubscribe=null; updateUserUI();
  if(user) try{ await inspectCloud(); }catch(e){ setStatus(`Cloud konnte nicht geladen werden: ${e.message}`,'Fehler'); }
});
updateUserUI();
