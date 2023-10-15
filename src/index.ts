import { Command } from 'commander';
import 'dotenv/config';
import figlet from 'figlet';
import { youtube } from './youtube';

const { TITLE: title = '' } = process.env;

const version = '0.0.1';

console.log(figlet.textSync(title));

const program = new Command();

program
  .name(title)
  .version(version)
  .description('A CLI Tool for interacting with ChatGPT via Langchain tools');

program
  .command('youtube')
  .alias('yt')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with a YouTube video')
  .action(async (opts) => {
    await youtube(opts);
  });

program.parse(process.argv);
