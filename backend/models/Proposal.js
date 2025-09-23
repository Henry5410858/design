const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
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
    theme: {
      primary: String,
      secondary: String,
      logoUrl: String,
    },
    items: [ItemSchema],
    aiIntro: String,
    pdfUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', ProposalSchema);