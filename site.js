/* Автодоктор — мінімальний JS без залежностей: статус «відчинено», меню і дропдаун, липка панель,
   передвибір послуги, UTM, фільтр портфоліо, події аналітики (dataLayer). */
(function(){
  var d=document;
  // 0. На хостингу (http/https) прибираємо «index.html» з посилань — адреси стають чистими (/tsiny/).
  //    Якщо сайт відкрито з диска (file://), посилання лишаються як є і працюють.
  if(/^https?:$/.test(location.protocol)){
    d.querySelectorAll('a[href]').forEach(function(a){
      var h=a.getAttribute('href');
      if(/(^|\/)index\.html(#.*)?$/.test(h)){a.setAttribute('href',h.replace(/index\.html(#.*)?$/,'$1')||'./')}
    });
  }
  // 1. Статус роботи за київським часом
  function kyivNow(){
    try{
      var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      var o={};p.forEach(function(x){o[x.type]=x.value});
      return {day:o.weekday,min:parseInt(o.hour,10)%24*60+parseInt(o.minute,10)};
    }catch(e){var n=new Date();return {day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n.getDay()],min:n.getHours()*60+n.getMinutes()}}
  }
  var t=kyivNow(), open=false, txt='';
  var wk=['Mon','Tue','Wed','Thu','Fri'].indexOf(t.day)>-1, sat=t.day==='Sat';
  if(wk && t.min>=480 && t.min<1020){open=true;txt='Відчинено · до 17:00'}
  else if(sat && t.min>=480 && t.min<780){open=true;txt='Відчинено · до 13:00'}
  else{
    if((wk||sat) && t.min<480) txt='Зачинено · відкриємося о 08:00';
    else if(t.day==='Sat'||t.day==='Sun') txt='Зачинено · відкриємося в пн о 08:00';
    else txt='Зачинено · відкриємося завтра о 08:00';
  }
  d.querySelectorAll('[data-status]').forEach(function(el){el.classList.add(open?'open':'closed')});
  d.querySelectorAll('[data-status-text]').forEach(function(el){el.textContent=txt});

  // 2. Мобільне меню
  var bg=d.querySelector('[data-burger]'), mn=d.querySelector('[data-mnav]');
  function closeMenu(){if(!mn)return;mn.classList.remove('open');d.body.classList.remove('menu-open');if(bg)bg.setAttribute('aria-expanded','false')}
  if(bg&&mn){
    bg.addEventListener('click',function(){var o=mn.classList.toggle('open');d.body.classList.toggle('menu-open',o);bg.setAttribute('aria-expanded',o)});
    mn.addEventListener('click',function(e){if(e.target.closest('a'))closeMenu()});
  }
  // 2b. Дропдаун «Послуги» (десктоп): hover/focus — через CSS, клік і Esc — тут
  d.querySelectorAll('[data-dd]').forEach(function(dd){
    var b=dd.querySelector('[data-dd-btn]');
    b.addEventListener('click',function(e){e.stopPropagation();var o=dd.classList.toggle('open');b.setAttribute('aria-expanded',o)});
    d.addEventListener('click',function(e){if(!dd.contains(e.target)){dd.classList.remove('open');b.setAttribute('aria-expanded','false')}});
    dd.addEventListener('keydown',function(e){if(e.key==='Escape'){dd.classList.remove('open');b.setAttribute('aria-expanded','false');b.focus();b.blur()}});
  });
  d.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});

  // 3. Липка панель: показуємо після першого екрана, ховаємо біля форми
  var st=d.querySelector('[data-sticky]'), hero=d.querySelector('[data-hero]'), book=d.getElementById('book');
  if(st){
    if('IntersectionObserver' in window){
      var heroVis=!!hero, bookVis=false;
      var upd=function(){st.classList.toggle('show',!heroVis&&!bookVis)};
      if(hero) new IntersectionObserver(function(e){heroVis=e[0].isIntersecting;upd()},{rootMargin:'-120px 0px 0px 0px'}).observe(hero);
      if(book) new IntersectionObserver(function(e){bookVis=e[0].isIntersecting;upd()},{threshold:.25}).observe(book);
      upd();
    } else st.classList.add('show');
  }

  // 4. Передвибір послуги у формі з кнопок «Записатися» (data-service="текст опції")
  var sel=d.querySelector('[data-service-select]');
  d.querySelectorAll('[data-service]').forEach(function(a){
    a.addEventListener('click',function(){
      var v=a.getAttribute('data-service');
      if(sel){for(var i=0;i<sel.options.length;i++){if(sel.options[i].text===v){sel.selectedIndex=i;break}}}
      setTimeout(function(){var ph=d.getElementById('f-phone');if(ph)ph.focus({preventScroll:true})},600);
    });
  });

  // 5. UTM / fbclid / gclid -> приховане поле форми (зберігається на всю сесію між сторінками)
  try{
    var q=location.search.replace(/^\?/,'');
    if(q){sessionStorage.setItem('ad_utm',q)}
    var u=d.querySelector('[data-utm]'); if(u){u.value=sessionStorage.getItem('ad_utm')||''}
  }catch(e){}

  // 6. Фільтр портфоліо
  var chips=d.querySelectorAll('[data-filter]'), works=d.querySelectorAll('[data-works] [data-tag]');
  chips.forEach(function(c){
    c.addEventListener('click',function(){
      var f=c.getAttribute('data-filter');
      chips.forEach(function(x){var on=x===c;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
      works.forEach(function(w){w.hidden=!(f==='all'||w.getAttribute('data-tag')===f)});
    });
  });

  // 7. Події аналітики (працюють, якщо в site.json заповнено gtm_id)
  function track(ev,fb){
    try{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:ev,page_path:location.pathname})}catch(e){}
    try{if(typeof gtag==='function')gtag('event',ev)}catch(e){}
    try{if(typeof fbq==='function')fbq('track',fb||'Contact')}catch(e){}
  }
  d.querySelectorAll('.js-call').forEach(function(a){a.addEventListener('click',function(){track('click_call','Contact')})});
  d.querySelectorAll('.js-viber').forEach(function(a){a.addEventListener('click',function(){track('click_viber','Contact')})});
  d.querySelectorAll('.js-tg').forEach(function(a){a.addEventListener('click',function(){track('click_telegram','Contact')})});

  // 8. Форма: проста перевірка телефону
  var f=d.querySelector('[data-form]');
  if(f){
    f.addEventListener('submit',function(e){
      var ph=f.querySelector('[name=phone]'), digits=(ph.value||'').replace(/\D/g,'');
      if(digits.length<10){e.preventDefault();ph.focus();ph.setCustomValidity('Вкажіть номер телефону, наприклад +380 67 123 45 67');ph.reportValidity();setTimeout(function(){ph.setCustomValidity('')},2500);return}
      track('generate_lead','Lead');
    });
  }
  var y=d.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear();
})();
