
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Mode, FunctionType, ImageData, AppState, AspectRatio } from './types';
import * as Icons from './components/Icons';
import { generateImageContent } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: Mode.CREATE,
    selectedFunction: 'free',
    aspectRatio: '1:1',
    prompt: '',
    image1: null,
    image2: null,
    resultImage: null,
    isLoading: false,
    statusMessage: 'Gerando seu design...'
  });

  const [showModal, setShowModal] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputDualRef1 = useRef<HTMLInputElement>(null);
  const fileInputDualRef2 = useRef<HTMLInputElement>(null);

  const toggleMode = (mode: Mode) => {
    setState(prev => ({
      ...prev,
      mode,
      selectedFunction: mode === Mode.CREATE ? 'free' : 'add-remove',
      image1: null,
      image2: null
    }));
  };

  const handleFunctionSelect = (func: FunctionType) => {
    setState(prev => ({ ...prev, selectedFunction: func }));
  };

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setState(prev => ({ ...prev, aspectRatio: ratio }));
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, prompt: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 0 | 1 | 2 = 0) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      
      setState(prev => {
        if (slot === 1) return { ...prev, image1: { base64, mimeType } };
        if (slot === 2) return { ...prev, image2: { base64, mimeType } };
        return { ...prev, image1: { base64, mimeType } };
      });
    };
    reader.readAsDataURL(file);
  };

  const generateImage = async () => {
    if (!state.prompt.trim() && state.mode === Mode.CREATE) return;

    setState(prev => ({ ...prev, isLoading: true, resultImage: null }));
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const result = await generateImageContent(
        state.prompt,
        state.mode,
        state.selectedFunction,
        state.aspectRatio,
        state.image1,
        state.image2
      );
      setState(prev => ({ ...prev, resultImage: result, isLoading: false }));
    } catch (error) {
      console.error("Geração falhou.");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const downloadImage = () => {
    if (!state.resultImage) return;
    const link = document.createElement('a');
    link.href = state.resultImage;
    link.download = `gerador30-${Date.now()}.png`;
    link.click();
  };

  const editCurrentImage = () => {
    if (!state.resultImage) return;
    const base64 = state.resultImage.split(',')[1];
    const mimeType = 'image/png';
    setState(prev => ({
      ...prev,
      mode: Mode.EDIT,
      selectedFunction: 'retouch',
      image1: { base64, mimeType },
      resultImage: null
    }));
    setShowModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aspectRatios = [
    { label: "1:1", icon: <Icons.Ratio11 /> },
    { label: "4:3", icon: <Icons.Ratio43 /> },
    { label: "16:9", icon: <Icons.Ratio169 /> },
    { label: "9:16", icon: <Icons.Ratio916 /> },
    { label: "3:4", icon: <Icons.Ratio34 /> },
  ];

  const cssAspectRatio = useMemo(() => {
    return state.aspectRatio.replace(':', ' / ');
  }, [state.aspectRatio]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-x-hidden">
      {/* Painel de Controle Lateral */}
      <div className="w-full md:w-[400px] border-r border-gray-100 flex flex-col p-6 space-y-6 bg-white z-20 shadow-sm">
        <header className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#007BFF] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">3</div>
           <div>
             <h1 className="text-2xl font-black tracking-tighter text-gray-900 leading-none uppercase">GERADOR 3.0</h1>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Design Studio</p>
           </div>
        </header>

        {/* 1. Prompt (Movido para o topo conforme solicitado) */}
        <section className="space-y-3">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Descreva seu Design</label>
          <textarea
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:border-[#007BFF] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none min-h-[100px] transition-all resize-none shadow-sm"
            placeholder="Ex: Futurismo cibernético, azul e branco..."
            value={state.prompt}
            onChange={handlePromptChange}
          />
        </section>

        {/* 2. Alternância de Modo */}
        <section className="flex bg-gray-100 rounded-2xl p-1.5 border border-gray-100">
          <button
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${state.mode === Mode.CREATE ? 'bg-white text-[#007BFF] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => toggleMode(Mode.CREATE)}
          >
            CRIAR
          </button>
          <button
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${state.mode === Mode.EDIT ? 'bg-white text-[#007BFF] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => toggleMode(Mode.EDIT)}
          >
            EDITAR
          </button>
        </section>

        {/* 3. Funções */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {state.mode === Mode.CREATE ? (
              <>
                <FunctionCard active={state.selectedFunction === 'free'} onClick={() => handleFunctionSelect('free')} label="LIVRE" icon={<Icons.PromptIcon />} />
                <FunctionCard active={state.selectedFunction === 'sticker'} onClick={() => handleFunctionSelect('sticker')} label="STICKER" icon={<Icons.StickerIcon />} />
                <FunctionCard active={state.selectedFunction === 'text'} onClick={() => handleFunctionSelect('text')} label="LOGO" icon={<Icons.LogoIcon />} />
                <FunctionCard active={state.selectedFunction === 'comic'} onClick={() => handleFunctionSelect('comic')} label="COMIC" icon={<Icons.ComicIcon />} />
              </>
            ) : (
              <>
                <FunctionCard active={state.selectedFunction === 'add-remove'} onClick={() => handleFunctionSelect('add-remove')} label="OBJETOS" icon={<Icons.AddRemoveIcon />} />
                <FunctionCard active={state.selectedFunction === 'retouch'} onClick={() => handleFunctionSelect('retouch')} label="RETOQUE" icon={<Icons.RetouchIcon />} />
                <FunctionCard active={state.selectedFunction === 'style'} onClick={() => handleFunctionSelect('style')} label="ESTILO" icon={<Icons.StyleIcon />} />
                <FunctionCard active={state.selectedFunction === 'compose'} onClick={() => handleFunctionSelect('compose')} label="MESCLAR" icon={<Icons.ComposeIcon />} />
              </>
            )}
          </div>
        </div>

        {/* 4. Proporção */}
        <section className="space-y-3">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Proporção da Tela</label>
          <div className="grid grid-cols-5 gap-1 w-full">
            {aspectRatios.map(ratio => (
              <button
                key={ratio.label}
                onClick={() => handleAspectRatioSelect(ratio.label as AspectRatio)}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                  state.aspectRatio === ratio.label 
                    ? 'bg-[#007BFF] border-[#007BFF] text-white shadow-xl shadow-blue-100 scale-105 z-10' 
                    : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <div className="scale-75">{ratio.icon}</div>
                <span className="text-[9px] font-black">{ratio.label}</span>
              </button>
            ))}
          </div>
        </section>

        {state.mode === Mode.EDIT && (
          <div className="space-y-3">
            <div 
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#007BFF] transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[100px]"
              onClick={() => (state.selectedFunction === 'compose' ? fileInputDualRef1.current : fileInputRef.current)?.click()}
            >
              {!state.image1 ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[#007BFF]"><Icons.UploadIcon /></div>
                  <span className="text-[10px] font-black text-gray-400">ENVIAR BASE</span>
                </div>
              ) : (
                <img src={`data:${state.image1.mimeType};base64,${state.image1.base64}`} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e)} />
              <input type="file" className="hidden" accept="image/*" ref={fileInputDualRef1} onChange={(e) => handleImageUpload(e, 1)} />
            </div>

            {state.selectedFunction === 'compose' && (
              <div 
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#007BFF] transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[100px]"
                onClick={() => fileInputDualRef2.current?.click()}
              >
                {!state.image2 ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-[#007BFF]"><Icons.UploadIcon /></div>
                    <span className="text-[10px] font-black text-gray-400">ENVIAR MÁSCARA</span>
                  </div>
                ) : (
                  <img src={`data:${state.image2.mimeType};base64,${state.image2.base64}`} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <input type="file" className="hidden" accept="image/*" ref={fileInputDualRef2} onChange={(e) => handleImageUpload(e, 2)} />
              </div>
            )}
          </div>
        )}

        {/* 5. Botão Gerar */}
        <div className="pt-2">
          <button
            className="w-full bg-[#007BFF] text-white font-black py-5 rounded-3xl shadow-2xl shadow-blue-200 hover:bg-[#0056b3] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
            onClick={generateImage}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "GERAR DESIGN"}
          </button>
        </div>
      </div>

      {/* Área de Visualização */}
      <main ref={resultRef} className="flex-1 bg-white flex items-center justify-center p-0 md:p-0 min-h-[500px] md:min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#007BFF 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}></div>

        <div 
          className="preview-frame relative shadow-none border-none bg-transparent"
          style={{ 
            aspectRatio: cssAspectRatio,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!state.isLoading && !state.resultImage && (
            <div className="flex flex-col items-center gap-4 text-gray-100 animate-in fade-in duration-700">
               <div className="w-24 h-24 border-2 border-dashed border-gray-100 rounded-full flex items-center justify-center">
                  <Icons.StyleIcon />
               </div>
               <div className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-200">Pronto para Gerar</div>
            </div>
          )}

          {state.isLoading && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-[#007BFF] border-t-transparent rounded-full animate-spin"></div>
              <div className="text-[#007BFF] font-black text-[14px] tracking-[0.5em] uppercase animate-pulse">Renderizando</div>
            </div>
          )}

          {state.resultImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={state.resultImage} 
                className="w-full h-full object-contain cursor-zoom-in transition-all duration-700"
                onClick={() => setShowModal(true)}
              />
              
              <div className="absolute bottom-10 right-10 flex flex-col gap-3">
                <button onClick={editCurrentImage} className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-gray-100 text-gray-900 hover:text-[#007BFF] active:scale-90 transition-all group flex items-center gap-3">
                  <Icons.RetouchIcon />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Editar</span>
                </button>
                <button onClick={downloadImage} className="bg-[#007BFF] p-5 rounded-3xl shadow-2xl text-white hover:bg-[#0056b3] active:scale-90 transition-all shadow-blue-300 group flex items-center gap-3">
                  <Icons.UploadIcon />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Salvar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Visualização Expandida */}
      {showModal && state.resultImage && (
        <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="max-w-7xl w-full flex flex-col items-center gap-8">
              <img src={state.resultImage} className="max-h-[75vh] rounded-3xl shadow-[0_60px_120px_-30px_rgba(0,123,255,0.3)] border border-gray-50 object-contain" />
              <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl px-4">
                <button className="flex-1 py-6 bg-gray-50 text-gray-900 border border-gray-100 rounded-[2rem] font-black hover:bg-[#007BFF] hover:text-white hover:border-[#007BFF] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs shadow-sm" onClick={editCurrentImage}><Icons.RetouchIcon /> EDITAR</button>
                <button className="flex-1 py-6 bg-[#007BFF] text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:bg-[#0056b3] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs" onClick={downloadImage}><Icons.UploadIcon /> SALVAR</button>
                <button className="w-full md:w-auto px-16 py-6 bg-white text-gray-400 font-bold rounded-[2rem] hover:text-red-500 transition-all uppercase tracking-[0.2em] text-xs" onClick={() => setShowModal(false)}>FECHAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const FunctionCard: React.FC<{active: boolean, label: string, icon: React.ReactNode, onClick: () => void}> = ({ active, label, icon, onClick }) => (
  <button
    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
      active 
        ? 'bg-blue-50 border-[#007BFF] shadow-lg shadow-blue-50 text-[#007BFF] scale-[1.02]' 
        : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
    }`}
    onClick={onClick}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 text-[#007BFF]' : 'scale-90 text-gray-400 opacity-50'}`}>{icon}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</div>
  </button>
);

export default App;
