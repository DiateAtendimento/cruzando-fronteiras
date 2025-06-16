// script.js

const API_URL = 'https://cruzando-fronteiras.onrender.com/api'; //Backend Render

let isModerator = false;
let jwtToken = null;

// Carrega modo do localStorage
if (localStorage.getItem('perfilDRPPS') === 'admin') isModerator = true;
if (localStorage.getItem('jwtDRPPS')) {
  jwtToken = localStorage.getItem('jwtDRPPS');
  isModerator = true;
}

let programacoes = [];
let editandoId = null;
let expandedState = { anos: {}, meses: {} };

// ========= DOMContentLoaded ==========
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnLoginAdmin').onclick = abrirModalLoginAdmin;
  document.getElementById('btnEntrarAdmin').onclick = autenticarAdmin;
  document.getElementById('btnFecharModalAdmin').onclick = fecharModalLoginAdmin;
  document.getElementById('btnSairAdmin').onclick = sairAdmin;
  if (isModerator) document.getElementById('btnSairAdmin').style.display = 'inline-block';
  document.getElementById('btnNovo').style.display = isModerator ? '' : 'none';
  document.getElementById('btnNovo').onclick = abrirModalNovo;
  document.getElementById('btnSalvar').onclick = salvarProgramacao;
  document.getElementById('btnCancelar').onclick = fecharModal;
  document.getElementById('btnConfirmaExclusao').onclick = confirmaExcluir;
  document.getElementById('btnCancelaExclusao').onclick = fecharConfirmacao;
  document.getElementById('programacaoBusca').oninput = renderTree;

  // Carregar programações do backend
  carregarProgramacoes();
});

// ======== MODAL LOGIN =========
function abrirModalLoginAdmin() {
  document.getElementById('modalLoginAdmin').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}
function fecharModalLoginAdmin() {
  document.getElementById('modalLoginAdmin').style.display = 'none';
  document.body.style.overflow = '';
}
async function autenticarAdmin() {
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  // Faz login pelo backend, recebe token JWT
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user: u, pass: p })
    });
    if (!res.ok) throw new Error('Login inválido');
    const data = await res.json();
    jwtToken = data.token;
    isModerator = true;
    localStorage.setItem('perfilDRPPS', 'admin');
    localStorage.setItem('jwtDRPPS', jwtToken);
    fecharModalLoginAdmin();
    document.getElementById('btnSairAdmin').style.display = 'inline-block';
    document.getElementById('btnNovo').style.display = '';
    renderTree();
  } catch {
    document.getElementById('loginError').style.display = 'block';
  }
}
function sairAdmin() {
  isModerator = false;
  jwtToken = null;
  localStorage.removeItem('perfilDRPPS');
  localStorage.removeItem('jwtDRPPS');
  fecharModalLoginAdmin();
  document.getElementById('btnSairAdmin').style.display = 'none';
  document.getElementById('btnNovo').style.display = 'none';
  renderTree();
}

// ======== CRUD PROGRAMACOES ========

async function carregarProgramacoes(tentativas = 3) {
  const lista = document.getElementById('programacaoLista');
  lista.innerHTML = '<li>🔄 Carregando programações...</li>';

  try {
    const res = await fetch(`${API_URL}/programacoes`);
    programacoes = await res.json();

    if (!programacoes.length) {
      lista.innerHTML = '<li>⚠️ Nenhuma programação encontrada.</li>';
    } else {
      renderTree();
    }
  } catch {
    if (tentativas > 0) {
      setTimeout(() => carregarProgramacoes(tentativas - 1), 2000);
    } else {
      lista.innerHTML = '<li>❌ Erro ao carregar. Tente recarregar a página.</li>';
    }
  }
}


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
  const p = programacoes.find(p => p._id === id);
  document.getElementById('inputTema').value = p.tema;
  document.getElementById('inputResponsavel').value = p.responsavel;
  document.getElementById('inputData').value = p.data ? p.data.substring(0, 10) : '';
  document.getElementById('inputVideo').value = p.video || '';
  document.getElementById('inputPptx').value = p.pptx || '';
  document.getElementById('programacaoModal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('programacaoModal').style.display = 'none';
}

// CRIAR/EDITAR
async function salvarProgramacao() {
  const tema = document.getElementById('inputTema').value;
  const responsavel = document.getElementById('inputResponsavel').value;


  const rawDate = document.getElementById('inputData').value;
  const data = new Date(rawDate + 'T12:00:00');



  const video = document.getElementById('inputVideo').value;
  const pptx = document.getElementById('inputPptx').value;
  if (!tema.trim() || !responsavel.trim() || !rawDate.trim()) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  const payload = { tema, responsavel, data, video, pptx };

  try {
    let res;
    if (editandoId) {
      // Editar
      res = await fetch(`${API_URL}/programacoes/${editandoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Criar novo
      res = await fetch(`${API_URL}/programacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
    }
    if (!res.ok) throw new Error('Não autorizado ou erro ao salvar');
    fecharModal();
    await carregarProgramacoes();
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

function abrirConfirmacao(id) {
  editandoId = id;
  document.getElementById('confirmExclusao').style.display = 'flex';
}
function fecharConfirmacao() {
  document.getElementById('confirmExclusao').style.display = 'none';
}
// EXCLUIR
async function confirmaExcluir() {
  try {
    const res = await fetch(`${API_URL}/programacoes/${editandoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    if (!res.ok) throw new Error('Não autorizado ou erro ao excluir');
    fecharConfirmacao();
    await carregarProgramacoes();
  } catch (err) {
    alert('Erro: ' + err.message);
  }
}

// ==== RESTANTE: AGRUPAR, RENDER TREE... (sem alteração) ====

function agruparProgramacoes(programacoesFiltradas) {
  const tree = {};
  programacoesFiltradas.forEach(p => {
    const ano = new Date(p.data).getFullYear();
    const mes = capitalizeMes(new Date(p.data).toLocaleString('pt-BR', { month: 'long' }));
    if (!tree[ano]) tree[ano] = {};
    if (!tree[ano][mes]) tree[ano][mes] = [];
    tree[ano][mes].push(p);
  });
  return tree;
}

function renderTree() {
  const busca = document.getElementById('programacaoBusca').value.toLowerCase();
  const lista = document.getElementById('programacaoLista');
  lista.innerHTML = '';

  const filtradas = programacoes.filter(p =>
    p.tema.toLowerCase().includes(busca) ||
    p.responsavel.toLowerCase().includes(busca) ||
    (new Date(p.data).getFullYear() + '').includes(busca) ||
    (new Date(p.data).toLocaleString('pt-BR', { month: 'long' }).toLowerCase().includes(busca))
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
          ${p.pptx ? `<span>PPTX: <a href="${p.pptx}" target="_blank">Ver</a></span>` : ""}
          ${isModerator ? `
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>` : ''}
        `;
        if (isModerator) {
          progLi.querySelector('.btn-editar').onclick = () => abrirModalEditar(p._id);
          progLi.querySelector('.btn-excluir').onclick = () => abrirConfirmacao(p._id);
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
function capitalizeMes(mes) {
  return mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();
}

//Tecla ENTER ATIVA
document.getElementById('modalLoginAdmin').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('btnEntrarAdmin').click();
  }
});
