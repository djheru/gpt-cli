import { input } from '@inquirer/prompts';
// import { GitbookLoader } from '@langchain/community/document_loaders/web/gitbook';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import boxen from 'boxen';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import ora from 'ora';
import { clearTable, dataExistsInTable, getVectorStore } from './db';
import { formatChatHistory, logger } from './utils';
// import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveUrlLoader } from '@langchain/community/document_loaders/web/recursive_url';
import { compile } from 'html-to-text';

let chatHistory: string = '';

const llm = new ChatOpenAI({
  temperature: 0.3,
  modelName: 'gpt-4o-mini',
});

let clog = logger(false);

export const docs = async (opts: { verbose?: boolean }) => {
  const verbose = !!opts.verbose;
  clog = logger(verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const spinner = ora('Loading Documents').start();
  spinner.color = 'cyan';

  const vectorStore = await getVectorStore('parking_manager_data');
  verbose && (await clearTable('parking_manager_data', vectorStore));

  const dataExists = await dataExistsInTable('parking_manager_data', vectorStore);
  if (dataExists) {
    clog.vlog('Parking Manager data already exists in the database');
    clog.vlog('Skipping data loading step');
    spinner.succeed('Parking Manager data already exists in the database');
  } else {
    clog.log('Parking Manager data does not exist in the database');
    clog.log('Loading Parking Manager data from Gitbook');

    const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

    const loader = new RecursiveUrlLoader(
      'https://docs.parkingmgt.com/parking-manager-app/6wLGdkWdDWt66M6gNTsT',
      {
        extractor: compiledConvert,
        maxDepth: 6,
        excludeDirs: ['/docs/api/'],
      }
    );
    spinner.color = 'cyan';
    const docs = await loader.load();
    console.log(docs);
    spinner.succeed(`Loaded ${docs.length} documents`);
    spinner.start();
    spinner.color = 'green';
    spinner.text = 'Splitting Data into Chunks';

    // const splitter = new RecursiveCharacterTextSplitter({
    //   chunkSize: 2000,
    //   chunkOverlap: 500,
    // });
    const splitter = RecursiveCharacterTextSplitter.fromLanguage('html', {
      chunkSize: 1200,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);
    clog.log(`Split ${splitDocs.length} documents`);

    spinner.text = 'Vectorizing Documents';
    spinner.color = 'magenta';
    await vectorStore.addDocuments(splitDocs);
    spinner.stop();
  }

  const retriever = vectorStore.asRetriever();

  const systemPrompt = `You are Parking Manager Helper GPT, an AI assistant specialized in helping Parking Management employees understand and apply operations and procedures. 

- Your goal is to provide accurate, concise, and helpful answers based on the retrieved context.
- Always use the provided context to construct your answers, and ensure your responses are directly relevant to the user's question.
- If the retrieved context does not contain the information needed to answer the question, clearly state: "I could not find the answer in the Parking Manager documentation provided."
- Avoid making up answers or providing information not explicitly found in the retrieved context.
- When applicable, suggest related topics or sections of the manual for further exploration.

Retrieved Context:
{context}
  `;

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{input}'],
  ]);

  const questionAnswerChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain: questionAnswerChain,
  });

  let question = '';
  let answer = '';
  let done = false;

  while (!done) {
    question = await input({
      default: 'done',
      message: 'Ask a question (or type "done", "bye", "exit", etc to exit):',
    });

    chatHistory = formatChatHistory(question, answer);

    if (['done', 'goodbye', 'bye', 'exit'].includes(question.toLowerCase())) {
      done = true;
      clog.log('Goodbye!');
      continue;
    }

    spinner.start();
    spinner.text =
      'Analyzing your question using the Parking Manager App docs and ChatGPT';
    spinner.color = 'magenta';

    const response = await ragChain.invoke({
      input: question,
      chatHistory,
    });
    answer = response.answer;

    const params = {
      chatHistory,
      question,
    };

    console.log(`Answer: ${answer}`);
    spinner.succeed();
    clog.vlog({ params });

    clog.log(
      boxen(answer, {
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
