export type FlowStepMetadata = {
  action?: string;
  result?: string;
  notes?: string;
};

export type FlowStepNode = {
  id: string;
  title: string;
  description: string;
  /** optional screenshot URL — falls back to a mock screen when absent */
  image?: string | null;
  /** short kicker shown above the title, e.g. "Auth", "Payments" */
  category?: string;
  metadata?: FlowStepMetadata;
};

export type FlowStepEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type FlowConfig = {
  id: string;
  title: string;
  description: string;
  nodes: FlowStepNode[];
  edges: FlowStepEdge[];
  /** Optional explicit row groupings by node id — each inner array is one horizontal row */
  rowGroups?: string[][];
};
