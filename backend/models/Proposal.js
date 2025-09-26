const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageUrl: String,
  enhancedUrl: String,
  location: String,
  keyFacts: [String],
  benefits: [String],
  performance: [String],
  highlights: [String],
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
      contact: {
        name: String,
        email: String,
        phone: String,
      },
    },
    theme: {
      primary: String,
      secondary: String,
      logoUrl: String,
    },
    items: [ItemSchema],
    aiIntro: String,
    template: String,
    locale: String,
    currencyCode: String,
    pdfUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', ProposalSchema);