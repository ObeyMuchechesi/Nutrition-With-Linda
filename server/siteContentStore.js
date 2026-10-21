const mongoose = require('mongoose');
const DEFAULT_SITE_CONTENT = require('../shared/siteContentDefaults.json');
const connectToDatabase = require('./database');

const siteContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'homepage' },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const SiteContent = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);

async function findOrCreateSiteContent() {
  return SiteContent.findOneAndUpdate(
    { key: 'homepage' },
    { $setOnInsert: { content: DEFAULT_SITE_CONTENT } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
}

async function getPublicSiteContent() {
  await connectToDatabase();
  const record = await findOrCreateSiteContent();
  return record.content || DEFAULT_SITE_CONTENT;
}

module.exports = { SiteContent, findOrCreateSiteContent, getPublicSiteContent };
