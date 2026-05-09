const dimData: Record<string, { name: string; color: string; text: string }> = {
  ambiental: {
    name: 'Dimensión ambiental',
    color: '#27ae60',
    text: 'Protección de los ecosistemas, mantenimiento de la biodiversidad y respeto a los límites planetarios. La actividad humana ha sobrepasado varios de estos límites, comprometiendo la estabilidad del sistema terrestre. Educar en sostenibilidad ambiental implica comprender los ciclos biogeoquímicos y las relaciones de dependencia entre la vida humana y los procesos naturales.'
  },
  social: {
    name: 'Dimensión social',
    color: '#e74c3c',
    text: 'Cohesión, equidad, derechos humanos, participación ciudadana e inclusión. La sostenibilidad social reconoce que no basta con proteger el medio ambiente: se requiere justicia, igualdad de oportunidades y el reconocimiento de los derechos fundamentales. La educación superior debe formar para comprender las estructuras de desigualdad y promover la corresponsabilidad social.'
  },
  economica: {
    name: 'Dimensión económica',
    color: '#f39c12',
    text: 'Producción y consumo responsables, transición hacia economías circulares y redistributivas, y justicia intergeneracional. El modelo de crecimiento ilimitado genera una huella ecológica que supera la biocapacidad del planeta. Reformular la economía hacia paradigmas de bienestar, suficiencia y economía del bien común es una tarea educativa urgente.'
  },
  cultural: {
    name: 'Dimensión cultural y ética',
    color: '#9b59b6',
    text: 'Valores, visiones del mundo, identidad, diálogo intercultural y responsabilidad ante la vida. Esta cuarta dimensión, subrayada por Morin (1999) y Leff (2014), es imprescindible para comprender los valores que orientan nuestras decisiones. La ética del cuidado, la responsabilidad intergeneracional y la empatía planetaria son competencias esenciales que la educación debe cultivar.'
  }
};

function initDimensions() {
  const btns = document.querySelectorAll<HTMLElement>('.o4-dim-btn');
  const panel = document.getElementById('o4-dim-panel');
  if (!panel) return;

  function showDim(key: string) {
    btns.forEach(b => b.classList.remove('active'));
    document.querySelector<HTMLElement>(`.o4-dim-btn[data-dim="${key}"]`)?.classList.add('active');
    const d = dimData[key];
    panel.innerHTML = `
      <div class="o4-dim-panel-content">
        <strong style="color:${d.color}">${d.name}</strong>
        <p>${d.text}</p>
      </div>
    `;
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => showDim(btn.dataset.dim!));
  });

  showDim('ambiental');
}

function initCrisisAccordion() {
  const cards = document.querySelectorAll<HTMLElement>('.o4-crisis-card');
  cards.forEach(card => {
    const head = card.querySelector<HTMLElement>('.o4-crisis-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const wasOpen = card.classList.contains('open');
      cards.forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
  });
  cards[0]?.classList.add('open');
}

function initCompTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('.o4-comp-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.comp!;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll<HTMLElement>('.o4-comp-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector<HTMLElement>(`.o4-comp-panel[data-comp="${key}"]`)?.classList.add('active');
    });
  });
}

function initCampoTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('.o4-campo-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.campo!;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll<HTMLElement>('.o4-campo-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector<HTMLElement>(`.o4-campo-panel[data-campo="${key}"]`)?.classList.add('active');
    });
  });
}

function initAudienceTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('.o4-audience-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.audience!;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll<HTMLElement>('.o4-audience-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector<HTMLElement>(`.o4-audience-panel[data-audience="${key}"]`)?.classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o4-dashboard')) return;
  initDimensions();
  initCrisisAccordion();
  initCompTabs();
  initCampoTabs();
  initAudienceTabs();
});
