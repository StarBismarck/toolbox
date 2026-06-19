(function(){
Tools.register({id:'changelog',name:'更新公告',icon:'📋',desc:'',html:'<p class="sect">📋 更新公告 <span style="font-size:13px;color:var(--ts)">'+VERSION+'</span></p><div id="clog"></div>',onEnter:function(){rdr();}});
function rdr(){
  $('clog').innerHTML=CHANGELOG.map(function(c){return'<div class="rp-card" style="margin-bottom:12px"><h3>'+c.v+' <span style="font-size:12px;color:var(--ts)">'+c.date+'</span></h3><ul style="padding-left:20px;font-size:14px;color:var(--t)">'+c.items.map(function(i){return'<li style="margin:4px 0">'+i+'</li>'}).join('')+'</ul></div>';}).join('');
}})();