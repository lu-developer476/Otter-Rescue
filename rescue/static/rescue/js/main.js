const $ = (selector) => document.querySelector(selector);
const modal = $('#game-modal'); const gameForm = $('#game-form'); const game = $('#game');
const canvas = $('#otter-canvas'); const context = canvas.getContext('2d'); const readyModal = $('#ready-modal');
const hud = { trash: $('#trash-count'), shells: $('#shell-count'), enemies: $('#enemy-count'), health: $('#health-count'), score: $('#score-count'), message: $('#game-message'), goal: $('#bonus-goal'), best: $('#best-score'), summary: $('#game-summary') };
const pauseButton = $('#pause-game');
const soundToggle = $('#sound-toggle'); const soundVolume = $('#sound-volume'); const soundVolumeValue = $('#sound-volume-value');
const sound = {
  enabled: localStorage.getItem('otter-rescue-sound-enabled') !== 'false',
  volume: Number(localStorage.getItem('otter-rescue-sound-volume') || 70), context: null,
  unlock() { if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)(); if (this.context.state === 'suspended') this.context.resume(); },
  play(notes, type = 'sine') {
    if (!this.enabled || !window.AudioContext && !window.webkitAudioContext) return;
    this.unlock(); const start = this.context.currentTime;
    notes.forEach(([frequency, offset = 0, duration = .12]) => {
      const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(0.0001, start + offset); gain.gain.exponentialRampToValueAtTime(Math.max(.001, this.volume / 1000), start + offset + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, start + offset + duration); oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(start + offset); oscillator.stop(start + offset + duration + .02);
    });
  },
};
function updateSoundControls() { soundToggle.setAttribute('aria-pressed', String(sound.enabled)); soundToggle.textContent = sound.enabled ? '♬ Sonido: sí' : '♬ Sonido: no'; soundVolume.value = sound.volume; soundVolumeValue.textContent = `${sound.volume}%`; }
const world = { width: canvas.width, height: canvas.height, keys: {}, playing: false, paused: false, mode: 'En equipo', difficulty: 'Curiosa', scene: 'Delta al atardecer', tick: 0, level: 1, spawn: 0 };
let player, trash, shells, enemies, currents, home, dam, bonuses, animation;
const random = (min, max) => Math.random() * (max - min) + min;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const highScore = () => Number(localStorage.getItem('otter-rescue-high-score') || 0);
const difficultyBase = () => world.difficulty === 'Guardiana' ? 1.35 : 1;
const isDefence = () => world.mode === 'Defensa de represa';
function updateBest(score = highScore()) { hud.best.textContent = `${score} puntos`; }
function scenePalette() {
  return {
    'Delta al atardecer': ['#ffc66e', '#ff9f75', '#42aeb8', '#438f77'],
    'Laguna de juncos': ['#d4f1bd', '#80c89d', '#2697aa', '#487e5d'],
    'Bosque inundado': ['#bdd7c3', '#718f6a', '#397f8a', '#365642'],
    'Estuario nocturno': ['#172a50', '#55457e', '#1d738e', '#1c4c62'],
  }[world.scene];
}
function resetGame() {
  player = { x: isDefence() ? 225 : 108, y: 410, radius: 27, health: 3, collected: 0, shells: 0, score: 0, invincible: 0, shield: 0 };
  home = { x: 855, y: 108, radius: 47 }; dam = { x: 65, y: 290, health: 100, maxHealth: 100, branches: 0 };
  const layouts = {
    'Delta al atardecer': [[145,250],[280,190],[425,250],[580,170],[710,260],[845,190],[180,420],[370,370],[530,460],[690,380]],
    'Laguna de juncos': [[120,190],[290,330],[450,160],[610,315],[805,180],[190,450],[390,430],[565,405],[790,450]],
    'Bosque inundado': [[160,135],[320,265],[495,175],[680,315],[830,140],[225,450],[440,395],[640,470],[835,410]],
    'Estuario nocturno': [[115,285],[270,145],[440,300],[600,180],[780,290],[180,460],[370,405],[545,470],[740,400]],
  }[world.scene];
  trash = layouts.map(([x, y], index) => ({ x, y, type: ['can','bag','bottle'][index % 3], radius: index % 3 === 1 ? 17 : 14, taken: false }));
  shells = layouts.slice(0, 5).map(([x, y], index) => ({ x: x + 42, y: y + (index % 2 ? 55 : -44), radius: 12, taken: false }));
  currents = world.scene === 'Bosque inundado' ? [{x:355,y:400,radius:78,dx:.8,dy:-.55},{x:700,y:300,radius:66,dx:-1.05,dy:.3}] : world.scene === 'Estuario nocturno' ? [{x:430,y:390,radius:65,dx:1.35,dy:0},{x:760,y:440,radius:62,dx:-.75,dy:-.7}] : [{x:350,y:405,radius:70,dx:1,dy:-.3},{x:690,y:390,radius:68,dx:-1,dy:.25}];
  enemies = isDefence() ? [] : Array.from({ length: 5 + (world.difficulty === 'Guardiana' ? 2 : 0) }, (_, i) => roamingEnemy(i));
  bonuses = []; world.tick = 0; world.level = 1; world.spawn = 0; world.playing = true; world.paused = false;
  pauseButton.textContent = 'Ⅱ Pausar'; pauseButton.setAttribute('aria-pressed', 'false');
  hud.goal.textContent = isDefence() ? 'Protegé la represa y reuní ramas' : `Encontrá ${shells.length} conchas perdidas`;
  updateHud(isDefence() ? '¡Construí y defendé! Las amenazas llegan desde la derecha.' : 'Limpiá el humedal y esquivá a los nuevos invasores.');
}
function roamingEnemy(index) {
  const kinds = world.scene === 'Estuario nocturno' ? ['jellyfish','eel','gull','crab'] : world.scene === 'Bosque inundado' ? ['beaver','eel','crab','gull'] : ['gull','crab','eel','turtle'];
  const kind = kinds[index % kinds.length]; return { x: 150 + (index * 143) % 700, y: 100 + (index * 87) % 370, kind, radius: kind === 'beaver' ? 25 : kind === 'jellyfish' ? 19 : 21, speed: random(.75,1.25) * difficultyBase(), direction: index % 2 ? 1 : -1, wave: index * 2 };
}
function spawnDefence() {
  const level = 1 + Math.floor(world.tick / 600); if (level > world.level) { world.level = level; sound.play([[392,0,.12],[523,.13,.18]], 'triangle'); updateHud(`¡Oleada ${level}! El río acelera sus desafíos.`); }
  const interval = Math.max(30, 92 - world.level * 7 - (world.difficulty === 'Guardiana' ? 12 : 0));
  if (++world.spawn < interval) return; world.spawn = 0;
  const roll = Math.random();
  if (roll < .22) { bonuses.push({x:990,y:random(80,485),kind: Math.random() < .5 ? 'branch' : 'heart',radius:15,speed:2.1 + world.level*.08}); return; }
  const kinds = ['log','plastic','beaver','gull','eel']; const kind = kinds[Math.floor(Math.random() * Math.min(kinds.length, 2 + Math.ceil(world.level / 2)))];
  enemies.push({ x: 995, y: random(75,480), kind, radius: kind === 'log' ? 25 : 21, speed: (1.55 + world.level * .13) * difficultyBase(), direction: -1, wave: random(0, 6), attacking: true });
}
function updateHud(message) {
  hud.trash.textContent = isDefence() ? `${dam.branches} ramas` : `${player.collected} / ${trash.length}`;
  hud.shells.textContent = isDefence() ? `${Math.ceil(dam.health)}%` : `${player.shells} / ${shells.length}`;
  hud.enemies.textContent = isDefence() ? `${enemies.length} · oleada ${world.level}` : enemies.length;
  hud.health.textContent = player.health; hud.score.textContent = player.score; if (message) hud.message.textContent = message;
}
function drawBackground() {
  const [top, horizon, water, land] = scenePalette(); const gradient = context.createLinearGradient(0,0,0,540); gradient.addColorStop(0,top); gradient.addColorStop(.43,horizon); gradient.addColorStop(.44,water); gradient.addColorStop(1,water); context.fillStyle=gradient; context.fillRect(0,0,960,540);
  context.fillStyle = world.scene === 'Estuario nocturno' ? '#f6e8af' : '#fff0a8'; context.beginPath(); context.arc(world.scene === 'Estuario nocturno' ? 760 : 790,78, world.scene === 'Estuario nocturno'?28:42,0,Math.PI*2); context.fill();
  context.fillStyle=land; if(world.scene === 'Bosque inundado'){ for(let x=80;x<960;x+=155){context.fillRect(x,95,18,210);context.beginPath();context.arc(x+9,90,55,0,Math.PI*2);context.fill();} } else { context.beginPath(); context.ellipse(185,225,270,72,0,0,Math.PI*2); context.ellipse(760,220,300,87,0,0,Math.PI*2); context.fill(); }
  context.strokeStyle='rgba(255,255,255,.3)'; context.lineWidth=3; for(let y=320;y<540;y+=50){context.beginPath();context.moveTo(0,y);context.bezierCurveTo(230,y-15,500,y+15,960,y);context.stroke();}
  if(world.scene === 'Laguna de juncos'){context.strokeStyle='#356e4d';context.lineWidth=5;for(let x=30;x<960;x+=48){context.beginPath();context.moveTo(x,300);context.lineTo(x+random(-12,12),220);context.stroke();}}
}
function drawDam() { context.save(); context.translate(dam.x,dam.y); context.strokeStyle='#75523a'; context.lineWidth=17; for(let y=-105;y<=105;y+=32){context.beginPath();context.moveTo(-20,y);context.lineTo(74,y+12);context.stroke();} context.fillStyle='#fff9ed';context.font='800 14px Nunito';context.fillText(`REPRESA ${Math.ceil(dam.health)}%`,-20,-128);context.restore(); }
function drawHome(){ context.fillStyle='#5a402f';context.beginPath();context.arc(home.x,home.y,home.radius,Math.PI,0);context.fill();context.fillStyle='#162e30';context.beginPath();context.arc(home.x,home.y+12,21,Math.PI,0);context.fill();context.fillStyle='#fff9ed';context.font='bold 16px Nunito';context.fillText('CASA',home.x-24,home.y-58); }
function drawTrash(i){ context.save();context.translate(i.x,i.y); if(i.type==='can'){context.fillStyle='#f8f5e8';context.fillRect(-9,-13,18,26);context.fillStyle='#f66d57';context.fillRect(-10,-12,20,5);} if(i.type==='bottle'){context.fillStyle='#d6f1e7';context.fillRect(-8,-10,16,24);context.fillRect(-4,-17,8,8);} if(i.type==='bag'||i.type==='plastic'){context.fillStyle='#8d7182';context.beginPath();context.arc(0,0,15,0,Math.PI*2);context.fill();}context.restore(); }
function drawShell(i){context.save();context.translate(i.x,i.y);context.fillStyle='#ffe6af';context.beginPath();context.arc(0,2,13,Math.PI,0);context.fill();context.strokeStyle='#e59768';context.lineWidth=2;for(let x=-8;x<=8;x+=8){context.beginPath();context.moveTo(0,1);context.lineTo(x,-10);context.stroke();}context.restore();}
function drawEnemy(i){ context.save();context.translate(i.x,i.y); const bob=Math.sin(world.tick/12+i.wave)*4;
  if(i.kind==='gull'){context.translate(0,bob);context.fillStyle='#f5f2e8';context.beginPath();context.ellipse(0,0,18,10,0,0,Math.PI*2);context.fill();context.strokeStyle='#5d5576';context.lineWidth=6;context.beginPath();context.moveTo(-4,0);context.lineTo(-22,-10);context.moveTo(4,0);context.lineTo(22,-10);context.stroke();context.fillStyle='#f6bc48';context.fillRect(16,-2,10,4);}
  else if(i.kind==='crab'){context.fillStyle='#e96b52';context.beginPath();context.ellipse(0,2,21,14,0,0,Math.PI*2);context.fill();context.strokeStyle='#e96b52';context.lineWidth=4;for(let x=-14;x<=14;x+=9){context.beginPath();context.moveTo(x,8);context.lineTo(x+(x<0?-7:7),18);context.stroke();}}
  else if(i.kind==='eel'){context.rotate(bob*.04);context.strokeStyle='#334c55';context.lineWidth=12;context.lineCap='round';context.beginPath();context.moveTo(-18,0);context.quadraticCurveTo(0,-15,19,1);context.stroke();context.fillStyle='#f7d85d';context.beginPath();context.arc(18,1,5,0,Math.PI*2);context.fill();}
  else if(i.kind==='jellyfish'){context.fillStyle='#d98bc7';context.beginPath();context.arc(0,-4,16,Math.PI,0);context.fill();context.strokeStyle='#d98bc7';context.lineWidth=3;for(let x=-10;x<=10;x+=7){context.beginPath();context.moveTo(x,0);context.quadraticCurveTo(x+4,14,x,20);context.stroke();}}
  else if(i.kind==='beaver'){context.fillStyle='#76503b';context.beginPath();context.ellipse(0,0,25,15,0,0,Math.PI*2);context.fill();context.fillStyle='#efc687';context.fillRect(16,-4,8,10);}
  else {context.rotate(.25);context.strokeStyle='#795137';context.lineWidth=15;context.beginPath();context.moveTo(-25,0);context.lineTo(25,0);context.stroke();} context.restore(); }
function drawBonus(i){context.save();context.translate(i.x,i.y);context.fillStyle=i.kind==='branch'?'#745038':'#f66d57';context.beginPath();context.arc(0,0,16,0,Math.PI*2);context.fill();context.fillStyle='#fff9ed';context.font='bold 20px sans-serif';context.fillText(i.kind==='branch'?'➕':'♥',-10,7);context.restore();}
function drawOtter(){const {x,y,radius}=player;context.save();context.translate(x,y);if(player.invincible>0&&Math.floor(player.invincible/5)%2)context.globalAlpha=.45;context.fillStyle='#704a36';context.beginPath();context.ellipse(8,7,radius*1.35,radius*.78,0,0,Math.PI*2);context.fill();context.fillStyle='#8c6246';context.beginPath();context.arc(-13,-5,radius*.78,0,Math.PI*2);context.fill();context.fillStyle='#162e30';context.beginPath();context.arc(-22,-7,3.5,0,Math.PI*2);context.arc(-8,-7,3.5,0,Math.PI*2);context.fill();if(player.shield>0){context.strokeStyle='#ffe476';context.lineWidth=4;context.beginPath();context.arc(0,0,42,0,Math.PI*2);context.stroke();}context.restore();}
function movePlayer(){const speed=(world.difficulty==='Guardiana'?3.2:4)*(player.shield>0?1.08:1);if(world.keys.ArrowUp||world.keys.w)player.y-=speed;if(world.keys.ArrowDown||world.keys.s)player.y+=speed;if(world.keys.ArrowLeft||world.keys.a)player.x-=speed;if(world.keys.ArrowRight||world.keys.d)player.x+=speed;player.x=Math.max(player.radius,Math.min(930,player.x));player.y=Math.max(player.radius,Math.min(513,player.y));}
function hit(message){if(player.invincible>0||player.shield>0)return;player.health--;player.invincible=80;sound.play([[180,0,.17],[130,.1,.22]], 'sawtooth');updateHud(message);if(!player.health)endGame('La nutria necesita descansar. Tocá Reiniciar para intentarlo de nuevo.');}
function endGame(message){world.playing=false;const best=Math.max(highScore(),player.score);localStorage.setItem('otter-rescue-high-score',best);updateBest(best);updateHud(message);}
function finishMission(){const bonus=player.shells===shells.length?100:0;player.score+=bonus;sound.play([[523,0,.12],[659,.13,.12],[784,.26,.28]], 'triangle');hud.goal.textContent=bonus?'¡Colección completa! +100 puntos':'Volvé a explorar para encontrar las conchas';endGame(`¡Misión cumplida! ${bonus?'¡Bonus de exploradora!':'La nutria volvió con su familia.'} 🦦`);}
function updateExplore(){const level=1+Math.floor(world.tick/720);if(level>world.level){world.level=level;enemies.push(roamingEnemy(enemies.length+level));sound.play([[330,0,.14],[440,.12,.16]], 'triangle');updateHud(`¡El humedal cambia! Nivel de desafío ${level}.`);}currents.forEach(c=>{if(distance(player,c)<c.radius){player.x+=c.dx;player.y+=c.dy;}});trash.forEach(i=>{if(!i.taken&&distance(player,i)<player.radius+i.radius){i.taken=true;player.collected++;player.score+=20;sound.play([[294,0,.09],[392,.08,.13]], 'sine');updateHud('¡Residuo rescatado! +20 puntos');}});shells.forEach(i=>{if(!i.taken&&distance(player,i)<player.radius+i.radius){i.taken=true;player.shells++;player.score+=15;sound.play([[659,0,.1],[880,.09,.16]], 'triangle');updateHud('¡Concha encontrada! +15 puntos');}});enemies.forEach(i=>{i.x+=i.speed*(1+(world.level-1)*.12)*i.direction;i.y+=Math.sin((world.tick+i.x)/25)*.55;if(i.x<35||i.x>925)i.direction*=-1;if(distance(player,i)<player.radius+i.radius)hit('¡Un invasor te bloqueó el paso!');});if(player.collected===trash.length&&distance(player,home)<player.radius+home.radius)finishMission();}
function updateDefence(){spawnDefence(); enemies.forEach(i=>{i.x-=i.speed;i.y+=Math.sin((world.tick+i.wave)/18)*.7;if(distance(player,i)<player.radius+i.radius){i.x=1000;player.score+=12;dam.branches++;sound.play([[440,0,.1],[587,.1,.14]], 'square');updateHud('¡Atajaste una amenaza! +12 puntos');}if(i.x<i.radius+72){i.x=1000;dam.health-=i.kind==='beaver'?18:11;sound.play([[160,0,.2]], 'sawtooth');updateHud('¡La represa recibió un golpe!');}});bonuses.forEach(i=>{i.x-=i.speed;if(distance(player,i)<player.radius+i.radius){i.x=-40;if(i.kind==='branch'){dam.branches++;dam.health=Math.min(100,dam.health+12);player.score+=18;sound.play([[392,0,.1],[523,.1,.14]], 'triangle');updateHud('¡Rama entregada! Represa reparada.');}else{player.health=Math.min(3,player.health+1);player.shield=220;sound.play([[523,0,.1],[659,.1,.16]], 'sine');updateHud('¡Corazón de río! Escudo temporal.');}}});enemies=enemies.filter(i=>i.x>-50&&i.x<1030);bonuses=bonuses.filter(i=>i.x>-40);if(dam.health<=0)endGame('La represa cedió. Reuní ramas y atajá las amenazas más temprano.');}
function update(){if(!world.playing||world.paused)return;world.tick++;movePlayer();isDefence()?updateDefence():updateExplore();if(player.invincible>0)player.invincible--;if(player.shield>0)player.shield--;}
function render(){drawBackground();if(isDefence())drawDam();else{currents.forEach(c=>{context.strokeStyle='rgba(234,255,253,.8)';context.lineWidth=4;context.setLineDash([9,9]);context.beginPath();context.ellipse(c.x,c.y,c.radius,c.radius*.52,0,0,Math.PI*2);context.stroke();context.setLineDash([]);});drawHome();trash.filter(i=>!i.taken).forEach(drawTrash);shells.filter(i=>!i.taken).forEach(drawShell);}bonuses.forEach(drawBonus);enemies.forEach(drawEnemy);drawOtter();}
function loop(){render();update();animation=requestAnimationFrame(loop);} function beginGame(){sound.unlock();sound.play([[392,0,.1],[523,.1,.16]], 'triangle');cancelAnimationFrame(animation);resetGame();loop();}
function togglePause(){if(!world.playing)return;world.paused=!world.paused;sound.play(world.paused?[[330,0,.12]]:[[440,0,.12]], 'sine');pauseButton.textContent=world.paused?'▶ Reanudar':'Ⅱ Pausar';pauseButton.setAttribute('aria-pressed',String(world.paused));hud.message.textContent=world.paused?'Partida pausada.':'¡Seguimos!';}
function clearMovement(){['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].forEach(k=>world.keys[k]=false);} function setCanvasDirection(x,y){clearMovement();if(Math.abs(x)<12&&Math.abs(y)<12)return;world.keys[Math.abs(x)>Math.abs(y)?(x>0?'ArrowRight':'ArrowLeft'):(y>0?'ArrowDown':'ArrowUp')]=true;}
document.querySelectorAll('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>modal.showModal?.()));$('[data-close-modal]').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(k==='p'&&!e.repeat){togglePause();e.preventDefault();}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(k)){world.keys[k]=true;e.preventDefault();}});window.addEventListener('keyup',e=>world.keys[e.key.length===1?e.key.toLowerCase():e.key]=false);window.addEventListener('blur',clearMovement);
document.querySelectorAll('[data-direction]').forEach(b=>{const k=({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'})[b.dataset.direction];b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);world.keys[k]=true;e.preventDefault();});['pointerup','pointercancel','lostpointercapture'].forEach(name=>b.addEventListener(name,e=>{world.keys[k]=false;e.preventDefault();}));});let touch;canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;touch={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(touch?.id===e.pointerId)setCanvasDirection(e.clientX-touch.x,e.clientY-touch.y);});['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>{touch=null;clearMovement();}));
pauseButton.addEventListener('click',togglePause);$('#restart-game').addEventListener('click',beginGame);$('#start-game').addEventListener('click',()=>{readyModal.close();beginGame();});gameForm.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(gameForm);world.mode=f.get('mode');world.difficulty=f.get('difficulty');world.scene=f.get('scene');hud.summary.textContent=`${world.mode}, ${world.scene}. Dificultad inicial: ${world.difficulty}; el desafío aumenta con el tiempo.`;game.hidden=false;modal.close();game.scrollIntoView({behavior:'smooth',block:'start'});game.focus({preventScroll:true});resetGame();render();readyModal.showModal?.();});updateBest();
soundToggle.addEventListener('click',()=>{sound.enabled=!sound.enabled;localStorage.setItem('otter-rescue-sound-enabled',sound.enabled);if(sound.enabled){sound.unlock();sound.play([[523,0,.1],[659,.1,.14]], 'triangle');}updateSoundControls();});soundVolume.addEventListener('input',()=>{sound.volume=Number(soundVolume.value);localStorage.setItem('otter-rescue-sound-volume',sound.volume);updateSoundControls();});updateSoundControls();
