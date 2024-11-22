import { input } from '@inquirer/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import boxen from 'boxen';
import { createOpenAPIChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import ora from 'ora';
import { clearTable, getVectorStore } from './db';
import { jsonStringToDocs, logger, serializeDocs } from './utils';

const contactsApiSpecUrl = 'http://localhost:4000/docs-yaml';
let clog = logger(false);

const model = new ChatOpenAI({
  temperature: 0.4,
  modelName: 'gpt-4o',
});

async function fetchContactData(): Promise<Document<Record<string, any>>[]> {
  clog.log(`Retrieving contacts data from: ${contactsApiSpecUrl}`);
  const swaggerChain = await createOpenAPIChain(contactsApiSpecUrl, {
    verbose: false,
  });
  const jsonString = await swaggerChain.run('Get the list of all contacts');
  const docs = jsonStringToDocs(jsonString);
  clog.vlog(`Retrieved ${docs.length} documents`);
  return docs;
}

export const contacts = async (opts: { verbose?: boolean }) => {
  const verbose = !!opts.verbose;
  clog = logger(verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const spinner = ora('Loading Contacts data from API').start();
  spinner.color = 'cyan';
  let docs;
  try {
    docs = await fetchContactData();
  } catch (err) {
    spinner.fail(`Failed to load contacts data from API`);
    clog.error(err);
    return;
  }
  spinner.succeed(`Loaded ${docs.length} documents`);
  spinner.start();
  spinner.color = 'green';
  spinner.text = 'Vectorzing JSON response data';
  const vectorStore = await getVectorStore('contacts');
  await clearTable('contacts', vectorStore);
  await vectorStore.addDocuments(docs);
  const retriever = vectorStore.asRetriever();
  spinner.succeed();

  const template = `You are PersonalContactsGPT, You are a helpful assistant specializing in answering questions about personal contacts.
  You will be provided context that consists of an array of JSON objects representing information about my contacts.
  Using only the the information in the context provided at the end, respond to the following user prompt: "{input}". 
  Add additional information helping me know what I can talk about with the contact to make it seem like I remember personal details about their life. 
  The more specific and detailed the information, the better.
  The sort of information I would be looking for (if relevant) is:
  - What is their name? What is their job? What are their interests? 
  - What is their spouse's name? What are their children's names, ages, and interests? 
  - Which contacts share jobs or interests in common?
  
  Add any additional relevant information you can think of.
  
  Base your answers only on the following context: 
  ------------------------------------------------------------
  CONTEXT: {context}
  
  ------------------------------------------------------------
  HELPFUL ANSWER: `;
  const prompt = PromptTemplate.fromTemplate(template);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(serializeDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  let done = false;

  while (!done) {
    const question = await input({
      default: 'done',
      message: 'Ask a question (or type "done", "bye", "exit", etc to exit):',
    });

    if (['done', 'goodbye', 'bye', 'exit'].includes(question.toLowerCase())) {
      done = true;
      clog.log('Goodbye!');
      continue;
    }

    spinner.start();
    spinner.text = 'Analyzing your question using the Contacts API data and ChatGPT';
    spinner.color = 'magenta';
    const response = await chain.invoke(question);
    spinner.succeed();

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
