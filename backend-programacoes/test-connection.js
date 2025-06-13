const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  });
