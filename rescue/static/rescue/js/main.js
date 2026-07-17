const modal = document.querySelector('#game-modal');
document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => modal.showModal()));
document.querySelector('[data-close-modal]').addEventListener('click', () => modal.close());
modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
