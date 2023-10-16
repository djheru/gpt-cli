import { Document } from 'langchain/document';

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

export const logger = (verboseOnly: boolean) => ({
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
