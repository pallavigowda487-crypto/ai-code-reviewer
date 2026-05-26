const axios = require('axios');
const { getSystemPrompt } = require('./promptService');

const createFallbackReview = (code, language, reason) => {
  return {
    fallback: true,
    fallbackReason: reason || 'The AI provider could not be reached or the API key is invalid.',
    summary: `Live AI review unavailable. This is a fallback review for ${language}.`,
    score: 65,
    issues: [
      {
        severity: 'Low',
        line: 'N/A',
        problem: 'Live AI review unavailable.',
        solution: reason || 'The AI provider could not be reached or the API key is invalid.'
      }
    ],
    improvedCode: code,
    bestPractices: [
      'Verify your Grok API key in server/.env or use a valid x.ai API token.',
      'Ensure the server can access the Grok API endpoint over the network.',
      'Use descriptive variable names and keep functions small.',
      'Add comments for any complex logic or edge cases.'
    ]
  };
};

const reviewWithGrok = async (code, language) => {
  try {
    const apiKey = process.env.GROK_API_KEY;
    const model = process.env.GROK_MODEL || 'grok-beta'; // Using grok-beta or grok-vision-beta based on xAI API

    console.log('DEBUG: GROK_API_KEY present=', !!apiKey, 'value=', apiKey ? apiKey.slice(0, 8) + '...' : 'undefined');

    if (!apiKey) {
      console.warn('Grok API key missing. Using fallback review.');
      return createFallbackReview(code, language, 'Grok API key is not configured.');
    }

    const systemPrompt = getSystemPrompt();
    const userPrompt = `Review the following ${language} code:\n\n${code}`;

    // xAI API endpoint for Grok
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let content = response.data.choices[0].message.content;
    
    // Sometimes LLMs wrap JSON in markdown block. Let's strip it.
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error in Grok Service:', {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    const reason = error.response?.data?.error || error.message;
    return createFallbackReview(code, language, `Grok API unavailable: ${reason}`);
  }
};

module.exports = {
  reviewWithGrok
};
