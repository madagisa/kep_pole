import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, FileText, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! 한국전력공사 지장전주 이설 비용 부담 판단 AI입니다.\n어떤 상황인지 남겨주시면, [배전선로 이설 업무기준]과 판례에 근거하여 비용 부담 주체(한전/고객)를 알려드립니다." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  
  // NotebookLM처럼 원본 소스 데이터를 보여주기 위한 상태
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 로컬 환경이나 Cloudflare 환경에서 규칙 텍스트 불러오기
    fetch('/kepco_rules.txt')
      .then(res => res.text())
      .then(text => setSourceText(text))
      .catch(e => console.error("Failed to load rules", e));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      let aiResponseText = "";

      // 1. Production (Cloudflare Pages) 환경 체크
      // 개발 모드가 아니고, 로컬 환경변수가 없다면 Edge Function API 호출
      if (import.meta.env.PROD || !import.meta.env.VITE_GEMINI_API_KEY) {
         const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...messages, userMsg] })
         });
         const data = await resp.json();
         if (!resp.ok) throw new Error(data.error || "서버 통신 오류");
         aiResponseText = data.answer;
      } else {
         // 2. Local 개발 환경 (VITE_GEMINI_API_KEY 사용)
         const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
         const model = genAI.getGenerativeModel({ model: "gemini-pro" });
         
         const systemInstruction = `
당신은 한국전력공사(KEPCO)의 지장전주 이설 업무기준 판단 전문 AI입니다.
반드시 아래의 [배전선로 이설 업무기준 및 판례 데이터] 문서에만 기반하여 사실 위주로 판단을 내려야 합니다. 
도출 시 어떤 조항(제N조 N항 등)을 근거로 삼았는지 인용하고 원문을 요약해서 보여주세요. 판별이 모호하면 되물어주세요.

=============================
[배전선로 이설 업무기준 및 판례 데이터]
${sourceText}
=============================
`;
         const chat = model.startChat({
           history: messages.map(m => ({
             role: m.role,
             parts: [{ text: m.content }]
           })),
           systemInstruction: systemInstruction,
           generationConfig: { temperature: 0.1 }
         });

         const result = await chat.sendMessage(userMsg.content);
         aiResponseText = result.response.text();
      }

      setMessages(prev => [...prev, { role: 'model', content: aiResponseText }]);

    } catch (err) {
      console.error(err);
      setError("죄송합니다. 오류가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">
      {/* 모바일 화면용 헤더 */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b shadow-sm">
        <h1 className="text-lg font-bold text-blue-700 flex items-center">
           <BookOpen className="w-5 h-5 mr-2" />
           지장전주 판단 AI
        </h1>
        <button onClick={() => setShowSource(!showSource)} className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
          {showSource ? "채팅 보기" : "관련 근거 원문 보기"}
        </button>
      </div>

      {/* 왼쪽 메인 채팅 영역 */}
      <div className={`flex-1 flex flex-col ${showSource ? 'hidden md:flex' : 'flex'}`}>
        <div className="hidden md:flex p-6 border-b bg-white items-center">
           <BookOpen className="w-6 h-6 text-blue-700 mr-2" />
           <h1 className="text-2xl font-bold text-gray-800">지장전주 판단 AI (NotebookLM 모델)</h1>
        </div>

        {/* 채팅 메시지 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 shadow-sm rounded-bl-none'}`}>
                <ReactMarkdown className="prose prose-sm md:prose-base prose-blue max-w-none">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4 flex items-center shadow-sm">
                 <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                 <span className="text-gray-500 text-sm">문서를 종합하여 추론 중입니다...</span>
               </div>
             </div>
          )}
          {error && (
            <div className="flex justify-center my-4">
               <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center text-sm border border-red-100">
                 <AlertCircle className="w-4 h-4 mr-2" />
                 {error}
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 bg-white border-t">
          <div className="max-w-4xl mx-auto flex items-end bg-gray-50 rounded-2xl border pr-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <textarea
              className="flex-1 max-h-32 min-h-[56px] text-gray-800 bg-transparent p-4 resize-none outline-none"
              placeholder="민원 상황을 구체적으로 입력하세요 (예: 본인 사유지인데 주택 신축을 위해 전주를 옮겨달라고 함)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="mb-2 p-2 rounded-xl bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 소스(근거 원문) 뷰어 영역 - NotebookLM 특징 */}
      <div className={`w-full md:w-[400px] lg:w-[500px] border-l bg-white flex flex-col ${!showSource ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-gray-50 flex items-center text-gray-700">
          <FileText className="w-5 h-5 mr-2" />
          <h2 className="font-semibold">AI 판단 기준 (Source Document)</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 italic">
              "AI는 반드시 좌측 채팅방에 업로드된 이 문서를 통째로 읽고 한전의 비용 부과 기준에 따라 답변합니다. 나중에 판례가 추가되면 이곳에 내용이 늘어납니다."
            </p>
          </div>
          <div className="prose prose-sm text-gray-600 whitespace-pre-wrap font-sans">
            {sourceText ? sourceText : (
              <span className="text-red-500 font-bold text-center block mt-10">
                public/kepco_rules.txt 파일을 찾을 수 없습니다.<br/>
                제공하신 PDF의 텍스트를 추출하여 이 파일에 넣어주세요.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
