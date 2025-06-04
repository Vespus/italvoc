import fetch from 'node-fetch';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  console.log('API: Request received', { method: req.method, body: req.body });

  if (req.method !== 'POST') {
    console.log('API: Method not allowed', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    const { count } = body;
    
    if (!count || typeof count !== 'number' || count < 1 || count > 20) {
      console.log('API: Invalid count', { count });
      return res.status(400).json({ 
        error: 'Invalid count. Please provide a number between 1 and 20.' 
      });
    }

    console.log('API: Checking ANTHROPIC_API_KEY', { 
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyLength: process.env.ANTHROPIC_API_KEY?.length
    });

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const prompt = `Generiere ${count} japanische Vokabeln im folgenden JSON-Format:
{
  "vocabularies": [
    {
      "japanese": "漢字", // Japanische Schreibweise (Kanji)
      "kana": "かんじ",   // Hiragana/Katakana Lesung
      "romaji": "kanji", // Lateinische Umschrift (Romaji)
      "german": "Kanji",  // Deutsche Bedeutung
      "example": "これは漢字です。" // Optional: Beispielsatz
    }
  ]
}

Wichtige Regeln:
1. Nur gültige japanische Vokabeln
2. Korrekte Kanji und Kana
3. Präzise deutsche Übersetzungen
4. Korrekte lateinische Umschrift (Romaji) für jedes Wort
5. Beispielsätze sind optional
6. Keine Duplikate
7. Vermeide unbedingt gängige Wörter und Substantive wie Haus, Lehrer, Wald, Strasse, etc.
8. Gehe bei der Vokabelgenerierung davon aus, dass jemand Japanisch Vokabeln lernen will, der schon einen guten Grundwortschatz hat.`;

    console.log('API: Sending request to Anthropic', { count });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log('API: Anthropic response status', { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Anthropic error response', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API: Anthropic response received', { 
      hasContent: !!data.content,
      contentLength: data.content?.[0]?.text?.length
    });
    
    // Extrahiere den JSON-String aus der Claude-Antwort
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('API: Invalid response format', { content });
      throw new Error('Invalid response format from Claude');
    }

    const vocabularies = JSON.parse(jsonMatch[0]).vocabularies;
    console.log('API: Successfully parsed vocabularies', { 
      count: vocabularies.length 
    });
    
    res.status(200).json({ vocabularies });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 