require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Programacao = require('./models/Programacao');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado!'))
  .catch(err => {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });

// Rotas CRUD

// Listar todas as programações (com datas formatadas BR)
app.get('/api/programacoes', async (req, res) => {
  try {
    const programacoes = await Programacao.find().sort({ data: 1 });
    const formatada = programacoes.map(p => ({
      ...p.toObject(),
      createdAtBr: new Date(p.createdAt).toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updatedAtBr: new Date(p.updatedAt).toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    res.json(formatada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar programações.' });
  }
});

// Criar nova programação
app.post('/api/programacoes', async (req, res) => {
  try {
    const nova = new Programacao(req.body);
    await nova.save();
    res.status(201).json(nova);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar programação.', details: err.message });
  }
});

// Editar programação
app.put('/api/programacoes/:id', async (req, res) => {
  try {
    const atualizada = await Programacao.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!atualizada) return res.status(404).json({ error: 'Programação não encontrada.' });
    res.json(atualizada);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao editar programação.', details: err.message });
  }
});

// Excluir programação
app.delete('/api/programacoes/:id', async (req, res) => {
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
