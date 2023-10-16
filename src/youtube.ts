import { input } from '@inquirer/prompts';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { RunnableSequence } from 'langchain/schema/runnable';
import { Document } from 'langchain/document';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PromptTemplate } from 'langchain/prompts';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { join } from 'path';
import { formatChatHistory, logger, serializeDocs } from './utils';

let clog = logger(false);

let chatHistory: string = '';

const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
});

async function fetchYouTubeTranscripts(
  url: string
): Promise<Document<Record<string, any>>[]> {
  clog.vlog(`Retrieving YouTube transcript for: ${url}`);
  const loader = YoutubeLoader.createFromUrl(url, {
    language: 'en',
    addVideoInfo: true,
  });

  const docs = await loader.load();
  clog.vlog(`Retrieved ${docs.length} documents`);
  return docs;
}

async function getVectorStore(docs: Document<Record<string, any>>[]) {
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  const vectorPath = join(__dirname, 'data');
  clog.vlog(`Saving vector store to ${vectorPath}`);
  await vectorStore.save(vectorPath);
  return vectorStore;
}

export const youtube = async (opts: { verbose?: boolean }) => {
  const verbose = !!opts.verbose;
  clog = logger(verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const youtubeUrl = await input({
    default: 'https://www.youtube.com/watch?v=0lJKucu6HJc',
    message: 'Enter a YouTube URL:',
  });

  clog.vlog(`You entered: ${youtubeUrl}`);

  const docs = await fetchYouTubeTranscripts(youtubeUrl);
  const vectorStore = await getVectorStore(docs);
  const retriever = vectorStore.asRetriever();

  const template = `Use the following pieces of content to answer the question at the end.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ________________________________________________________________
  CONTEXT: {context}
  ________________________________________________________________
  CHAT HISTORY: {chatHistory}
  ________________________________________________________________
  QUESTION: {question}
  ________________________________________________________________
  HELPFUL ANSWER:`;
  const questionPrompt = PromptTemplate.fromTemplate(template);

  const chain = RunnableSequence.from([
    {
      question: (input: { question: string; chatHistory?: string }) => input.question,
      chatHistory: (input: { question: string; chatHistory?: string }) =>
        input.chatHistory ?? '',
      context: async (input: { question: string; chatHistory?: string }) => {
        const relevantDocs = await retriever.getRelevantDocuments(input.question);
        const serialized = serializeDocs(relevantDocs);
        return serialized;
      },
    },
    questionPrompt,
    model,
    new StringOutputParser(),
  ]);

  let question = 'Please provide a high-level summary of the video';

  let response = await chain.invoke({
    question,
  });

  clog.vlog('Response: %j', response);
  clog.log(`\n\n${response}\n\n`);

  let done = false;
  while (!done) {
    question = await input({
      default: 'done',
      message: 'Ask a question (or type "done", "bye", "exit", etc to exit):',
    });

    chatHistory = formatChatHistory(response, question);

    if (['done', 'goodbye', 'bye', 'exit'].includes(question.toLowerCase())) {
      done = true;
      clog.log('Goodbye!');
      continue;
    }

    const params = {
      chatHistory,
      question,
    };

    response = await chain.invoke(params);

    clog.log({ params });
    clog.vlog('Response: %j', response);

    clog.log(`\n\n${response}\n\n`);
  }
};
