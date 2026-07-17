const modal = document.querySelector('#game-modal');
const gameForm = document.querySelector('#game-form');
const game = document.querySelector('#game');
const gameSummary = document.querySelector('#game-summary');
const canvas = document.querySelector('#otter-canvas');
const context = canvas.getContext('2d');
const trashCount = document.querySelector('#trash-count');
const shellCount = document.querySelector('#shell-count');
const enemyCount = document.querySelector('#enemy-count');
const healthCount = document.querySelector('#health-count');
const scoreCount = document.querySelector('#score-count');
const gameMessage = document.querySelector('#game-message');
const bonusGoal = document.querySelector('#bonus-goal');
const bestScore = document.querySelector('#best-score');
const readyModal = document.querySelector('#ready-modal');
const pauseButton = document.querySelector('#pause-game');
const startButton = document.querySelector('#start-game');

const world = { width: canvas.width, height: canvas.height, keys: {}, playing: false, paused: false, difficulty: 'Curiosa', scene: 'Delta al atardecer', tick: 0 };
let player; let trash; let shells; let enemies; let currents; let home; let animation;

function random(min, max) { return Math.random() * (max - min) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function highScore() { return Number(localStorage.getItem('otter-rescue-high-score') || 0); }
function updateBestScore(score = highScore()) { bestScore.textContent = `${score} puntos`; }

function resetGame() {
  const hard = world.difficulty === 'Guardiana';
  player = { x: 108, y: 420, radius: 27, health: 3, collected: 0, shells: 0, score: 0, invincible: 0 };
  home = { x: 855, y: 108, radius: 47 };
  const debris = [
    [155, 250, 'can', 'land'], [275, 215, 'bag', 'land'], [405, 164, 'can', 'land'], [555, 250, 'bottle', 'land'], [700, 195, 'bag', 'land'], [820, 250, 'can', 'land'],
    [130, 360, 'can', 'water'], [245, 460, 'bottle', 'water'], [365, 330, 'bag', 'water'], [480, 445, 'can', 'water'], [605, 365, 'bottle', 'water'], [720, 470, 'bag', 'water'], [850, 370, 'can', 'water'], [890, 430, 'bottle', 'water'],
  ];
  trash = debris.map(([x, y, type, zone]) => ({ x, y, type, zone, radius: type === 'bag' ? 17 : 14, taken: false }));
  shells = [{ x: 205, y: 410, radius: 12, taken: false }, { x: 465, y: 310, radius: 12, taken: false }, { x: 625, y: 445, radius: 12, taken: false }, { x: 755, y: 330, radius: 12, taken: false }, { x: 430, y: 105, radius: 12, taken: false }];
  enemies = Array.from({ length: hard ? 10 : 7 }, (_, index) => {
    const kind = index % 4 === 0 ? 'bird' : index % 3 === 0 ? 'crab' : 'eel';
    return { x: 170 + (index * 107) % 670, y: kind === 'bird' ? 92 + (index * 43) % 150 : 310 + (index * 71) % 180, radius: kind === 'bird' ? 18 : index % 3 === 0 ? 24 : 20, speed: random(.7, 1.25) * (hard ? 1.2 : 1), direction: index % 2 ? 1 : -1, kind, wingOffset: index * 1.8 };
  });
  currents = hard
    ? [{ x: 310, y: 365, radius: 68, dx: 1.15, dy: -.34 }, { x: 555, y: 420, radius: 73, dx: -1.2, dy: -.38 }, { x: 785, y: 365, radius: 62, dx: .9, dy: .55 }]
    : [{ x: 350, y: 405, radius: 72, dx: 1.05, dy: -.32 }, { x: 690, y: 390, radius: 69, dx: -1.05, dy: .24 }];
  world.tick = 0; world.playing = true; world.paused = false;
  pauseButton.textContent = 'Ⅱ Pausar'; pauseButton.setAttribute('aria-pressed', 'false');
  bonusGoal.textContent = 'Encontrá 5 conchas perdidas';
  updateHud('Limpiá el humedal y esquivá a los invasores.');
}

function updateHud(message) {
  trashCount.textContent = `${player.collected} / ${trash.length}`;
  shellCount.textContent = `${player.shells} / ${shells.length}`;
  enemyCount.textContent = enemies.length;
  healthCount.textContent = player.health;
  scoreCount.textContent = player.score;
  if (message) gameMessage.textContent = message;
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, world.height); const isLagoon = world.scene === 'Laguna de juncos';
  sky.addColorStop(0, isLagoon ? '#c7e7cf' : '#b9e6e5'); sky.addColorStop(.42, '#d9f2df'); sky.addColorStop(.43, '#75ccd3'); sky.addColorStop(1, isLagoon ? '#299caf' : '#3daebd'); context.fillStyle = sky; context.fillRect(0, 0, world.width, world.height);
  context.fillStyle = '#fff0a8'; context.beginPath(); context.arc(770, 78, 42, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#72bd83'; context.beginPath(); context.ellipse(170, 226, 250, 74, 0, 0, Math.PI * 2); context.ellipse(725, 220, 310, 88, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#56ae7d'; context.beginPath(); context.ellipse(490, 290, 115, 32, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = 'rgba(255,255,255,.32)'; context.lineWidth = 3; for (let y = 305; y < 540; y += 52) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(190, y - 18, 330, y + 18, 510, y); context.bezierCurveTo(700, y - 18, 820, y + 18, 960, y); context.stroke(); }
}
function drawHome() { context.fillStyle = '#5a402f'; context.beginPath(); context.arc(home.x, home.y, home.radius, Math.PI, 0); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(home.x, home.y + 12, 21, Math.PI, 0); context.fill(); context.fillStyle = '#fff9ed'; context.font = 'bold 16px Nunito'; context.fillText('CASA', home.x - 24, home.y - 58); }
function drawTrash(item) {
  context.save(); context.translate(item.x, item.y); context.rotate(item.type === 'bag' ? -.2 : .25);
  if (item.zone === 'water') { context.globalAlpha = .88; context.fillStyle = 'rgba(21,111,130,.35)'; context.fillRect(-18, 7, 36, 10); }
  if (item.type === 'can') { context.fillStyle = '#f8f5e8'; context.fillRect(-9, -13, 18, 26); context.fillStyle = '#f66d57'; context.fillRect(-10, -12, 20, 5); context.fillStyle = '#ffd653'; context.fillRect(-9, 4, 18, 5); }
  if (item.type === 'bottle') { context.fillStyle = '#d6f1e7'; context.fillRect(-8, -10, 16, 24); context.fillRect(-4, -17, 8, 8); context.fillStyle = '#f66d57'; context.fillRect(-9, 1, 18, 7); }
  if (item.type === 'bag') { context.fillStyle = '#8d7182'; context.beginPath(); context.arc(0, 0, 15, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#efe1d7'; context.lineWidth = 3; context.beginPath(); context.arc(0, -13, 8, Math.PI, 0); context.stroke(); }
  context.restore();
}
function drawShell(item) { context.save(); context.translate(item.x, item.y); context.fillStyle = '#ffe6af'; context.beginPath(); context.arc(0, 2, 13, Math.PI, 0); context.fill(); context.strokeStyle = '#e59768'; context.lineWidth = 2; for (let x = -8; x <= 8; x += 8) { context.beginPath(); context.moveTo(0, 1); context.lineTo(x, -10); context.stroke(); } context.restore(); }
function drawEnemy(item) { context.save(); context.translate(item.x, item.y); if (item.kind === 'bird') { const flap = Math.sin(world.tick / 4 + item.wingOffset) * 8; context.fillStyle = '#6b4a81'; context.beginPath(); context.arc(0, 2, 10, 0, Math.PI * 2); context.fill(); context.fillStyle = '#a77abb'; context.beginPath(); context.ellipse(-8, flap / 2, 13, 5, -.38, 0, Math.PI * 2); context.ellipse(8, flap / 2, 13, 5, .38, 0, Math.PI * 2); context.fill(); context.fillStyle = '#fff0a8'; context.beginPath(); context.moveTo(9, 3); context.lineTo(18, 6); context.lineTo(9, 9); context.closePath(); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(4, 0, 2, 0, Math.PI * 2); context.fill(); } else if (item.kind === 'crab') { context.fillStyle = '#e96b52'; context.beginPath(); context.ellipse(0, 2, 21, 14, 0, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#e96b52'; context.lineWidth = 5; [-13, -5, 5, 13].forEach((x) => { context.beginPath(); context.moveTo(x, 8); context.lineTo(x + (x < 0 ? -7 : 7), 18); context.stroke(); }); context.fillStyle = '#162e30'; context.beginPath(); context.arc(-7, -4, 2.5, 0, Math.PI * 2); context.arc(7, -4, 2.5, 0, Math.PI * 2); context.fill(); } else { context.rotate(Math.sin(world.tick / 20 + item.x) * .35); context.strokeStyle = '#334c55'; context.lineWidth = 12; context.lineCap = 'round'; context.beginPath(); context.moveTo(-18, 0); context.quadraticCurveTo(0, -15, 19, 1); context.stroke(); context.fillStyle = '#f7d85d'; context.beginPath(); context.arc(18, 1, 5, 0, Math.PI * 2); context.fill(); } context.restore(); }
function drawCurrent(current) { const angle = Math.atan2(current.dy, current.dx); context.save(); context.translate(current.x, current.y); context.rotate(angle); context.strokeStyle = 'rgba(234,255,253,.8)'; context.lineWidth = 4; context.setLineDash([9, 9]); context.beginPath(); context.ellipse(0, 0, current.radius, current.radius * .52, 0, 0, Math.PI * 2); context.stroke(); context.setLineDash([]); context.fillStyle = 'rgba(234,255,253,.9)'; for (let x = -current.radius * .5; x <= current.radius * .45; x += 28) { const bob = Math.sin(world.tick / 9 + x) * 4; context.beginPath(); context.moveTo(x, bob); context.lineTo(x + 15, bob); context.lineTo(x + 8, bob - 6); context.closePath(); context.fill(); } context.restore(); }
function drawOtter() { const { x, y, radius } = player; context.save(); context.translate(x, y); if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2) context.globalAlpha = .45; context.fillStyle = '#704a36'; context.beginPath(); context.ellipse(8, 7, radius * 1.35, radius * .78, 0, 0, Math.PI * 2); context.fill(); context.fillStyle = '#8c6246'; context.beginPath(); context.arc(-13, -5, radius * .78, 0, Math.PI * 2); context.fill(); context.fillStyle = '#704a36'; context.beginPath(); context.arc(-29, -26, 9, 0, Math.PI * 2); context.arc(-2, -27, 9, 0, Math.PI * 2); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(-22, -7, 3.5, 0, Math.PI * 2); context.arc(-8, -7, 3.5, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#162e30'; context.lineWidth = 2; context.beginPath(); context.arc(-15, 4, 6, 0, Math.PI); context.stroke(); context.restore(); }
function finishMission() { world.playing = false; const bonus = player.shells === shells.length ? 100 : 0; player.score += bonus; const score = Math.max(highScore(), player.score); localStorage.setItem('otter-rescue-high-score', score); updateBestScore(score); bonusGoal.textContent = bonus ? '¡Colección completa! +100 puntos' : 'Volvé a explorar para encontrar las conchas'; updateHud(`¡Misión cumplida! ${bonus ? '¡Bonus de exploradora!' : 'La nutria volvió con su familia.'} 🦦`); }
function update() {
  if (!world.playing || world.paused) return; world.tick += 1; const speed = world.difficulty === 'Guardiana' ? 3.15 : 4;
  if (world.keys.ArrowUp || world.keys.w) player.y -= speed; if (world.keys.ArrowDown || world.keys.s) player.y += speed; if (world.keys.ArrowLeft || world.keys.a) player.x -= speed; if (world.keys.ArrowRight || world.keys.d) player.x += speed;
  currents.forEach((current) => { if (distance(player, current) < current.radius) { player.x += current.dx; player.y += current.dy; } });
  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
  trash.forEach((item) => { if (!item.taken && distance(player, item) < player.radius + item.radius) { item.taken = true; player.collected += 1; player.score += 20; updateHud(player.collected === trash.length ? '¡El humedal está limpio! Ahora llevá a la nutria a casa.' : '¡Residuo rescatado! +20 puntos'); } });
  shells.forEach((item) => { if (!item.taken && distance(player, item) < player.radius + item.radius) { item.taken = true; player.shells += 1; player.score += 15; updateHud('¡Concha encontrada! +15 puntos'); } });
  enemies.forEach((item) => { item.x += item.speed * item.direction; if (item.x < 45 || item.x > 915) item.direction *= -1; item.y += Math.sin((world.tick + item.x) / (item.kind === 'bird' ? 20 : 35)) * (item.kind === 'bird' ? .7 : .3); if (player.invincible <= 0 && distance(player, item) < player.radius + item.radius) { player.health -= 1; player.invincible = 80; const name = item.kind === 'crab' ? 'cangrejo invasor' : item.kind === 'bird' ? 'ave invasora' : 'pez invasor'; updateHud(`¡Un ${name} te bloqueó el paso!`); if (!player.health) { world.playing = false; gameMessage.textContent = 'La nutria necesita descansar. Tocá Reiniciar para intentarlo de nuevo.'; } } });
  if (player.invincible > 0) player.invincible -= 1; if (player.collected === trash.length && distance(player, home) < player.radius + home.radius) finishMission();
}
function renderGame() { drawBackground(); currents.forEach(drawCurrent); drawHome(); trash.filter((item) => !item.taken).forEach(drawTrash); shells.filter((item) => !item.taken).forEach(drawShell); enemies.forEach(drawEnemy); drawOtter(); }
function loop() { renderGame(); update(); animation = requestAnimationFrame(loop); }
function beginGame() { cancelAnimationFrame(animation); resetGame(); loop(); }
function togglePause() {
  if (!world.playing) return;
  world.paused = !world.paused;
  pauseButton.textContent = world.paused ? '▶ Reanudar' : 'Ⅱ Pausar';
  pauseButton.setAttribute('aria-pressed', String(world.paused));
  gameMessage.textContent = world.paused ? 'Partida pausada. Cuando quieras, podés continuar.' : '¡Seguimos! La nutria está lista para nadar.';
}
function openModal() { if (typeof modal.showModal === 'function') modal.showModal(); }
document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', openModal)); document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close()); modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
window.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'p' && !event.repeat) { togglePause(); event.preventDefault(); } if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) { world.keys[event.key] = true; event.preventDefault(); } }); window.addEventListener('keyup', (event) => { world.keys[event.key] = false; });
document.querySelectorAll('[data-direction]').forEach((button) => { const key = ({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' })[button.dataset.direction]; ['pointerdown', 'pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => button.addEventListener(eventName, (event) => { world.keys[key] = eventName === 'pointerdown'; event.preventDefault(); })); });
pauseButton.addEventListener('click', togglePause); document.querySelector('#restart-game').addEventListener('click', beginGame); startButton.addEventListener('click', () => { readyModal.close(); beginGame(); }); gameForm.addEventListener('submit', (event) => { event.preventDefault(); const selections = new FormData(gameForm); world.difficulty = selections.get('difficulty'); world.scene = selections.get('scene'); gameSummary.textContent = `${selections.get('mode')}, ${world.scene}. Dificultad: ${world.difficulty}.`; game.hidden = false; modal.close(); game.scrollIntoView({ behavior: 'smooth', block: 'start' }); game.focus({ preventScroll: true }); resetGame(); renderGame(); if (typeof readyModal.showModal === 'function') readyModal.showModal(); else beginGame(); }); updateBestScore();
