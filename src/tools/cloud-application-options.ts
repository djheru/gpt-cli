import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { DynamicTool } from 'langchain/tools';

const url = 'https://serverlessland.com/patterns?framework=CDK&language=TypeScript';

export const CloudApplicationOptions = new DynamicTool({
  name: 'Cloud Application Options',
  description: `Use this tool to see what cloud applications are available to be deployed.
  This tool returns a list of cloud applications with a title, description and a URL containing more information about the application.`,
  func: async () => {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: { headless: 'new' },
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: 0,
      },
      evaluate: async (page: Page, browser: Browser) => {
        const cards = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.card'))
            .map((card) => {
              const obj = {
                title: (
                  card.querySelector('.card-title') as HTMLElement
                )?.innerText.trim(),
                description: (
                  card.querySelector('.card-text') as HTMLElement
                )?.innerText.trim(),
                href: (
                  card.querySelector('a.float-right') as HTMLAnchorElement
                )?.href.trim(),
              };
              return obj;
            })
            .filter(({ title, description, href }) => title && description && href);
        });
        console.log(cards);
        return JSON.stringify(cards);
      },
    });

    const docs = await loader.load();
    return JSON.stringify(docs, null, 2);
  },
});
