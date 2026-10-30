(function(){
  var P=[];
  Tools.register({id:'poll',name:'集体投票',icon:'🗳️',desc:'多人共享投票',html:'<p class="sect">🗳️ 集体投票</p><p style="font-size:13px;color:var(--ts);margin-bottom:10px">创建投票后，把网站地址发给队友，他们打开「集体投票」页就能看到并投票。</p><div class="row"><input type="text" id="pt" placeholder="投票标题"/></div><div style="margin-bottom:10px"><textarea id="popts" placeholder="选项，每行一个" style="width:100%;height:90px;padding:10px;border:1px solid var(--b);border-radius:var(--rs);font-size:14px;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box"></textarea></div><div class="row"><label style="font-size:13px">截止(可选):</label><input type="datetime-local" id="pdl" style="flex:2"/></div><div style="text-align:center;margin-bottom:14px"><button class="btn btn-p" onclick="TP.create()">📊 创建投票</button> <button class="btn btn-o btn-sm" onclick="TP.load()">🔄 刷新</button></div><div id="plist"></div>',onEnter:function(){TP.load();}});
  window.TP={
    create:async function(){
      var title=($('pt').value||'').trim()||'未命名投票';
      var opts=($('popts').value||'').split('\n').map(function(s){return s.trim()}).filter(function(s){return s});
      if(opts.length<2){toast('至少2个选项');return}
      var dlv=$('pdl').value,deadline=dlv?new Date(dlv).getTime():null,id=Date.now();
      var poll={id:id,title:title,options:opts.map(function(n){return{name:n,votes:0}}),deadline:deadline,createdBy:App.user,createdAt:Date.now()};
      try{
        await API.upsert('toolbar_data','username=eq._poll&data_type=eq.poll_'+id,{username:'_poll',data_type:'poll_'+id,data_json:JSON.stringify(poll),updated_at:new Date().toISOString()});
        $('pt').value='';$('popts').value='';$('pdl').value='';
        toast('投票已创建，把网址发给队友即可投票');
        TP.load();
      }catch(e){toast('创建失败，稍后重试')}
    },
    vote:async function(id,idx){
      try{
        var rows=await API.get('toolbar_data','username=eq._poll&data_type=eq.poll_'+id);
        if(!rows.length){toast('投票不存在');return}
        var poll=JSON.parse(rows[0].data_json);
        if(poll.deadline&&Date.now()>poll.deadline){toast('投票已截止');return}
        if(idx<0||idx>=poll.options.length)return;
        poll.options[idx].votes=(poll.options[idx].votes||0)+1;
        await API.upsert('toolbar_data','username=eq._poll&data_type=eq.poll_'+id,{username:'_poll',data_type:'poll_'+id,data_json:JSON.stringify(poll),updated_at:new Date().toISOString()});
        TP.load();
      }catch(e){toast('投票失败，稍后重试')}
    },
    del:async function(id){
      if(!confirm('删除这个投票？'))return;
      try{await API.del('toolbar_data','username=eq._poll&data_type=eq.poll_'+id)}catch(e){}
      TP.load();
    },
    load:async function(){
      try{
        var rows=await API.get('toolbar_data','username=eq._poll&limit=100&order=id.desc');
        var seen={};
        P=rows.map(function(r){try{return JSON.parse(r.data_json)}catch(e){return null}}).filter(function(x){return x&&!seen[x.id]&&(seen[x.id]=1)});
      }catch(e){P=[]}
      rdr();
    }
  };
  function rdr(){
    var c=$('plist');
    if(!P.length){c.innerHTML='<div class="empty"><span class="icon">🗳️</span>还没有投票，创建一个吧</div>';return}
    c.innerHTML=P.map(function(poll){
      var total=poll.options.reduce(function(s,o){return s+(o.votes||0)},0),maxV=Math.max.apply(null,poll.options.map(function(o){return o.votes||0}).concat([0])),over=poll.deadline&&Date.now()>poll.deadline;
      var dlTxt=poll.deadline?'<span style="font-size:12px;color:'+(over?'var(--err)':'var(--ts)')+'">'+(over?'⏰ 已截止':'⏰ 截止 '+new Date(poll.deadline).toLocaleString('zh-CN'))+'</span>':'';
      var opts=poll.options.map(function(o,i){var pct=total===0?0:Math.round((o.votes||0)/total*100),bw=total===0?0:(o.votes||0)/Math.max(maxV,1)*100,lead=(o.votes||0)===maxV&&maxV>0?'🏆 ':'';return'<div class="poll-opt" onclick="TP.vote('+poll.id+','+i+')"><div class="bar" style="width:'+bw+'%"></div><div class="txt"><span>'+lead+H(o.name)+'</span><span class="pct">'+(o.votes||0)+'票('+pct+'%)</span></div></div>';}).join('');
      return'<div class="rp-card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px"><strong>📊 '+H(poll.title)+'</strong><span style="font-size:12px;color:var(--ts)">共 '+total+' 票 · 发起: '+H(poll.createdBy||'?')+'</span>'+dlTxt+'</div>'+opts+'<div style="text-align:right;margin-top:6px"><button class="btn btn-d btn-xs" onclick="event.stopPropagation();TP.del('+poll.id+')">删除投票</button></div></div>';
    }).join('');
  }
})();
