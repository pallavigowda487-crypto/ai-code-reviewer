const { reviewWithGroq } = require('./groqService');

const getAIProvider = () => {
  const provider = process.env.AI_PROVIDER || 'groq';

  if (provider.toLowerCase() === 'grok') {
     console.log('Intercepted AI_PROVIDER=grok, forcing to groq');
  }

  return reviewWithGroq;
};

module.exports = {
  getAIProvider
};

