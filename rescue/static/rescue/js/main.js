const modal = document.querySelector('#game-modal');
const gameForm = document.querySelector('#game-form');
const mission = document.querySelector('#mission');
const missionSummary = document.querySelector('#mission-summary');
const missionCard = document.querySelector('#mission-card');
const missionProgress = document.querySelector('#mission-progress');

const steps = [
  {
    title: 'Primera pista',
    text: 'Entre los juncos hay una huella fresca. Observá el agua antes de avanzar.',
    choices: [
      ['Observar las ondas', 'Las ondas llevan hacia un canal tranquilo. ¡Buena observación!'],
      ['Entrar entre los juncos', 'Avanzás con cuidado y encontrás una pluma que señala el camino.'],
    ],
  },
  {
    title: 'El canal bloqueado',
    text: 'Una rama y algunos residuos frenan el paso del agua. La nutria puede estar del otro lado.',
    choices: [
      ['Retirar los residuos', 'El agua vuelve a correr y aparece una nueva huella en la orilla.'],
      ['Buscar un paso seguro', 'Encontrás una pasarela de piedras que protege las plantas del borde.'],
    ],
  },
  {
    title: 'Camino a casa',
    text: 'Escuchás un chillido suave cerca de la madriguera. La nutria bebé ya reconoce el sendero.',
    choices: [
      ['Acompañarla en silencio', 'La nutria se reúne con su familia. El humedal está un poco mejor gracias a vos.'],
      ['Dejar marcas seguras', 'Las marcas ayudan a la nutria a volver con su familia. El humedal está a salvo.'],
    ],
  },
];

let currentStep = 0;

function renderStep(feedback = '') {
  const step = steps[currentStep];
  const isFinalStep = currentStep === steps.length - 1;
  missionProgress.textContent = `Pista ${currentStep + 1} de ${steps.length}`;
  missionCard.innerHTML = `
    <span class="mission-icon" aria-hidden="true">🦦</span>
    <div class="mission-content">
      <h3>${step.title}</h3>
      <p>${feedback || step.text}</p>
      <div class="mission-choices" aria-label="Elegí cómo continuar">
        ${isFinalStep
          ? '<button class="choice-button" type="button" data-restart>Jugar otra vez <span>↻</span></button>'
          : step.choices.map(([label], index) => `<button class="choice-button" type="button" data-choice="${index}">${label} <span>→</span></button>`).join('')}
      </div>
    </div>`;

  missionCard.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = step.choices[Number(button.dataset.choice)];
      currentStep += 1;
      window.setTimeout(() => renderStep(choice[1]), 180);
    });
  });
  missionCard.querySelector('[data-restart]')?.addEventListener('click', () => {
    currentStep = 0;
    renderStep();
  });
}

function openModal() {
  if (typeof modal.showModal === 'function') modal.showModal();
}

document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', openModal));
document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

gameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const selections = new FormData(gameForm);
  const mode = selections.get('mode');
  const scene = selections.get('scene');
  const difficulty = selections.get('difficulty');

  currentStep = 0;
  missionSummary.textContent = `${mode}, ${scene}. Dificultad: ${difficulty}. Elegí una opción para continuar.`;
  mission.hidden = false;
  renderStep();
  modal.close();
  mission.scrollIntoView({ behavior: 'smooth', block: 'start' });
  mission.focus({ preventScroll: true });
});
