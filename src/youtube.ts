import { input } from '@inquirer/prompts';
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import boxen from 'boxen';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import ora from 'ora';
import { clearTable, getVectorStore } from './db';
import { formatChatHistory, logger, serializeDocs } from './utils';

let clog = logger(false);

let chatHistory: string = '';

const model = new ChatOpenAI({
  temperature: 0.7,
  modelName: 'gpt-4o',
});

async function fetchYouTubeTranscripts(
  url: string
): Promise<Document<Record<string, any>>[]> {
  console.log('OHIA');
  clog.vlog(`Retrieving YouTube transcript for: ${url}`);
  const loader = YoutubeLoader.createFromUrl(url, {
    language: 'en',
    addVideoInfo: true,
  });

  const docs = await loader.loadAndSplit(
    new RecursiveCharacterTextSplitter({ chunkSize: 4000 })
  );
  clog.vlog(`Retrieved ${docs.length} documents`);
  return docs;
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

  const spinner = ora('Loading YouTube transcript').start();
  spinner.color = 'cyan';
  const docs = await fetchYouTubeTranscripts(youtubeUrl);
  spinner.succeed(`Loaded ${docs.length} documents`);
  spinner.start();
  spinner.color = 'green';
  spinner.text = 'Vectorzing YouTube transcript';
  const vectorStore = await getVectorStore('youtube_data');
  await clearTable('youtube_data', vectorStore);
  await vectorStore.addDocuments(docs);
  const retriever = vectorStore.asRetriever();

  const template = `Use the following pieces of content to answer the question at the end.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  Provide detailed, specific information in the answer.
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

  let question = `Please provide a detailed summary of the video transcript provided. 
  Make sure to cover all the main points, but without too much detail. 
  The user can ask follow-up questions if they need more information about specific details.`;
  spinner.succeed();
  spinner.start();
  spinner.text = 'Generating summary using ChatGPT';
  spinner.color = 'magenta';
  let response = await chain.invoke({
    question,
  });
  spinner.stop();

  clog.vlog('Response: %j', response);
  clog.log(
    boxen(response, {
      title: 'Video Summary',
      titleAlignment: 'left',
      padding: 2,
      margin: 2,
      borderStyle: 'bold',
      borderColor: 'greenBright',
    })
  );

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
    spinner.start();
    spinner.text = 'Analyzing your question using the video transcript and ChatGPT';
    spinner.color = 'magenta';
    response = await chain.invoke(params);
    spinner.succeed();
    clog.vlog({ params });

    clog.log(
      boxen(response, {
        title: question,
        titleAlignment: 'left',
        padding: 2,
        margin: 2,
        borderStyle: 'bold',
        borderColor: 'greenBright',
      })
    );
  }
};
