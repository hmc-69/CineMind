import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FilmPackage, StoryboardImage, AgentRole } from '../types';
import { ImageIcon, Download } from 'lucide-react';

interface OutputDisplayProps {
  activeRole: AgentRole;
  filmPackage: FilmPackage;
  isGeneratingImages: boolean;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ activeRole, filmPackage, isGeneratingImages }) => {
  
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
        
        {/* Header Area */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">/</span> {activeRole} Report
            </h2>
            <p className="text-sm text-zinc-500 mt-1 font-mono">
                PRJ: {filmPackage.input.title.toUpperCase() || 'UNTITLED'} // MOD: {filmPackage.input.mode.toUpperCase()}
            </p>
          </div>
          {content && (
              <button className="text-xs flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
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
            <div className="prose prose-invert prose-amber max-w-none">
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-zinc-100 mt-8 mb-4 border-l-4 border-amber-500 pl-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-zinc-200 mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium text-amber-500/90 mt-4 mb-2 uppercase tracking-wider text-xs" {...props} />,
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