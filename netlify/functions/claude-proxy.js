/**
 * Netlify Function — Claude API Proxy
 *
 * Why this exists:
 *   The Anthropic API cannot be called directly from a browser because:
 *   1. Anthropic blocks browser requests via CORS policy
 *   2. Putting an API key in frontend code exposes it to anyone
 *
 * This function runs server-side on Netlify's infrastructure.
 * The browser calls /.netlify/functions/claude-proxy instead of
 * api.anthropic.com directly. The ANTHROPIC_API_KEY environment
 * variable is set in your Netlify dashboard — never in code.
 *
 * Setup:
 *   Netlify Dashboard → Site → Environment Variables → Add:
 *     Key:   ANTHROPIC_API_KEY
 *     Value: sk-ant-...your key...
 */

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // CORS headers — allow requests from your own Netlify domain
  const headers = {
    'Access-Control-Allow-Origin': '*',   // Tighten to your domain in production
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);

    // Forward the request to Anthropic, injecting the server-side key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // ← set in Netlify dashboard
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      body.model      || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        system:     body.system,
        messages:   body.messages,
        ...(body.tools ? { tools: body.tools } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || 'Anthropic API error' }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
