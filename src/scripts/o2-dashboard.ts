import { Chart, registerables } from 'chart.js';
import Papa from 'papaparse';
Chart.register(...registerables);

const odsColors: Record<number, string> = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d',
  5: '#ff3a21', 6: '#26bde2', 7: '#fcc30b', 8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a'
};

const odsNames: Record<number, string> = {
  1: 'Fin de la pobreza', 2: 'Hambre cero', 3: 'Salud y bienestar',
  4: 'Educación de calidad', 5: 'Igualdad de género', 6: 'Agua limpia y saneamiento',
  7: 'Energía asequible y no contaminante', 8: 'Trabajo decente y crecimiento económico',
  9: 'Industria, innovación e infraestructura', 10: 'Reducción de las desigualdades',
  11: 'Ciudades y comunidades sostenibles', 12: 'Producción y consumo responsable',
  13: 'Acción por el clima', 14: 'Vida submarina',
  15: 'Vida de ecosistemas terrestres', 16: 'Paz, justicia e instituciones sólidas',
  17: 'Alianzas para lograr los objetivos'
};

const odsClauses: Record<number, { targets: string; clause: string }> = {
  1: { targets: '1.4', clause: 'La Universidad impulsará políticas de inclusión social orientadas a garantizar el acceso y la permanencia en la educación universitaria de estudiantes en situación de vulnerabilidad económica, mediante becas, ayudas y programas de apoyo específicos.' },
  2: { targets: '2.4, 2.5', clause: 'La Universidad fomentará la adopción de medidas para garantizar una oferta alimentaria saludable y sostenible en centros docentes y campus universitarios, impulsando la colaboración con productores locales y la reducción del desperdicio alimentario en sus servicios de restauración.' },
  3: { targets: '3.4, 3.9', clause: 'La Universidad contribuirá a la prevención, mantenimiento y mejora de la salud mental, la actividad física y la reducción de riesgos laborales de la comunidad universitaria, garantizando entornos saludables y seguros.' },
  4: { targets: '4.3, 4.b', clause: 'La Universidad garantizará un acceso equitativo y no discriminatorio a la educación universitaria, impulsando la eliminación de barreras económicas, sociales o culturales que limiten la igualdad de oportunidades, y promoviendo la movilidad académica nacional e internacional como instrumento de formación integral.' },
  5: { targets: '5.1, 5.5', clause: 'La Universidad impulsará políticas y adoptará medidas que aseguren la igualdad efectiva entre mujeres y hombres, garantizando su representación equilibrada en los órganos de gobierno y decisión, así como la integración de la perspectiva de género en la docencia, la investigación y la gestión universitaria. Asimismo, adoptará mecanismos eficaces para prevenir y erradicar cualquier forma de discriminación o violencia de género.' },
  6: { targets: '6.4, 6.b', clause: 'La Universidad implementará medidas de gestión integral del agua que incluyan la optimización del consumo, la modernización de las infraestructuras de saneamiento, la reutilización de aguas pluviales y residuales, y promoverá el uso eficiente del agua mediante programas de sensibilización sobre el consumo responsable de los recursos hídricos.' },
  7: { targets: '7.2, 7.3', clause: 'La Universidad desarrollará políticas orientadas a la transición hacia un modelo energético sostenible, fomentando la generación y el uso de energías renovables, la reducción del consumo energético y la mejora de la eficiencia en sus infraestructuras.' },
  8: { targets: '8.5, 8.6', clause: 'La Universidad impulsará políticas orientadas a garantizar el trabajo decente y la igualdad de oportunidades, promoviendo la estabilidad y la mejora continua de la calidad del empleo en todos los colectivos universitarios, y fomentará programas de orientación e inserción profesional que faciliten el acceso de sus egresados al mercado laboral.' },
  9: { targets: '9.4, 9.5', clause: 'La Universidad fomentará la investigación científica, el desarrollo tecnológico y la innovación orientados a la sostenibilidad, mediante la creación y consolidación de infraestructuras resilientes y eficientes. Asimismo, promoverá alianzas estratégicas con el sector productivo, las administraciones públicas y la sociedad civil para impulsar un modelo de transferencia del conocimiento inclusivo y responsable.' },
  10: { targets: '10.3', clause: 'La Universidad garantizará la igualdad de oportunidades mediante políticas activas de inclusión y accesibilidad universal, promoviendo la participación plena del estudiantado y del personal perteneciente a colectivos vulnerables, y asegurando la eliminación de cualquier forma de discriminación o exclusión.' },
  11: { targets: '11.2, 11.7', clause: 'La Universidad contribuirá al desarrollo de comunidades sostenibles mediante una gestión ambientalmente responsable de sus espacios, el fomento de la movilidad sostenible y la colaboración con su entorno social y territorial.' },
  12: { targets: '12.5', clause: 'La Universidad promoverá un modelo de consumo y gestión responsable de los recursos, impulsando la reducción, reutilización y reciclaje de materiales, así como la incorporación de criterios de sostenibilidad en la contratación pública, la restauración y la gestión de residuos en todos sus campus.' },
  13: { targets: '13.1, 13.2', clause: 'La Universidad desarrollará políticas de mitigación y adaptación al cambio climático, aplicando planes de reducción de su huella de carbono, fomentando la eficiencia energética y asegurando la integración de la sostenibilidad ambiental en su planificación estratégica y académica.' },
  14: { targets: '14.1, 14.2', clause: 'La Universidad promoverá la investigación y la formación orientadas a la conservación de la biodiversidad marina, así como la sensibilización sobre la protección de los ecosistemas marinos mediante prácticas sostenibles.' },
  15: { targets: '15.1, 15.5', clause: 'La Universidad fomentará la protección de la biodiversidad y la conservación de los ecosistemas terrestres, promoviendo la restauración de los espacios naturales en su entorno e impulsando proyectos de educación ambiental y conservación.' },
  16: { targets: '16.6, 16.7', clause: 'La Universidad garantizará la transparencia y la rendición de cuentas en el ejercicio de sus funciones mediante la publicación periódica de información institucional y de informes de sostenibilidad, y promoverá la participación inclusiva en los procesos de toma de decisiones.' },
  17: { targets: '17.16, 17.17', clause: 'La Universidad fomentará la cooperación y las alianzas estratégicas con otras universidades, administraciones públicas, entidades privadas y la sociedad civil con el propósito de contribuir conjuntamente al logro de los ODS.' }
};

function initLevelTabs() {
  const tabs = document.querySelectorAll<HTMLElement>('.o2-level-tab');
  const panels = document.querySelectorAll<HTMLElement>('.o2-level-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const level = tab.dataset.level!;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector<HTMLElement>(`.o2-level-panel[data-panel="${level}"]`)?.classList.add('active');
    });
  });
}

function showODSClause(i: number, panel: HTMLElement) {
  document.querySelectorAll('.o2-ods-btn').forEach(b => b.classList.remove('active'));
  document.querySelector<HTMLElement>(`.o2-ods-btn[data-ods="${i}"]`)?.classList.add('active');
  const data = odsClauses[i];
  panel.innerHTML = `
    <div class="o2-clause-header">
      <span class="o2-clause-badge" style="background:${odsColors[i]}">ODS ${i}</span>
      <span class="o2-clause-name">${odsNames[i]}</span>
      <span class="o2-clause-targets">Metas prioritarias: ${data.targets}</span>
    </div>
    <p class="o2-clause-text">${data.clause}</p>
  `;
  panel.classList.add('visible');
}

function initODSExplorer() {
  const grid = document.getElementById('o2-ods-grid');
  const panel = document.getElementById('o2-clause-panel');
  if (!grid || !panel) return;

  for (let i = 1; i <= 17; i++) {
    const btn = document.createElement('button');
    btn.className = 'o2-ods-btn';
    btn.dataset.ods = String(i);
    btn.style.setProperty('--ods-color', odsColors[i]);
    btn.textContent = `ODS ${i}`;
    btn.title = odsNames[i];
    btn.addEventListener('click', () => showODSClause(i, panel));
    grid.appendChild(btn);
  }

  // Seleccionar ODS 1 por defecto
  showODSClause(1, panel);
}

const uniInfo: Record<string, { descripcion: string; ods: string }> = {
  'Universidad de Oviedo': {
    descripcion: 'Integración transversal de los ODS en sus estatutos y estrategias institucionales, con especial atención a la sostenibilidad social y también mención a la dimensión ambiental.',
    ods: 'ODS 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12'
  },
  'Universidad de Zaragoza': {
    descripcion: 'Alta integración normativa de los ODS con presencia equilibrada de objetivos sociales, económicos y de gobernanza en sus estatutos universitarios.',
    ods: 'ODS 1, 4, 5, 8, 9, 10, 11, 16'
  },
  'Universidad de Málaga': {
    descripcion: 'Presencia uniforme de un amplio abanico de ODS en sus estatutos, destacando por su cobertura equilibrada entre dimensiones sociales y económicas.',
    ods: 'ODS 3, 4, 5, 6, 8, 9, 10'
  },
  'Univ. Politécnica de Valencia': {
    descripcion: 'Sólida integración de ODS vinculados a infraestructura, igualdad y sostenibilidad ambiental en sus marcos normativos universitarios.',
    ods: 'ODS 1, 5, 6, 7, 9, 10, 11, 12'
  },
  'Universidad de Valladolid': {
    descripcion: 'Destaca la presencia del ODS 3 a través del compromiso con la salud integral de su comunidad: bienestar físico, mental y social, investigación en salud y entornos seguros.',
    ods: 'ODS 2, 3, 7'
  },
  'Univ. Autónoma de Barcelona': {
    descripcion: 'Incorporación de ODS vinculados a la inclusión social, la salud y la producción responsable en sus estatutos y políticas institucionales.',
    ods: 'ODS 1, 2, 3, 12'
  },
  'Univ. Tecnológica Atlántico-Med.': {
    descripcion: 'Incorporación de la Agenda 2030 con foco en los ODS 16 y 17, que promueven la gobernanza y la cooperación, y gran vinculación de sus estatutos con la educación de calidad.',
    ods: 'ODS 4, 16, 17'
  },
  'Universidad de La Laguna': {
    descripcion: 'Integración de ODS relacionados con la salud, el hambre cero y la producción responsable, con presencia en sus estatutos y estrategias institucionales.',
    ods: 'ODS 2, 3, 12'
  },
  'Universidad Pompeu Fabra': {
    descripcion: 'Reconocida por su alineación con el ODS 3 (Salud y bienestar) en sus marcos normativos, con presencia de este objetivo en sus estatutos universitarios.',
    ods: 'ODS 3'
  },
  'Universidad de Granada': {
    descripcion: 'Estrategias de igualdad y calidad educativa alineadas con los ODS 4 y 5, referente además en buenas prácticas de gobernanza con género.',
    ods: 'ODS 4, 5'
  },
};

function showUniDetail(idx: number, labels: string[], values: number[], isAprox: boolean[]) {
  const panel = document.getElementById('o2-uni-detail');
  if (!panel) return;
  const name = labels[idx];
  const info = uniInfo[name] ?? { descripcion: 'Universidad reconocida por su integración normativa de los ODS en el sistema universitario español.', ods: '—' };
  const aproxNote = isAprox[idx] ? '<span class="o2-uni-aprox">* Valor aproximado</span>' : '';
  panel.innerHTML = `
    <div class="o2-uni-header">
      <span class="o2-uni-name">${name}</span>
      <span class="o2-uni-count">${values[idx]} menciones${aproxNote}</span>
    </div>
    <p class="o2-uni-desc">${info.descripcion}</p>
    <div class="o2-uni-ods">${info.ods}</div>
  `;
  panel.classList.add('visible');
}

function initTop10Chart() {
  const canvas = document.getElementById('chart-o2-top10') as HTMLCanvasElement | null;
  if (!canvas) return;

  Papa.parse('/csvs/o2/top10_menciones.csv', {
    download: true,
    header: true,
    complete: (results: { data: Record<string, string>[] }) => {
      const rows = results.data.filter(r => r.Universidad);
      const labels = rows.map(r => r.Universidad);
      const values = rows.map(r => parseInt(r.Menciones));
      const isAprox = rows.map(r => r.Aprox === 'si');

      let activeIdx = 0;

      const getColors = (active: number) =>
        labels.map((_, i) =>
          i === active
            ? 'rgba(59,130,246,1)'
            : isAprox[i] ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.6)'
        );

      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Menciones a ODS en estatutos',
            data: values,
            backgroundColor: getColors(0),
            borderColor: 'rgba(59,130,246,1)',
            borderWidth: 1,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          onClick: (_evt, elements) => {
            if (!elements.length) return;
            activeIdx = elements[0].index;
            (chart.data.datasets[0].backgroundColor as string[]) = getColors(activeIdx);
            chart.update('none');
            showUniDetail(activeIdx, labels, values, isAprox);
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const aprox = isAprox[ctx.dataIndex];
                  return ` ${ctx.parsed.x} menciones${aprox ? ' (aprox.)' : ''}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              title: { display: true, text: 'Número de menciones a ODS' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11 }, cursor: 'pointer' } as any
            }
          }
        }
      });

      // Seleccionar Universidad de Oviedo por defecto
      showUniDetail(0, labels, values, isAprox);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o2-dashboard')) return;
  initLevelTabs();
  initODSExplorer();
  initTop10Chart();
});
