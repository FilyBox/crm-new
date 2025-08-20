import { DocumentDataType } from '@prisma/client';
import { base64 } from '@scure/base';
import { match } from 'ts-pattern';

export type GetFileOptions = {
  type: DocumentDataType;
  data: string;
};

export const getMultipleFiles = async ({ type, data }: GetFileOptions) => {
  return await match(type)
    .with(DocumentDataType.BYTES, () => getFileFromBytes(data))
    .with(DocumentDataType.BYTES_64, () => getFileFromBytes64(data))
    .with(DocumentDataType.S3_PATH, async () => getFileFromS3(data))
    .exhaustive();
};

const getFileFromBytes = (data: string) => {
  const encoder = new TextEncoder();

  const binaryData = encoder.encode(data);

  return binaryData;
};

const getFileFromBytes64 = (data: string) => {
  const binaryData = base64.decode(data);

  return binaryData;
};

export const getFileFromS3 = async (key: string) => {
  try {
    const getPresignedUrlResponse = await fetch(
      `http://localhost:3000/api/files/presigned-get-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
        }),
      },
    );

    if (!getPresignedUrlResponse.ok) {
      throw new Error(
        `Failed to get presigned url with key "${key}", failed with status code ${getPresignedUrlResponse.status}`,
      );
    }

    const { url } = await getPresignedUrlResponse.json();
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get file "${key}", failed with status code ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    const binaryData = new Uint8Array(buffer);

    return binaryData;
  } catch (error) {
    console.error(`Error fetching presigned URL for key "${key}":`, error);
    throw new Error(`Failed to get presigned url for key "${key}"`);
  }
};
