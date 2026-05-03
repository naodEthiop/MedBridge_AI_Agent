import type { PatientMemory } from '@/lib/ai/patientMemory';

export type HealthGraph = {
  nodes: Array<{ id: string; type: 'symptom' | 'diagnosis' | 'treatment' | 'outcome'; timestamp: number; data: unknown }>;
  edges: Array<{ from: string; to: string; relation: 'causes' | 'correlates' | 'progresses_to' }>;
};

export function buildHealthGraph(memory: PatientMemory): HealthGraph {
  const nodes = memory.timeline.map((event, index) => ({
    id: `${event.type}-${index}`,
    type: (event.type === 'ai_analysis' ? 'outcome' : event.type === 'appointment' ? 'treatment' : event.type === 'symptom' ? 'symptom' : event.type === 'diagnosis' ? 'diagnosis' : 'outcome') as 'symptom' | 'diagnosis' | 'treatment' | 'outcome',
    timestamp: event.timestamp,
    data: event.data,
  }));

  const edges = nodes.slice(1).map((node, index) => ({
    from: nodes[index].id,
    to: node.id,
    relation: 'progresses_to' as const,
  }));

  return { nodes, edges };
}
