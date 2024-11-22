import { Command } from 'commander';
import 'dotenv/config';
import figlet from 'figlet';
import { contacts } from './contacts';
import { docs } from './docs';
import { pdf } from './pdf';
import { typeorm } from './typeorm';
import { youtube } from './youtube';

const { TITLE: title = '' } = process.env;

const version = '0.0.1';

console.clear();
console.log(figlet.textSync(title));

const program = new Command();

program
  .name(title)
  .version(version)
  .description('A CLI Tool for interacting with ChatGPT via Langchain tools');

program
  .command('contacts')
  .alias('cn')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with the Contacts API using an OpenAPI spec')
  .action(async (opts) => {
    await contacts(opts);
  });

program
  .command('pdf')
  .alias('p')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with a PDF using an OpenAPI spec')
  .action(async (opts) => {
    await pdf(opts);
  });

program
  .command('typeorm')
  .alias('to')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with the TypeORM docs')
  .action(async (opts) => {
    await typeorm(opts);
  });

program
  .command('docs')
  .alias('do')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with the Parking Manager App docs')
  .action(async (opts) => {
    await docs(opts);
  });

program
  .command('youtube')
  .alias('yt')
  .option('-v, --verbose', 'Verbose output')
  .description('Chat with a YouTube video')
  .action(async (opts) => {
    await youtube(opts);
  });

program.parse(process.argv);
