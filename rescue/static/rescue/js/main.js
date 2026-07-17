const modal = document.querySelector('#game-modal');
const gameForm = document.querySelector('#game-form');
const game = document.querySelector('#game');
const gameSummary = document.querySelector('#game-summary');
const canvas = document.querySelector('#otter-canvas');
const context = canvas.getContext('2d');
const trashCount = document.querySelector('#trash-count');
const healthCount = document.querySelector('#health-count');
const gameMessage = document.querySelector('#game-message');

const world = { width: canvas.width, height: canvas.height, keys: {}, playing: false, difficulty: 'Curiosa' };
let player; let trash; let hazards; let home; let animation;

function random(min, max) { return Math.random() * (max - min) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function resetGame() {
  player = { x: 105, y: 405, radius: 28, health: 3, collected: 0, invincible: 0 };
  home = { x: 850, y: 110, radius: 48 };
  trash = Array.from({ length: 8 }, (_, index) => ({ x: 210 + (index % 4) * 165 + random(-35, 35), y: 120 + Math.floor(index / 4) * 220 + random(-45, 45), radius: 14, taken: false }));
  hazards = Array.from({ length: world.difficulty === 'Guardiana' ? 6 : 4 }, (_, index) => ({ x: 250 + index * 135, y: random(95, 450), radius: 19, speed: random(.65, 1.15), direction: index % 2 ? 1 : -1 }));
  world.playing = true;
  updateHud('Juntá los residuos y llegá a la madriguera.');
}

function updateHud(message) {
  trashCount.textContent = `${player.collected} / ${trash.length}`;
  healthCount.textContent = player.health;
  if (message) gameMessage.textContent = message;
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, '#b9e6e5'); sky.addColorStop(.42, '#d9f2df'); sky.addColorStop(.43, '#75ccd3'); sky.addColorStop(1, '#3daebd');
  context.fillStyle = sky; context.fillRect(0, 0, world.width, world.height);
  context.fillStyle = '#fff0a8'; context.beginPath(); context.arc(770, 78, 42, 0, Math.PI * 2); context.fill();
  context.fillStyle = '#72bd83'; context.beginPath(); context.ellipse(170, 226, 250, 74, 0, 0, Math.PI * 2); context.ellipse(725, 220, 310, 88, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = 'rgba(255,255,255,.32)'; context.lineWidth = 3;
  for (let y = 305; y < 540; y += 52) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(190, y - 18, 330, y + 18, 510, y); context.bezierCurveTo(700, y - 18, 820, y + 18, 960, y); context.stroke(); }
}

function drawHome() { context.fillStyle = '#5a402f'; context.beginPath(); context.arc(home.x, home.y, home.radius, Math.PI, 0); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(home.x, home.y + 12, 21, Math.PI, 0); context.fill(); context.fillStyle = '#fff9ed'; context.font = 'bold 16px Nunito'; context.fillText('CASA', home.x - 24, home.y - 58); }
function drawTrash(item) { context.save(); context.translate(item.x, item.y); context.rotate(.32); context.fillStyle = '#f8f5e8'; context.fillRect(-9, -14, 18, 28); context.fillStyle = '#f66d57'; context.fillRect(-10, -13, 20, 5); context.fillStyle = '#286c78'; context.fillRect(-5, -8, 10, 15); context.restore(); }
function drawHazard(item) { context.save(); context.translate(item.x, item.y); context.rotate(.2); context.fillStyle = '#f6d856'; context.fillRect(-14, -20, 28, 40); context.fillStyle = '#f66d57'; context.fillRect(-15, -9, 30, 8); context.restore(); }
function drawOtter() { const { x, y, radius } = player; context.save(); context.translate(x, y); if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2) context.globalAlpha = .45; context.fillStyle = '#704a36'; context.beginPath(); context.ellipse(8, 7, radius * 1.35, radius * .78, 0, 0, Math.PI * 2); context.fill(); context.fillStyle = '#8c6246'; context.beginPath(); context.arc(-13, -5, radius * .78, 0, Math.PI * 2); context.fill(); context.fillStyle = '#704a36'; context.beginPath(); context.arc(-29, -26, 9, 0, Math.PI * 2); context.arc(-2, -27, 9, 0, Math.PI * 2); context.fill(); context.fillStyle = '#162e30'; context.beginPath(); context.arc(-22, -7, 3.5, 0, Math.PI * 2); context.arc(-8, -7, 3.5, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#162e30'; context.lineWidth = 2; context.beginPath(); context.arc(-15, 4, 6, 0, Math.PI); context.stroke(); context.restore(); }

function update() {
  if (!world.playing) return;
  const speed = world.difficulty === 'Guardiana' ? 3.2 : 4.1;
  if (world.keys.ArrowUp || world.keys.w) player.y -= speed;
  if (world.keys.ArrowDown || world.keys.s) player.y += speed;
  if (world.keys.ArrowLeft || world.keys.a) player.x -= speed;
  if (world.keys.ArrowRight || world.keys.d) player.x += speed;
  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x)); player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
  trash.forEach((item) => { if (!item.taken && distance(player, item) < player.radius + item.radius) { item.taken = true; player.collected += 1; updateHud(player.collected === trash.length ? '¡El agua está limpia! Ahora llevá a la nutria a casa.' : '¡Residuo rescatado! Seguí cuidando el humedal.'); } });
  hazards.forEach((item) => { item.y += item.speed * item.direction; if (item.y < 80 || item.y > 485) item.direction *= -1; if (player.invincible <= 0 && distance(player, item) < player.radius + item.radius) { player.health -= 1; player.invincible = 75; updateHud('¡Cuidado con la botella!'); if (!player.health) { world.playing = false; gameMessage.textContent = 'La nutria necesita descansar. Tocá Reiniciar para intentarlo de nuevo.'; } } });
  if (player.invincible > 0) player.invincible -= 1;
  if (player.collected === trash.length && distance(player, home) < player.radius + home.radius) { world.playing = false; gameMessage.textContent = '¡Misión cumplida! La nutria volvió con su familia y el humedal quedó más limpio. 🦦'; }
}

function loop() { drawBackground(); drawHome(); trash.filter((item) => !item.taken).forEach(drawTrash); hazards.forEach(drawHazard); drawOtter(); update(); animation = requestAnimationFrame(loop); }
function beginGame() { cancelAnimationFrame(animation); resetGame(); loop(); }
function openModal() { if (typeof modal.showModal === 'function') modal.showModal(); }

document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', openModal));
document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
window.addEventListener('keydown', (event) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) { world.keys[event.key] = true; event.preventDefault(); } });
window.addEventListener('keyup', (event) => { world.keys[event.key] = false; });
document.querySelectorAll('[data-direction]').forEach((button) => { const key = ({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' })[button.dataset.direction]; ['pointerdown', 'pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => button.addEventListener(eventName, (event) => { world.keys[key] = eventName === 'pointerdown'; event.preventDefault(); })); });
document.querySelector('#restart-game').addEventListener('click', beginGame);
gameForm.addEventListener('submit', (event) => { event.preventDefault(); const selections = new FormData(gameForm); world.difficulty = selections.get('difficulty'); gameSummary.textContent = `${selections.get('mode')}, ${selections.get('scene')}. Dificultad: ${world.difficulty}.`; game.hidden = false; modal.close(); game.scrollIntoView({ behavior: 'smooth', block: 'start' }); game.focus({ preventScroll: true }); beginGame(); });
