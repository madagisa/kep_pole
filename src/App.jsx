import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  FileText, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  User, 
  Bot, 
  Copy, 
  CheckCircle2, 
  Search,
  BookMarked
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
  const [messages, setMessages] = useState([
    { role: 'model', content: "안녕하세요! **한국전력공사 지장전주 가이드**에 오신 것을 환영합니다.\n\n[배전선로 이설 업무기준]과 최신 판례를 바탕으로 비용 부담 주체를 정확히 판별해 드립니다. 민원 상황을 아래에 입력해 주세요." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch('/kepco_rules.txt')
      .then(res => res.text())
      .then(text => setSourceText(text))
      .catch(e => console.error("Failed to load rules", e));
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      let aiResponseText = "";
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
         const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
         
         const systemInstruction = `
공식 직급: 한국전력공사(KEPCO) 지장전주 이설 전문 선임 매니저
가이드라인:
- 반드시 아래의 [공식 업무기준] 문서 조항에 기반하여 사실적으로 판단하시오.
- 근거 조항(제N조 N항)을 반드시 명시할 것.
- 표 데이터가 있으면 마크다운 표(|---|---|)를 사용하여 가독성 있게 표현하시오.
- 답변 말미에 "판단 근거: [N조 N항]"을 요약 정리하시오.
- 문서에 없는 내용은 "본 문서에는 명시되지 않았습니다"라고 하고 지어내지 말 것.

[공식 업무기준]
${sourceText}
`;
         const chat = model.startChat({
           history: messages.slice(0, -1).map(m => ({
             role: m.role,
             parts: [{ text: m.content }]
           })),
           systemInstruction: systemInstruction,
           generationConfig: { temperature: 0.1, topK: 1 }
         });

         const result = await chat.sendMessage(userMsg.content);
         aiResponseText = result.response.text();
      }

      setMessages(prev => [...prev, { role: 'model', content: aiResponseText }]);

    } catch (err) {
      console.error(err);
      setError("연동 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-800 antialiased overflow-hidden md:flex-row">
      
      {/* 🌟 좌측: 사이드패널 / 혹은 네비게이션 (데스크탑) */}
      <div className="hidden md:flex flex-col w-20 lg:w-24 bg-white border-r items-center py-8 space-y-8 shadow-sm z-20">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <BookMarked className="w-7 h-7" />
        </div>
        <div className="flex flex-col space-y-6">
          <button className="p-3 text-blue-600 bg-blue-50 rounded-xl transition-all">
            <Bot className="w-6 h-6" />
          </button>
          <button onClick={() => setShowSource(!showSource)} className={`p-3 rounded-xl transition-all ${showSource ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}>
            <FileText className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 🚀 중앙: 메인 인터렉션 영역 */}
      <div className={`flex-1 flex flex-col relative bg-white transition-all duration-500 overflow-hidden ${showSource ? 'md:max-w-[calc(100%-550px)]' : 'md:max-w-full'}`}>
        
        {/* 모바일 화면용 헤더 */}
        <div className="md:hidden flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800">지장전주 가이드</span>
          </div>
          <button onClick={() => setShowSource(!showSource)} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-full transition-all">
            {showSource ? "채팅 보기" : "관심 소스 보기"}
          </button>
        </div>

        {/* 데스크탑 상단 바 */}
        <div className="hidden md:flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center">
              지장전주 전문가 브리핑
              <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-md font-extrabold uppercase tracking-widest">Enterprise Beta</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5 font-medium leading-relaxed">KEPCO [배전선로 이설 업무기준] 인용 AI</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-slate-200" />
                  </div>
                ))}
             </div>
             <span className="text-xs text-slate-400 font-semibold">+ 직원 활용 중</span>
          </div>
        </div>

        {/* 💬 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 space-y-8 scroll-smooth h-full">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[80%]`}>
                
                <div className="flex items-center mb-1.5 space-x-2 px-1">
                  {msg.role === 'user' ? (
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">나 (요청자)</span>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">KEPCO AI 매니저</span>
                    </>
                  )}
                </div>

                <div className={`relative px-5 py-4 transition-all duration-300 ${msg.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-blue-500/25' : 'bg-white border border-slate-100/60 text-slate-800 rounded-2xl rounded-tl-none shadow-sm shadow-slate-200/50'}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm md:prose-base max-w-none prose-slate prose-headings:text-slate-800 prose-strong:text-blue-700 prose-code:bg-blue-50 prose-code:text-blue-600 prose-table:border prose-table:border-slate-200 prose-table:rounded-xl prose-table:overflow-hidden prose-th:bg-blue-50/50 prose-th:p-3 prose-th:text-slate-700 prose-td:p-3 prose-td:border-t prose-td:border-slate-100 prose-tr:hover:bg-slate-50/70 transition-colors"
                  >
                    {msg.content}
                  </ReactMarkdown>
                  
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="absolute -bottom-10 right-0 p-2 text-slate-400 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all opacity-0 md:group-hover:opacity-100"
                      title="복사하기"
                    >
                      {copiedId === idx ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
             <div className="flex justify-start animate-pulse">
               <div className="bg-slate-50 rounded-2xl rounded-tl-none p-5 flex items-center border border-slate-100 shadow-sm">
                 <div className="flex space-x-2 mr-3">
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75" />
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150" />
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-225" />
                 </div>
                 <span className="text-slate-500 text-xs font-semibold tracking-tight">문서를 종합하여 전문 소견을 정리하고 있습니다...</span>
               </div>
             </div>
          )}

          {error && (
            <div className="flex justify-center my-6">
               <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl flex items-center text-sm border border-red-100 shadow-sm font-medium">
                 <AlertCircle className="w-4 h-4 mr-3" />
                 {error}
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-10" />
        </div>

        {/* ⌨️ 입력 필드 - 글래스모피즘 */}
        <div className="px-4 py-4 md:px-12 bg-white/70 backdrop-blur-xl border-t border-slate-100/50 pb-6 md:pb-8 sticky bottom-0 z-20 w-full mb-0 shadow-[0_-10px_40px_rgb(0,0,0,0.02)] transition-all">
          <div className={`max-w-4xl mx-auto relative group transition-all duration-300 ${loading ? 'opacity-70 grayscale' : ''}`}>
            <textarea
              className="w-full bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2rem] px-6 py-5 md:px-8 md:py-6 pr-20 md:pr-24 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] min-h-[70px] max-h-[220px]"
              placeholder="민원 케이스를 전문적으로 설명해 주세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-3 bottom-3 md:right-4 md:bottom-4 flex space-x-2">
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.03] hover:shadow-blue-500/40 active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all duration-300"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-[0.2em] font-bold">Powered by Gemini Intelligent Core Engine</p>
        </div>
      </div>

      {/* 📖 우측: 관련 근거 뷰어 (NotebookLM 스타일) */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 md:relative md:inset-auto md:z-10 bg-slate-900/40 backdrop-blur-sm md:bg-transparent ${showSource ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto md:hidden'}`}>
        <div className={`absolute right-0 top-0 h-full w-[85%] md:w-[450px] lg:w-[550px] bg-white shadow-2xl flex flex-col transition-all duration-500 transform ${showSource ? 'translate-x-0' : 'translate-x-full md:translate-x-0 cursor-default'}`}>
          <div className="flex items-center justify-between p-6 border-b bg-slate-50">
            <div className="flex items-center text-slate-800">
               <FileText className="w-5 h-5 text-blue-600 mr-2" />
               <span className="font-bold tracking-tight">참조 소스 원문 데이터</span>
            </div>
            <button onClick={() => setShowSource(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#FAFBFC]">
            <div className="bg-white border rounded-3xl p-6 shadow-sm border-blue-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-blue-100/50 transition-all duration-500" />
               <h3 className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3 flex items-center">
                 <Search className="w-3 h-3 mr-2" /> 
                 Live Context
               </h3>
               <p className="text-sm text-slate-600 leading-relaxed font-medium">
                 현재 좌측 AI는 이 문서의 **{sourceText.length.toLocaleString()}자** 데이터를 완벽하게 숙지하고 파악한 상태에서 답변하고 있습니다.
               </p>
            </div>

            <div className="prose prose-sm prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-sans text-slate-500 leading-relaxed text-sm selection:bg-blue-100">
                {sourceText ? sourceText : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <span>데이터 로딩 중...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
