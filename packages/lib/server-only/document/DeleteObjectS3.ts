import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '@documenso/lib/utils/env';

// Configuración del cliente S3
const s3 = new S3Client({
  region: env('NEXT_PRIVATE_UPLOAD_REGION'), // Región donde se encuentra el bucket
  credentials: {
    accessKeyId: `${env('NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID')}`, // Credenciales de acceso a AWS
    secretAccessKey: `${env('NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY')}`,
  },
});

const getKeyFromUrl = (url: string): string => {
  // Extraer la Key usando una expresión regular
  const match = url.match(/\.s3\.[^/]+\/(.+)/);
  if (!match || !match[1]) {
    throw new Error('URL de S3 no válida');
  }

  // Check if there's a query parameter and remove it
  const keyWithoutQueryParams = match[1].includes('?') ? match[1].split('?')[0] : match[1];

  return keyWithoutQueryParams;
};

export const deleteFile = async (Location: string) => {
  try {
    const keyname = getKeyFromUrl(Location);

    const params = {
      Bucket: env('NEXT_PRIVATE_UPLOAD_BUCKET'),
      Key: keyname,
    };

    // Crear el comando para eliminar el archivo
    const command = new DeleteObjectCommand(params);

    const data = await s3.send(command);

    return data;
  } catch (error) {
    console.error('Error al eliminar el archivo de S3:', error);
    throw error;
  }
};
