
var $=function(id){return document.getElementById(id)};
var H=function(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML};
var toast=function(m){var t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show')},2000)};

// Version & Changelog
var VERSION='v2.2';
var WECHAT_OAUTH_URL='https://pswiejbqdsvdajzzisgj.supabase.co/functions/v1/wechat-auth';
var CHANGELOG=[
  {v:'v2.2',date:'2026-06-19',items:['头像上传修复：圆形裁剪+正确显示','登录页照片背景+暗色遮罩','重置功能移至后台(仅admin)','好友聊天功能上线','小值轮换：起始偏移+轮换方向']},
  {v:'v2.0',date:'2026-06-18',items:['全新UI：蓝顶栏+三栏布局','收件箱系统：反馈+好友申请','好友申请需对方同意','头像上传：自动压缩至60x60','30秒心跳保持在线状态','☰快捷菜单','返回键简化：一键回首页','移动端适配']},
  {v:'v1.0',date:'2026-06-18',items:['三队百宝箱上线','多用户注册/登录','云端自动同步(Supabase)','小值轮换·多重项目配置','公差轮换·次数统计','幸运转盘·抽签','备忘录·集体投票','个人中心·好友系统']}
];

var API={URL:'https://pswiejbqdsvdajzzisgj.supabase.co',KEY:'sb_publishable_OcLstUOCgADmmQHZwjHEAg_TfGg_1fw',
  _h:function(ct){var h={'apikey':API.KEY,'Authorization':'Bearer '+API.KEY};if(ct)h['Content-Type']='application/json';return h;},
  get:async function(t,q){var r=await fetch(API.URL+'/rest/v1/'+t+(q?'?'+q:''),{headers:API._h()});if(!r.ok)throw new Error('GET '+r.status);return r.json();},
  post:async function(t,b){var r=await fetch(API.URL+'/rest/v1/'+t,{method:'POST',headers:Object.assign({'Prefer':'return=minimal'},API._h(true)),body:JSON.stringify(b)});if(!r.ok)throw new Error('POST '+r.status);},
  del:async function(t,q){var r=await fetch(API.URL+'/rest/v1/'+t+'?'+q,{method:'DELETE',headers:API._h()});if(!r.ok)throw new Error('DEL '+r.status);},
  upsert:async function(t,q,b){try{await API.del(t,q)}catch(e){};await API.post(t,b);},
  check:async function(){var r=[];try{await API.get('toolbar_data','limit=1');r.push({name:'数据库连接',ok:true});}catch(e){r.push({name:'数据库连接',ok:false,err:e.message});}try{localStorage.setItem('_dt','1');localStorage.removeItem('_dt');r.push({name:'本地存储',ok:true});}catch(e){r.push({name:'本地存储',ok:false,err:e.message});}r.push({name:'用户数',ok:true,info:Auth.users().length});return r;}};

var Store={_k:function(k){return'tb_'+(App.user||'')+'_'+k;},
  get:function(k,fb){try{var v=localStorage.getItem(Store._k(k));return v!=null?JSON.parse(v):(fb!==undefined?fb:null);}catch(e){return fb!==undefined?fb:null;}},
  set:function(k,v){localStorage.setItem(Store._k(k),JSON.stringify(v));Store._sync(k,v);},
  getRaw:function(k){return localStorage.getItem(k);},setRaw:function(k,v){localStorage.setItem(k,v);},
  _sync:function(k,v){if(!App.user)return;var u=App.user,b={username:u,data_type:k,data_json:JSON.stringify(v),updated_at:new Date().toISOString()};API.upsert('toolbar_data','username=eq.'+encodeURIComponent(u)+'&data_type=eq.'+encodeURIComponent(k),b).catch(function(){});},
  syncUsers:function(){API.upsert('toolbar_data','username=eq._system&data_type=eq._users',{username:'_system',data_type:'_users',data_json:JSON.stringify(Auth.users()),updated_at:new Date().toISOString()}).catch(function(){});},
  pull:async function(){if(!App.user)return;try{var rows=await API.get('toolbar_data','username=eq.'+encodeURIComponent(App.user));var h=false;for(var i=0;i<rows.length;i++){if(rows[i].data_type&&rows[i].data_type!=='_users'&&rows[i].data_type!=='_inbox'&&rows[i].data_json){localStorage.setItem(Store._k(rows[i].data_type),rows[i].data_json);h=true;}}if(h){toast('已同步');var c=Router._current,cfg=Router._routes[c];if(cfg&&cfg.onEnter)cfg.onEnter();}var inboxRow=rows.find(function(r){return r.data_type==='_inbox'});if(inboxRow&&inboxRow.data_json){localStorage.setItem(Store._k('_inbox'),inboxRow.data_json);App.updateInboxBadge();}}catch(e){}},
  pullUsers:async function(){try{var rows=await API.get('toolbar_data','username=eq._system&data_type=eq._users');if(rows.length&&rows[0].data_json){var cu=JSON.parse(rows[0].data_json),lu=Auth.users();for(var i=0;i<cu.length;i++){var existing=lu.find(function(u){return u.username===cu[i].username});if(!existing)lu.push(cu[i]);else{existing.avatar=cu[i].avatar||existing.avatar;existing.friends=cu[i].friends||existing.friends;}}Auth._saveNoSync(lu);}}catch(e){}}};

var Router={_routes:{},_history:[],_current:'home',
  register:function(n,c){Router._routes[n]=c;},
  go:function(n){Router._history=[];var p=Router._current;if(p===n&&n!=='home')return;var c=Router._routes[n];if(!c)return;var ps=document.querySelectorAll('.page');for(var i=0;i<ps.length;i++)ps[i].classList.remove('active');var pid='page'+n.charAt(0).toUpperCase()+n.slice(1),pg=$(pid);if(!pg){pg=document.createElement('div');pg.id=pid;pg.className='page';if(c.html)pg.innerHTML=c.html;$('mainArea').appendChild(pg);}pg.classList.add('active');$('ht').textContent=c.title||n;$('bb').classList.toggle('hide',n==='home');Router._current=n;history.replaceState({page:n},'','#'+n);if(c.onEnter)c.onEnter();$('menuOverlay').classList.remove('show');if(n==='home'){Render.lb();App.renderSidebar();}},
  back:function(){Router.go('home');},
  init:function(){var s=this;window.addEventListener('popstate',function(e){Router.go('home');});var h=location.hash.replace('#','');if(h&&Router._routes[h]){Router.go(h);}}
};

var Auth={
  isReg:false,init:function(){Auth._ensureAdmin();Store.pullUsers().then(function(){if(sessionStorage.getItem('tb_s')){App.login(sessionStorage.getItem('tb_s'));return;}var p=new URLSearchParams(location.search);var wt=p.get('wx_token');if(wt){Auth._handleWechatToken(wt);return;}$('ls').style.display='flex';if(!Store.getRaw('tb_users'))Auth._setReg();});},
  _ensureAdmin:function(){if(!Store.getRaw('tb_users')){crypto.subtle.digest('SHA-256',new TextEncoder().encode('12345'+'tb_salt')).then(function(h){var hash=Array.from(new Uint8Array(h)).map(function(b){return b.toString(16).padStart(2,'0')}).join('');Store.setRaw('tb_users',JSON.stringify([{id:0,username:'admin',passwordHash:hash,createdAt:'',avatar:'👑',status:'offline',role:'admin',friends:[],lastSeen:null}]));});}},
  _setReg:function(){Auth.isReg=true;$('lt').textContent='📝 注册';$('lst').textContent='创建新账号';$('lb').textContent='注册';$('ltg').textContent='已有账号？';$('ltl').textContent='登录';$('lp2').style.display='block';$('le').textContent='';},
  _setLogin:function(){Auth.isReg=false;$('lt').textContent='🔐 登录';$('lst').textContent='请输入账号密码';$('lb').textContent='登录';$('ltg').textContent='没有账号？';$('ltl').textContent='注册';$('lp2').style.display='none';$('le').textContent='';},
  toggle:function(){Auth.isReg?Auth._setLogin():Auth._setReg();},
  users:function(){try{return JSON.parse(Store.getRaw('tb_users'))||[]}catch(e){return[]}},
  saveUsers:function(u){Store.setRaw('tb_users',JSON.stringify(u));Store.syncUsers();App.renderSidebar();Render.lb();},
  _saveNoSync:function(u){Store.setRaw('tb_users',JSON.stringify(u));},
  hash:async function(p){var d=new TextEncoder().encode(p+'tb_salt');var h=await crypto.subtle.digest('SHA-256',d);return Array.from(new Uint8Array(h)).map(function(b){return b.toString(16).padStart(2,'0')}).join('');},
  login:async function(){var un=$('lu').value.trim(),pw=$('lp').value,pw2=$('lp2').value,er=$('le');if(!un){er.textContent='请输入用户名';return}if(un.length<2){er.textContent='用户名至少2字';return}if(pw.length<4){er.textContent='密码至少4位';return}var us=Auth.users();if(Auth.isReg){if(pw!==pw2){er.textContent='两次密码不一致';return}if(us.some(function(u){return u.username===un})){er.textContent='该用户名已存在';return}us.push({id:Date.now(),username:un,passwordHash:await Auth.hash(pw),createdAt:new Date().toLocaleString('zh-CN'),avatar:'',status:'online',role:'user',friends:[],lastSeen:new Date().toLocaleString('zh-CN')});Auth.saveUsers(us);sessionStorage.setItem('tb_s',un);App.login(un);toast('注册成功，欢迎 '+un+'!');}else{var f=us.find(function(u){return u.username===un});if(!f){er.textContent='用户不存在';return}if(await Auth.hash(pw)!==f.passwordHash){er.textContent='密码错误';$('lp').value='';return}f.status='online';f.lastSeen=new Date().toLocaleString('zh-CN');Auth.saveUsers(us);sessionStorage.setItem('tb_s',un);App.login(un);}},
  logout:function(){App.stopHeartbeat();var us=Auth.users(),un=App.user;var f=us.find(function(u){return u.username===un});if(f){f.status='offline';Auth.saveUsers(us);}sessionStorage.removeItem('tb_s');App.user=null;$('ls').style.display='flex';$('app').classList.remove('show');$('lu').value='';$('lp').value='';$('lp2').value='';Auth._setLogin();},
  wechatLogin:function(){location.href=WECHAT_OAUTH_URL;},
  _handleWechatToken:async function(token){try{var parts=atob(token).split(':');var username=parts[0];if(!username){$('ls').style.display='flex';return}var us=Auth.users();var f=us.find(function(u){return u.username===username});if(!f){toast('微信用户未同步');$('ls').style.display='flex';return}sessionStorage.setItem('tb_s',username);App.login(username);history.replaceState({},'','/toolbox');}catch(e){$('ls').style.display='flex';}}
};

var App={
  user:null,heartbeatId:null,
  login:function(un){App.user=un;$('ls').style.display='none';$('app').classList.add('show');var u=Auth.users().find(function(x){return x.username===un});if(u){$('av').textContent=u.avatar||'👤';$('adBtn').style.display=(u.role==='admin'?'flex':'none');}App.startHeartbeat();App._buildHome();Router.register('home',{title:'三队百宝箱',onEnter:function(){Render.lb();App.renderSidebar();}});Router.init();Router.go('home');Store.pull();App.renderSidebar();Render.lb();App.updateInboxBadge();App.checkVersion();},
  _buildHome:function(){var g=$('homeGrid');g.innerHTML='';Tools.list.forEach(function(t){if(t.id==='admin')return;g.innerHTML+='<div class="tool-card" onclick="Router.go(\''+t.id+'\')"><span class="icon">'+t.icon+'</span><span class="label">'+t.name+'</span><span class="desc">'+t.desc+'</span></div>';});},
  toggleMenu:function(){$('menuOverlay').classList.toggle('show');},
  quickStatus:function(st){TPR.setS(st);},
  renderSidebar:function(){var u=Auth.users().find(function(x){return x.username===App.user});if(!u)return;var fs=u.friends||[],us=Auth.users();var sf=$('sidebarFriends');if(!fs.length){sf.innerHTML='<div style="color:var(--ts);font-size:12px;text-align:center;padding:10px">暂无好友<br>去个人中心添加</div>';return;}var online=[],offline=[];fs.forEach(function(fn){var fu=us.find(function(x){return x.username===fn});if(fu&&(fu.status==='online'||fu.status==='busy'||fu.status==='away'))online.push(fu);else offline.push(fn||{username:fn,avatar:'👤'});});var ri=function(u,st){return'<div class="f-item" onclick="Chat.open(\''+u.username+'\')"><div class="fav">'+(u.avatar||'👤')+'</div><div class="fn">'+H(u.username)+'</div><div class="f-dot '+st+'"></div></div>';};sf.innerHTML='<div style="font-size:11px;color:var(--ts);margin-bottom:4px">在线 ('+online.length+')</div>'+online.map(function(fu){return ri(fu,fu.status==='busy'?'busy':fu.status==='away'?'busy':'on');}).join('')+'<div style="font-size:11px;color:var(--ts);margin:8px 0 4px">离线 ('+offline.length+')</div>'+offline.map(function(fu){return ri(fu,'off');}).join('');},
  startHeartbeat:function(){App.stopHeartbeat();App._beat();App.heartbeatId=setInterval(function(){App._beat();},30000);},
  _beat:function(){if(!App.user)return;var us=Auth.users();var f=us.find(function(u){return u.username===App.user});if(f&&f.status!=='offline'){sessionStorage.setItem('tb_hb',Date.now().toString());}},
  stopHeartbeat:function(){if(App.heartbeatId){clearInterval(App.heartbeatId);App.heartbeatId=null;}},
  updateInboxBadge:function(){var ib=Store.get('_inbox',[]);var unread=ib.filter(function(m){return !m.read}).length;var b=$('inboxBadge');if(unread>0){b.textContent=unread;b.classList.add('show');}else{b.classList.remove('show');}},
  checkVersion:function(){var lv=localStorage.getItem('tb_version');if(lv!==VERSION){toast('欢迎使用 '+VERSION+'！查看☰菜单→更新公告');localStorage.setItem('tb_version',VERSION);}}
};

var Inbox={
  add:function(type,from,to,msg){var ib=JSON.parse(localStorage.getItem('tb_'+to+'_inbox')||'[]');ib.unshift({id:Date.now(),type:type,from:from,msg:msg,time:new Date().toLocaleString('zh-CN'),read:false});localStorage.setItem('tb_'+to+'_inbox',JSON.stringify(ib));API.upsert('toolbar_data','username=eq.'+encodeURIComponent(to)+'&data_type=eq._inbox',{username:to,data_type:'_inbox',data_json:JSON.stringify(ib),updated_at:new Date().toISOString()}).catch(function(){});},
  markRead:function(id){var ib=Store.get('_inbox',[]);for(var i=0;i<ib.length;i++){if(ib[i].id===id){ib[i].read=true;break;}}Store.set('_inbox',ib);App.updateInboxBadge();},
  acceptFriend:function(id,from){Inbox.markRead(id);var us=Auth.users();var me=us.find(function(u){return u.username===App.user});var them=us.find(function(u){return u.username===from});if(!me.friends)me.friends=[];if(me.friends.indexOf(from)<0)me.friends.push(from);if(them&&them.friends&&them.friends.indexOf(App.user)<0)them.friends.push(App.user);Auth.saveUsers(us);toast('已添加好友: '+from);},
  declineFriend:function(id){Inbox.markRead(id);}
};

var Tools={list:[],register:function(c){Tools.list.push(c);Router.register(c.id,{title:c.icon+' '+c.name,html:c.html||'',onEnter:function(){if(c.onEnter)c.onEnter();}});}};

var Render={lb:function(){var us=Auth.users();var lb=$('lbList');var order={online:0,busy:1,away:2,offline:3};us.sort(function(a,b){return(order[a.status]||3)-(order[b.status]||3)});lb.innerHTML=us.map(function(u){var s=u.status==='online'?'在线':u.status==='busy'?'忙碌':u.status==='away'?'离开':'离线';return'<div class="lb-item"><div class="lb-av">'+(u.avatar||'👤')+'</div><div class="lb-info"><div class="lb-name">'+H(u.username)+'</div><div class="lb-stat">'+s+'</div></div><div class="lb-dot '+(u.status==='online'?'on':u.status==='busy'?'busy':'off')+'"></div></div>';}).join('');if(window.innerWidth<=768){$('mobileLB').style.display='block';$('mobileLB').innerHTML='<div class="rp-card"><h3>🏆 在线排行榜</h3>'+lb.innerHTML+'</div>';}else{$('mobileLB').style.display='none';}}};
