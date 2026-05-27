import { NextRequest, NextResponse } from 'next/server';
import { buildStoryPrompt, parseStoryResponse, generateFallbackStory } from '@/lib/storyGenerator';
import { Character, StoryHistoryEntry, NPC, PlotThread } from '@/types/game';

const MAX_RETRIES = 3;

async function callLLM(
  apiBase: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string | null> {
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个修仙世界的叙事者，擅长创作有深度的修仙故事，风格参考《凡人修仙传》但要有独特的反转。你要保持故事连贯性，记住之前出现的人物和事件。你只返回合法的JSON，不要包含任何其他文字、解释、注释或markdown标记。确保JSON完全合法：字符串中引号必须用反斜杠转义，不要尾逗号，不要注释。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    console.error('LLM API error:', response.status);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character, previousChoice, useLLM, storyHistory, npcs, plotThreads } = body as {
      character: Character;
      previousChoice?: string;
      useLLM?: boolean;
      storyHistory?: StoryHistoryEntry[];
      npcs?: NPC[];
      plotThreads?: PlotThread[];
    };

    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    const apiBase = process.env.LLM_API_BASE || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

    if (!useLLM || !apiKey) {
      const story = generateFallbackStory(character);
      return NextResponse.json({ story });
    }

    const prompt = buildStoryPrompt(character, previousChoice, storyHistory, npcs, plotThreads);

    // 最多重试3次
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const raw = await callLLM(apiBase, apiKey, model, prompt);
        if (!raw) continue;

        const story = parseStoryResponse(raw);
        if (story) {
          return NextResponse.json({ story });
        }

        console.warn(`Story parse failed (attempt ${attempt}/${MAX_RETRIES}), raw length: ${raw.length}`);
        console.warn(`Raw response (first 500 chars): ${raw.slice(0, 500)}`);
      } catch (err) {
        console.error(`LLM call failed (attempt ${attempt}/${MAX_RETRIES}):`, err);
      }
    }

    // 全部重试失败，降级到备用故事
    console.warn('All LLM attempts failed, using fallback story');
    const story = generateFallbackStory(character);
    return NextResponse.json({ story, fallback: true });
  } catch (error) {
    console.error('Story API error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
