export type ProductionMode = 'Festival' | 'Netflix' | 'Budget';

export enum AgentRole {
  Scriptwriter = 'Scriptwriter',
  Director = 'Director',
  Cinematographer = 'Cinematographer',
  Producer = 'Producer',
  Editor = 'Editor',
  Marketing = 'Marketing'
}

export interface StoryInput {
  title: string;
  genre: string;
  mode: ProductionMode;
  language: string;
  content: string;
  inputType: 'logline' | 'script';
}

export interface AgentOutput {
  role: AgentRole;
  content: string; // Markdown content
  timestamp: number;
  completed: boolean;
}

export interface StoryboardImage {
  prompt: string;
  base64?: string;
  loading: boolean;
}

export interface FilmPackage {
  id: string;
  input: StoryInput;
  generatedScript?: string; // Scriptwriter
  scriptBreakdown?: string; // Director
  shotList?: string; // Cinematographer
  budgetReport?: string; // Producer
  editPlan?: string; // Editor
  finalScript?: string; // Director (Revised)
  marketingCopy?: string; // Marketing
  storyboardPrompts: string[];
  generatedImages: StoryboardImage[];
}

export interface AgentStatus {
  id: AgentRole;
  label: string;
  description: string;
  isProcessing: boolean;
  isComplete: boolean;
}