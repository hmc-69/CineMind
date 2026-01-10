import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, AgentStatus, FilmPackage, StoryInput, ProductionMode, StoryboardImage } from './types';
import { 
  runDirectorAgent, 
  runCinematographerAgent, 
  runProducerAgent, 
  runEditorAgent, 
  runMarketingAgent,
  runScriptwriterAgent,
  generateStoryboardPrompts,
  generateImage
} from './services/gemini';
import AgentCard from './components/AgentCard';
import OutputDisplay from './components/OutputDisplay';
import { Film, Play, Sparkles, Globe, Upload, FileText, AlignLeft, FileUp, Loader2, Menu, X, Plus } from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';

// Handle PDF.js import structure which can vary by bundler/environment
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF Worker
// using cdnjs for the worker ensures we get the correct raw file with proper CORS headers
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const INITIAL_STATUS: AgentStatus[] = [
  { id: AgentRole.Scriptwriter, label: 'Screenwriter', description: 'Script generation & formatting', isProcessing: false, isComplete: false },
  { id: AgentRole.Director, label: 'Director', description: 'Story structure & themes', isProcessing: false, isComplete: false },
  { id: AgentRole.Cinematographer, label: 'Cinematographer', description: 'Shot list & lighting', isProcessing: false, isComplete: false },
  { id: AgentRole.Producer, label: 'Producer', description: 'Budget & feasibility', isProcessing: false, isComplete: false },
  { id: AgentRole.Editor, label: 'Editor', description: 'Pacing & rhythm', isProcessing: false, isComplete: false },
  { id: AgentRole.Marketing, label: 'Marketing', description: 'Trailer & pitch', isProcessing: false, isComplete: false },
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Chinese (Mandarin)',
  'Hindi',
  'Portuguese'
];

export default function App() {
  // --- App State ---
  const [input, setInput] = useState<StoryInput>({
    title: '',
    genre: '',
    mode: 'Netflix',
    language: 'English',
    content: '',
    inputType: 'logline'
  });
  const [rewriteScript, setRewriteScript] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(INITIAL_STATUS);
  const [filmPackage, setFilmPackage] = useState<FilmPackage>({
    id: 'draft-1',
    input: input,
    storyboardPrompts: [],
    generatedImages: []
  });
  const [activeRole, setActiveRole] = useState<AgentRole>(AgentRole.Scriptwriter);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Refs ---
  const packageRef = useRef(filmPackage);
  useEffect(() => { packageRef.current = filmPackage; }, [filmPackage]);

  // --- Handlers ---
  const handleStartProduction = async () => {
    if (!input.content.trim()) return;
    
    setIsProcessing(true);
    setHasStarted(true);
    setShowMobileSidebar(false); // Close sidebar on mobile when starting
    
    // Determine Pipeline
    const includeScriptwriter = input.inputType === 'logline' || (input.inputType === 'script' && rewriteScript);
    
    // Filter agents based on configuration
    const pipeline = INITIAL_STATUS.filter(s => s.id !== AgentRole.Scriptwriter || includeScriptwriter);
    
    // Reset statuses for the active pipeline
    setAgentStatuses(pipeline.map(s => ({...s, isComplete: false, isProcessing: false})));
    
    // Determine starting role
    const startingRole = includeScriptwriter ? AgentRole.Scriptwriter : AgentRole.Director;
    setActiveRole(startingRole);

    setFilmPackage(prev => ({
        ...prev, 
        input: input, 
        generatedScript: undefined,
        scriptBreakdown: undefined, 
        shotList: undefined, 
        budgetReport: undefined, 
        editPlan: undefined, 
        marketingCopy: undefined, 
        generatedImages: []
    }));

    try {
      let scriptContent = input.content;
      let generatedScript = undefined;

      // 0. Scriptwriter (Conditional)
      if (includeScriptwriter) {
        generatedScript = await runAgentStep(AgentRole.Scriptwriter, async () => {
          return await runScriptwriterAgent(input);
        }, 'generatedScript');
        scriptContent = generatedScript;
      }

      // 1. Director
      // Use scriptContent variable instead of packageRef to ensure data availability immediately
      const scriptBreakdown = await runAgentStep(AgentRole.Director, async () => {
        return await runDirectorAgent(input, scriptContent);
      }, 'scriptBreakdown');

      // 2. Cinematographer
      const shotList = await runAgentStep(AgentRole.Cinematographer, async () => {
        return await runCinematographerAgent(input, scriptBreakdown);
      }, 'shotList');

      // 3. Producer
      const budgetReport = await runAgentStep(AgentRole.Producer, async () => {
        return await runProducerAgent(input, shotList);
      }, 'budgetReport');

      // 4. Editor
      const editPlan = await runAgentStep(AgentRole.Editor, async () => {
        return await runEditorAgent(input, scriptBreakdown, budgetReport);
      }, 'editPlan');

      // 5. Marketing
      const marketingCopy = await runAgentStep(AgentRole.Marketing, async () => {
        return await runMarketingAgent(input, scriptBreakdown);
      }, 'marketingCopy');

      // 6. Asset Generation (Parallel)
      // Pass variables directly to avoid ref timing issues
      startAssetGeneration(scriptBreakdown, shotList);

    } catch (error) {
      console.error("Pipeline breakdown:", error);
      alert("Production halted due to an error. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runAgentStep = async (role: AgentRole, action: () => Promise<string>, stateKey: keyof FilmPackage): Promise<string> => {
    // Update status to processing
    setAgentStatuses(prev => prev.map(s => s.id === role ? { ...s, isProcessing: true } : s));
    setActiveRole(role);

    // Run AI
    const result = await action();

    // Update Data
    setFilmPackage(prev => ({ ...prev, [stateKey]: result }));

    // Update status to complete
    setAgentStatuses(prev => prev.map(s => s.id === role ? { ...s, isProcessing: false, isComplete: true } : s));
    
    // Return result for immediate use
    return result;
  };

  const startAssetGeneration = async (script: string, shots: string) => {
    setIsGeneratingImages(true);
    try {
        // Generate Prompts
        const prompts = await generateStoryboardPrompts(
            JSON.stringify({
                script: script,
                shots: shots
            })
        );

        setFilmPackage(prev => ({ ...prev, storyboardPrompts: prompts }));

        // Create placeholders
        const placeholders: StoryboardImage[] = prompts.map(p => ({ prompt: p, loading: true }));
        setFilmPackage(prev => ({ ...prev, generatedImages: placeholders }));

        // Generate Images Sequentially
        const newImages = [...placeholders];
        for (let i = 0; i < prompts.length; i++) {
            const base64 = await generateImage(prompts[i]);
            if (base64) {
              newImages[i] = { ...newImages[i], base64, loading: false };
            } else {
              // Handle individual image failure without crashing entire UI
              newImages[i] = { ...newImages[i], loading: false };
            }
            setFilmPackage(prev => ({ ...prev, generatedImages: [...newImages] }));
        }

    } catch (e) {
        console.error("Asset gen failed", e);
    } finally {
        setIsGeneratingImages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
        let extractedText = "";

        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedText = result.value;
        } 
        else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            // Use local variable for task to ensure typing is handled if needed
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;
            
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                extractedText += pageText + '\n\n';
            }
        } 
        else {
            // Default to text read
            extractedText = await file.text();
        }

        setInput(prev => ({...prev, content: extractedText}));
    } catch (error) {
        console.error("File parsing error:", error);
        alert("Failed to extract text from file. Please upload a simpler file or copy/paste text.");
    } finally {
        setIsParsingFile(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper to change active role
  const handleAgentClick = (id: AgentRole) => {
    setActiveRole(id);
    setShowMobileSidebar(false);
  };

  // --- Main App Render ---
  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-zinc-200 overflow-hidden font-sans selection:bg-amber-500/30 relative">
      
      {/* Sidebar / Configuration - Mobile Drawer & Desktop Sidebar */}
      <div className={`
          fixed inset-0 z-50 bg-zinc-950 flex flex-col transition-transform duration-300 ease-in-out
          md:static md:w-[400px] md:border-r md:border-zinc-800 md:bg-zinc-950/50 md:backdrop-blur-xl md:z-10 md:translate-x-0
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center text-black font-bold">
                <Film size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CineMind <span className="text-zinc-500 font-normal">Studio</span></h1>
          </div>
          {/* Mobile Close Button */}
          <button 
             onClick={() => setShowMobileSidebar(false)}
             className="md:hidden text-zinc-400 hover:text-white"
          >
             <X size={24} />
          </button>
        </div>
        
        <div className="md:hidden px-6 text-xs text-zinc-500 -mt-4 pb-4 border-b border-zinc-800">
             Autonomous Multi-Agent Production Pipeline
        </div>

        {/* Input Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Project Title</label>
              <input 
                type="text" 
                value={input.title}
                onChange={e => setInput(prev => ({...prev, title: e.target.value}))}
                placeholder="Enter working title..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Genre</label>
                <input 
                    type="text" 
                    value={input.genre}
                    onChange={e => setInput(prev => ({...prev, genre: e.target.value}))}
                    placeholder="Sci-Fi, Noir..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-700"
                />
               </div>
               <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mode</label>
                <select 
                    value={input.mode}
                    onChange={e => setInput(prev => ({...prev, mode: e.target.value as ProductionMode}))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                    <option value="Netflix">Netflix (Streaming)</option>
                    <option value="Festival">Festival (Art House)</option>
                    <option value="Budget">Budget (Indie)</option>
                </select>
               </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Language</label>
              <div className="relative">
                <select 
                    value={input.language}
                    onChange={e => setInput(prev => ({...prev, language: e.target.value}))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 pl-10 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
                <Globe size={16} className="absolute left-3 top-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Source Material Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Source Material</label>
              
              {/* Toggle */}
              <div className="flex bg-zinc-900 p-1 rounded-md mb-3 border border-zinc-800">
                <button 
                  onClick={() => setInput(prev => ({...prev, inputType: 'logline'}))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-2
                    ${input.inputType === 'logline' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <AlignLeft size={14} /> Logline
                </button>
                <button 
                  onClick={() => setInput(prev => ({...prev, inputType: 'script'}))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-center gap-2
                    ${input.inputType === 'script' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <FileText size={14} /> Script
                </button>
              </div>

              {/* Input Area based on toggle */}
              <div className="relative">
                {input.inputType === 'script' && (
                  <div className="mb-2 flex justify-end">
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handleFileUpload} 
                       accept=".txt,.md,.json,.pdf,.docx" 
                       className="hidden" 
                     />
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingFile}
                        className="text-xs flex items-center gap-1.5 text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20 disabled:opacity-50 disabled:cursor-wait"
                     >
                        {isParsingFile ? (
                           <><Loader2 size={12} className="animate-spin" /> Reading...</>
                        ) : (
                           <><Upload size={12} /> Upload Script (PDF/DOCX)</>
                        )}
                     </button>
                  </div>
                )}
                
                <textarea 
                  value={input.content}
                  onChange={e => setInput(prev => ({...prev, content: e.target.value}))}
                  disabled={isParsingFile}
                  placeholder={input.inputType === 'logline' 
                    ? "A retired detective discovers a time machine in his basement..." 
                    : "EXT. ALLEYWAY - NIGHT\n\nThe rain falls hard on the pavement..."}
                  className={`w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-700 resize-none font-script leading-relaxed
                    ${input.inputType === 'script' ? 'h-48' : 'h-32'}
                    ${isParsingFile ? 'opacity-50' : ''}`}
                />

                {/* Optional Rewrite Checkbox - Only for Script Input */}
                {input.inputType === 'script' && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                id="rewrite"
                                checked={rewriteScript}
                                onChange={e => setRewriteScript(e.target.checked)}
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-600 bg-zinc-900 checked:border-amber-500 checked:bg-amber-500 transition-all"
                            />
                            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 text-black w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <label htmlFor="rewrite" className="text-xs text-zinc-400 cursor-pointer select-none">
                            Use AI Screenwriter to format/polish this script?
                        </label>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartProduction}
            disabled={isProcessing || !input.content || isParsingFile}
            className={`w-full py-4 rounded-md font-bold tracking-wide flex items-center justify-center gap-2 transition-all
                ${isProcessing || isParsingFile || !input.content
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/20'
                }
            `}
          >
            {isProcessing ? (
                <>PRODUCING... <Sparkles size={16} className="animate-spin" /></>
            ) : (
                <>START PRODUCTION <Play size={16} fill="currentColor" /></>
            )}
          </button>

          {/* Agent Status List */}
          <div className="space-y-3 pt-6 border-t border-zinc-800">
             <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Production Pipeline</h3>
             {agentStatuses.map((status) => (
                <AgentCard 
                    key={status.id} 
                    status={status} 
                    isActive={activeRole === status.id}
                    onClick={() => handleAgentClick(status.id)}
                />
             ))}
          </div>

        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-zinc-950 relative w-full">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center text-black font-bold">
                    <Film size={14} />
                </div>
                <span className="font-bold text-white text-lg">CineMind</span>
            </div>
            <button 
                onClick={() => setShowMobileSidebar(true)}
                className="text-zinc-400 hover:text-amber-500 p-1"
            >
                <Menu size={24} />
            </button>
        </div>

        {/* Background Ambient Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>

        <div className="relative z-10 flex-1 h-full overflow-hidden">
             {/* FAB for Mobile Start if not started */}
            {!hasStarted && (
                <div className="md:hidden absolute bottom-8 right-6 z-30">
                    <button 
                        onClick={() => setShowMobileSidebar(true)}
                        className="bg-amber-600 text-black p-4 rounded-full shadow-lg shadow-amber-900/40 hover:bg-amber-500 hover:scale-105 transition-all flex items-center justify-center"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            <OutputDisplay 
                activeRole={activeRole} 
                filmPackage={filmPackage} 
                isGeneratingImages={isGeneratingImages}
                hasStarted={hasStarted}
                onOpenSidebar={() => setShowMobileSidebar(true)}
            />
        </div>
      </div>
      
    </div>
  );
}