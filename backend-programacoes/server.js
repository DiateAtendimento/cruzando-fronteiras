require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Programacao = require('./models/Programacao');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_forte_123';

// Middleware
app.use(cors());
app.use(express.json());

//IP DO RENDER
require('node-fetch')('https://api.ipify.org?format=json')
  .then(res => res.json())
  .then(data => console.log('🌐 IP público do Render:', data.ip))
  .catch(err => console.error('❌ Erro ao buscar IP do Render:', err.message));


// Conexão com o MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado!'))
  .catch(err => {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });

// ======== AUTENTICAÇÃO JWT ========

// Usuário/senha de admin (em produção, use .env)
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Di@te2025W3';

// Rota de login — retorna token JWT se for admin
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    // Cria token JWT válido por 3h
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '3h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
});

// Middleware de autenticação para rotas protegidas
function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não enviado.' });

  const token = authHeader.replace('Bearer ', '');
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido ou expirado.' });
    req.user = decoded;
    next();
  });
}

// ======== ROTAS CRUD ========

// Listar todas as programações (acesso livre)
app.get('/api/programacoes', async (req, res) => {
  try {
    const programacoes = await Programacao.find().sort({ data: 1 });
    res.json(programacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar programações.' });
  }
});

// Criar nova programação (PROTEGIDO)
app.post('/api/programacoes', autenticarJWT, async (req, res) => {
  try {
    let nova = new Programacao(req.body);
    await nova.save();

    const createdAtBr = new Date(nova.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const updatedAtBr = new Date(nova.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    nova = await Programacao.findByIdAndUpdate(nova._id, { createdAtBr, updatedAtBr }, { new: true });

    res.status(201).json(nova);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar programação.', details: err.message });
  }
});

// Editar programação (PROTEGIDO)
app.put('/api/programacoes/:id', autenticarJWT, async (req, res) => {
  try {
    let atualizada = await Programacao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!atualizada) return res.status(404).json({ error: 'Programação não encontrada.' });

    const updatedAtBr = new Date(atualizada.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    atualizada = await Programacao.findByIdAndUpdate(req.params.id, { updatedAtBr }, { new: true });

    res.json(atualizada);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao editar programação.', details: err.message });
  }
});

// Excluir programação (PROTEGIDO)
app.delete('/api/programacoes/:id', autenticarJWT, async (req, res) => {
  try {
    const removida = await Programacao.findByIdAndDelete(req.params.id);
    if (!removida) return res.status(404).json({ error: 'Programação não encontrada.' });
    res.json({ msg: 'Programação excluída com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao excluir programação.' });
  }
});

// Teste rota raiz
app.get('/', (req, res) => {
  res.send('Backend Programações Rodando 🎉');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
