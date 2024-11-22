import 'dotenv/config';

import { TypeORMVectorStore } from '@langchain/community/vectorstores/typeorm';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DataSourceOptions } from 'typeorm';

const {
  HOST: host,
  PORT: port,
  PGUSER: username,
  PGPASSWORD: password,
  PGDATABASE: database,
} = process.env;

export const getVectorStore = async (tableName: string) => {
  const args = {
    tableName,
    postgresConnectionOptions: {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
    } as DataSourceOptions,
  };

  const typeormVectorStore = await TypeORMVectorStore.fromDataSource(
    new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      stripNewLines: true,
    }),
    args
  );

  await typeormVectorStore.ensureTableInDatabase();
  return typeormVectorStore;
};

export const clearTable = async (tableName: string, vectorStore: TypeORMVectorStore) => {
  await vectorStore.appDataSource.createQueryBuilder().delete().from(tableName).execute();
};

export const dataExistsInTable = async (
  tableName: string,
  vectorStore: TypeORMVectorStore
) => {
  const count = await vectorStore.appDataSource
    .createQueryBuilder()
    .select()
    .from(tableName, tableName)
    .getCount();
  return count > 0;
};
