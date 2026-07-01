// Create a simple button that redirects to /game
const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <button id="game-button" style="padding: 20px 40px; font-size: 18px; cursor: pointer;">
        Play Game
      </button>
    </div>
  `;

  const gameButton = document.getElementById('game-button');
  if (gameButton) {
    gameButton.addEventListener('click', () => {
      window.location.href = '/game';
    });
  }
}