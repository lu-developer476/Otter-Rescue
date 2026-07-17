const modal = document.querySelector('#game-modal');
const gameForm = document.querySelector('#game-form');
const mission = document.querySelector('#mission');
const missionSummary = document.querySelector('#mission-summary');

document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => modal.showModal()));
document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

gameForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const selections = new FormData(gameForm);
  const mode = selections.get('mode');
  const scene = selections.get('scene');
  const difficulty = selections.get('difficulty');

  missionSummary.textContent = `${mode}, ${scene}. Dificultad: ${difficulty}.`;
  mission.hidden = false;
  modal.close();
  mission.scrollIntoView({ behavior: 'smooth', block: 'start' });
  mission.focus({ preventScroll: true });
});
