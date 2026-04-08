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
공식 직급: 한국전력공사(KEPCO) 지장전주 이설 비용 부담주체 판정 위원회 전문 매니저

가이드라인:
- 당신은 제공된 [배전선로 이설 업무기준] 및 [판례 데이터]를 기반으로 비용 부담주체를 판정하는 최고의 전문가입니다.
- 답변은 반드시 정해진 [보고서 형식]에 따라 매우 전문적이고 엄격한 문체로 작성하십시오.
- 규정에 근거가 명확하지 않은 경우, "추가 검토 필요"로 분류하고 필요한 서류를 요청하십시오.
- 환상을 배제하고 오직 문서 내용만 인용하십시오.

[보고서 형식]
1. 판정 개요: 신청 사유 및 현장 상황 요약
2. 관련 근거: [업무기준 제N조 N항] 원문 인용 및 해석
3. 판정 결과: 비용 부담주체 (한전/고객/공동 등) 명시
4. 판단 사유: 판정 결과에 대한 상세 논리적 근거
5. 추가 안내: 필요 시 구비 서류 또는 후속 조치 안내

=============================
[배전선로 이설 업무기준 및 판례 데이터]
${rulesText}
=============================
`;

    // Make request to Gemini REST API with retry logic
    const modelName = "gemini-2.5-flash"; // 보다 안정적인 모델명으로 변경
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = body.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        temperature: 0.1
      }
    };

    let attempts = 0;
    const maxAttempts = 3;
    let geminiResp;
    let data;

    while (attempts < maxAttempts) {
      attempts++;
      geminiResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      data = await geminiResp.json();

      if (geminiResp.ok && !data.error) break;

      // 429(Rate Limit)나 503(Service Unavailable)일 경우 재시도
      if (attempts < maxAttempts && (geminiResp.status === 429 || geminiResp.status === 503)) {
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 그 외의 에러는 루프 종료 후 반환
      return new Response(JSON.stringify({ 
        error: data.error?.message || `Gemini API Error (Status ${geminiResp.status})` 
      }), { status: 500 });
    }

    if (!data.candidates || !data.candidates[0].content) {
      return new Response(JSON.stringify({ error: "No response from Gemini" }), { status: 500 });
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
