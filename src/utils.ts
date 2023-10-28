import { Document } from 'langchain/document';
import { AgentStep } from 'langchain/schema';
import { StructuredTool } from 'langchain/tools';

export type LoggerOperations = {
  log: (...args: any[]) => void;
  vlog: (...args: any[]) => void;
  error: (...args: any[]) => void;
};
export type Logger = (verboseOnly: boolean) => LoggerOperations;

export const formatChatHistory = (
  human: string,
  ai: string,
  previousChatHistory?: string
) => {
  const newInteraction = `Human: ${human}\nAI: ${ai}`;
  if (!previousChatHistory) {
    return newInteraction;
  }
  return `${previousChatHistory}\n\n${newInteraction}`;
};

export const logger: Logger = (verboseOnly: boolean) => ({
  log: (...args: any[]) => {
    console.log(...args);
  },
  vlog: (...args: any[]) => {
    if (verboseOnly) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
});

export const serializeDocs = (docs: Array<Document>) =>
  docs.map((doc) => doc.pageContent).join('\n\n');

export const renderTextDescription = (tools: StructuredTool[]): string =>
  tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');

/**
 * Construct the scratchpad that lets the agent continue its thought process.
 * @param intermediateSteps
 * @param observationPrefix
 * @param llmPrefix
 * @returns a string with the formatted observations and agent logs
 */
export function formatLogToString(
  intermediateSteps: AgentStep[],
  observationPrefix = 'Observation: ',
  llmPrefix = 'Thought: '
): string {
  const formattedSteps = intermediateSteps.reduce(
    (thoughts, { action, observation }) =>
      thoughts +
      [action.log, `\n${observationPrefix}${observation}`, llmPrefix].join('\n'),
    ''
  );
  return formattedSteps;
}

export const jsonStringToDocs = (jsonString: string) => {
  const jsonData = JSON.parse(jsonString) as Record<string, any>[];
  const docs = jsonData.map((record) => ({
    pageContent: JSON.stringify(record),
    metadata: { id: record.id },
  }));
  return docs;
};
