const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-4',
      messages: [
        { role: 'system', content: 'You are a code review assistant.' },
        { role: 'user', content: 'Review this JavaScript code: console.log("hi")' }
      ],
      temperature: 0.2
    }, {
      headers: {
        Authorization: 'Bearer your_api_key_here',
        'Content-Type': 'application/json'
      }
    });

    console.log('STATUS', response.status);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('ERROR', err.message);
    if (err.response) {
      console.error('RESPONSE STATUS', err.response.status);
      console.error('RESPONSE DATA', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
