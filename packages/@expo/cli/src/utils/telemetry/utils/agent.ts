import type { DetectionResult } from 'agent-cli-detector';

const debug = require('debug')('expo:telemetry:agent') as typeof console.log;

export type AgentTelemetryContext =
  | {
      detected: false;
    }
  | {
      detected: true;
      id: string;
      name: string;
      sessionId?: string;
      confidence?: {
        level: string;
        score: number;
        signals: number;
      };
    };

// Preserve native dynamic import so the CommonJS CLI can load ESM-only packages.
// eslint-disable-next-line no-new-func
const importAgentCliDetector = new Function('moduleName', 'return import(moduleName)') as (
  moduleName: 'agent-cli-detector'
) => Promise<typeof import('agent-cli-detector')>;

export async function getAgentTelemetryContextAsync(): Promise<AgentTelemetryContext> {
  try {
    const { detectAgent } = await importAgentCliDetector('agent-cli-detector');
    return normalizeDetectionResult(detectAgent());
  } catch (error: any) {
    debug('Failed to detect coding agent: %s', error?.message ?? error);
    return createUndetectedAgentTelemetryContext();
  }
}

export function createUndetectedAgentTelemetryContext(): AgentTelemetryContext {
  return { detected: false };
}

function normalizeDetectionResult(result: DetectionResult): AgentTelemetryContext {
  if (!result.detected || !result.agent) {
    return createUndetectedAgentTelemetryContext();
  }

  return {
    detected: true,
    id: result.agent.id,
    name: result.agent.name,
    ...(result.agent.sessionId ? { sessionId: result.agent.sessionId } : null),
    ...(result.confidence ? { confidence: result.confidence } : null),
  };
}
