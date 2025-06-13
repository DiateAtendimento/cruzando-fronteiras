// script.js

const isModerator = true; // Troque para false para simular visitante

let programacoes = [
  {
    id: crypto.randomUUID(),
    ano: 2025,
    mes: "Junho",
    tema: "RPPS em Foco",
    responsavel: "Wagner Marcelino",
    data: "2025-06-20",
    video: "https://youtu.be/xxx",
    pptx: "https://drive.google.com/xxx",
  },
  {
    id: crypto.randomUUID(),
    ano: 2025,
    mes: "Julho",
    tema: "Nova Previdência",
    responsavel: "Cláudia Iten",
    data: "2025-07-10",
    video: "",
    pptx: "",
  },
];

let editandoId = null;

// Objeto para guardar os estados abertos/fechados da árvore
let expandedState = {
  anos: {},      // { [ano]: true/false }
  meses: {}      // { [`${ano}_${mes}`]: true/false }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnNovo').style.display = isModerator ? '' : 'none';
  renderTree();
  document.getElementById('btnNovo').onclick = abrirModalNovo;
  document.getElementById('btnSalvar').onclick = salvarProgramacao;
  document.getElementById('btnCancelar').onclick = fecharModal;
  document.getElementById('btnConfirmaExclusao').onclick = confirmaExcluir;
  document.getElementById('btnCancelaExclusao').onclick = fecharConfirmacao;
  document.getElementById('programacaoBusca').oninput = renderTree;
});

function agruparProgramacoes(programacoesFiltradas) {
  const tree = {};
  programacoesFiltradas.forEach(p => {
    if (!tree[p.ano]) tree[p.ano] = {};
    if (!tree[p.ano][p.mes]) tree[p.ano][p.mes] = [];
    tree[p.ano][p.mes].push(p);
  });
  return tree;
}

function renderTree() {
  const busca = document.getElementById('programacaoBusca').value.toLowerCase();
  const lista = document.getElementById('programacaoLista');
  lista.innerHTML = '';

  // Filtro por busca
  const filtradas = programacoes.filter(p =>
    p.tema.toLowerCase().includes(busca) ||
    p.responsavel.toLowerCase().includes(busca) ||
    (p.ano + '').includes(busca) ||
    (p.mes || '').toLowerCase().includes(busca)
  );

  const tree = agruparProgramacoes(filtradas);

  Object.keys(tree).sort().forEach(ano => {
    const anoKey = String(ano);
    const isAnoOpen = !!expandedState.anos[anoKey];
    const anoLi = document.createElement('li');
    anoLi.classList.add('pasta');
    anoLi.innerHTML = `
      <button class="toggle-btn" data-level="ano" data-ano="${anoKey}" aria-expanded="${isAnoOpen}">${isAnoOpen ? "–" : "+"}</button>
      <b>${ano}</b>
    `;
    const ulMes = document.createElement('ul');
    ulMes.style.marginLeft = '1.2rem';
    ulMes.style.display = isAnoOpen ? "" : "none";

    Object.keys(tree[ano]).sort((a, b) => new Date(`2020-${mesToNum(a)}-01`) - new Date(`2020-${mesToNum(b)}-01`)).forEach(mes => {
      const mesKey = `${anoKey}_${mes}`;
      const isMesOpen = !!expandedState.meses[mesKey];
      const mesLi = document.createElement('li');
      mesLi.classList.add('pasta');
      mesLi.innerHTML = `
        <button class="toggle-btn" data-level="mes" data-ano="${anoKey}" data-mes="${mes}" aria-expanded="${isMesOpen}">${isMesOpen ? "–" : "+"}</button>
        <b>${mes}</b>
      `;
      const ulProg = document.createElement('ul');
      ulProg.style.marginLeft = '1.2rem';
      ulProg.style.display = isMesOpen ? "" : "none";

      tree[ano][mes].forEach(p => {
        const progLi = document.createElement('li');
        progLi.classList.add('programacao-item');
        progLi.innerHTML = `
          <b>${p.tema}</b> <br>
          <span>Responsável: ${p.responsavel}</span><br>
          <span>Data: ${p.data ? new Date(p.data).toLocaleDateString('pt-BR') : 'xx/xx/xxxx'}</span><br>
          ${p.video ? `<span>Vídeo: <a href="${p.video}" target="_blank">Ver</a></span><br>` : ""}
          ${p.pptx ? `<span>PPTX: <a href="${p.pptx}" target="_blank">Baixar</a></span>` : ""}
          ${isModerator ? `
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>` : ''}
        `;
        if (isModerator) {
          progLi.querySelector('.btn-editar').onclick = () => abrirModalEditar(p.id);
          progLi.querySelector('.btn-excluir').onclick = () => abrirConfirmacao(p.id);
        }
        ulProg.appendChild(progLi);
      });
      mesLi.appendChild(ulProg);
      ulMes.appendChild(mesLi);
    });
    anoLi.appendChild(ulMes);
    lista.appendChild(anoLi);
  });

  // Controle de expandir/recolher usando botão, preservando estado
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = function () {
      const li = btn.parentElement;
      const ul = li.querySelector('ul');
      if (!ul) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      ul.style.display = expanded ? 'none' : '';
      btn.textContent = expanded ? '+' : '–';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');

      // Atualiza estado expandido
      if (btn.dataset.level === "ano") {
        expandedState.anos[btn.dataset.ano] = !expanded;
      }
      if (btn.dataset.level === "mes") {
        expandedState.meses[`${btn.dataset.ano}_${btn.dataset.mes}`] = !expanded;
      }
    };
  });
}

function mesToNum(mesNome) {
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  let idx = meses.findIndex(m => m.toLowerCase() === (mesNome || '').toLowerCase());
  return idx === -1 ? '01' : String(idx+1).padStart(2, '0');
}

// Modal novo/editar
function abrirModalNovo() {
  editandoId = null;
  document.getElementById('inputTema').value = '';
  document.getElementById('inputResponsavel').value = '';
  document.getElementById('inputData').value = '';
  document.getElementById('inputVideo').value = '';
  document.getElementById('inputPptx').value = '';
  document.getElementById('programacaoModal').style.display = 'flex';
}

function abrirModalEditar(id) {
  editandoId = id;
  const p = programacoes.find(p => p.id === id);
  document.getElementById('inputTema').value = p.tema;
  document.getElementById('inputResponsavel').value = p.responsavel;
  document.getElementById('inputData').value = p.data;
  document.getElementById('inputVideo').value = p.video;
  document.getElementById('inputPptx').value = p.pptx;
  document.getElementById('programacaoModal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('programacaoModal').style.display = 'none';
}

function salvarProgramacao() {
  const tema = document.getElementById('inputTema').value;
  const responsavel = document.getElementById('inputResponsavel').value;
  const data = document.getElementById('inputData').value;
  const video = document.getElementById('inputVideo').value;
  const pptx = document.getElementById('inputPptx').value;
  if (!tema.trim() || !responsavel.trim() || !data.trim()) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  const ano = (new Date(data)).getFullYear();
  const mes = capitalizeMes((new Date(data)).toLocaleString('pt-BR', { month: 'long' }));

  if (editandoId) {
    const idx = programacoes.findIndex(p => p.id === editandoId);
    programacoes[idx] = { ...programacoes[idx], tema, responsavel, data, video, pptx, ano, mes };
  } else {
    programacoes.push({
      id: crypto.randomUUID(),
      tema, responsavel, data, video, pptx, ano, mes
    });
  }
  fecharModal();
  renderTree(); // Estado de expansão será preservado!
}

function capitalizeMes(mes) {
  return mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
}

function abrirConfirmacao(id) {
  editandoId = id;
  document.getElementById('confirmExclusao').style.display = 'flex';
}
function fecharConfirmacao() {
  document.getElementById('confirmExclusao').style.display = 'none';
}
function confirmaExcluir() {
  programacoes = programacoes.filter(p => p.id !== editandoId);
  fecharConfirmacao();
  renderTree();
}

