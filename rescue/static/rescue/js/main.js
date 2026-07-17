const modal = document.querySelector('#game-modal');
const gameForm = document.querySelector('#game-form');
const game = document.querySelector('#game');
const gameSummary = document.querySelector('#game-summary');
const canvas = document.querySelector('#otter-canvas');
const context = canvas.getContext('2d');
const trashCount = document.querySelector('#trash-count');
const shellCount = document.querySelector('#shell-count');
const healthCount = document.querySelector('#health-count');
const scoreCount = document.querySelector('#score-count');
const gameMessage = document.querySelector('#game-message');
const bonusGoal = document.querySelector('#bonus-goal');
const bestScore = document.querySelector('#best-score');

const world = { width: canvas.width, height: canvas.height, keys: {}, playing: false, difficulty: 'Curiosa', scene: 'Delta al atardecer' };
let player; let trash; let shells; let hazards; let currents; let home; let animation;

function random(min, max) { return Math.random() * (max - min) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function highScore() { return Number(localStorage.getItem('otter-rescue-high-score') || 0); }
function updateBestScore(score = highScore()) { bestScore.textContent = `${score} puntos`; }

function resetGame() {
  player = { x: 105, y: 405, radius: 28, health: 3, collected: 0, shells: 0, score: 0, invincible: 0 };
  home = { x: 850, y: 110, radius: 48 };
  trash = Array.from({ length: 8 }, (_, index) => ({ x: 210 + (index % 4) * 165 + random(-35, 35), y: 120 + Math.floor(index / 4) * 220 + random(-45, 45), radius: 14, taken: false }));
  shells = [{ x: 310, y: 395, radius: 13, taken: false }, { x: 590, y: 170, radius: 13, taken: false }, { x: 780, y: 395, radius: 13, taken: false }];
  hazards = Array.from({ length: world.difficulty === 'Guardiana' ? 6 : 4 }, (_, index) => ({ x: 250 + index * 135, y: random(95, 450), radius: 19, speed: random(.65, 1.15), direction: index % 2 ? 1 : -1 }));
  currents = world.difficulty === 'Guardiana' ? [{ x: 435, y: 370, radius: 72, force: 1.25 }, { x: 690, y: 235, radius: 62, force: -1.1 }] : [{ x: 530, y: 330, radius: 67, force: .8 }];
  world.playing = true;
  bonusGoal.textContent = 'Encontrá 3 conchas perdidas';
  updateHud('Juntá los residuos y llegá a la madriguera.');
}

function updateHud(message) {
  trashCount.textContent = `${player.collected} / ${trash.length}`;
  shellCount.textContent = `${player.shells} / ${shells.length}`;
  healthCount.textContent = player.health;
  scoreCount.textContent = player.score;
  if (message) gameMessage.textContent = message;
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, world.height);
  const isLagoon = world.scene === 'Laguna de juncos';
  sky.addColorStop(0, isLagoon ? '#c7e7cf' : '#b9e6e5'); sky.addColorStop(.42, '#d9f2df'); sky.addColorStop(.43, '#75ccd3'); sky.addColorStop(1, isLagoon ? '#299caf' : '#3daebd');
  context.fillStyle = sky; context.fillRect(0, 0, world.width, world.height);
  context.fillStyle = '#fff0a8'; context.beginPath(); context.arc(770, 78, 42, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#72bd83'; context.beginPath(); context.ellipse(170, 226, 250, 74, 0, 0, Math.PI * 2); context.ellipse(725, 220, 310, 88, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = 'rgba(255,255,255,.32)'; context.lineWidth = 3;
  for (let y = 305; y < 540; y += 52) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(190, y - 18, 330, y + 18, 510, y); context.bezierCurveTo(700, y - 18, 820, y + 18, 960, y); context.stroke(); }
}
function drawHome() { context.fillStyle = '#5a402f'; context.beginPath(); context.arc(home.x, home.y, home.radius, Math.PI, 0); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(home.x, home.y + 12, 21, Math.PI, 0); context.fill(); context.fillStyle = '#fff9ed'; context.font = 'bold 16px Nunito'; context.fillText('CASA', home.x - 24, home.y - 58); }
function drawTrash(item) { context.save(); context.translate(item.x, item.y); context.rotate(.32); context.fillStyle = '#f8f5e8'; context.fillRect(-9, -14, 18, 28); context.fillStyle = '#f66d57'; context.fillRect(-10, -13, 20, 5); context.fillStyle = '#286c78'; context.fillRect(-5, -8, 10, 15); context.restore(); }
function drawShell(item) { context.save(); context.translate(item.x, item.y); context.fillStyle = '#ffe6af'; context.beginPath(); context.arc(0, 2, 14, Math.PI, 0); context.fill(); context.strokeStyle = '#e59768'; context.lineWidth = 2; for (let x = -8; x <= 8; x += 8) { context.beginPath(); context.moveTo(0, 1); context.lineTo(x, -10); context.stroke(); } context.restore(); }
function drawHazard(item) { context.save(); context.translate(item.x, item.y); context.rotate(.2); context.fillStyle = '#f6d856'; context.fillRect(-14, -20, 28, 40); context.fillStyle = '#f66d57'; context.fillRect(-15, -9, 30, 8); context.restore(); }
function drawCurrent(current) { context.save(); context.translate(current.x, current.y); context.strokeStyle = 'rgba(234,255,253,.75)'; context.lineWidth = 4; context.setLineDash([10, 9]); context.beginPath(); context.arc(0, 0, current.radius, .2, Math.PI * 1.75); context.stroke(); context.restore(); }
function drawOtter() { const { x, y, radius } = player; context.save(); context.translate(x, y); if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2) context.globalAlpha = .45; context.fillStyle = '#704a36'; context.beginPath(); context.ellipse(8, 7, radius * 1.35, radius * .78, 0, 0, Math.PI * 2); context.fill(); context.fillStyle = '#8c6246'; context.beginPath(); context.arc(-13, -5, radius * .78, 0, Math.PI * 2); context.fill(); context.fillStyle = '#704a36'; context.beginPath(); context.arc(-29, -26, 9, 0, Math.PI * 2); context.arc(-2, -27, 9, 0, Math.PI * 2); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(-22, -7, 3.5, 0, Math.PI * 2); context.arc(-8, -7, 3.5, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#162e30'; context.lineWidth = 2; context.beginPath(); context.arc(-15, 4, 6, 0, Math.PI); context.stroke(); context.restore(); }

function finishMission() { world.playing = false; const bonus = player.shells === shells.length ? 75 : 0; player.score += bonus; const score = Math.max(highScore(), player.score); localStorage.setItem('otter-rescue-high-score', score); updateBestScore(score); bonusGoal.textContent = bonus ? '¡Colección completa! +75 puntos' : 'Volvé a explorar para encontrar las conchas'; updateHud(`¡Misión cumplida! ${bonus ? '¡Bonus de exploradora!' : 'La nutria volvió con su familia.'} 🦦`); }
function update() {
  if (!world.playing) return;
  const speed = world.difficulty === 'Guardiana' ? 3.2 : 4.1;
  if (world.keys.ArrowUp || world.keys.w) player.y -= speed;
  if (world.keys.ArrowDown || world.keys.s) player.y += speed;
  if (world.keys.ArrowLeft || world.keys.a) player.x -= speed;
  if (world.keys.ArrowRight || world.keys.d) player.x += speed;
  currents.forEach((current) => { if (distance(player, current) < current.radius) player.x += current.force; });
  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
  trash.forEach((item) => { if (!item.taken && distance(player, item) < player.radius + item.radius) { item.taken = true; player.collected += 1; player.score += 20; updateHud(player.collected === trash.length ? '¡El agua está limpia! Ahora llevá a la nutria a casa.' : '¡Residuo rescatado! +20 puntos'); } });
  shells.forEach((item) => { if (!item.taken && distance(player, item) < player.radius + item.radius) { item.taken = true; player.shells += 1; player.score += 15; updateHud('¡Concha encontrada! +15 puntos'); } });
  hazards.forEach((item) => { item.y += item.speed * item.direction; if (item.y < 80 || item.y > 485) item.direction *= -1; if (player.invincible <= 0 && distance(player, item) < player.radius + item.radius) { player.health -= 1; player.invincible = 75; updateHud('¡Cuidado con la botella!'); if (!player.health) { world.playing = false; gameMessage.textContent = 'La nutria necesita descansar. Tocá Reiniciar para intentarlo de nuevo.'; } } });
  if (player.invincible > 0) player.invincible -= 1;
  if (player.collected === trash.length && distance(player, home) < player.radius + home.radius) finishMission();
}
function loop() { drawBackground(); currents.forEach(drawCurrent); drawHome(); trash.filter((item) => !item.taken).forEach(drawTrash); shells.filter((item) => !item.taken).forEach(drawShell); hazards.forEach(drawHazard); drawOtter(); update(); animation = requestAnimationFrame(loop); }
function beginGame() { cancelAnimationFrame(animation); resetGame(); loop(); }
function openModal() { if (typeof modal.showModal === 'function') modal.showModal(); }

document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', openModal));
document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
window.addEventListener('keydown', (event) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) { world.keys[event.key] = true; event.preventDefault(); } });
window.addEventListener('keyup', (event) => { world.keys[event.key] = false; });
document.querySelectorAll('[data-direction]').forEach((button) => { const key = ({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' })[button.dataset.direction]; ['pointerdown', 'pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => button.addEventListener(eventName, (event) => { world.keys[key] = eventName === 'pointerdown'; event.preventDefault(); })); });
document.querySelector('#restart-game').addEventListener('click', beginGame);
gameForm.addEventListener('submit', (event) => { event.preventDefault(); const selections = new FormData(gameForm); world.difficulty = selections.get('difficulty'); world.scene = selections.get('scene'); gameSummary.textContent = `${selections.get('mode')}, ${world.scene}. Dificultad: ${world.difficulty}.`; game.hidden = false; modal.close(); game.scrollIntoView({ behavior: 'smooth', block: 'start' }); game.focus({ preventScroll: true }); beginGame(); });
updateBestScore();
