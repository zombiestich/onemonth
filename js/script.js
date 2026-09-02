(function(){
  "use strict";

  /* ============================================================
     CONFIG
  ============================================================ */
  // Star polygon as percentages of the certificate image (x%, y%)
  var STAR_POINTS_PCT = [
    [25.37,30.94],[32.13,42.14],[11.57,44.17],[29.07,50.42],[15.83,59.64],
    [36.57,57.76],[36.57,69.53],[51.11,60.83],[65.09,69.69],[65.28,58.02],
    [85.46,60.05],[72.96,50.42],[90.65,44.11],[70.19,42.14],[76.39,30.78],
    [58.33,36.72],[50.65,26.04],[43.7,36.98]
  ];
  var CANVAS_W = 540, CANVAS_H = 960; // logical drawing resolution (matches 1080x1920 aspect)
  var SCRATCH_RADIUS = 26;            // eraser brush radius in canvas px
  var REVEAL_THRESHOLD = 0.8;         // 80%
  var TAPS_REQUIRED = 3;              // clicks on the "3" needed to trigger the transition
  var TAP_RESET_MS = 1400;            // reset the tap counter after this much inactivity

  var calendarScene = document.getElementById('calendarScene');
  var certificateScene = document.getElementById('certificateScene');
  var calendarStage = document.getElementById('calendarStage');
  var certificateStage = document.getElementById('certificateStage');
  var threeHotspot = document.getElementById('threeHotspot');
  var threeGlow = document.getElementById('threeGlow');
  var particleLayer = document.getElementById('particleLayer');
  var pressLabel = document.getElementById('pressLabel');
  var confettiLayer = document.getElementById('confettiLayer');
  var canvas = document.getElementById('scratchCanvas');
  var ctx = canvas.getContext('2d');
  var replayBtn = document.getElementById('replayBtn');
  var liveRegion = document.getElementById('liveRegion');

  var starPxPoints = STAR_POINTS_PCT.map(function(p){
    return [ p[0]/100*CANVAS_W, p[1]/100*CANVAS_H ];
  });

  /* ============================================================
     GEOMETRY HELPERS
  ============================================================ */
  function pointInPolygon(x, y, poly){
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      var intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function polygonBBox(poly){
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    poly.forEach(function(p){
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    return { minX:minX, minY:minY, maxX:maxX, maxY:maxY, w:maxX-minX, h:maxY-minY };
  }

  var starBBox = polygonBBox(starPxPoints);

  // Precompute sample grid (points inside the star) once, for fast progress checks
  var sampleGrid = (function(){
    var pts = [];
    var cols = 44, rows = 60;
    for (var r = 0; r < rows; r++){
      for (var c = 0; c < cols; c++){
        var x = starBBox.minX + (c + 0.5) / cols * starBBox.w;
        var y = starBBox.minY + (r + 0.5) / rows * starBBox.h;
        if (pointInPolygon(x, y, starPxPoints)){
          pts.push([Math.round(x), Math.round(y)]);
        }
      }
    }
    return pts;
  })();

  /* ============================================================
     SCRATCH-OFF COATING
  ============================================================ */
  function drawCoating(){
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);

    ctx.save();
    // clip to star so all painting (base + texture) stays inside the shape
    ctx.beginPath();
    starPxPoints.forEach(function(p,i){
      if (i===0) ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]);
    });
    ctx.closePath();
    ctx.clip();

    // metallic silver/gray base
    var grad = ctx.createLinearGradient(starBBox.minX, starBBox.minY, starBBox.maxX, starBBox.maxY);
    grad.addColorStop(0, '#c7c9cc');
    grad.addColorStop(0.25, '#e4e5e7');
    grad.addColorStop(0.5, '#a9acb0');
    grad.addColorStop(0.75, '#dcdde0');
    grad.addColorStop(1, '#b7b9bc');
    ctx.fillStyle = grad;
    ctx.fillRect(starBBox.minX-4, starBBox.minY-4, starBBox.w+8, starBBox.h+8);

    // soft sheen
    var sheen = ctx.createRadialGradient(
      starBBox.minX + starBBox.w*0.35, starBBox.minY + starBBox.h*0.3, 10,
      starBBox.minX + starBBox.w*0.35, starBBox.minY + starBBox.h*0.3, starBBox.w*0.8
    );
    sheen.addColorStop(0, 'rgba(255,255,255,0.55)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(starBBox.minX-4, starBBox.minY-4, starBBox.w+8, starBBox.h+8);

    // scratchy noise texture (short random diagonal strokes)
    var seed = 42;
    function rnd(){ seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    ctx.lineCap = 'round';
    for (var i = 0; i < 900; i++){
      var x = starBBox.minX + rnd()*starBBox.w;
      var y = starBBox.minY + rnd()*starBBox.h;
      var len = 4 + rnd()*10;
      var ang = rnd()*Math.PI;
      var shade = 130 + Math.floor(rnd()*90);
      ctx.strokeStyle = 'rgba('+shade+','+shade+','+(shade+4)+','+(0.12+rnd()*0.18)+')';
      ctx.lineWidth = 0.6 + rnd()*1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang)*len, y + Math.sin(ang)*len);
      ctx.stroke();
    }

    // fine dot grain
    for (var j = 0; j < 1400; j++){
      var gx = starBBox.minX + rnd()*starBBox.w;
      var gy = starBBox.minY + rnd()*starBBox.h;
      var shade2 = 150 + Math.floor(rnd()*80);
      ctx.fillStyle = 'rgba('+shade2+','+shade2+','+shade2+','+(0.1+rnd()*0.2)+')';
      ctx.fillRect(gx, gy, 1, 1);
    }

    ctx.restore();

    // subtle outline so the star edge reads crisply
    ctx.save();
    ctx.beginPath();
    starPxPoints.forEach(function(p,i){
      if (i===0) ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(120,122,125,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  var starClipCss = 'polygon(' + STAR_POINTS_PCT.map(function(p){
    return p[0].toFixed(2)+'% '+p[1].toFixed(2)+'%';
  }).join(',') + ')';
  canvas.style.clipPath = starClipCss;
  canvas.style.webkitClipPath = starClipCss;

  /* ============================================================
     SCRATCH INTERACTION
  ============================================================ */
  var scratching = false;
  var lastPt = null;
  var revealed = false;
  var progressCheckPending = false;

  function canvasCoordsFromEvent(evt){
    var rect = canvas.getBoundingClientRect();
    var clientX = (evt.touches && evt.touches[0]) ? evt.touches[0].clientX : evt.clientX;
    var clientY = (evt.touches && evt.touches[0]) ? evt.touches[0].clientY : evt.clientY;
    var x = (clientX - rect.left) / rect.width * CANVAS_W;
    var y = (clientY - rect.top) / rect.height * CANVAS_H;
    return [x, y];
  }

  function eraseAt(x, y, fromPt){
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (fromPt){
      ctx.lineWidth = SCRATCH_RADIUS * 2;
      ctx.beginPath();
      ctx.moveTo(fromPt[0], fromPt[1]);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function checkProgress(){
    if (revealed || progressCheckPending) return;
    progressCheckPending = true;
    requestAnimationFrame(function(){
      progressCheckPending = false;
      var bx = Math.max(0, Math.floor(starBBox.minX));
      var by = Math.max(0, Math.floor(starBBox.minY));
      var bw = Math.min(CANVAS_W - bx, Math.ceil(starBBox.w));
      var bh = Math.min(CANVAS_H - by, Math.ceil(starBBox.h));
      var data;
      try{
        data = ctx.getImageData(bx, by, bw, bh).data;
      }catch(e){ return; }

      var scratched = 0;
      for (var i = 0; i < sampleGrid.length; i++){
        var sx = sampleGrid[i][0] - bx;
        var sy = sampleGrid[i][1] - by;
        if (sx < 0 || sy < 0 || sx >= bw || sy >= bh) continue;
        var idx = (sy * bw + sx) * 4 + 3; // alpha channel
        if (data[idx] < 120) scratched++;
      }
      var pct = scratched / sampleGrid.length;
      if (pct >= REVEAL_THRESHOLD){
        finishReveal();
      }
    });
  }

  function finishReveal(){
    if (revealed) return;
    revealed = true;
    canvas.style.transition = 'opacity .55s ease';
    canvas.style.opacity = '0';
    liveRegion.textContent = 'Certificate fully revealed';
    setTimeout(function(){
      canvas.style.pointerEvents = 'none';
      launchConfetti();
      replayBtn.classList.add('visible');
    }, 480);
  }

  function handleDown(evt){
    if (revealed) return;
    evt.preventDefault();
    scratching = true;
    var pt = canvasCoordsFromEvent(evt);
    if (pointInPolygon(pt[0], pt[1], starPxPoints)){
      eraseAt(pt[0], pt[1], null);
      lastPt = pt;
      checkProgress();
    } else {
      lastPt = null;
    }
  }
  function handleMove(evt){
    if (!scratching || revealed) return;
    evt.preventDefault();
    var pt = canvasCoordsFromEvent(evt);
    if (pointInPolygon(pt[0], pt[1], starPxPoints)){
      eraseAt(pt[0], pt[1], lastPt);
      lastPt = pt;
      checkProgress();
    } else {
      lastPt = null;
    }
  }
  function handleUp(evt){
    if (!scratching) return;
    scratching = false;
    lastPt = null;
    checkProgress();
  }

  canvas.addEventListener('mousedown', handleDown);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);

  canvas.addEventListener('touchstart', handleDown, { passive:false });
  canvas.addEventListener('touchmove', handleMove, { passive:false });
  canvas.addEventListener('touchend', handleUp, { passive:false });
  canvas.addEventListener('touchcancel', handleUp, { passive:false });

  /* ============================================================
     CONFETTI (post-reveal)
  ============================================================ */
  var CONFETTI_COLORS = ['#4a6fa5','#7fa8d9','#a7c7e7','#d9e6f5','#ffffff','#c9d9ee'];
  function launchConfetti(){
    var originX = starBBox.minX + starBBox.w/2;
    var originY = starBBox.minY + starBBox.h/2;
    var originXPct = originX / CANVAS_W * 100;
    var originYPct = originY / CANVAS_H * 100;

    var count = 50;
    for (var i = 0; i < count; i++){
      (function(){
        var el = document.createElement('div');
        var roll = Math.random();
        el.className = 'confetti';
        if (roll < 0.22){
          el.textContent = '\u2728';
          el.style.fontSize = (10 + Math.random()*10) + 'px';
        } else if (roll < 0.48){
          var starSize = 8 + Math.random()*8;
          el.style.width = starSize + 'px';
          el.style.height = starSize + 'px';
          el.style.background = CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)];
          el.style.clipPath = 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
        } else {
          el.style.width = (5 + Math.random()*5) + 'px';
          el.style.height = (7 + Math.random()*8) + 'px';
          el.style.background = CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)];
          el.style.borderRadius = (Math.random() < 0.5) ? '50%' : '2px';
        }
        var angle = Math.random() * Math.PI * 2;
        var dist = 90 + Math.random()*220;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist - 40;
        var rot = (Math.random()*720 - 360) + 'deg';
        var dur = 1.1 + Math.random()*1.1;
        var delay = Math.random()*0.35;

        el.style.left = originXPct + '%';
        el.style.top = originYPct + '%';
        el.style.setProperty('--dx', dx + 'px');
        el.style.setProperty('--dy', dy + 'px');
        el.style.setProperty('--rot', rot);
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = delay + 's';

        confettiLayer.appendChild(el);
        el.addEventListener('animationend', function(){
          el.remove();
        });
      })(i);
    }
  }

  /* ============================================================
     FLOATING NOTES / STARS / SPARKLES (calendar -> certificate)
  ============================================================ */
  var PARTICLE_GLYPHS = ['\u266A','\u266B','\u2726','\u2727','\u2728','\u2606'];
  function launchParticles(){
    var count = 22;
    for (var i = 0; i < count; i++){
      (function(){
        var el = document.createElement('div');
        el.className = 'particle';
        el.textContent = PARTICLE_GLYPHS[Math.floor(Math.random()*PARTICLE_GLYPHS.length)];
        var leftPct = 4 + Math.random()*22; // roughly around the hotspot area, drifting outward
        var topPct = 48 + Math.random()*20;
        var dx = (Math.random()*220 - 60) + 'px';
        var dy = (-160 - Math.random()*160) + 'px';
        var rot = (Math.random()*140 - 70) + 'deg';
        var dur = 1 + Math.random()*0.8;
        var delay = Math.random()*0.5;
        var hue = Math.random() < 0.5 ? '#e8b768' : '#8fb0d8';

        el.style.left = leftPct + '%';
        el.style.top = topPct + '%';
        el.style.color = hue;
        el.style.fontSize = (14 + Math.random()*16) + 'px';
        el.style.setProperty('--dx', dx);
        el.style.setProperty('--dy', dy);
        el.style.setProperty('--rot', rot);
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = delay + 's';

        particleLayer.appendChild(el);
        el.addEventListener('animationend', function(){ el.remove(); });
      })();
    }
  }

  /* ============================================================
     SCENE TRANSITION (crumble out -> crumble in)
  ============================================================ */
  var transitioning = false;
  function goToCertificate(){
    if (transitioning) return;
    transitioning = true;

    threeGlow.classList.add('pulsing');
    launchParticles();

    setTimeout(function(){
      calendarStage.classList.remove('crumble-in');
      calendarStage.classList.add('crumble-out');
    }, 260);

    setTimeout(function(){
      calendarScene.classList.remove('active');
      calendarStage.classList.remove('crumble-out');
      threeGlow.classList.remove('pulsing');

      certificateScene.classList.add('active');
      certificateStage.classList.remove('crumble-out');
      certificateStage.classList.add('pop-in');
      liveRegion.textContent = 'Certificate revealed. Scratch the star.';
      transitioning = false;
    }, 900);
  }

  function goToCalendar(){
    if (transitioning) return;
    transitioning = true;

    certificateStage.classList.remove('crumble-in', 'pop-in');
    certificateStage.classList.add('crumble-out');

    setTimeout(function(){
      certificateScene.classList.remove('active');
      certificateStage.classList.remove('crumble-out');

      resetCertificate();

      calendarScene.classList.add('active');
      calendarStage.classList.remove('crumble-out', 'tap-shake');
      calendarStage.classList.add('crumble-in');
      pressLabel.classList.remove('fading');
      threeGlow.classList.add('idle');
      liveRegion.textContent = 'Back to the calendar.';
      transitioning = false;
    }, 640);
  }

  /* ============================================================
     RESET / REPLAY
  ============================================================ */
  function resetCertificate(){
    revealed = false;
    scratching = false;
    lastPt = null;
    canvas.style.transition = 'none';
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'auto';
    drawCoating();
    confettiLayer.innerHTML = '';
    replayBtn.classList.remove('visible');
  }

  replayBtn.addEventListener('click', function(){
    goToCalendar();
  });

  var tapCount = 0;
  var tapResetTimer = null;

  function resetTapCount(){
    tapCount = 0;
    if (tapResetTimer){ clearTimeout(tapResetTimer); tapResetTimer = null; }
  }

  function registerTap(){
    if (transitioning) return;
    tapCount++;
    pressLabel.classList.add('fading');
    threeGlow.classList.remove('idle');

    if (tapResetTimer) clearTimeout(tapResetTimer);
    tapResetTimer = setTimeout(resetTapCount, TAP_RESET_MS);

    if (tapCount >= TAPS_REQUIRED){
      resetTapCount();
      calendarStage.classList.remove('tap-shake');
      void calendarStage.offsetWidth; // restart animation
      calendarStage.classList.add('tap-shake');
      setTimeout(goToCertificate, 190);
    } else {
      // quick feedback pulse on each tap, growing a little stronger each time
      threeGlow.classList.remove('tapped');
      void threeGlow.offsetWidth; // restart animation
      threeGlow.classList.add('tapped');
      liveRegion.textContent = tapCount + ' of ' + TAPS_REQUIRED + ' presses';
    }
  }

  threeHotspot.addEventListener('click', function(){
    registerTap();
  });
  threeHotspot.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      registerTap();
    }
  });

  /* ============================================================
     BACKGROUND STARS (decorative, grey-green, twinkling)
  ============================================================ */
  var BG_STAR_COLORS = ['#a9b79c','#8fa07f','#b7c2ab','#95a688','#c3ccb8'];
  function initBgStars(){
    var layer = document.getElementById('bgStars');
    var count = window.innerWidth < 560 ? 20 : 32;
    for (var i = 0; i < count; i++){
      var el = document.createElement('div');
      el.className = 'bg-star';
      var size = 6 + Math.random()*20;
      el.style.left = (Math.random()*100) + '%';
      el.style.top = (Math.random()*100) + '%';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = BG_STAR_COLORS[Math.floor(Math.random()*BG_STAR_COLORS.length)];
      el.style.setProperty('--rot', Math.floor(Math.random()*40 - 20) + 'deg');
      el.style.setProperty('--op-min', (0.08 + Math.random()*0.1).toFixed(2));
      el.style.setProperty('--op-max', (0.28 + Math.random()*0.24).toFixed(2));
      el.style.animationDuration = (2.6 + Math.random()*3.4) + 's';
      el.style.animationDelay = (Math.random()*3) + 's';
      layer.appendChild(el);
    }
  }

  /* ============================================================
     INIT
  ============================================================ */
  drawCoating();
  initBgStars();
  threeGlow.classList.add('idle');

})();
