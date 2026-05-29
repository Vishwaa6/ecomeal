import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { ingredients } = await request.json()

    if (!ingredients) {
      return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `You are a professional chef AI for a restaurant. 
Based on these expiring ingredients: ${ingredients}

Generate exactly 3 creative dish recommendations to minimize food waste.
Respond ONLY with a valid JSON object in this exact format, no markdown, no extra text:
{
  "dishes": [
    {
      "name": "Dish name",
      "description": "Brief appetizing description",
      "ingredients": ["ingredient1", "ingredient2"],
      "waste_tip": "How this dish reduces waste"
    }
  ]
}`
          }
        ]
      })
    })

    const data = await response.json()
    console.log('Groq response:', JSON.stringify(data))
    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}