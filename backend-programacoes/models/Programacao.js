const mongoose = require('mongoose');

const ProgramacaoSchema = new mongoose.Schema({
  tema:        { type: String, required: true },
  responsavel: { type: String, required: true },
  data:        { type: Date,   required: true },
  video:       { type: String },
  pptx:        { type: String },
  imagemUrl:   { type: String },
  createdAtBr: { type: String },
  updatedAtBr: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Programacao', ProgramacaoSchema);

const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });
const router = express.Router();

// Upload da imagem
router.post('/upload-imagem', upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  res.json({ url: req.file.path });
});
