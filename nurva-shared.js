/* NURVA shared helpers: language, role, header, bottom nav, toast.
   Each page calls NURVA.start({ en:{...}, id:{...} }, renderFn). */
(function(){
  var COMMON = {
    en:{ back:"← Home", navHome:"Home", navReport:"Report", navTips:"Tips", navMood:"Mood", navProfile:"Profile",
         footerNote:"Educational prototype referencing Indonesian Government Regulation No. 17 of 2025 on Child Protection in the Digital Space.",
         days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
         justNow:"Just now", minAgo:function(n){return n+" min ago";}, hourAgo:function(n){return n+"h ago";}, dayAgo:function(n){return n+"d ago";} },
    id:{ back:"← Beranda", navHome:"Beranda", navReport:"Laporan", navTips:"Tips", navMood:"Mood", navProfile:"Profil",
         footerNote:"Prototype edukasi mengacu PP Nomor 17 Tahun 2025 tentang Perlindungan Anak di Ranah Digital.",
         days:['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
         justNow:"Baru saja", minAgo:function(n){return n+" menit lalu";}, hourAgo:function(n){return n+" jam lalu";}, dayAgo:function(n){return n+" hari lalu";} }
  };
  var MOODS = {
    senang:{emoji:'😄', tone:'ok',   en:'Happy',      id:'Senang'},
    baik:  {emoji:'🙂', tone:'ok',   en:'Doing well', id:'Baik-baik saja'},
    biasa: {emoji:'😐', tone:'',     en:'Neutral',    id:'Biasa saja'},
    sedih: {emoji:'😔', tone:'warn', en:'Sad',        id:'Sedih'},
    marah: {emoji:'😡', tone:'warn', en:'Angry / Upset', id:'Marah / Kesal'}
  };

  var N = window.NURVA = {
    role: localStorage.getItem('nurva_role') || 'parent',
    lang: localStorage.getItem('nurva_lang') || 'en',
    dict: {}, renderFn: null, moods: MOODS,
    get: function(k, d){ var v = localStorage.getItem(k); return v === null ? d : v; },
    getJSON: function(k, d){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }catch(e){ return d; } },
    isChild: function(){ return N.role === 'child'; },
    home: function(){ return N.role === 'child' ? 'child-dashboard.html' : 'parent-dashboard.html'; },
    t: function(key){
      var args = Array.prototype.slice.call(arguments, 1);
      var v = (N.dict[N.lang] || {})[key];
      if(v === undefined) v = (COMMON[N.lang] || {})[key];
      if(v === undefined) v = (N.dict.en || {})[key];
      if(v === undefined) v = COMMON.en[key];
      return typeof v === 'function' ? v.apply(null, args) : v;
    },
    timeAgo: function(ts){
      var diff = Math.floor((Date.now() - ts) / 60000);
      if(diff < 1) return N.t('justNow');
      if(diff < 60) return N.t('minAgo', diff);
      var h = Math.floor(diff / 60);
      if(h < 24) return N.t('hourAgo', h);
      return N.t('dayAgo', Math.floor(h / 24));
    },
    fmtMins: function(m){ var h = Math.floor(m / 60), r = m % 60; return h > 0 ? h + 'h ' + r + 'm' : r + 'm'; },
    screenMins: function(){
      var m = parseInt(N.get('nurva_screen_time_minutes', '0'), 10);
      if(!m){ m = 128; localStorage.setItem('nurva_screen_time_minutes', m); }
      return m;
    },
    baseLimitMins: function(){ return parseInt(N.get('nurva_limit_minutes', '180'), 10) || 180; },
    bonusCap: function(){ var v = parseInt(N.get('nurva_bonus_cap', '20'), 10); return isNaN(v) ? 20 : v; },
    bonusToday: function(){ var o = N.getJSON('nurva_bonus_today', null); return o && o.date === new Date().toDateString() ? o.mins : 0; },
    limitMins: function(){ return N.baseLimitMins() + N.bonusToday(); },
    WEEK_TARGET: 5,
    weeklyGoalPct: function(){
      var since = Date.now() - 7*86400000;
      var n = N.getJSON('nurva_quiz_log', []).filter(function(q){ return q.time >= since; }).length;
      return Math.min(100, Math.round(n / N.WEEK_TARGET * 100));
    },
    toast: function(msg){
      var el = document.getElementById('toast');
      el.textContent = msg; el.classList.add('show');
      setTimeout(function(){ el.classList.remove('show'); }, 1800);
    },
    toggleLang: function(){ document.getElementById('langMenu').classList.toggle('open'); },
    setLang: function(l){
      N.lang = l; localStorage.setItem('nurva_lang', l);
      document.getElementById('langMenu').classList.remove('open');
      N.apply();
    },
    apply: function(){
      document.querySelectorAll('[data-i18n]').forEach(function(el){
        var v = N.t(el.getAttribute('data-i18n')); if(v !== undefined) el.innerHTML = v;
      });
      document.getElementById('langCode').textContent = N.lang.toUpperCase();
      document.getElementById('langOptEn').classList.toggle('active', N.lang === 'en');
      document.getElementById('langOptId').classList.toggle('active', N.lang === 'id');
      document.documentElement.lang = N.lang;
      if(N.renderFn) N.renderFn();
    },
    start: function(dict, renderFn, activeNav){
      N.dict = dict; N.renderFn = renderFn;
      var hero = document.getElementById('hero');
      hero.outerHTML =
        '<div class="hero"><div class="hero-inner">' +
          '<div class="topbar">' +
            '<a class="back-btn" href="' + N.home() + '"><div class="brand-mark">N</div><span class="back-text" data-i18n="back">← Home</span></a>' +
            '<div class="lang-switch"><button class="lang-btn" onclick="NURVA.toggleLang()">🌐 <span id="langCode">EN</span></button>' +
              '<div class="lang-menu" id="langMenu">' +
                '<div class="lang-option" id="langOptEn" onclick="NURVA.setLang(\'en\')">🇬🇧 English</div>' +
                '<div class="lang-option" id="langOptId" onclick="NURVA.setLang(\'id\')">🇮🇩 Bahasa Indonesia</div>' +
              '</div></div>' +
          '</div>' +
          '<h1 data-i18n="pageTitle"></h1><p data-i18n="pageSub"></p>' +
        '</div></div>';

      var nav = N.isChild()
        ? [['child-dashboard.html','🏠','navHome','home'],['activity-report.html','📊','navReport','report'],['child-dashboard.html#emotion-check','😊','navMood','mood'],['profile.html','👤','navProfile','profile']]
        : [['parent-dashboard.html','🏠','navHome','home'],['activity-report.html','📊','navReport','report'],['parenting-insight.html','📖','navTips','tips'],['profile.html','👤','navProfile','profile']];
      var navEl = document.getElementById('bottomNav');
      navEl.className = 'bottom-nav';
      navEl.innerHTML = nav.map(function(n){
        return '<a class="nav-item' + (n[3] === activeNav ? ' active' : '') + '" href="' + n[0] + '"><span class="nav-emoji">' + n[1] + '</span><span data-i18n="' + n[2] + '"></span></a>';
      }).join('');

      document.addEventListener('click', function(e){
        var w = document.querySelector('.lang-switch');
        if(w && !w.contains(e.target)) document.getElementById('langMenu').classList.remove('open');
      });
      window.addEventListener('storage', function(){ if(N.renderFn) N.renderFn(); });
      N.apply();
    }
  };
})();
