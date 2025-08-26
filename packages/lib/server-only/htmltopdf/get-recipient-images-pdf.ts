import type { Browser } from 'playwright';

import { prisma } from '@documenso/prisma';

import { getFileServerSide } from '../../universal/upload/get-file.server';
import { env } from '../../utils/env';

export type GetRecipientImagesPdfOptions = {
  documentId: number;
  language?: string;
};

export const getRecipientImagesPdf = async ({
  documentId,
  language,
}: GetRecipientImagesPdfOptions) => {
  // Obtener recipients del documento con sus imágenes
  const recipients = await prisma.recipient.findMany({
    where: {
      documentId: documentId,
    },
    include: {
      images: true,
    },
  });

  // Filtrar solo recipients que tienen imágenes
  const recipientsWithImages = recipients.filter((recipient) => recipient.images.length > 0);

  if (recipientsWithImages.length === 0) {
    return null;
  }

  const { chromium } = await import('playwright');

  let browser: Browser;
  const browserlessUrl = env('NEXT_PRIVATE_BROWSERLESS_URL');

  if (browserlessUrl) {
    browser = await chromium.connectOverCDP(browserlessUrl);
  } else {
    browser = await chromium.launch();
  }

  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();

  // Crear HTML con las imágenes de cada recipient
  const recipientSections = await Promise.all(
    recipientsWithImages.map(async (recipient) => {
      const imageElements = await Promise.all(
        recipient.images.map(async (image) => {
          try {
            // Obtener la imagen de S3 usando el path almacenado
            const imageData = await getFileServerSide({ data: image.data, type: 'S3_PATH' });
            const base64Image = Buffer.from(imageData).toString('base64');

            return `  
              <img src="data:image/png;base64,${base64Image}"   
                   style="max-width: 400px; max-height: 300px; border: 1px solid #ccc; margin: 10px 0;" />  
            `;
          } catch (error) {
            console.error(`Error loading image ${image.id}:`, error);
            return `<p style="color: red;">Error cargando imagen</p>`;
          }
        }),
      );

      return `  
        <div class="recipient-section">  
          <h3>${recipient.name} (${recipient.email})</h3>  
          <div class="images-container">  
            ${imageElements.join('')}  
          </div>  
        </div>  
      `;
    }),
  );

  const html = `  
    <!DOCTYPE html>  
    <html>  
      <head>  
        <style>  
          body {   
            font-family: Arial, sans-serif;   
            padding: 20px;   
            line-height: 1.6;  
          }  
          .recipient-section {   
            margin-bottom: 40px;   
            page-break-inside: avoid;   
            border-bottom: 1px solid #eee;  
            padding-bottom: 20px;  
          }  
          h1 {   
            text-align: center;   
            margin-bottom: 30px;   
            color: #333;  
          }  
          h3 {   
            margin-bottom: 15px;   
            color: #555;  
            font-size: 0.875rem
            line-height: 1.25rem
          }  
          .images-container {  
            display: grid;  
            grid-template-columns: 1fr 1fr;  
            gap: 20px;  
            justify-items: center;  

          }  
          img {   
            display: block;   
            margin: 10px 0;  
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);  
          }  
        </style>
      </head>  
      <body>  
        ${recipientSections.join('')}  
      </body>  
    </html>  
  `;

  await page.setContent(html);

  const result = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px',
    },
  });

  await browserContext.close();
  void browser.close();

  return result;
};
