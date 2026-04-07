export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured in Cloudflare environment." }), { status: 500 });
    }

    // Fetch the rules txt file from the same domain
    const url = new URL(request.url);
    const rulesUrl = `${url.protocol}//${url.host}/kepco_rules.txt`;
    
    let rulesText = "지장전주 업무기준 텍스트를 불러올 수 없습니다. 텍스트 파일 위치를 확인하세요.";
    try {
      const resp = await fetch(rulesUrl);
      if(resp.ok) rulesText = await resp.text();
    } catch(e) {
      console.error(e);
    }

    const systemInstruction = `
당신은 한국전력공사(KEPCO)의 지장전주 이설 업무기준 판단 전문 AI입니다.
반드시 아래 제공된 [배전선로 이설 업무기준] 문서 및 추가 판례에만 기반하여 판단을 내려야 합니다. 
결과 도출 시, 어떤 조항(제N조 N항 등)을 근거로 삼았는지 명확히 인용하고 원문을 요약해서 보여주세요.
규정에 명확하지 않거나 직원의 입력 정보가 부족한 경우, 확정하지 말고 추가 정보를 되물어주세요.

=============================
[배전선로 이설 업무기준 및 판례 데이터]
${rulesText}
=============================
`;

    // Make request to Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = body.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        temperature: 0.1 // 낮게 설정하여 환각 방지 및 엄격한 추론 유도
      }
    };

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await geminiResp.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
