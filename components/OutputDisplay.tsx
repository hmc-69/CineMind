import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FilmPackage, StoryboardImage, AgentRole } from '../types';
import { ImageIcon, Download, Film, Sparkles, Zap, Bot, Clapperboard, MonitorPlay, Globe, ChevronRight } from 'lucide-react';

interface OutputDisplayProps {
  activeRole: AgentRole;
  filmPackage: FilmPackage;
  isGeneratingImages: boolean;
  hasStarted: boolean;
  onOpenSidebar: () => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ activeRole, filmPackage, isGeneratingImages, hasStarted, onOpenSidebar }) => {
  
  const getContent = () => {
    switch (activeRole) {
      case AgentRole.Scriptwriter: return filmPackage.generatedScript;
      case AgentRole.Director: return filmPackage.scriptBreakdown;
      case AgentRole.Cinematographer: return filmPackage.shotList;
      case AgentRole.Producer: return filmPackage.budgetReport;
      case AgentRole.Editor: return filmPackage.editPlan;
      case AgentRole.Marketing: return filmPackage.marketingCopy;
      default: return null;
    }
  };

  const content = getContent();

  if (!hasStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 md:p-12 text-center bg-zinc-950">
         <div className="max-w-3xl space-y-6 md:space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black mb-2 md:mb-4 shadow-2xl shadow-amber-900/30">
               <Film size={32} className="md:w-10 md:h-10" />
            </div>
            
            <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                  CineMind <span className="text-zinc-600 font-light">Studio</span>
                </h1>
                <p className="text-base md:text-xl text-zinc-400 font-light max-w-xl mx-auto px-4 md:px-0">
                  Your autonomous AI production team. <br className="hidden md:block"/>
                  Turn loglines into greenlight-ready pitch packages.
                </p>
                
                {/* Mobile CTA Button */}
                <div className="md:hidden pt-4 pb-2">
                    <button 
                        onClick={onOpenSidebar}
                        className="bg-zinc-800 text-zinc-200 px-6 py-3 rounded-full font-semibold border border-zinc-700 flex items-center gap-2 mx-auto hover:bg-zinc-700 transition-colors shadow-lg"
                    >
                        Start New Project <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 md:pt-8 text-left w-full">
               <div className="p-5 md:p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:border-amber-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 text-amber-500">
                     <Bot size={20} />
                  </div>
                  <h3 className="font-semibold text-zinc-200 mb-1">Multi-Agent Core</h3>
                  <p className="text-sm text-zinc-500">Specialized agents (Director, DOP, Producer) collaborate to build your vision.</p>
               </div>
               
               <div className="p-5 md:p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:border-amber-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 text-amber-500">
                     <MonitorPlay size={20} />
                  </div>
                  <h3 className="font-semibold text-zinc-200 mb-1">Visual Storyboarding</h3>
                  <p className="text-sm text-zinc-500">Automated shot lists and high-fidelity cinematic image generation.</p>
               </div>

               <div className="p-5 md:p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:border-amber-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 text-amber-500">
                     <Globe size={20} />
                  </div>
                  <h3 className="font-semibold text-zinc-200 mb-1">Deep Localization</h3>
                  <p className="text-sm text-zinc-500">Produce content authentically adapted for 10+ global markets.</p>
               </div>
            </div>

            <div className="hidden md:flex pt-8 justify-center text-sm text-zinc-600 animate-pulse">
                &larr; Configure your project on the left to begin
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6 custom-scrollbar">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-zinc-800 pb-4 gap-2 md:gap-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">/</span> {activeRole} Report
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 mt-1 font-mono">
                PRJ: {filmPackage.input.title.toUpperCase() || 'UNTITLED'} // MOD: {filmPackage.input.mode.toUpperCase()}
            </p>
          </div>
          {content && (
              <button className="text-xs flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors self-start md:self-auto">
                  <Download size={14} /> EXPORT
              </button>
          )}
        </div>

        {/* Dynamic Content */}
        {!content ? (
           <div className="h-64 flex flex-col items-center justify-center text-zinc-600 space-y-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                <ImageIcon size={32} className="opacity-20" />
              </div>
              <p>Waiting for agent input...</p>
           </div>
        ) : (
            <div className="prose prose-sm md:prose-base prose-invert prose-amber max-w-none">
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mt-8 mb-4 border-l-4 border-amber-500 pl-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-semibold text-zinc-200 mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-medium text-amber-500/90 mt-4 mb-2 uppercase tracking-wider text-xs" {...props} />,
                        p: ({node, ...props}) => <p className="text-zinc-300 leading-relaxed mb-4 font-light" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 text-zinc-300" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-zinc-600" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-zinc-100 font-semibold" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-zinc-700 pl-4 py-1 my-4 text-zinc-400 italic bg-zinc-900/30 rounded-r-md" {...props} />,
                        code: ({node, ...props}) => <code className="bg-zinc-900 px-1 py-0.5 rounded text-amber-500/80 font-mono text-sm" {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        )}

        {/* Gallery Section - Only show on Marketing or Cinematographer tab, or if images exist */}
        {(filmPackage.generatedImages.length > 0 || isGeneratingImages) && (
            <div className="mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ImageIcon size={16} /> Visual Assets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filmPackage.generatedImages.map((img, idx) => (
                        <div key={idx} className="group relative aspect-video bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                            {img.loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs font-mono animate-pulse">RENDERING...</span>
                                </div>
                            ) : img.base64 ? (
                                <>
                                    <img src={img.base64} alt="Storyboard" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-red-500 text-xs">Failed to load</div>
                            )}
                        </div>
                    ))}
                    {isGeneratingImages && filmPackage.generatedImages.length === 0 && (
                         <div className="aspect-video bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed flex items-center justify-center">
                            <span className="text-xs text-zinc-500 font-mono animate-pulse">INITIALIZING RENDER ENGINE...</span>
                         </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default OutputDisplay;