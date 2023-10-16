import { input } from '@inquirer/prompts';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import { logger } from './utils';

let clog = logger(false);

async function fetchYouTubeData(url: string): Promise<void> {
  clog.vlog(`Retrieving YouTube transcript for: ${url}`);
  const loader = YoutubeLoader.createFromUrl(url, {
    language: 'en',
    addVideoInfo: true,
  });

  const docs = await loader.load();
  clog.vlog(`Retrieved ${docs.length} documents`);
  clog.vlog(`First document: %j`, docs[0]);
}

export const youtube = async (opts: { verbose?: boolean }) => {
  clog = logger(!!opts.verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const answer = await input({
    default: 'https://www.youtube.com/watch?v=0lJKucu6HJc',
    message: 'Enter a YouTube URL:',
  });

  const youtubeUrl = answer;
  clog.log(`You entered: ${youtubeUrl}`);

  await fetchYouTubeData(youtubeUrl);

  let done = false;
  while (!done) {
    const userQuestion = await input({
      default: 'done',
      message: 'Ask a question (or type "done" to exit):',
    });

    const questionText = userQuestion;
    clog.log(`You entered: ${questionText}`);

    if (['done', 'goodbye', 'bye', 'exit'].includes(questionText.toLowerCase())) {
      done = true;
      console.log('Goodbye!');
    } else {
      // Replace with your logic to generate responses
      console.log(`Response to "${questionText}": Lorem ipsum`);
    }
  }
};
