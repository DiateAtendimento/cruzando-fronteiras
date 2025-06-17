// server.js
process.env.TZ = 'America/Sao_Paulo';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const jwt = require('jsonwebtoken');

const Programacao = require('./models/Programacao');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_forte_123';

// Middleware
app.use(cors());
app.use(express.json());

// Descobre IP público do Render
(async () => {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    console.log('🌐 IP público do Render:', data.ip);
  } catch (err) {
    console.error('❌ Erro ao buscar IP do Render:', err.message);
  }
})();

// Conexão com o MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado!'))
  .catch(err => {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });

// ======== ROTAS DE UPLOAD ========
app.use('/api', uploadRoutes); 

// ======== AUTENTICAÇÃO JWT ========

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Di@te2025W3';

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '3h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
});

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

app.get('/api/programacoes', async (req, res) => {
  try {
    const programacoes = await Programacao.find().sort({ data: 1 });
    res.json(programacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar programações.' });
  }
});

app.post('/api/programacoes', autenticarJWT, async (req, res) => {
  try {
    // CORRIGINDO FUSO HORÁRIO ANTES DE SALVAR
    const { tema, responsavel, data, video, pptx, imagemUrl } = req.body;
    const dataInput = new Date(data);
    dataInput.setHours(12, 0, 0);

    const dadosProgramacao = { tema, responsavel, data: dataInput, video, pptx, imagemUrl };

    let nova = new Programacao(dadosProgramacao);
    await nova.save();

    const createdAtBr = new Date(nova.createdAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const updatedAtBr = new Date(nova.updatedAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    nova = await Programacao.findByIdAndUpdate(nova._id, { createdAtBr, updatedAtBr }, { new: true });
    res.status(201).json(nova);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar programação.', details: err.message });
  }
});

app.put('/api/programacoes/:id', autenticarJWT, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    if (req.body.data) {
      const dataInput = new Date(req.body.data);
      dataInput.setHours(12, 0, 0);
      req.body.data = dataInput;
    }

    let atualizada = await Programacao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!atualizada) return res.status(404).json({ error: 'Programação não encontrada.' });

    const updatedAtBr = new Date(atualizada.updatedAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    atualizada = await Programacao.findByIdAndUpdate(req.params.id, { updatedAtBr }, { new: true });

    res.json(atualizada);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao editar programação.', details: err.message });
  }
});


app.delete('/api/programacoes/:id', autenticarJWT, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const removida = await Programacao.findByIdAndDelete(req.params.id);
    if (!removida) return res.status(404).json({ error: 'Programação não encontrada.' });
    res.json({ msg: 'Programação excluída com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao excluir programação.' });
  }
});
