import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { type QueryResult, sql } from '@vercel/postgres';
import { generateObject } from 'ai';
import { z } from 'zod';

import { env } from '@documenso/lib/utils/env';
import {
  type Config,
  type Result,
  configSchema,
  explanationsSchema,
} from '@documenso/ui/lib/types';

const google = createGoogleGenerativeAI({
  apiKey: env('GOOGLE_GENERATIVE_AI_API_KEY') ?? '',
});

export const generateQuery = async (input: string) => {
  console.log('pepe');

  console.log('GOOGLE_GENERATIVE_AI_API_KEY', env('GOOGLE_GENERATIVE_AI_API_KEY'));
  ('use server');
  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash-lite'),
      system: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:
use FROM public."Contracts" in the query to retrieve the data. and column's names should be inside double quotes.
avoid displaying userId, teamId, documentId, createdAt, updatedAt, folderId, user, team, folder in the query.
model Contract {
  id       Int     @id @default(autoincrement())
  title    String  @db.Text
  fileName String? @db.Text

  artists                     String?                       @db.Text
  startDate                   DateTime?
  endDate                     DateTime?
  isPossibleToExpand          ExpansionPossibility          @default(NO_ESPECIFICADO)
  possibleExtensionTime       String?
  status                      ContractStatus?               @default(NO_ESPECIFICADO)
  collectionPeriod            RetentionAndCollectionPeriod?
  retentionPeriod             RetentionAndCollectionPeriod?
  retentionPeriodDescription  String?
  retentionPeriodDuration     String?
  collectionPeriodDescription String?
  collectionPeriodDuration    String?
  contractType                ContractType?
  documentId                  Int
  createdAt                   DateTime                      @default(now())
  updatedAt                   DateTime                      @updatedAt
  summary                     String?                       @db.Text
  userId                      Int?
  teamId                      Int?
  folder                      Folder?                       @relation(fields: [folderId], references: [id], onDelete: Cascade)
  folderId                    String?
  user                        User?                         @relation(fields: [userId], references: [id], onDelete: SetNull)
  team                        Team?                         @relation(fields: [teamId], references: [id], onDelete: SetNull)

  @@index([folderId])
  @@map("Contracts")
}


enum ContractStatus {
  VIGENTE
  FINALIZADO
  NO_ESPECIFICADO
}

enum ExpansionPossibility {
  SI
  NO
  NO_ESPECIFICADO
}

enum RetentionAndCollectionPeriod {
  SI
  NO
  NO_ESPECIFICADO
}

enum ContractType {
  ARRENDAMIENTOS
  ALQUILERES
  VEHICULOS
  SERVICIOS
  ARTISTAS
}

    If the user asks for a contractype, RetentionAndCollectionPeriod, ExpansionPossibility or ContractStatus that is not in the list, infer based on the list above.

    Only retrieval queries are allowed.

    For things like industry, company names and other string fields, use the ILIKE operator and convert both the search term and the field to lowercase using LOWER() function. For example: LOWER(industry) ILIKE LOWER('%search_term%').

    Note: artists is a comma-separated list of artists. Trim whitespace to ensure you're grouping properly. Note, some fields may be null or have only one value.
    When answering questions about a specific field, ensure you are selecting the identifying column (ie. what is Vercel's valuation would select company and valuation').


    Note: valuation is in billions of dollars so 10b would be 10.0.
    Note: if the user asks for a rate, return it as a decimal. For example, 0.1 would be 10%.

    If the user asks for 'over time' data, return by year.

    EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column. If the user asks for a rate, return the rate as a decimal. For example, 0.1 would be 10%.
    `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
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
  console.log('postgres connectionString', env('NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS'));

  let data: QueryResult;
  console.log('e');
  try {
    console.log('Using Vercel Postgres connection string');
    data = await sql.query(query);
    // data = await sql.query(query);
  } catch (e) {
    if (e.message.includes('relation "unicorns" does not exist')) {
      // throw error
      throw Error('Table does not exist');
    } else {
      throw e;
    }
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
  } catch (e) {
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

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    console.error(e.message);
    throw new Error('Failed to generate chart suggestion');
  }
};
