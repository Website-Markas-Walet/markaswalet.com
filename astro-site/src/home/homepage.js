
(function(){
  var track = document.getElementById('mwtk-track');
  var outer = document.getElementById('mwtk-viewport');
  if(!track || !outer) return;
  var pos = 0;
  var paused = false;
  var halfW;
  function getHalf(){
    var items = track.querySelectorAll('.mwtk-item');
    var half = items.length / 2;
    var w = 0;
    for(var i=0; i<half; i++){
      w += items[i].offsetWidth + 20;
    }
    return w;
  }
  function step(){
    if(!paused){
      pos += 0.5;
      if(!halfW || pos >= halfW) halfW = getHalf();
      if(pos >= halfW) pos = 0;
      track.style.transform = 'translateX(-' + pos + 'px)';
    }
    requestAnimationFrame(step);
  }
  outer.addEventListener('mouseenter', function(){ paused = true; });
  outer.addEventListener('mouseleave', function(){ paused = false; });
  // Wait for images to have dimensions
  window.addEventListener('load', function(){ halfW = getHalf(); });
  requestAnimationFrame(step);
})();

;

document.addEventListener('DOMContentLoaded', function() {

  /* ── Hero slider (2 slides) ── */
  var slides   = document.querySelectorAll('.mw-slide');
  var contents = document.querySelectorAll('.mw-hero-slide-content');
  var dots     = document.querySelectorAll('.mw-hero-dot');
  var prevBtn  = document.getElementById('mw-prev');
  var nextBtn  = document.getElementById('mw-next');
  var cur = 0, timer;

  function goTo(n) {
    slides[cur].classList.remove('active');
    contents[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = ((n % slides.length) + slides.length) % slides.length;
    slides[cur].classList.add('active');
    contents[cur].classList.add('active');
    dots[cur].classList.add('active');
  }
  function startAuto() {
    clearInterval(timer);
    timer = setInterval(function(){ goTo(cur + 1); }, 6000);
  }
  dots.forEach(function(d,i){ d.addEventListener('click', function(){ clearInterval(timer); goTo(i); startAuto(); }); });
  if(prevBtn) prevBtn.addEventListener('click', function(){ clearInterval(timer); goTo(cur-1); startAuto(); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ clearInterval(timer); goTo(cur+1); startAuto(); });
  /* Keyboard */
  document.addEventListener('keydown', function(e){
    if(e.key==='ArrowLeft'){ clearInterval(timer); goTo(cur-1); startAuto(); }
    if(e.key==='ArrowRight'){ clearInterval(timer); goTo(cur+1); startAuto(); }
  });
  /* Swipe */
  var hero = document.querySelector('.mw-hero'), tx=0, ty=0;
  if(hero){
    hero.addEventListener('touchstart',function(e){ tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
    hero.addEventListener('touchend',function(e){
      var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40){ clearInterval(timer); goTo(dx<0?cur+1:cur-1); startAuto(); }
    },{passive:true});
  }
  startAuto();

  /* ── Scroll reveal ── */
  var revEls = document.querySelectorAll('.mw-reveal');
  var ro = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); ro.unobserve(e.target); } });
  },{ threshold:.12 });
  revEls.forEach(function(el){ ro.observe(el); });

  /* ── Animated counters ── */
  var counters = document.querySelectorAll('.mw-stat-n[data-count]');
  var co = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target;
      var target = parseInt(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var isYear = target > 1000;
      var start = isYear ? target - 5 : 0;
      var step = (target - start) / (1400/16);
      var val = start;
      function tick(){
        val = Math.min(val+step, target);
        el.textContent = Math.floor(val).toLocaleString() + (val>=target ? suffix : '');
        if(val < target) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      co.unobserve(el);
    });
  },{ threshold:.5 });
  counters.forEach(function(c){ co.observe(c); });

});

/* ── Video lazy play ── */
function mwPlay(iframeId, thumbId, videoId) {
  var iframe = document.getElementById(iframeId);
  var thumb  = document.getElementById(thumbId);
  if(iframe && iframe.dataset.src){ iframe.src = iframe.dataset.src + '&autoplay=1'; delete iframe.dataset.src; }
  if(thumb) thumb.classList.add('gone');
}
