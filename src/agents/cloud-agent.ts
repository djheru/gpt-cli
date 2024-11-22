import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, ZeroShotAgent } from 'langchain/agents';
import { LLMChain } from 'langchain/chains';
import { cloudApplicationListTool } from '../tools/cloud-application-list';
import { LoggerOperations, logger } from '../utils';

const CloudAgent = async (topic: string, clog: LoggerOperations) => {
  try {
    // Tools
    // Cloud Application Options
    const cloudApplicationList = await cloudApplicationListTool(clog);

    const tools = [cloudApplicationList];

    // Prompt template - ZeroShotAgent.createPrompt
    const systemMessagePromptTemplate = ZeroShotAgent.createPrompt(tools, {
      prefix:
        "Deploy a cloud application matching the user's request. You have access to the following tools:",
      suffix:
        'Now begin! Select a cloud application, retrive the details, and respond with the data.',
    });

    // Prompt
    const systemMessagePrompt = new SystemMessagePromptTemplate(
      systemMessagePromptTemplate
    );
    const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(
      'Please select the cloud application that most closely matches the following input: {input}. Provide the title, description, and href.'
    );
    const prompt = ChatPromptTemplate.fromMessages([
      systemMessagePrompt,
      humanMessagePrompt,
    ]);

    // LLM - ChatOpenAI
    const llm = new ChatOpenAI({ temperature: 0, modelName: 'gpt-4o' });

    // LLM Chain
    const llmChain = new LLMChain({ prompt, llm });

    // Agent - ZeroShotAgent
    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: tools.map((tool) => tool.name),
    });

    // // Agent Executor - From agent and tools
    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      maxIterations: 10,
      returnIntermediateSteps: false,
      verbose: true,
    });

    // Executor call
    const result = await executor.call({
      input: ` ${topic}`,
      question: `Which cloud application most closely matches the user request: ${topic}? Select the single best result and return the title, description, and href.`,
    });
    clog.log(result);

    return result;
  } catch (e) {
    clog.error(e);
  }
};

const run = async () => {
  const result = await CloudAgent('API Gateway with Lambda', logger(true));
};

run();
