import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile,
  setPersistence, browserLocalPersistence, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp=initializeApp(firebaseConfig);
const auth=getAuth(firebaseApp);
const db=getFirestore(firebaseApp);
auth.languageCode='zh-TW';
setPersistence(auth,browserLocalPersistence).catch(()=>{});

const $=id=>document.getElementById(id);
const state={user:null,unsub:null,writeTimer:null,lastLocal:'',lastRemote:'',ready:false};

function waitForApp(){
  if(window.DreamTreeApp)return Promise.resolve(window.DreamTreeApp);
  return new Promise(resolve=>window.addEventListener('dreamtree:app-ready',()=>resolve(window.DreamTreeApp),{once:true}));
}
function setAuthMessage(text,type=''){
  const el=$('authMessage');if(!el)return;
  el.textContent=text||'';el.className='auth-message '+type;
}
function setSync(text,type=''){
  const label=$('syncLabel'),dot=$('syncDot');
  if(label)label.textContent=text;
  if(dot)dot.className='sync-dot '+type;
}
function translateError(error){
  const map={
    'auth/invalid-email':'Email 格式不正確。','auth/missing-password':'請輸入密碼。',
    'auth/weak-password':'密碼至少需要 6 個字元。','auth/email-already-in-use':'這個 Email 已經註冊。',
    'auth/invalid-credential':'Email 或密碼不正確。','auth/user-disabled':'這個帳號已停用。',
    'auth/too-many-requests':'嘗試次數過多，請稍後再試。','auth/network-request-failed':'網路連線失敗，請確認網路。',
    'auth/popup-closed-by-user':'Google 登入視窗已關閉。',
    'auth/popup-blocked':'瀏覽器阻擋登入視窗，正在改用重新導向登入。',
    'auth/cancelled-popup-request':'Google 登入已取消。',
    'auth/account-exists-with-different-credential':'這個 Email 已使用其他登入方式註冊。',
    'auth/unauthorized-domain':'目前網站網域尚未加入 Firebase 已授權網域。',
    'permission-denied':'雲端資料權限不足，請確認 Firestore 規則。'
  };
  return map[error?.code]||error?.message||'發生未預期的錯誤。';
}
function setMode(mode){
  document.querySelectorAll('[data-auth-panel]').forEach(x=>x.hidden=x.dataset.authPanel!==mode);
  document.querySelectorAll('[data-auth-mode]').forEach(x=>x.classList.toggle('active',x.dataset.authMode===mode));
  setAuthMessage('');
}
window.setAuthMode=setMode;


const prefersRedirect=()=>matchMedia('(max-width: 760px), (pointer: coarse)').matches;

const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});

async function googleLogin(){
  const button=$('googleLoginButton');
  if(button)button.disabled=true;
  setAuthMessage('正在開啟 Google 登入…');
  try{
    if(prefersRedirect()){
      sessionStorage.setItem('dreamTreeGoogleRedirect','1');
      await signInWithRedirect(auth,googleProvider);
      return;
    }
    await signInWithPopup(auth,googleProvider);
    setAuthMessage('Google 登入成功，正在載入資料…','ok');
  }catch(err){
    if(err?.code==='auth/popup-blocked'||err?.code==='auth/operation-not-supported-in-this-environment'){
      sessionStorage.setItem('dreamTreeGoogleRedirect','1');
      setAuthMessage('正在改用安全重新導向登入…');
      await signInWithRedirect(auth,googleProvider);
      return;
    }
    setAuthMessage(translateError(err),'bad');
  }finally{
    if(button)button.disabled=false;
  }
}

getRedirectResult(auth).then(result=>{
  if(result?.user)setAuthMessage('Google 登入成功，正在載入資料…','ok');
  sessionStorage.removeItem('dreamTreeGoogleRedirect');
}).catch(err=>setAuthMessage(translateError(err),'bad'));

async function register(e){
  e.preventDefault();setAuthMessage('正在建立帳號…');
  const name=$('registerName').value.trim(),email=$('registerEmail').value.trim();
  const password=$('registerPassword').value,confirm=$('registerConfirm').value;
  if(!name)return setAuthMessage('請輸入顯示名稱。','bad');
  if(password!==confirm)return setAuthMessage('兩次密碼不一致。','bad');
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(cred.user,{displayName:name});
    await setDoc(doc(db,'users',cred.user.uid,'profile','main'),{
      displayName:name,email,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    },{merge:true});
    setAuthMessage('帳號建立成功，正在進入 Dream Tree…','ok');
  }catch(err){setAuthMessage(translateError(err),'bad')}
}
async function login(e){
  e.preventDefault();setAuthMessage('正在登入…');
  try{await signInWithEmailAndPassword(auth,$('loginEmail').value.trim(),$('loginPassword').value)}
  catch(err){setAuthMessage(translateError(err),'bad')}
}
async function reset(e){
  e.preventDefault();const email=$('resetEmail').value.trim();
  try{await sendPasswordResetEmail(auth,email);setAuthMessage('重設密碼郵件已寄出，請查看信箱。','ok')}
  catch(err){setAuthMessage(translateError(err),'bad')}
}
$('googleLoginButton')?.addEventListener('click',googleLogin);
$('loginForm')?.addEventListener('submit',login);
$('registerForm')?.addEventListener('submit',register);
$('resetForm')?.addEventListener('submit',reset);
$('logoutButton')?.addEventListener('click',()=>signOut(auth));
$('userMenuButton')?.addEventListener('click',()=>document.body.classList.toggle('user-menu-open'));

document.addEventListener('click',e=>{
  if(!e.target.closest('.cloud-user'))document.body.classList.remove('user-menu-open');
});

async function uploadData(data,reason='auto'){
  if(!state.user||!data)return;
  const json=JSON.stringify(data);if(json===state.lastRemote&&reason==='auto')return;
  setSync(navigator.onLine?'同步中…':'離線待同步',navigator.onLine?'syncing':'offline');
  try{
    await setDoc(doc(db,'users',state.user.uid,'data','app'),{
      payload:data,schemaVersion:2,updatedAt:serverTimestamp(),updatedBy:navigator.userAgent.slice(0,120)
    });
    state.lastLocal=json;state.lastRemote=json;
    setSync('已同步','ok');
    const t=$('lastSyncTime');if(t)t.textContent='剛剛';
  }catch(err){setSync(navigator.onLine?'同步失敗':'離線待同步',navigator.onLine?'bad':'offline');console.error(err)}
}
window.dreamCloudQueue=data=>{
  if(!state.user||!state.ready)return;
  clearTimeout(state.writeTimer);
  state.writeTimer=setTimeout(()=>uploadData(data),700);
};
window.dreamCloudSyncNow=()=>uploadData(window.DreamTreeApp?.getData(),'manual');


function setUserAvatar(user,display){
  const avatar=$('userAvatar');if(!avatar)return;
  if(user.photoURL){
    avatar.textContent='';avatar.style.backgroundImage=`url("${String(user.photoURL).replace(/"/g,'')}")`;avatar.classList.add('has-photo');
  }else{
    avatar.style.backgroundImage='';avatar.classList.remove('has-photo');avatar.textContent=display.slice(0,1).toUpperCase();
  }
}
function onboardingSeenKey(user){
  return `dreamTreeV7OnboardingSeen:${user.uid}`;
}
function showOnboarding(user,{force=false}={}){
  const overlay=$('onboardingOverlay');
  if(!overlay)return;
  if($('onboardingName'))$('onboardingName').value=user.displayName||user.email?.split('@')[0]||'';
  if(force){
    if($('onboardingDream'))$('onboardingDream').value='';
    if($('onboardingTarget'))$('onboardingTarget').value='';
  }
  overlay.classList.remove('hidden');
  document.body.classList.add('onboarding-open');
}
async function openOnboardingIfNeeded(user){
  const localSeen=localStorage.getItem(onboardingSeenKey(user))==='1';
  const profileRef=doc(db,'users',user.uid,'profile','main');
  let profile={};
  try{
    const profileSnap=await getDoc(profileRef);
    profile=profileSnap.exists()?profileSnap.data():{};
  }catch(err){
    console.warn('Unable to read onboarding profile; using local first-login check.',err);
  }

  // V7.1 rule: every account must see the V7 onboarding once on this browser.
  // A completed cloud profile alone no longer suppresses the first V7 welcome.
  if(localSeen)return;
  showOnboarding(user);
}
async function completeOnboarding(skip=false){
  const user=auth.currentUser;if(!user)return;
  const name=($('onboardingName')?.value||user.displayName||user.email?.split('@')[0]||'使用者').trim();
  const dream=($('onboardingDream')?.value||'').trim();
  const target=Number($('onboardingTarget')?.value||0);
  const msg=$('onboardingMessage');if(msg){msg.textContent='正在建立你的 Dream Tree…';msg.className='auth-message'}
  try{
    if(name&&name!==user.displayName)await updateProfile(user,{displayName:name});
    await setDoc(doc(db,'users',user.uid,'profile','main'),{
      displayName:name,email:user.email||'',photoURL:user.photoURL||'',onboardingComplete:true,
      onboardingSkipped:Boolean(skip),updatedAt:serverTimestamp(),createdAt:serverTimestamp()
    },{merge:true});
    if(!skip&&dream){const api=await waitForApp();api.addStarterDream?.(dream,target)}
    localStorage.setItem(onboardingSeenKey(user),'1');
    $('onboardingOverlay')?.classList.add('hidden');
    document.body.classList.remove('onboarding-open');
    if($('userDisplayName'))$('userDisplayName').textContent=name;
    setUserAvatar(user,name);
  }catch(err){if(msg){msg.textContent=translateError(err);msg.className='auth-message bad'}}
}
$('onboardingForm')?.addEventListener('submit',e=>{e.preventDefault();completeOnboarding(false)});
$('skipOnboarding')?.addEventListener('click',()=>completeOnboarding(true));
$('reopenOnboardingButton')?.addEventListener('click',()=>{
  const user=auth.currentUser;
  if(!user)return;
  document.body.classList.remove('user-menu-open');
  showOnboarding(user,{force:true});
});

async function startCloud(user){
  const api=await waitForApp();
  state.user=user;state.ready=false;
  setSync('讀取雲端…','syncing');
  const ref=doc(db,'users',user.uid,'data','app');
  const snap=await getDoc(ref);
  const ownerKey='dreamTreeCloudOwner';
  const previousOwner=localStorage.getItem(ownerKey);
  if(snap.exists()&&snap.data()?.payload){
    const payload=snap.data().payload;
    state.lastRemote=JSON.stringify(payload);
    if(JSON.stringify(api.getData())!==state.lastRemote)api.applyData(payload);
  }else if(!previousOwner||previousOwner===user.uid){
    // 第一次連接雲端：把目前瀏覽器既有資料安全搬移到新帳號。
    await uploadData(api.getData(),'initial');
  }else{
    // 這台裝置曾登入另一個帳號，避免把前一位使用者的資料複製給新帳號。
    const fresh=api.freshData();
    api.applyData(fresh);
    await uploadData(fresh,'initial');
  }
  localStorage.setItem(ownerKey,user.uid);
  state.ready=true;
  if(state.unsub)state.unsub();
  state.unsub=onSnapshot(ref,{includeMetadataChanges:true},snapshot=>{
    if(!snapshot.exists()||!snapshot.data()?.payload)return;
    const payload=snapshot.data().payload,json=JSON.stringify(payload);
    if(snapshot.metadata.hasPendingWrites){setSync('同步中…','syncing');return}
    state.lastRemote=json;
    setSync('已同步','ok');
    if(json!==JSON.stringify(api.getData()))api.applyData(payload);
  },err=>{setSync('同步失敗','bad');console.error(err)});
}

onAuthStateChanged(auth,async user=>{
  const overlay=$('authOverlay');
  if(user){
    document.body.classList.remove('auth-locked');overlay?.classList.add('hidden');
    const display=user.displayName||user.email?.split('@')[0]||'使用者';
    if($('userDisplayName'))$('userDisplayName').textContent=display;
    if($('userEmail'))$('userEmail').textContent=user.email||'';
    setUserAvatar(user,display);
    try{await startCloud(user);await openOnboardingIfNeeded(user)}catch(err){setSync('雲端載入失敗','bad');console.error(err)}
  }else{
    $('onboardingOverlay')?.classList.add('hidden');
    document.body.classList.remove('onboarding-open');
    if(state.unsub){state.unsub();state.unsub=null}state.user=null;state.ready=false;
    document.body.classList.add('auth-locked');overlay?.classList.remove('hidden');
    setSync('尚未登入','offline');
  }
});

window.addEventListener('online',()=>{setSync('重新連線…','syncing');if(state.user)uploadData(window.DreamTreeApp?.getData(),'reconnect')});
window.addEventListener('offline',()=>setSync('離線待同步','offline'));
