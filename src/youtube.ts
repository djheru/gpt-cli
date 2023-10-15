import { input } from '@inquirer/prompts';
import { logger } from './utils';

async function fetchYouTubeData(url: string): Promise<void> {
  console.log(`Fetching data for ${url}...`);
  // Replace this with your actual data fetching logic
}

export const youtube = async (opts: { verbose?: boolean }) => {
  const clog = logger(!!opts.verbose);
  clog.vlog('Verbose logging enabled');
  clog.vlog('Options: %j', opts);

  const answer = await input({
    message: 'Enter a YouTube URL:',
  });

  const youtubeUrl = answer;
  clog.log(`You entered: ${youtubeUrl}`);

  await fetchYouTubeData(youtubeUrl);

  let done = false;
  while (!done) {
    const userQuestion = await input({
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
