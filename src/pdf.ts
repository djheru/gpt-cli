import { input } from '@inquirer/prompts';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import boxen from 'boxen';
import fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import ora from 'ora';
import { clearTable, dataExistsInTable, getVectorStore } from './db';
import { formatChatHistory, logger, serializeDocs } from './utils';

let chatHistory: string = '';

const model = new ChatOpenAI({
  temperature: 0.3,
  modelName: 'gpt-4o',
});

let clog = logger(false);
export const pdf = async (opts: { verbose?: boolean }) => {
  const verbose = !!opts.verbose;
  clog = logger(verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const filename = await input({
    default: 'done',
    message:
      'Enter the filename of a PDF file (or type "done", "bye", "exit", etc to exit):',
  });

  if (['done', 'goodbye', 'bye', 'exit'].includes(filename.toLowerCase())) {
    clog.log('Goodbye!');
    return;
  }
  const fileExists = fs.existsSync(filename);
  if (!fileExists) {
    clog.log(`File ${filename} does not exist!`);
    return;
  }

  const vectorStore = await getVectorStore('pdf_data');

  const dataExists = await dataExistsInTable('pdf_data', vectorStore);
  if (dataExists) {
    await clearTable('pdf_data', vectorStore);
  }

  const spinner = ora('Loading Documents').start();
  spinner.color = 'cyan';

  clog.log('Loading data from PDF document');

  const loader = new PDFLoader(filename);

  spinner.color = 'cyan';
  const docs = await loader.load();
  spinner.succeed(`Loaded ${docs.length} documents`);
  spinner.start();
  spinner.color = 'green';
  spinner.text = 'Splitting Data into Chunks';

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 15000,
    chunkOverlap: 500,
  });

  const splitDocs = await splitter.splitDocuments(docs);
  clog.log(`Split ${splitDocs.length} documents`);

  spinner.text = 'Vectorizing Documents';
  spinner.color = 'magenta';
  await vectorStore.addDocuments(splitDocs);
  spinner.stop();

  const retriever = vectorStore.asRetriever();

  const template = `You are PDF Helper GPT. You are a helpful AI assistant specializing in answering questions from Typescript Developers using the pdf library. 
  Use the following pieces of content to answer the question at the end.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  Provide detailed, specific information in the answer.
  ________________________________________________________________
  CONTEXT: The context below is extracted from the pdf library documentation. It is meant to help you answer the question.
  
  {context}
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

  let question = '';
  let response = '';
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
    spinner.text = 'Analyzing your question using the pdf docs and ChatGPT';
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
