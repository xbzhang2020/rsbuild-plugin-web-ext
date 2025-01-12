import './index.css';

const rootEl = document.querySelector('#root');
if (rootEl) {
  rootEl.innerHTML = `
  <div class="content">
     <h1>Vanilla WebExtend</h1>
    <p>This is a sidepanel page.</p>
  </div>
  `;
}
