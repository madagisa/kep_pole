import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  ClipboardCheck,
  MapPin,
  HelpCircle,
  Building2,
  Construction,
  Landmark,
  ShieldCheck,
  SendHorizontal
} from 'lucide-react';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    applicantName: "",
    address: "",
    poleId: "",
    locationType: "private", // private, public, agrip, other
    legalRight: "unknown", // yes, no, unknown
    reason: "new_build", // new_build, access, road_project, agri_work, other
    timing: "unknown", // before_permit, after_permit, before_notice, after_notice, unknown
    kecViolation: "no", // yes, no
    additionalInfo: ""
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [sourceText, setSourceText] = useState("");

  useEffect(() => {
    fetch('/kepco_rules.txt')
      .then(res => res.text())
      .then(text => setSourceText(text))
      .catch(e => console.error("Failed to load rules", e));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJudgment = async () => {
    setLoading(true);
    setError("");
    setStep(5); // Result step

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { 
              role: 'user', 
              content: `
[지장전주 이설 판정 요청 데이터]
1. 현장 정보: ${formData.address} (${formData.poleId})
2. 신청인: ${formData.applicantName}
3. 장소 성격: ${formData.locationType}
4. 적법 권원/점용허가: ${formData.legalRight}
5. 이설 사유: ${formData.reason}
6. 주요 시점: ${formData.timing}
7. KEC 이격거리 미달 여부: ${formData.kecViolation}
8. 기타 상황: ${formData.additionalInfo}

위 데이터를 바탕으로 [배전선로 이설 업무기준]에 따른 부담주체 판정 결과를 보고서 형식으로 작성해줘. 
정확한 근거 조항을 명시하고, 부담주체(한전/고객)를 명확히 판정해줘.` 
            }
          ] 
        })
      });
      
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "서버 통신 오류");
      setResult(data.answer);
    } catch (err) {
      console.error(err);
      setError("판정 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">현장 기본 정보</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">신청인(성명/상호)</label>
                <input 
                  type="text" 
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" 
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">전주 번호</label>
                <input 
                  type="text" 
                  name="poleId"
                  value={formData.poleId}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" 
                  placeholder="예: 1234A567"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-500 ml-1">현장 주소</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" 
                  placeholder="예: 서울특별시 중구 ..."
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">설치 환경 및 권원</h2>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 ml-1">토지 성격</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'private', label: '사유지', icon: <Landmark className="w-4 h-4" /> },
                  { id: 'public', label: '공공용지(도로)', icon: <MapPin className="w-4 h-4" /> },
                  { id: 'agri', label: '농경지', icon: <FileText className="w-4 h-4" /> },
                  { id: 'other', label: '기타', icon: <HelpCircle className="w-4 h-4" /> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFormData(prev => ({ ...prev, locationType: item.id }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all space-y-2 ${formData.locationType === item.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    {item.icon}
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <label className="text-sm font-bold text-slate-500 ml-1">적법 권원 / 점용 허가 여부</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'yes', label: '있음 (동의/허가)' },
                  { id: 'no', label: '없음 (무단/만료)' },
                  { id: 'unknown', label: '확인 불가 / 불분명' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFormData(prev => ({ ...prev, legalRight: item.id }))}
                    className={`px-6 py-3 rounded-full border-2 text-sm font-bold transition-all ${formData.legalRight === item.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium ml-1">* 점용 허가 조건에 따라 부담 주체가 달라질 수 있습니다.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <Construction className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">이설 신청 사유</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'new_build', label: '건조물 신증축', desc: '새 건물을 짓거나 확장하는 경우' },
                { id: 'access', label: '출입구 확보', desc: '주차장 진입로 등 차량 출입에 지장' },
                { id: 'road_project', label: '도로공사 / 공공사업', desc: '정부/지자체 시행 사업' },
                { id: 'agri_work', label: '농작업 지장', desc: '농기계 통행, 관정 설치 등' },
                { id: 'other', label: '기타 사유', desc: '미관 저해, 안전 우려 등' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFormData(prev => ({ ...prev, reason: item.id }))}
                  className={`flex items-start p-5 rounded-3xl border-2 transition-all text-left ${formData.reason === item.id ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.reason === item.id ? 'border-orange-500 bg-orange-500' : 'border-slate-200'}`}>
                    {formData.reason === item.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="ml-4">
                    <div className={`text-base font-bold ${formData.reason === item.id ? 'text-orange-900' : 'text-slate-700'}`}>{item.label}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">검토 상세 조건</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-1">주요 발생 시점</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'before_permit', label: '건축허가(신고) 전 설치' },
                    { id: 'after_permit', label: '건축허가(신고) 후 설치' },
                    { id: 'before_notice', label: '도로 고시(구역 결정) 전' },
                    { id: 'after_notice', label: '도로 고시(구역 결정) 후' },
                    { id: 'unknown', label: '시점 불분명' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setFormData(prev => ({ ...prev, timing: item.id }))}
                      className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold text-left transition-all ${formData.timing === item.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-700">KEC(전기설비규정) 이격거리 미달</div>
                  <div className="text-xs text-slate-400 mt-1">이격거리 부족으로 안전상 즉시 이설이 필요한 상태입니까?</div>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, kecViolation: "yes" }))}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.kecViolation === "yes" ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                  >
                    예
                  </button>
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, kecViolation: "no" }))}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.kecViolation === "no" ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                  >
                    아니오
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">추가 참고 상황</label>
                <textarea 
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" 
                  placeholder="특이사항이나 보충 설명이 필요한 내용을 입력하세요..."
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="min-h-[500px] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            {loading ? (
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">지장전주 판정 분석 중...</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">업무 표준 및 최신 판례 데이터를 대조하고 있습니다.</p>
                </div>
              </div>
            ) : error ? (
              <div className="max-w-md w-full bg-red-50 p-8 rounded-[2rem] border border-red-100 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-red-800">분석 실패</h3>
                <p className="text-sm text-red-600/70 font-medium leading-relaxed">{error}</p>
                <button 
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all"
                >
                  다시 시도하기
                </button>
              </div>
            ) : (
              <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-900/5 overflow-hidden">
                  <div className="p-8 md:p-12 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-xs uppercase tracking-widest mb-2">
                        <ClipboardCheck className="w-4 h-4" />
                        <span>AI Judgment Report</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">부담주체 판정 보고서</h2>
                    </div>
                    <div className="hidden md:block">
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20">Final Report</div>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 overflow-y-auto max-h-[600px] custom-scrollbar">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-strong:text-blue-700 prose-table:border prose-table:border-slate-100"
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                  <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Powered by KEPCO AI Engine</p>
                    <div className="flex space-x-3 w-full md:w-auto">
                      <button 
                        onClick={() => setStep(1)}
                        className="flex-1 md:flex-none px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                      >
                        처음으로
                      </button>
                      <button 
                        className="flex-1 md:flex-none px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                        onClick={() => window.print()}
                      >
                        보고서 인쇄
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const steps = [
    { id: 1, label: "기본 정보" },
    { id: 2, label: "설치 환경" },
    { id: 3, label: "지장 사유" },
    { id: 4, label: "상세 검토" }
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFE] text-slate-800 font-sans selection:bg-blue-100">
      
      {/* 🌟 Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-slate-800 tracking-tighter">KEPCO 지장전주 판정시스템</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advanced Judgment Workflow</p>
          </div>
        </div>

        {step <= 4 && (
          <div className="flex items-center space-x-2 md:space-x-8">
            <div className="hidden lg:flex items-center">
              {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className="flex items-center group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                      {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                    </div>
                    <span className={`ml-3 text-xs font-bold transition-all ${step === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && <div className="w-8 h-px bg-slate-100 mx-4" />}
                </React.Fragment>
              ))}
            </div>
            <div className="lg:hidden px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
              Step {step} of 4
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
           <button className="hidden md:flex items-center px-4 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
             <BookOpen className="w-5 h-5 mr-2" />
             <span className="text-xs font-bold">도움말</span>
           </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        
        {step <= 4 && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center lg:text-left">
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-md">Smart Workflow v4.0</span>
              <h2 className="text-4xl font-black text-slate-800 mt-4 tracking-tight leading-none italic">
                {steps.find(s => s.id === step)?.label}
              </h2>
              <p className="text-slate-400 text-sm mt-3 font-medium">실무 규정에 근거한 정확한 판정을 위해 상세 데이터를 입력해 주세요.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/40 border border-slate-100 ring-1 ring-slate-100/50">
              {renderStep()}

              <div className="mt-12 flex pt-8 border-t border-slate-50 items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`flex items-center px-8 py-4 rounded-2xl text-sm font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  이전 단계
                </button>
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-10 py-5 bg-slate-900 text-white rounded-3xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    다음으로
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleJudgment}
                    className="flex items-center px-10 py-5 bg-blue-600 text-white rounded-3xl text-sm font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    AI 판정 요청
                    <SendHorizontal className="w-5 h-5 ml-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && renderStep()}

      </main>

      <footer className="py-12 border-t border-slate-50 bg-[#FAFBFC] mt-20">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2 grayscale opacity-50">
             <div className="w-8 h-8 bg-slate-600 rounded-lg" />
             <span className="font-bold text-slate-800 text-sm">KEPCO</span>
          </div>
          <p className="text-xs text-slate-400 font-medium text-center md:text-left">
            본 시스템은 한국전력공사 내부 업무 가이드를 상용 AI 모델로 구현한 서비스입니다.<br className="md:hidden" />
            최종 결정은 반드시 원문 규정을 확인하시기 바랍니다.
          </p>
          <div className="flex space-x-6">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Legal</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Privacy</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
