(function(){
var D={people:[],projects:[{name:'班内',count:1}],offset:0,startIndex:0,reverse:false};
function ld(){
  var old=Store.get('rotation',null);
  if(old){
    D.people=old.people||[];
    D.projects=old.projects||[{name:'班内',count:1}];
    D.offset=old.offset||0;
    D.startIndex=old.startIndex||0;
    D.reverse=!!old.reverse;
  }else{
    D={people:[],projects:[{name:'班内',count:1}],offset:0,startIndex:0,reverse:false};
  }
}
function sv(){Store.set('rotation',D)}
function ds(o){var d=new Date();d.setDate(d.getDate()+o);return d.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}

Tools.register({id:'rotation',name:'小值轮换',icon:'🔄',desc:'多重项目值班轮换',
html:'<p class="sect">🔄 小值轮换</p><p style="font-size:13px;color:var(--ts);margin-bottom:12px">添加人员，配置项目类型及值班人数。</p>'+
'<div class="row"><input type="text" id="rn" placeholder="姓名" style="flex:2"/><button class="btn btn-p btn-sm" onclick="TR.add()">+添加人员</button></div>'+
'<div id="rpl" style="margin-bottom:14px"></div>'+
'<p style="font-size:14px;font-weight:600;margin-bottom:6px">项目配置</p><div id="rpc"></div>'+
'<div class="row"><button class="btn btn-o btn-sm" onclick="TR.addProj()">+添加项目</button></div>'+
'<p style="font-size:14px;font-weight:600;margin:12px 0 6px">轮换设置</p>'+
'<div class="row"><label style="font-size:13px">起始偏移:</label><input type="number" id="rsi" value="0" min="0" style="width:70px;flex:none" onchange="TR.updSI(this.value)"/><span style="font-size:12px;color:var(--ts)">人（0=从头开始）</span></div>'+
'<div class="row" style="align-items:center"><label style="font-size:13px">轮换方向:</label><select id="rrev" onchange="TR.updRev(this.value)" style="width:120px;flex:none"><option value="0">从上向下</option><option value="1">从下向上</option></select></div>'+
'<div class="date-nav"><button class="btn btn-o btn-sm" onclick="TR.sh(-1)">◀ 前一天</button><span class="dl" id="rd"></span><button class="btn btn-o btn-sm" onclick="TR.sh(1)">后一天 ▶</button></div>'+
'<div style="text-align:center;margin-bottom:12px"><button class="btn btn-o btn-sm" onclick="TR.td()">📍 回到今天</button></div>'+
'<div id="rb"></div>',onEnter:function(){ld();rdr();}});

window.TR={
  add:function(){var n=$('rn').value.trim();if(!n){toast('请输入姓名');return}ld();if(D.people.some(function(p){return p.name===n})){toast('已存在');return}D.people.push({id:Date.now(),name:n});sv();$('rn').value='';rdr();},
  sh:function(d){ld();D.offset+=d;sv();rdr();},
  td:function(){ld();D.offset=0;sv();rdr();},
  del:function(id){ld();D.people=D.people.filter(function(p){return p.id!==id});sv();rdr();},
  up:function(id){ld();var i=D.people.findIndex(function(p){return p.id===id});if(i<=0)return;var t=D.people[i];D.people[i]=D.people[i-1];D.people[i-1]=t;sv();rdr();},
  down:function(id){ld();var i=D.people.findIndex(function(p){return p.id===id});if(i<0||i>=D.people.length-1)return;var t=D.people[i];D.people[i]=D.people[i+1];D.people[i+1]=t;sv();rdr();},
  addProj:function(){ld();D.projects.push({name:'项目'+(D.projects.length+1),count:1});sv();rdr();},
  delProj:function(i){ld();D.projects.splice(i,1);if(!D.projects.length)D.projects=[{name:'默认',count:1}];sv();rdr();},
  updProj:function(i,field,val){ld();if(field==='name')D.projects[i].name=val;else D.projects[i].count=Math.max(1,parseInt(val)||1);sv();rdr();},
  updSI:function(v){ld();D.startIndex=Math.max(0,parseInt(v)||0);sv();rdr();},
  updRev:function(v){ld();D.reverse=v==='1';sv();rdr();}
};

function rdr(){
  var pl=$('rpl');
  if(!D.people.length){pl.innerHTML='<div class="empty"><span class="icon">👥</span>还没有人员</div>';}
  else{pl.innerHTML=D.people.map(function(p,i){return'<div class="li"><div class="ct"><div class="t">'+(i+1)+'. '+H(p.name)+'</div></div><div class="act"><button class="btn btn-o btn-xs" onclick="TR.up('+p.id+')">▲</button><button class="btn btn-o btn-xs" onclick="TR.down('+p.id+')">▼</button><button class="btn btn-d btn-xs" onclick="TR.del('+p.id+')">删除</button></div></div>';}).join('');}

  var pc=$('rpc');
  pc.innerHTML=D.projects.map(function(p,i){return'<div class="proj-row"><input value="'+H(p.name)+'" onchange="TR.updProj('+i+',\'name\',this.value)" placeholder="项目名"/><input type="number" class="narrow" value="'+p.count+'" min="1" max="99" onchange="TR.updProj('+i+',\'count\',this.value)" title="需要人数"/>人<button class="btn btn-d btn-xs" onclick="TR.delProj('+i+')">×</button></div>';}).join('');

  $('rsi').value=D.startIndex;
  $('rrev').value=D.reverse?'1':'0';

  var tn=D.projects.reduce(function(s,p){return s+p.count},0);
  var d0=new Date();d0.setHours(0,0,0,0);
  var dk=Math.max(0,Math.floor((d0.getTime()-new Date(2024,0,1).getTime())/86400000)+D.offset);
  $('rd').textContent=ds(D.offset);

  var bd=$('rb');
  if(!D.people.length||!tn){bd.innerHTML='<div style="color:var(--ts);text-align:center;margin-top:12px">添加人员并配置项目后显示</div>';return}

  var startIdx=(dk*tn+D.startIndex)%D.people.length;
  var lb=D.offset===0?'今日':(D.offset>0?D.offset+'天后':Math.abs(D.offset)+'天前');
  var html='<p style="font-size:15px;font-weight:600;margin-bottom:10px">📅 '+lb+'值班 (共需'+tn+'人, '+(D.reverse?'从下向上':'从上向下')+')</p>';
  var pi=0;
  for(var i=0;i<D.projects.length;i++){
    html+='<div class="duty-card"><div class="pr">📋 '+H(D.projects[i].name)+' ('+D.projects[i].count+'人)</div><div class="pj">';
    var names=[];
    for(var j=0;j<D.projects[i].count;j++){
      var idx=(startIdx+pi+j)%D.people.length;
      if(D.reverse) idx=(D.people.length-1-idx+D.people.length)%D.people.length;
      names.push(D.people[idx].name);
    }
    html+=names.map(H).join('、')+'</div></div>';
    pi+=D.projects[i].count;
  }
  html+='<p style="font-size:12px;color:var(--ts);margin-top:8px;text-align:center">共 '+D.people.length+' 人，每日 '+tn+' 人值班</p>';
  bd.innerHTML=html;
}})();
