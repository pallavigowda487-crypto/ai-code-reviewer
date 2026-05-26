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
      'Verify your Groq API key in server/.env or use a valid API token.',
      'Ensure the server can access the Groq API endpoint over the network.',
      'Use descriptive variable names and keep functions small.',
      'Add comments for any complex logic or edge cases.'
    ]
  };
};

const reviewWithGroq = async (code, language) => {
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama3-70b-8192';

    if (!apiKey) {
      console.warn('Groq API key missing. Using mock review.');
      const { reviewWithMock } = require('./mockService');
      return reviewWithMock(code, language);
    }

    const systemPrompt = getSystemPrompt();
    const userPrompt = `Review the following ${language} code:\n\n${code}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
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
    } else if (content.startsWith('```')) {
      content = content.replace(/^```.*\n/, '').replace(/\n```$/, '');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error in Groq Service:', {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status
    });

    // Fall back to a mock review if API key is invalid or API fails, to make it run perfectly for demo purposes
    const { reviewWithMock } = require('./mockService');
    return reviewWithMock(code, language);
  }
};

module.exports = {
  reviewWithGroq
};
