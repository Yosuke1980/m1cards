// ごほうび共通ライブラリ — 全学習アプリで1つの貯金箱を共有する
// 仕組み: せいかい/はなした1回=スタンプ1こ → 10こでメダル → メダル3こで「ごほうびけん」
// 保存: localStorage 'gohoubi-v1'（同一オリジンの全ページで共有。旧 'sansu-reward' から自動移行）
// API: GOHOUBI.state() / GOHOUBI.save() / GOHOUBI.mini() / GOHOUBI.award(onClose) → 演出を出したらtrue
(function(){
  const KEY = 'gohoubi-v1';
  let rw = {s:0, m:0, t:[]};
  try{
    const s = localStorage.getItem(KEY);
    if(s){ rw = JSON.parse(s); }
    else{
      const old = localStorage.getItem('sansu-reward');
      if(old){ rw = JSON.parse(old); localStorage.setItem(KEY, old); }
    }
  }catch(e){}
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(rw)); }catch(e){} }

  const css = [
    '.gh-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(17,16,19,.93);padding:24px;}',
    '.gh-box{background:#1c1a1f;border:2px solid #d9a441;border-radius:16px;padding:38px 30px;text-align:center;max-width:420px;box-shadow:0 0 60px rgba(217,164,65,.5);animation:ghPop .45s cubic-bezier(.2,1.4,.5,1);font-family:inherit;}',
    '@keyframes ghPop{from{transform:scale(.5);opacity:0;}to{transform:scale(1);opacity:1;}}',
    '.gh-box .gh-big{font-size:64px;line-height:1.2;}',
    '.gh-box .gh-msg{font-size:20px;font-weight:900;color:#d9a441;margin:14px 0 6px;}',
    '.gh-box .gh-sub{font-size:14px;color:#a49e94;line-height:1.9;}',
    '.gh-box button{margin-top:18px;font-family:inherit;font-size:15px;font-weight:700;padding:12px 30px;border-radius:999px;border:none;background:#d1352b;color:#fff;cursor:pointer;}',
    '.gh-conf{position:fixed;top:-16px;z-index:70;pointer-events:none;border-radius:2px;animation:ghFall linear forwards;}',
    '@keyframes ghFall{to{transform:translateY(108vh) rotate(720deg);opacity:.85;}}',
    '.rw-panel{background:#1c1a1f;border:1px solid #38343d;border-radius:12px;padding:20px;margin-bottom:14px;box-shadow:0 0 0 1px rgba(217,164,65,.28);}',
    '.rw-title{font-size:16px;font-weight:900;color:#d9a441;margin-bottom:14px;}',
    '.stamp-row{display:flex;gap:9px;flex-wrap:wrap;}',
    '.stamp{width:44px;height:44px;border-radius:50%;border:2px dashed #38343d;display:flex;align-items:center;justify-content:center;font-size:22px;color:#38343d;}',
    '.stamp.on{border:2px solid #d9a441;background:rgba(217,164,65,.18);color:#d9a441;}',
    '.rw-note{font-size:13px;color:#a49e94;margin-top:12px;line-height:1.9;}',
    '.medal-shelf{font-size:36px;line-height:1.6;word-break:break-all;}',
    '.medal-count{font-size:15px;font-weight:700;margin-top:6px;color:#f2efe9;}',
    '.ticket{display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(90deg,rgba(217,164,65,.16),transparent);border:1px dashed #d9a441;border-radius:10px;padding:14px 16px;margin-bottom:10px;font-size:16px;font-weight:900;color:#f2efe9;}',
    '.ticket.used{opacity:.4;border-color:#38343d;background:none;}',
    '.ticket button{font-family:inherit;font-size:13px;font-weight:700;padding:9px 16px;border-radius:8px;border:1px solid #d9a441;background:transparent;color:#d9a441;cursor:pointer;}',
    '.ticket.used button{border-color:#38343d;color:#a49e94;cursor:default;}',
  ].join('\n');
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function conf(n){
    for(let i=0;i<n;i++){
      const s = document.createElement('span');
      s.className = 'gh-conf';
      s.style.background = Math.random()<.65 ? '#d9a441' : '#d1352b';
      s.style.left = (Math.random()*100) + 'vw';
      s.style.width = (5+Math.random()*6) + 'px';
      s.style.height = (10+Math.random()*12) + 'px';
      s.style.animationDuration = (1.2+Math.random()*1.3) + 's';
      s.style.animationDelay = (Math.random()*.3) + 's';
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 3200);
    }
  }

  function overlay(kind, onClose){
    const isTicket = kind === 'ticket';
    const o = document.createElement('div');
    o.className = 'gh-overlay';
    o.innerHTML = '<div class="gh-box">'+
      '<div class="gh-big">'+(isTicket ? '🎫' : '🏅')+'</div>'+
      '<div class="gh-msg">'+(isTicket ? 'ごほうびけん ゲット！' : 'メダル ゲット！')+'</div>'+
      '<div class="gh-sub">'+(isTicket
        ? 'おうちのひとに みせて<br>ごほうびと こうかんしよう！'
        : 'れんぞくせいかい 10もん たっせい！<br>メダル3こで ごほうびけんだよ')+'</div>'+
      '<button>つぎへ すすむ →</button>'+
      '</div>';
    document.body.appendChild(o);
    conf(isTicket ? 40 : 22);
    // 効果音はページ側にエンジンがあれば使う（なければ無音で演出だけ）
    if(typeof window.sndKaboom === 'function'){
      window.sndKaboom();
      if(typeof window.sndDon === 'function') setTimeout(window.sndDon, 400);
      if(isTicket) setTimeout(window.sndKaboom, 700);
    }
    o.querySelector('button').addEventListener('click', ()=>{ o.remove(); if(onClose) onClose(); });
  }

  window.GOHOUBI = {
    state(){ return rw; },
    save,
    mini(){ return '🏅' + rw.m + ' ⭐' + rw.s + '/10'; },
    // まちがえたらスタンプは0に戻る（れんぞくせいかい10もん＝メダルのルール。メダル・けんは減らない）
    miss(){ if(rw.s > 0 || (rw.subj && Object.keys(rw.subj).length)){ rw.s = 0; rw.subj = {}; save(); } },
    // スタンプ1こ加算（教科バランス制: 1枚のカードにつき同一教科は4こまで）。
    // 戻り値 {stamped, capped, shown}。shown=演出表示中（閉じたらonClose）。
    SUBJECT_CAP: 4,
    award(onClose, delayMs, subject){
      subject = subject || 'etc';
      if(!rw.subj) rw.subj = {};
      if((rw.subj[subject] || 0) >= this.SUBJECT_CAP){
        return {stamped:false, capped:true, shown:false};
      }
      rw.subj[subject] = (rw.subj[subject] || 0) + 1;
      rw.s++;
      let kind = null;
      if(rw.s >= 10){
        rw.s = 0; rw.m++; rw.subj = {};
        kind = 'medal';
        if(rw.m % 3 === 0){
          rw.t.push({id:Date.now(), u:false});
          kind = 'ticket';
        }
      }
      save();
      if(kind){
        setTimeout(()=>overlay(kind, onClose), delayMs || 0);
        return {stamped:true, capped:false, shown:true};
      }
      return {stamped:true, capped:false, shown:false};
    }
    ,
    // ごほうび画面（スタンプ・メダル・けん）を任意のコンテナに描画する共通部品
    renderPanel(el){
      const names = {sansu:'さんすう', eigo:'えいご', kokugo:'こくご', joushiki:'じょうしき', hanashi:'おはなし', hakken:'はっけん', etc:'そのほか'};
      let sr = '';
      for(let i=0;i<10;i++) sr += '<div class="stamp'+(i<rw.s?' on':'')+'">'+(i<rw.s?'⭐':'')+'</div>';
      const subj = rw.subj || {};
      const parts = Object.keys(subj).map(k=>(names[k]||k)+' '+subj[k]+'こ');
      const next = 3 - (rw.m % 3);
      let h = '<div class="rw-panel"><p class="rw-title">⭐ スタンプカード（れんぞくせいかいで たまる）</p>'+
        '<div class="stamp-row">'+sr+'</div>'+
        '<p class="rw-note">れんぞくで10もん せいかいすると メダル1こ！<br>まちがえると ⭐は0に もどるよ（メダルは へらない）</p>'+
        '<p class="rw-note">ひとつの きょうかで ためられるのは <b style="color:#d9a441;">4こまで</b>。いろんな きょうかを やろう！'+
        (parts.length ? '<br>いまのカード: '+parts.join('・') : '')+'</p></div>';
      h += '<div class="rw-panel"><p class="rw-title">🏅 メダルだな</p>'+
        '<div class="medal-shelf">'+(rw.m ? '🏅'.repeat(Math.min(rw.m,30)) : 'まだないよ。クイズで あつめよう！')+'</div>'+
        '<p class="medal-count">メダル '+rw.m+' こ'+(rw.m ? '（あと'+next+'こで ごほうびけん！）' : '')+'</p>'+
        '<p class="rw-note">メダル3こで「ごほうびけん」1まい！</p></div>';
      h += '<div class="rw-panel"><p class="rw-title">🎫 ごほうびけん</p><div class="gh-tickets"></div>'+
        '<p class="rw-note">おうちのひとに みせて、ごほうびと こうかんしよう！<br>（なにと こうかんできるかは おうちのひとが きめるよ）</p></div>';
      el.innerHTML = h;
      const tl = el.querySelector('.gh-tickets');
      if(!rw.t.length){ tl.innerHTML = '<p class="rw-note">まだないよ。メダル3こで 1まい もらえるよ！</p>'; }
      else{
        [...rw.t].reverse().forEach(tk=>{
          const d = document.createElement('div');
          d.className = 'ticket' + (tk.u ? ' used' : '');
          d.innerHTML = '<span>🎫 ごほうびけん</span>';
          const b = document.createElement('button');
          b.textContent = tk.u ? 'つかったよ' : 'つかう';
          if(!tk.u) b.addEventListener('click', ()=>{
            if(confirm('ごほうびと こうかんした？（おうちのひとと いっしょにおしてね）')){
              tk.u = true; save(); window.GOHOUBI.renderPanel(el);
            }
          });
          d.appendChild(b);
          tl.appendChild(d);
        });
      }
    }
  };
})();
