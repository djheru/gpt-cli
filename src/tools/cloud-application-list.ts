import { RetrievalQAChain } from 'langchain/chains';
import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { OpenAI } from 'langchain/llms/openai';
import { ChainTool } from 'langchain/tools';
import { getVectorStore } from '../db';
import { LoggerOperations } from '../utils';

const url = 'https://serverlessland.com/patterns?framework=CDK&language=TypeScript';

const initChain = async (clog: LoggerOperations) => {
  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4o' });
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: 'new' },
    gotoOptions: {
      waitUntil: 'networkidle0',
      timeout: 0,
    },
    evaluate: async (page: Page, browser: Browser) => {
      const cards = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.card'))
          .map((card) => {
            const obj = {
              title: (card.querySelector('.card-title') as HTMLElement)?.innerText.trim(),
              description: (
                card.querySelector('.card-text') as HTMLElement
              )?.innerText.trim(),
              href: (
                card.querySelector('a.float-right') as HTMLAnchorElement
              )?.href.trim(),
            };
            return obj;
          })
          .filter(({ title, description, href }) => title && description && href)
          .map(
            ({ title, description, href }) =>
              `Title: ${title}
Description: ${description}
URL: ${href}
----------------

`
          )
          .join('')
      );
      return cards;
    },
  });

  const docs = await loader.load();
  clog.log(docs);

  const vectorStore = await getVectorStore('cloud_application_options_data');
  await vectorStore.addDocuments(docs);

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  return chain;
};

export const cloudApplicationListTool = async (clog: LoggerOperations) =>
  new ChainTool({
    name: 'Cloud Application List',
    description: `Use this tool to see what cloud applications are available to be deployed.
  This tool returns a list of cloud applications with a title, description and a URL containing more information about the application.`,
    chain: await initChain(clog),
    returnDirect: !true,
  });
