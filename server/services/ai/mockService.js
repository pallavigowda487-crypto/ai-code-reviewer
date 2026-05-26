const reviewWithMock = async (code, language) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    fallback: false,
    summary: `Great job! This is a mock AI review since a valid API key was not provided. Your ${language} code looks functionally correct but can be improved with some best practices.`,
    score: 85,
    issues: [
      {
        severity: 'Medium',
        line: '1',
        problem: 'Console log statement found',
        solution: 'Consider removing console.log in production code or replacing it with a robust logging framework.'
      },
      {
        severity: 'Low',
        line: '1',
        problem: 'Missing error handling',
        solution: 'Consider wrapping your code in a try/catch block if it performs operations that could fail.'
      }
    ],
    improvedCode: `// Improved ${language} code\ntry {\n  ${code.split('\\n').map(line => '  ' + line).join('\\n')}\n} catch (error) {\n  console.error('An error occurred:', error);\n}`,
    bestPractices: [
      'Always remove debugging statements before deploying to production.',
      'Add comprehensive error handling to prevent application crashes.',
      'Use descriptive names for variables and functions.',
      'Write unit tests to verify the logic of your code.'
    ]
  };
};

module.exports = {
  reviewWithMock
};
