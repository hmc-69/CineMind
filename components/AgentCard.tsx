import React from 'react';
import { AgentRole, AgentStatus } from '../types';
import { Video, Camera, DollarSign, Scissors, Megaphone, Loader2, CheckCircle, Circle, PenTool } from 'lucide-react';

interface AgentCardProps {
  status: AgentStatus;
  isActive: boolean;
  onClick: () => void;
}

const iconMap = {
  [AgentRole.Scriptwriter]: PenTool,
  [AgentRole.Director]: Video,
  [AgentRole.Cinematographer]: Camera,
  [AgentRole.Producer]: DollarSign,
  [AgentRole.Editor]: Scissors,
  [AgentRole.Marketing]: Megaphone,
};

const AgentCard: React.FC<AgentCardProps> = ({ status, isActive, onClick }) => {
  const Icon = iconMap[status.id];

  return (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-300 group
        ${isActive 
          ? 'bg-zinc-900 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
        }
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-md ${isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>{status.label}</h3>
          <p className="text-xs text-zinc-500 line-clamp-1">{status.description}</p>
        </div>
        <div className="text-zinc-500">
            {status.isProcessing ? (
                <Loader2 className="animate-spin text-amber-500" size={18} />
            ) : status.isComplete ? (
                <CheckCircle className="text-emerald-500" size={18} />
            ) : (
                <Circle size={18} />
            )}
        </div>
      </div>
      
      {/* Progress Bar for processing state */}
      {status.isProcessing && (
         <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800 overflow-hidden rounded-b-lg">
            <div className="h-full bg-amber-500/50 w-full animate-progress-indeterminate"></div>
         </div>
      )}
    </div>
  );
};

export default AgentCard;