const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  location: String,
  keyFacts: String,
  imageUrl: String,
  enhancedUrl: String,
});

const ProposalSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    client: {
      name: String,
      email: String,
      phone: String,
      quote: String,
      industry: String,
      valueProps: [String],
    },
    contact: {
      name: String,
      email: String,
      phone: String,
      company: String,
      address: String,
      website: String,
    },
    theme: {
      primary: String,
      secondary: String,
      logoUrl: String,
    },
    items: [ItemSchema],
    template: { type: String, enum: ['comparative-short', 'simple-proposal', 'dossier-express'], default: 'comparative-short' },
    aiIntro: String,
    pdfUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', ProposalSchema);