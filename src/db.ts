import 'dotenv/config';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { TypeORMVectorStore } from 'langchain/vectorstores/typeorm';
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
    new OpenAIEmbeddings(),
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
