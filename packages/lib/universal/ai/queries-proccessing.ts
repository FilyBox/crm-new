import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { QueryResult } from '@vercel/postgres';
import { sql } from '@vercel/postgres';
import { generateObject } from 'ai';
import { z } from 'zod';

import { env } from '@documenso/lib/utils/env';
import {
  type Config,
  type Result,
  configSchema,
  explanationsSchema,
} from '@documenso/ui/lib/types';

import generateAiPrompts from './ai-prompts';

const google = createGoogleGenerativeAI({
  apiKey: env('GOOGLE_GENERATIVE_AI_API_KEY') ?? '',
});

export const generateQuery = async (
  input: string,
  userId: number,
  teamId: number | undefined,
  folderId: number | undefined,
  tableToConsult: string,
) => {
  const resultPrompt = generateAiPrompts(teamId, userId, folderId, tableToConsult);

  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      system: resultPrompt.prompt,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    const query = result.object.query;

    // if (teamId !== undefined) {
    //   query += ' AND "teamId" = ' + teamId;
    // } else {
    //   query += ' AND "userId" = ' + userId;
    // }

    return query;
  } catch (e: unknown) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};

export const runGenerateSQLQuery = async (query: string) => {
  if (
    !query.trim().toLowerCase().startsWith('select') ||
    query.trim().toLowerCase().includes('drop') ||
    query.trim().toLowerCase().includes('delete') ||
    query.trim().toLowerCase().includes('insert') ||
    query.trim().toLowerCase().includes('update') ||
    query.trim().toLowerCase().includes('alter') ||
    query.trim().toLowerCase().includes('truncate') ||
    query.trim().toLowerCase().includes('create') ||
    query.trim().toLowerCase().includes('grant') ||
    query.trim().toLowerCase().includes('revoke')
  ) {
    throw new Error('Only SELECT queries are allowed');
  }

  let data: QueryResult;
  console.log('e');
  try {
    data = await sql.query(query);
    // data = await sql.query(query);
  } catch (e: unknown) {
    throw new Error('Failed to execute SQL query');
  }

  return data.rows as Result[];
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  'use server';
  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user write a SQL query you wrote to retrieve the data they asked for. The table schema is as follows:
    unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM unicorns limit 20", the sections could be "SELECT *", "FROM UNICORNS", "LIMIT 20".
    If a section doesnt have any explanation, include it, but leave the explanation empty.

    `,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    return result.object;
  } catch (e: unknown) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};

export const generateChartConfig = async (results: Result[], userQuery: string) => {
  'use server';
  const system = `You are a data visualization expert. `;

  try {
    const { object: config } = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      system,
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
      For multiple groups use multi-lines.

      Here is an example complete config:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      schema: configSchema,
    });

    interface ChartConfig {
      type: string;
      xKey: string;
      yKeys: string[];
      colors: Record<string, string>;
      legend: boolean;
    }

    const colors: Record<string, string> = {};
    (config as ChartConfig).yKeys.forEach((key: string, index: number) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e: unknown) {
    // @ts-expect-error e is type unknown
    console.error(e.message);
    throw new Error('Failed to generate chart suggestion');
  }
};
