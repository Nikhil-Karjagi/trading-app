import { NextResponse } from "next/server";

function getFallbackQuestions(title: string) {
  return [
    {
      question: `What does RSI below 30 indicate for a stock?`,
      options: ["Overbought — time to sell", "Oversold — potential buy zone", "Neutral market", "High volume"],
      correctIndex: 1,
      explanation: "RSI below 30 = oversold. Stock may bounce back up — often a buying opportunity."
    },
    {
      question: "What is STCG tax rate in India for stocks held less than 1 year?",
      options: ["10%", "15%", "20%", "30%"],
      correctIndex: 2,
      explanation: "Short Term Capital Gains for equity in India is taxed at 20% flat for holdings under 1 year."
    },
    {
      question: "What does a Moving Average BUY signal mean?",
      options: ["Price fell below MA", "Price crossed above MA", "Volume spiked", "RSI crossed 70"],
      correctIndex: 1,
      explanation: "BUY signal = price crosses above the Moving Average, indicating start of an uptrend."
    },
    {
      question: "What is Beta in stock analysis?",
      options: ["Company profit margin", "Stock volatility vs market", "Daily trading volume", "P/E ratio"],
      correctIndex: 1,
      explanation: "Beta measures stock movement vs market. Above 1 = more volatile than market."
    },
    {
      question: "Why do US stocks cost more for Indian investors?",
      options: ["US stocks always expensive", "Forex charges and TCS apply", "SEBI charges extra", "NSE blocks US trading"],
      correctIndex: 1,
      explanation: "Indian investors pay forex markup (1.5%), bank wire (₹500), and TCS — all reducing actual returns."
    },
  ];
}

async function tryGeminiModel(model: string, prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    if (data.error?.code === 429 || data.error?.code === 503) return null;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();

    const prompt = `Generate exactly 5 multiple choice questions about: "${title}". ${description ? `Context: ${description}` : ""}

Return ONLY a JSON array, no markdown, no backticks:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]`;

    const models = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite-001",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let text: string | null = null;
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      text = await tryGeminiModel(model, prompt, process.env.GEMINI_API_KEY!);
      if (text) {
        console.log(`Success with model: ${model}`);
        break;
      }
      console.log(`Model ${model} failed, trying next...`);
    }

    if (!text) {
      console.log("All models failed, using fallback questions");
      return NextResponse.json({ questions: getFallbackQuestions(title), fallback: true });
    }

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) {
      return NextResponse.json({ questions: getFallbackQuestions(title), fallback: true });
    }

    const questions = JSON.parse(text.slice(start, end + 1));
    return NextResponse.json({ questions, fallback: false });

  } catch (e: unknown) {
    console.error("Quiz error:", e);
    return NextResponse.json({ questions: getFallbackQuestions("trading"), fallback: true });
  }
}