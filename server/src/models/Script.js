const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  keywords: [{ type: String }],
  responses: [{ type: String }],
  intentType: { type: String, enum: ['keyword', 'ai', 'order', 'greeting', 'question'], default: 'keyword' },
  priority: { type: Number, default: 0 },
  aiEnabled: { type: Boolean, default: false },
  randomEnabled: { type: Boolean, default: true },
  matchMode: { type: String, enum: ['keyword', 'regex', 'fuzzy'], default: 'keyword' },
  remark: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#00d4ff' },
  order: { type: Number, default: 0 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

const Script = mongoose.model('Script', scriptSchema);
const Category = mongoose.model('Category', categorySchema);

module.exports = { Script, Category };