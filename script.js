// script.js

const API_URL = 'https://cruzando-fronteiras.onrender.com/api'; //Backend Render

let isModerator = false;
let jwtToken = null;
let idImagemAtual = null;


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
  document.getElementById('btnUploadImagem').addEventListener('click', enviarImagem);
  document.getElementById('btnCancelarUpload').onclick = fecharModalImagem;

  // Carregar programações do backend
  carregarProgramacoes();
});


function abrirModalImagem(id) {
  idImagemAtual = id;
  document.getElementById('inputArquivoImagem').value = '';
  document.getElementById('uploadStatus').textContent = '';
  document.getElementById('modalUploadImagem').style.display = 'block';
}

function fecharModalImagem() {
  document.getElementById('modalUploadImagem').style.display = 'none';
  idImagemAtual = null;
}

async function enviarImagem() {
  const input = document.getElementById('inputArquivoImagem');
  const status = document.getElementById('uploadStatus');
    
  if (!/^[a-f\d]{24}$/i.test(idImagemAtual)) {
    status.textContent = 'ID de programação inválido.';
    return;
  }

  if (!input.files || !input.files[0]) {
    status.textContent = 'Selecione uma imagem primeiro.';
    return;
  }

  const formData = new FormData();
  formData.append('imagem', input.files[0]);

  status.textContent = 'Enviando imagem...';

  try {
    const res = await fetch(`${API_URL}/upload-imagem`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.url) {
      status.textContent = 'Imagem enviada com sucesso!';

      await fetch(`${API_URL}/programacoes/${idImagemAtual}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ imagemUrl: data.url })
      });

      setTimeout(() => {
        fecharModalImagem();
        carregarProgramacoes();
      }, 1000);
    } else {
      status.textContent = 'Erro no envio da imagem.';
    }
  } catch (err) {
    status.textContent = 'Erro ao enviar: ' + err.message;
  }
}


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
  document.getElementById('inputImagem').value = '';
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
  document.getElementById('inputImagem').value = p.imagemUrl || '';
  document.getElementById('programacaoModal').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('programacaoModal').style.display = 'none';
}

async function salvarProgramacao() {
  const tema = document.getElementById('inputTema').value;
  const responsavel = document.getElementById('inputResponsavel').value;
  const rawDate = document.getElementById('inputData').value;
  const data = new Date(rawDate + 'T12:00:00');
  const video = document.getElementById('inputVideo').value;
  const pptx = document.getElementById('inputPptx').value;
  const imagemUrl = document.getElementById('inputImagem').value;

  if (!tema.trim() || !responsavel.trim() || !rawDate.trim()) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  const payload = { tema, responsavel, data, video, pptx, imagemUrl };

  try {
    let res;
    if (editandoId) {
      res = await fetch(`${API_URL}/programacoes/${editandoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
    } else {
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

function renderTree() {
  const busca = document.getElementById('programacaoBusca').value.toLowerCase();
  const lista = document.getElementById('programacaoLista');
  lista.innerHTML = '';

  const agrupado = {};
  programacoes.forEach(p => {
    if (!p.data) return;
    const data = new Date(p.data);
    const ano = data.getFullYear();
    const mes = capitalizeMes(data.toLocaleString('pt-BR', { month: 'long' }));
    const dia = data.toLocaleDateString('pt-BR').slice(0, 5);
    if (!agrupado[ano]) agrupado[ano] = {};
    if (!agrupado[ano][mes]) agrupado[ano][mes] = [];
    agrupado[ano][mes].push({ ...p, dia });
  });

  Object.keys(agrupado).sort((a, b) => b - a).forEach(ano => {
    const liAno = document.createElement('li');
    const btnAno = document.createElement('button');
    btnAno.className = 'tree-toggle-btn';
    btnAno.textContent = expandedState.anos[ano] ? '–' : '+';
    btnAno.setAttribute('aria-expanded', expandedState.anos[ano] ? 'true' : 'false');
    btnAno.onclick = () => {
      expandedState.anos[ano] = !expandedState.anos[ano];
      renderTree();
    };
    liAno.appendChild(btnAno);
    const spanAno = document.createElement('span');
    spanAno.textContent = ` ${ano}`;
    spanAno.style.fontWeight = 'bold';
    liAno.appendChild(spanAno);

    if (expandedState.anos[ano]) {
      const ulMeses = document.createElement('ul');
      Object.keys(agrupado[ano]).forEach(mes => {
        const key = `${ano}-${mes}`;
        const liMes = document.createElement('li');
        const btnMes = document.createElement('button');
        btnMes.className = 'tree-toggle-btn';
        btnMes.textContent = expandedState.meses[key] ? '–' : '+';
        btnMes.setAttribute('aria-expanded', expandedState.meses[key] ? 'true' : 'false');
        btnMes.onclick = () => {
          expandedState.meses[key] = !expandedState.meses[key];
          renderTree();
        };
        liMes.appendChild(btnMes);
        const spanMes = document.createElement('span');
        spanMes.textContent = ` ${mes}`;
        spanMes.style.fontWeight = 'bold';
        liMes.appendChild(spanMes);

        if (expandedState.meses[key]) {
          const container = document.createElement('div');
          container.className = 'cards-container';

          agrupado[ano][mes]
            .filter(p => p.tema.toLowerCase().includes(busca))
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .forEach(p => {
              const card = document.createElement('div');
              card.className = 'programacao-card';

              const imagemContainer = document.createElement('div');
              imagemContainer.className = 'programacao-img-container';
              imagemContainer.innerHTML = p.imagemUrl
                ? `<img src="${p.imagemUrl}" alt="Imagem ${p.tema}" class="programacao-img">`
                : `<div class="programacao-img placeholder-img">Sem imagem</div>`;
              card.appendChild(imagemContainer);

              const info = document.createElement('div');
              info.className = 'programacao-info';
              info.innerHTML = `
                <h3>${p.dia} — ${p.tema}</h3>
                <p>Proprietário(a): ${p.responsavel}</p>
                ${p.video ? `<p>Vídeo: <a href="${p.video}" target="_blank">Acessar</a></p>` : ''}
                ${p.pptx ? `<p>PPTX: <a href="${p.pptx}" target="_blank">Acessar</a></p>` : ''}
              `;
              card.appendChild(info);

              if (isModerator) {
                const acoes = document.createElement('div');
                acoes.className = 'programacao-acoes';
                acoes.innerHTML = `
                  <button class="btn-editar" onclick="abrirModalEditar('${p._id}')">Editar</button>
                  <button class="btn-excluir" onclick="abrirConfirmacao('${p._id}')">Excluir</button>
                  <button class="btn-imagem" onclick="abrirModalImagem('${p._id}')">Imagem</button>

                `;
                card.appendChild(acoes);
              }

              container.appendChild(card);
            });
          liMes.appendChild(container);
        }

        ulMeses.appendChild(liMes);
      });
      liAno.appendChild(ulMeses);
    }

    lista.appendChild(liAno);
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

document.getElementById('modalLoginAdmin').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    document.getElementById('btnEntrarAdmin').click();
  }
});
