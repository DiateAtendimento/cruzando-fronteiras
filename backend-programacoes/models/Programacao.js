const mongoose = require('mongoose');

const ProgramacaoSchema = new mongoose.Schema({
  tema:        { type: String, required: true },
  responsavel: { type: String, required: true },
  data:        { type: Date,   required: true },
  video:       { type: String },
  pptx:        { type: String },
  createdAtBr: { type: String },
  updatedAtBr: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Programacao', ProgramacaoSchema);
