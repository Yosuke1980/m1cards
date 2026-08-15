// ごほうび共通ライブラリ — 全学習アプリで1つの貯金箱を共有する
// 仕組み: せいかい/はなした1回=スタンプ1こ → 10こでメダル → メダル3こで「ごほうびけん」
// 保存: localStorage 'gohoubi-v1'（同一オリジンの全ページで共有。旧 'sansu-reward' から自動移行）
// API: GOHOUBI.state() / GOHOUBI.save() / GOHOUBI.mini() / GOHOUBI.award(onClose) → 演出を出したらtrue
(function(){
  const KEY = 'gohoubi-v1';
  const SKEY = 'gohoubi-solved-v1';   // その日に正解ずみの問題（日付が変わると空になる）
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

  let solved = {d:'', k:{}};
  try{
    const sv = localStorage.getItem(SKEY);
    if(sv) solved = JSON.parse(sv);
  }catch(e){}
  function today(){
    const d = new Date();
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }
  function saveSolved(){ try{ localStorage.setItem(SKEY, JSON.stringify(solved)); }catch(e){} }
  function rollDay(){
    if(solved.d !== today()){ solved = {d:today(), k:{}}; saveSolved(); }
  }

  const css = [
    '.gh-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(17,16,19,.93);padding:24px;}',
    '.gh-box{background:#1c1a1f;border:2px solid #d9a441;border-radius:16px;padding:38px 30px;text-align:center;max-width:420px;box-shadow:0 0 60px rgba(217,164,65,.5);animation:ghPop .45s cubic-bezier(.2,1.4,.5,1);font-family:inherit;}',
    '@keyframes ghPop{from{transform:scale(.5);opacity:0;}to{transform:scale(1);opacity:1;}}',
    '.gh-box .gh-big{font-size:64px;line-height:1.2;}',
    '.gh-box .gh-msg{font-size:20px;font-weight:900;color:#d9a441;margin:14px 0 6px;}',
    '.gh-box .gh-sub{font-size:14px;color:#a49e94;line-height:1.9;}',
    '.gh-box button{margin-top:18px;font-family:inherit;font-size:15px;font-weight:700;padding:12px 30px;border-radius:999px;border:none;background:#d1352b;color:#fff;cursor:pointer;}',
    '.gh-conf{position:fixed;top:-16px;z-index:70;pointer-events:none;border-radius:2px;animation:ghFall linear forwards;}',
    '.gh-stamp{position:fixed;left:50%;top:36%;z-index:50;pointer-events:none;text-align:center;font-family:inherit;animation:ghStamp 1.4s ease forwards;}',
    '.gh-stamp .gh-star{font-size:96px;line-height:1;filter:drop-shadow(0 0 24px rgba(217,164,65,.9));}',
    '.gh-stamp .gh-got{font-size:26px;font-weight:900;color:#d9a441;margin-top:6px;text-shadow:0 2px 12px rgba(0,0,0,.9);}',
    '.gh-stamp .gh-cnt{font-size:20px;font-weight:900;color:#f2efe9;margin-top:4px;text-shadow:0 2px 12px rgba(0,0,0,.9);}',
    '.gh-stamp .gh-hard{font-size:17px;font-weight:900;color:#f0857c;margin-top:6px;text-shadow:0 2px 12px rgba(0,0,0,.9);}',
    '@keyframes ghStamp{0%{transform:translate(-50%,-50%) scale(.3);opacity:0;}22%{transform:translate(-50%,-50%) scale(1.18);opacity:1;}55%{transform:translate(-50%,-50%) scale(1);opacity:1;}100%{transform:translate(-50%,-170%) scale(.55);opacity:0;}}',
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
    '.gh-sync textarea{width:100%;height:64px;font-family:inherit;font-size:13px;line-height:1.6;padding:8px;border-radius:8px;border:1px solid #38343d;background:#111013;color:#f2efe9;resize:vertical;}',
    '.gh-sync button{font-family:inherit;font-size:14px;font-weight:700;padding:10px 18px;border-radius:8px;border:1px solid #d9a441;background:transparent;color:#d9a441;cursor:pointer;margin:8px 6px 0 0;}',
    '.gh-sync .gh-msg{font-size:13px;line-height:1.9;color:#a49e94;margin-top:8px;}',
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

  function stampPop(hard){
    const d = document.createElement('div');
    d.className = 'gh-stamp';
    d.innerHTML =
      '<div class="gh-star">⭐</div>' +
      '<div class="gh-got">スタンプ ゲット！</div>' +
      '<div class="gh-cnt">' + rw.s + ' / 10</div>' +
      (hard ? '<div class="gh-hard">🔥 むずかしい問題！ ' +
              (rw.hard || 0) + '/' + window.GOHOUBI.NEED_HARD + '</div>' : '');
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1450);
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

  // 別の端末と記録を合わせるためのコード（記録をそのまま文字にしたもの）
  function makeCode(){
    const data = {m: rw.m || 0, s: rw.s || 0, hard: rw.hard || 0,
                  t: (rw.t || []).length, u: (rw.t || []).filter(x => x.u).length};
    return btoa(JSON.stringify(data)).replace(/=+$/, '');
  }
  function readCode(code){
    // 多いほうに合わせる（減ることはない）
    let d;
    try{
      d = JSON.parse(atob(String(code || '').trim().replace(/\s+/g, '')));
    }catch(e){ return null; }
    if(typeof d.m !== 'number') return null;
    const before = {m: rw.m || 0, t: (rw.t || []).length};
    rw.m = Math.max(rw.m || 0, d.m || 0);
    rw.s = Math.max(rw.s || 0, d.s || 0);
    rw.hard = Math.max(rw.hard || 0, d.hard || 0);
    const want = Math.max((rw.t || []).length, d.t || 0);
    rw.t = rw.t || [];
    while(rw.t.length < want) rw.t.push({id: 0, u: false});
    // つかった枚数も多いほうに合わせる
    const usedNow = rw.t.filter(x => x.u).length;
    let needUsed = Math.max(usedNow, d.u || 0) - usedNow;
    for(const tk of rw.t){ if(needUsed <= 0) break; if(!tk.u){ tk.u = true; needUsed--; } }
    save();
    return {medalBefore: before.m, medalNow: rw.m,
            ticketBefore: before.t, ticketNow: rw.t.length};
  }

  window.GOHOUBI = {
    state(){ return rw; },
    save,
    // 引数に教科キーを渡すと「その教科であと何こ貯められるか」も出す
    mini(subject){
      let t = '🏅' + rw.m + ' ⭐' + rw.s + '/10';
      const hd = rw.hard || 0;
      t += hd >= this.NEED_HARD ? '（🔥' + this.NEED_HARD + '/' + this.NEED_HARD + '）'
                                : '（🔥' + hd + '/' + this.NEED_HARD + '）';
      if(subject){
        const used = (rw.subj && rw.subj[subject]) || 0;
        t += used >= this.SUBJECT_CAP
          ? '｜この きょうか まんタン🈵'
          : '｜この きょうか ' + used + '/' + this.SUBJECT_CAP;
      }
      return t;
    },
    // その教科がもう上限に達しているか（出題前の案内に使う）
    isCapped(subject){
      return ((rw.subj && rw.subj[subject]) || 0) >= this.SUBJECT_CAP;
    },
    // まちがえたら⭐が1こ減るだけ（連続でなくてOK・0未満にはならない。メダル/けんは減らない）
    miss(){ if(rw.s > 0){ rw.s--; if(rw.hard) rw.hard--; save(); } },
    // スタンプ1こ加算（教科バランス制: 1枚のカードにつき同一教科の上限。10=実質制限なし）。
    // 戻り値 {stamped, capped, shown}。shown=演出表示中（閉じたらonClose）。
    SUBJECT_CAP: 10,
    NEED_HARD: 3,        // メダル1こに必要な「むずかしい問題」の数
    // qkey を渡すと「その日すでに正解した問題」ではスタンプが増えない（周回稼ぎ防止）
    solvedToday(subject, qkey){
      rollDay();
      return !!solved.k[(subject||'etc') + '|' + qkey];
    },
    // hard=true を渡すと「むずかしい問題」として数える。
    // ⭐が10こ たまっても、むずかしいが NEED_HARD こに届くまでメダルにならない。
    award(onClose, delayMs, subject, qkey, hard){
      subject = subject || 'etc';
      rollDay();
      if(qkey !== undefined && qkey !== null){
        const fk = subject + '|' + qkey;
        if(solved.k[fk]){
          return {stamped:false, repeat:true, capped:false, shown:false};
        }
        solved.k[fk] = 1; saveSolved();
      }
      if(!rw.subj) rw.subj = {};
      if((rw.subj[subject] || 0) >= this.SUBJECT_CAP){
        return {stamped:false, capped:true, shown:false};
      }
      rw.subj[subject] = (rw.subj[subject] || 0) + 1;
      rw.s++;
      if(hard) rw.hard = (rw.hard || 0) + 1;
      let kind = null;
      const needHard = this.NEED_HARD;
      if(rw.s >= 10 && (rw.hard || 0) >= needHard){
        rw.s = 0; rw.hard = 0; rw.subj = {};
        rw.m++;
        kind = 'medal';
        if(rw.m % 3 === 0){
          rw.t.push({id:Date.now(), u:false});
          kind = 'ticket';
        }
      }else if(rw.s > 10){
        rw.s = 10;   // むずかしいが足りない間は 10 で止めて待たせる
      }
      save();
      if(kind){
        setTimeout(()=>overlay(kind, onClose), delayMs || 0);
        return {stamped:true, capped:false, shown:true};
      }
      stampPop(!!hard);
      const needMore = rw.s >= 10 && (rw.hard || 0) < this.NEED_HARD;
      return {stamped:true, capped:false, shown:false, hard:!!hard,
              needHard: needMore ? this.NEED_HARD - (rw.hard || 0) : 0};
    }
    ,
    makeCode, readCode,
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
        '<p class="rw-note">⭐が10こ、そのうち <b style="color:#f0857c;">🔥むずかしい問題が' + this.NEED_HARD + 'こ</b> たまると メダル1こ！<br>'+
        'いまの むずかしい: <b style="color:#f0857c;">' + (rw.hard || 0) + '/' + this.NEED_HARD + '</b><br>'+
        'まちがえると ⭐は1こ へるよ（メダルは へらない）</p>'+
        (parts.length ? '<p class="rw-note">いまのカード: '+parts.join('・')+'</p>' : '')+'</div>';
      h += '<div class="rw-panel"><p class="rw-title">🏅 メダルだな</p>'+
        '<div class="medal-shelf">'+(rw.m ? '🏅'.repeat(Math.min(rw.m,30)) : 'まだないよ。クイズで あつめよう！')+'</div>'+
        '<p class="medal-count">メダル '+rw.m+' こ'+(rw.m ? '（あと'+next+'こで ごほうびけん！）' : '')+'</p>'+
        '<p class="rw-note">メダル3こで「ごほうびけん」1まい！</p></div>';
      h += '<div class="rw-panel gh-sync"><p class="rw-title">📱 ほかの きかいと きろくを あわせる</p>'+
        '<p class="rw-note">iPadと iPhoneなど、べつの きかいで あそぶと きろくが わかれてしまいます。'+
        'こちらで「コードを つくる」→ もう一方で はりつけると、<b style="color:#d9a441;">メダルの 多いほうに そろいます</b>（へることは ありません）。</p>'+
        '<button class="gh-mk">コードを つくる</button>'+
        '<textarea class="gh-code" placeholder="ここに コードが 出ます／ほかの きかいの コードを はりつけて ください"></textarea>'+
        '<button class="gh-ld">はりつけた コードを よみこむ</button>'+
        '<p class="gh-msg"></p></div>';
      h += '<div class="rw-panel"><p class="rw-title">🎫 ごほうびけん</p><div class="gh-tickets"></div>'+
        '<p class="rw-note">おうちのひとに みせて、ごほうびと こうかんしよう！<br>（なにと こうかんできるかは おうちのひとが きめるよ）</p></div>';
      el.innerHTML = h;
      const ta = el.querySelector('.gh-code');
      const msg = el.querySelector('.gh-msg');
      el.querySelector('.gh-mk').addEventListener('click', () => {
        ta.value = makeCode();
        ta.select();
        msg.textContent = 'このコードを、もう一方の きかいの おなじ ところに はりつけてね。';
      });
      el.querySelector('.gh-ld').addEventListener('click', () => {
        const r = readCode(ta.value);
        if(!r){ msg.textContent = 'コードが よめませんでした。もういちど コピーしてね。'; return; }
        msg.innerHTML = 'あわせました！ メダル ' + r.medalBefore + ' → <b style="color:#d9a441;">' +
          r.medalNow + '</b>こ／けん ' + r.ticketBefore + ' → <b style="color:#d9a441;">' +
          r.ticketNow + '</b>まい';
        window.GOHOUBI.renderPanel(el);
      });

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
