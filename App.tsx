import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, AgentStatus, FilmPackage, StoryInput, ProductionMode, StoryboardImage } from './types';
import { 
  runDirectorAgent, 
  runCinematographerAgent, 
  runProducerAgent, 
  runEditorAgent, 
  runMarketingAgent,
  generateStoryboardPrompts,
  generateImage
} from './services/gemini';
import AgentCard from './components/AgentCard';
import OutputDisplay from './components/OutputDisplay';
import { Film, Play, Sparkles, Globe } from 'lucide-react';

const INITIAL_STATUS: AgentStatus[] = [
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
    content: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(INITIAL_STATUS);
  const [filmPackage, setFilmPackage] = useState<FilmPackage>({
    id: 'draft-1',
    input: input,
    storyboardPrompts: [],
    generatedImages: []
  });
  const [activeRole, setActiveRole] = useState<AgentRole>(AgentRole.Director);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // --- Refs ---
  const packageRef = useRef(filmPackage);
  useEffect(() => { packageRef.current = filmPackage; }, [filmPackage]);

  // --- Handlers ---
  const handleStartProduction = async () => {
    if (!input.content.trim()) return;
    
    setIsProcessing(true);
    // Reset statuses
    setAgentStatuses(INITIAL_STATUS.map(s => ({...s, isComplete: false, isProcessing: false})));
    setFilmPackage(prev => ({
        ...prev, 
        input: input, 
        scriptBreakdown: undefined, 
        shotList: undefined, 
        budgetReport: undefined, 
        editPlan: undefined, 
        marketingCopy: undefined, 
        generatedImages: []
    }));

    try {
      // 1. Director
      await runAgentStep(AgentRole.Director, async () => {
        return await runDirectorAgent(input);
      }, 'scriptBreakdown');

      // 2. Cinematographer
      await runAgentStep(AgentRole.Cinematographer, async () => {
        return await runCinematographerAgent(input, packageRef.current.scriptBreakdown!);
      }, 'shotList');

      // 3. Producer
      await runAgentStep(AgentRole.Producer, async () => {
        return await runProducerAgent(input, packageRef.current.shotList!);
      }, 'budgetReport');

      // 4. Editor
      await runAgentStep(AgentRole.Editor, async () => {
        return await runEditorAgent(input, packageRef.current.scriptBreakdown!, packageRef.current.budgetReport!);
      }, 'editPlan');

      // 5. Marketing
      await runAgentStep(AgentRole.Marketing, async () => {
        return await runMarketingAgent(input, packageRef.current.scriptBreakdown!);
      }, 'marketingCopy');

      // 6. Asset Generation (Parallel)
      startAssetGeneration();

    } catch (error) {
      console.error("Pipeline breakdown:", error);
      alert("Production halted due to an error. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runAgentStep = async (role: AgentRole, action: () => Promise<string>, stateKey: keyof FilmPackage) => {
    // Update status to processing
    setAgentStatuses(prev => prev.map(s => s.id === role ? { ...s, isProcessing: true } : s));
    setActiveRole(role);

    // Run AI
    const result = await action();

    // Update Data
    setFilmPackage(prev => ({ ...prev, [stateKey]: result }));

    // Update status to complete
    setAgentStatuses(prev => prev.map(s => s.id === role ? { ...s, isProcessing: false, isComplete: true } : s));
  };

  const startAssetGeneration = async () => {
    setIsGeneratingImages(true);
    try {
        // Generate Prompts
        const prompts = await generateStoryboardPrompts(
            JSON.stringify({
                script: packageRef.current.scriptBreakdown,
                shots: packageRef.current.shotList
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

  // --- Main App Render ---
  return (
    <div className="flex h-screen bg-black text-zinc-200 overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Sidebar / Configuration */}
      <div className="w-[400px] flex flex-col border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center text-black font-bold">
                <Film size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CineMind <span className="text-zinc-500 font-normal">Studio</span></h1>
          </div>
          <p className="text-xs text-zinc-500">Autonomous Multi-Agent Production Pipeline</p>
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

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Logline / Script Idea</label>
              <textarea 
                value={input.content}
                onChange={e => setInput(prev => ({...prev, content: e.target.value}))}
                placeholder="A retired detective discovers a time machine in his basement..."
                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-700 resize-none font-script leading-relaxed"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartProduction}
            disabled={isProcessing || !input.content}
            className={`w-full py-4 rounded-md font-bold tracking-wide flex items-center justify-center gap-2 transition-all
                ${isProcessing 
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
                    onClick={() => setActiveRole(status.id)}
                />
             ))}
          </div>

        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-zinc-950 relative">
        {/* Background Ambient Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>

        <div className="relative z-10 flex-1 h-full">
            <OutputDisplay 
                activeRole={activeRole} 
                filmPackage={filmPackage} 
                isGeneratingImages={isGeneratingImages}
            />
        </div>
      </div>
      
    </div>
  );
}