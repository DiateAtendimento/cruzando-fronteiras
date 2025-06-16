// backend-programacoes/routes/upload.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });
const router = express.Router();

// Endpoint POST /api/upload-imagem
router.post('/upload-imagem', upload.single('imagem'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Falha no upload da imagem' });
  }

  res.json({ url: req.file.path });
});

module.exports = router;
