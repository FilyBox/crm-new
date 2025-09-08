import { GoogleGenAI, Type } from '@google/genai';
import { task } from '@trigger.dev/sdk/v3';
// Usa la versión asíncrona
import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';

// Asegúrate de instalarlo con `pnpm add node-fetch`
import { prisma } from '@documenso/prisma';

import { extractText } from '../services/textparser';

export const extractBodyContractTask = task({
  id: 'extract-body-contract',
  queue: {
    concurrencyLimit: 1,
  },
  // Set an optional maxDuration to prevent tasks from running indefinitely
  // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: {
    teamId: number;
    urlDocument: string;
    userId: number;
    documentId: number;
  }) => {
    const documentId = payload.documentId;
    const teamId = payload.teamId;
    const userId = payload.userId;

    console.log('teamId', teamId);
    console.log(`🔹 Buscando archivo con ID: ${documentId} en la base de datos...`);
    try {
      const decryptedId = payload.documentId;
      console.log(`🔹 Workspace ID: ${decryptedId} y ${payload.documentId}`);
      if (!decryptedId) {
        console.log(`⚠️ No se pudo desencriptar el ID: ${payload.documentId}`);
        return null;
      }

      const documentBodyExists = await prisma.documentBodyExtracted.findFirst({
        where: { documentId: documentId },
      });
      console.log('documentBodyExists', documentBodyExists);
      let documentBody;
      if (documentBodyExists) {
        documentBody = documentBodyExists;
      } else {
        documentBody = await prisma.documentBodyExtracted.create({
          data: { body: 'En proceso', status: 'PENDING', documentId: documentId },
        });
      }

      const document = await prisma.document.findFirst({
        where: { id: documentId },
      });

      console.log('document', document);

      const pdfUrl = payload.urlDocument;

      const fileName = document?.title;
      let extractedText;
      // extractedText = await extractText(fileName ?? 'archivo_desconocido', buffer, pdfUrl);

      if (
        documentBody.body &&
        documentBody.body !== 'En proceso' &&
        documentBody.body !== 'Formato no soportado.'
      ) {
        console.log('documentBody.body', documentBody.body);
        if (documentBody.body === 'Formato no soportado.') {
          const response = await fetch(pdfUrl);
          if (!response.ok) {
            console.log(`⚠️ Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
            throw new Error(`Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const pdf = await PDFDocument.load(arrayBuffer).catch((e) => {
            console.error(`PDF upload parse error: ${e.message}`);
            throw new Error('INVALID_DOCUMENT_FILE');
          });

          console.log(`PDF : ${pdf}`);
          if (pdf.isEncrypted) {
            console.log(`⚠️ El PDF está encriptado y no se puede procesar: ${pdfUrl}`);
            throw new Error(`El PDF está encriptado y no se puede procesar: ${pdfUrl}`);
          }

          console.log(`✅ PDF descargado con éxito, tamaño: ${buffer.length} bytes`);
          extractedText = await extractText(
            fileName ?? 'archivo_desconocido',
            buffer,
            pdfUrl,
            'pdf',
          );
        } else {
          extractedText = documentBody.body;
        }
      } else {
        const response = await fetch(pdfUrl);

        if (!response.ok) {
          console.log(`⚠️ Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
          throw new Error(`Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`✅ PDF descargado con éxito, tamaño: ${buffer.length} bytes`);
        extractedText = await extractText(fileName ?? 'archivo_desconocido', buffer, pdfUrl);
      }
      if (!extractedText) {
        console.log(`⚠️ No se pudo extraer el texto del PDF: ${fileName}`);
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'ERROR' },
        });
        return;
      }

      if (
        extractedText === 'Error al procesar el PDF.' ||
        extractedText === 'Formato no soportado.'
      ) {
        console.log(`⚠️ No se pudo extraer el texto del PDF: ${fileName}`);

        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'ERROR' },
        });
        return;
      }

      console.log(`✅ texto extraido con éxito`);

      if (extractedText) {
        console.log('ai beggining');
        const prompt = `
Extrae la información clave de este contrato en base a los siguientes requerimientos:
el titulo es: ${fileName}
1. **Título del contrato**: Nombre del contrato.
2. **Artistas**: Nombres de todos los artistas involucrados.
   Nombre del grupo: si se especifica un grupo, banda o colectivo al que pertenece el involucrado del contrato, da el nombre.}
3. **Fecha de inicio del contrato**: Fecha de inicio del contrato formato dd/mm/aaaa, si solo esta el año escribe la fecha como si fuera desde ese incio de año, es decir, 01/01/AÑO.
4. **Fecha de finalización del contrato**: Fecha de finalización del contrato formato dd/mm/aaaa, si no esta especificada dejalo vacio.
5. **¿Es posible expandirlo?**: Indica si el contrato puede extenderse (SI, NO, NO_ESPECIFICADO).
6. **Tiempo de extensión posible**: Especifica el tiempo de extensión (2, 3, 5 años o la cantidad de tiempo especificada), fecha estimada.
7. **Estatus del contrato**: Si ya está vencido (FINALIZADO) o es vigente (VIGENTE). Basado en la fecha actual: ${new Date().toISOString()}.
8. **Tipo de Contrato**: Clasifica el contrato como uno de los siguientes: ARRENDAMIENTOS, ALQUILERES, VEHICULOS, SERVICIOS, ARTISTAS.
9. **Periodo de Colección**: Indica si existe un período de Colección específico (SI, NO, NO_ESPECIFICADO).
10. **Descripción del Periodo de Coleccion**: Detalla cómo funciona el período de Colección.
11. **Duración del Periodo de Coleccion**: Especifica la duración del período de Colección.
12. **Periodo de Retención**: Indica si existe un período de retención (SI, NO, NO_ESPECIFICADO).
13. **Descripción del Periodo de Retención**: Detalla cómo funciona el período de retención.
14. **Duración del Periodo de Retención**: Especifica la duración del período de retención.
15. **Resumen general** SIEMPRE genera un resumen del contrato.

este es el contrato: ${extractedText}
        `;

        console.log('prompt', prompt);

        await prisma.documentBodyExtracted.update({
          where: { id: documentBody.id },
          data: { status: 'COMPLETE', body: extractedText },
        });
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'COMPLETED' },
        });

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        // const responses = await ai.models.generateContent({
        //   model: 'gemini-2.0-flash-lite',
        //   contents: prompt,
        //   config: {
        //     responseMimeType: 'application/json',
        //     responseSchema: {
        //       type: Type.ARRAY,
        //       items: {
        //         type: Type.OBJECT,
        //         properties: {
        //           tituloContrato: { type: Type.STRING },
        //           artistas: {
        //             type: Type.ARRAY,
        //             items: {
        //               type: Type.OBJECT,
        //               properties: {
        //                 nombre: { type: Type.STRING },
        //               },
        //             },
        //           },
        //           fechaInicio: { type: Type.STRING },
        //           fechaFin: { type: Type.STRING },
        //           esPosibleExpandirlo: { type: Type.STRING, enum: ['SI', 'NO', 'NO_ESPECIFICADO'] },
        //           tiempoExtensionPosible: { type: Type.STRING },
        //           estatusContrato: {
        //             type: Type.STRING,
        //             enum: ['VIGENTE', 'FINALIZADO', 'NO_ESPECIFICADO'],
        //           },
        //           resumenGeneral: { type: Type.STRING },
        //         },
        //         propertyOrdering: [
        //           'tituloContrato',
        //           'artistas',
        //           'fechaInicio',
        //           'fechaFin',
        //           'esPosibleExpandirlo',
        //           'tiempoExtensionPosible',
        //           'estatusContrato',

        //           'resumenGeneral',
        //         ],
        //       },
        //     },
        //   },
        // });
        const responses = await ai.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tituloContrato: { type: Type.STRING },
                  artistas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        nombre: { type: Type.STRING },
                      },
                    },
                  },

                  nombreGrupo: { type: Type.STRING },
                  fechaInicio: { type: Type.STRING, format: 'date-time' },

                  fechaFin: { type: Type.STRING, format: 'date-time' },
                  esPosibleExpandirlo: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  tiempoExtensionPosible: { type: Type.STRING },
                  estatusContrato: {
                    type: Type.STRING,
                    enum: ['VIGENTE', 'FINALIZADO', 'NO_ESPECIFICADO'],
                  },
                  tipoContrato: {
                    type: Type.STRING,
                    enum: ['ARRENDAMIENTOS', 'ALQUILERES', 'VEHICULOS', 'SERVICIOS', 'ARTISTAS'],
                  },
                  periodoColeccion: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  descripcionPeriodoColeccion: { type: Type.STRING },
                  duracionPeriodoColeccion: { type: Type.STRING },
                  periodoRetencion: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  descripcionPeriodoRetencion: { type: Type.STRING },
                  duracionPeriodoRetencion: { type: Type.STRING },
                  resumenGeneral: { type: Type.STRING },
                },
                propertyOrdering: [
                  'tituloContrato',
                  'artistas',
                  'nombreGrupo',
                  'fechaInicio',
                  'fechaFin',
                  'esPosibleExpandirlo',
                  'tiempoExtensionPosible',
                  'estatusContrato',
                  'tipoContrato',
                  'periodoColeccion',
                  'descripcionPeriodoColeccion',
                  'duracionPeriodoColeccion',
                  'periodoRetencion',
                  'descripcionPeriodoRetencion',
                  'duracionPeriodoRetencion',
                  'resumenGeneral',
                ],
              },
            },
          },
        });
        console.log('response', responses.text);

        const parsedResponse = responses.text ? JSON.parse(responses.text)[0] : null; // Parse JSON and get the first item if text exists
        console.log('parsedResponse', parsedResponse);
        let contractsTable;

        const existingContract = await prisma.contract.findFirst({
          where: { documentId: documentId },
        });

        if (existingContract) {
          console.log('Ya existe el contrato, actualizando');
          contractsTable = await prisma.contract.update({
            where: { id: existingContract.id },
            data: {
              documentId: documentId,
              fileName: fileName,
              artists: parsedResponse.artistas
                .map((artist: { nombre: string }) => artist.nombre)
                .join(', '),
              endDate:
                parsedResponse.fechaFin &&
                parsedResponse.fechaFin !== 'NO ESPECIFICADO' &&
                parsedResponse.fechaFin !== 'NO_ESPECIFICADO' &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(parsedResponse.fechaFin)
                  ? parsedResponse.fechaFin
                  : null,
              startDate:
                parsedResponse.fechaInicio &&
                parsedResponse.fechaInicio !== 'NO ESPECIFICADO' &&
                parsedResponse.fechaInicio !== 'NO_ESPECIFICADO' &&
                /^\d{2}\/\d{2}\/\d{4}$/.test(parsedResponse.fechaInicio)
                  ? parsedResponse.fechaInicio
                  : null,
              status: parsedResponse.estatusContrato,
              teamId: teamId,
              userId: userId,
              title: parsedResponse.tituloContrato,
              isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
              possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
              contractType: parsedResponse.tipoContrato,
              collectionPeriod: parsedResponse.periodoColeccion,
              collectionPeriodDescription: parsedResponse.descripcionPeriodoColeccion,
              collectionPeriodDuration: parsedResponse.duracionPeriodoColeccion,
              retentionPeriod: parsedResponse.periodoRetencion,
              retentionPeriodDescription: parsedResponse.descripcionPeriodoRetencion,
              retentionPeriodDuration: parsedResponse.duracionPeriodoRetencion,
              summary: parsedResponse.resumenGeneral,
            },
          });
          console.log('contractsTable', contractsTable);
        } else {
          console.log('No existe el contrato, creando uno nuevo');
          contractsTable = await prisma.contract.create({
            data: {
              documentId: documentId,
              fileName: fileName,
              artists: parsedResponse.artistas
                .map((artist: { nombre: string }) => artist.nombre)
                .join(', '),
              endDate: parsedResponse.fechaFin,
              startDate: parsedResponse.fechaInicio,
              teamId: teamId,
              userId: userId,
              status: parsedResponse.estatusContrato,
              title: parsedResponse.tituloContrato,
              isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
              possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
              contractType: parsedResponse.tipoContrato,
              collectionPeriod: parsedResponse.periodoColeccion,
              collectionPeriodDescription: parsedResponse.descripcionPeriodoColeccion,
              collectionPeriodDuration: parsedResponse.duracionPeriodoColeccion,
              retentionPeriod: parsedResponse.periodoRetencion,
              retentionPeriodDescription: parsedResponse.descripcionPeriodoRetencion,
              retentionPeriodDuration: parsedResponse.duracionPeriodoRetencion,
              summary: parsedResponse.resumenGeneral,
            },
          });
          console.log('contractsTable', contractsTable);
        }
        // if (existingContract) {
        //   console.log('Ya existe el contrato, actualizando');
        //   contractsTable = await prisma.contract.update({
        //     where: { id: existingContract.id },
        //     data: {
        //       documentId: documentId,
        //       fileName: fileName,
        //       artists: parsedResponse.artistas
        //         .map((artist: { nombre: string }) => artist.nombre)
        //         .join(', '),
        //       endDate: parsedResponse.fechaFin,
        //       startDate: parsedResponse.fechaInicio,
        //       status: parsedResponse.estatusContrato,
        //       title: parsedResponse.tituloContrato,
        //       isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
        //       possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
        //       summary: parsedResponse.resumenGeneral,
        //     },
        //   });
        // } else {
        //   console.log('No existe el contrato, creando uno nuevo');
        //   contractsTable = await prisma.contract.create({
        //     data: {
        //       documentId: documentId,
        //       fileName: fileName,
        //       artists: parsedResponse.artistas
        //         .map((artist: { nombre: string }) => artist.nombre)
        //         .join(', '),
        //       endDate: parsedResponse.fechaFin,
        //       startDate: parsedResponse.fechaInicio,
        //       status: parsedResponse.estatusContrato,
        //       title: parsedResponse.tituloContrato,
        //       isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
        //       possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
        //       summary: parsedResponse.resumenGeneral,
        //     },
        //   });
        //   console.log('contractsTable', contractsTable);
        // }
      }
    } catch (error) {
      console.log('Error procesando el PDF:', error);
      console.error('Error procesando el PDF:', error);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'ERROR' },
      });
      console.log('documentId', documentId);
    }
  },
});

export const contractInfoTask = task({
  id: 'extract-contract-info',
  queue: {
    concurrencyLimit: 1,
  },
  // Set an optional maxDuration to prevent tasks from running indefinitely
  // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: {
    teamId: number;
    urlDocument: string;
    userId: number;
    documentId: number;
  }) => {
    const documentId = payload.documentId;
    const teamId = payload.teamId;
    const userId = payload.userId;

    console.log(`🔹 Buscando archivo con ID: ${documentId} en la base de datos...`);
    try {
      const decryptedId = payload.documentId;
      console.log(`🔹 Workspace ID: ${decryptedId} y ${payload.documentId}`);
      if (!decryptedId) {
        console.log(`⚠️ No se pudo desencriptar el ID: ${payload.documentId}`);
        return null;
      }
      const documentWhereClause = {
        id: documentId,
        ...(teamId
          ? {
              OR: [
                // { teamId, ...visibilityFilters },
                { teamId },
              ],
            }
          : { userId, teamId: null }),
      };
      const documentBodyExists = await prisma.documentBodyExtracted.findFirst({
        where: { documentId: documentId },
      });
      console.log('documentBodyExists', documentBodyExists);
      let documentBody;
      if (documentBodyExists) {
        documentBody = documentBodyExists;
      } else {
        documentBody = await prisma.documentBodyExtracted.create({
          data: { body: 'En proceso', status: 'PENDING', documentId: documentId },
        });
      }

      console.log('documentWhereClause', documentWhereClause);

      const document = await prisma.document.findFirst({
        where: { id: documentId },
      });

      console.log('document', document);

      const pdfUrl = payload.urlDocument;

      const fileName = document?.title;
      let extractedText;
      // extractedText = await extractText(fileName ?? 'archivo_desconocido', buffer, pdfUrl);

      if (
        documentBody.body &&
        documentBody.body !== 'En proceso' &&
        documentBody.body !== 'Formato no soportado.'
      ) {
        console.log('documentBody.body', documentBody.body);
        if (documentBody.body === 'Formato no soportado.') {
          const response = await fetch(pdfUrl);

          if (!response.ok) {
            console.log(`⚠️ Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
            throw new Error(`Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          console.log(`✅ PDF descargado con éxito, tamaño: ${buffer.length} bytes`);
          extractedText = await extractText(fileName ?? 'archivo_desconocido', buffer, pdfUrl);
        } else {
          extractedText = documentBody.body;
        }
      } else {
        const response = await fetch(pdfUrl);

        if (!response.ok) {
          console.log(`⚠️ Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
          throw new Error(`Error al obtener ${pdfUrl}, código HTTP: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`✅ PDF descargado con éxito, tamaño: ${buffer.length} bytes`);
        extractedText = await extractText(fileName ?? 'archivo_desconocido', buffer, pdfUrl);
      }
      if (!extractedText) {
        console.log(`⚠️ No se pudo extraer el texto del PDF: ${fileName}`);
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'ERROR' },
        });
        return;
      }

      if (
        extractedText === 'Error al procesar el PDF.' ||
        extractedText === 'Formato no soportado.'
      ) {
        console.log(`⚠️ No se pudo extraer el texto del PDF: ${fileName}`);

        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'ERROR' },
        });
        return;
      }

      console.log(`✅ texto extraido con éxito`);

      if (extractedText) {
        console.log('ai beggining');
        const prompt = `
Extrae la información clave de este contrato en base a los siguientes requerimientos:
el titulo es: ${fileName}
1. **Título del contrato**: Nombre del contrato.
2. **Artistas**: Nombres de todos los artistas involucrados.
   Nombre del grupo: si se especifica un grupo, banda o colectivo al que pertenece el involucrado del contrato, da el nombre.}
3. **Fecha de inicio del contrato**: Fecha de inicio del contrato formato dd/mm/aaaa, si solo esta el año escribe la fecha como si fuera desde ese incio de año, es decir, 01/01/AÑO.
4. **Fecha de finalización del contrato**: Fecha de finalización del contrato formato dd/mm/aaaa, si no esta especificada dejalo vacio.
5. **¿Es posible expandirlo?**: Indica si el contrato puede extenderse (SI, NO, NO_ESPECIFICADO).
6. **Tiempo de extensión posible**: Especifica el tiempo de extensión (2, 3, 5 años o la cantidad de tiempo especificada), fecha estimada.
7. **Estatus del contrato**: Si ya está vencido (FINALIZADO) o es vigente (VIGENTE). Basado en la fecha actual: ${new Date().toISOString()}.
8. **Tipo de Contrato**: Clasifica el contrato como uno de los siguientes: ARRENDAMIENTOS, ALQUILERES, VEHICULOS, SERVICIOS, ARTISTAS.
9. **Periodo de Colección**: Indica si existe un período de Colección específico (SI, NO, NO_ESPECIFICADO).
10. **Descripción del Periodo de Coleccion**: Detalla cómo funciona el período de Colección.
11. **Duración del Periodo de Coleccion**: Especifica la duración del período de Colección.
12. **Periodo de Retención**: Indica si existe un período de retención (SI, NO, NO_ESPECIFICADO).
13. **Descripción del Periodo de Retención**: Detalla cómo funciona el período de retención.
14. **Duración del Periodo de Retención**: Especifica la duración del período de retención.
15. **Resumen general** SIEMPRE genera un resumen del contrato.

este es el contrato: ${extractedText}
        `;

        console.log('prompt', prompt);

        const documentBodyExtracted = await prisma.documentBodyExtracted.update({
          where: { id: documentBody.id },
          data: { status: 'COMPLETE', body: extractedText },
        });

        console.log('documentBodyExtracted', documentBodyExtracted);

        const document = await prisma.document.update({
          where: { id: documentId },
          data: { status: 'COMPLETED' },
        });

        console.log('document updated', document);

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        // const responses = await ai.models.generateContent({
        //   model: 'gemini-2.0-flash-lite',
        //   contents: prompt,
        //   config: {
        //     responseMimeType: 'application/json',
        //     responseSchema: {
        //       type: Type.ARRAY,
        //       items: {
        //         type: Type.OBJECT,
        //         properties: {
        //           tituloContrato: { type: Type.STRING },
        //           artistas: {
        //             type: Type.ARRAY,
        //             items: {
        //               type: Type.OBJECT,
        //               properties: {
        //                 nombre: { type: Type.STRING },
        //               },
        //             },
        //           },
        //           fechaInicio: { type: Type.STRING },
        //           fechaFin: { type: Type.STRING },
        //           esPosibleExpandirlo: { type: Type.STRING, enum: ['SI', 'NO', 'NO_ESPECIFICADO'] },
        //           tiempoExtensionPosible: { type: Type.STRING },
        //           estatusContrato: {
        //             type: Type.STRING,
        //             enum: ['VIGENTE', 'FINALIZADO', 'NO_ESPECIFICADO'],
        //           },
        //           resumenGeneral: { type: Type.STRING },
        //         },
        //         propertyOrdering: [
        //           'tituloContrato',
        //           'artistas',
        //           'fechaInicio',
        //           'fechaFin',
        //           'esPosibleExpandirlo',
        //           'tiempoExtensionPosible',
        //           'estatusContrato',

        //           'resumenGeneral',
        //         ],
        //       },
        //     },
        //   },
        // });
        const responses = await ai.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tituloContrato: { type: Type.STRING },
                  artistas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        nombre: { type: Type.STRING },
                      },
                    },
                  },

                  nombreGrupo: { type: Type.STRING },
                  fechaInicio: { type: Type.STRING },

                  fechaFin: { type: Type.STRING },
                  esPosibleExpandirlo: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  tiempoExtensionPosible: { type: Type.STRING },
                  estatusContrato: {
                    type: Type.STRING,
                    enum: ['VIGENTE', 'FINALIZADO', 'NO_ESPECIFICADO'],
                  },
                  tipoContrato: {
                    type: Type.STRING,
                    enum: ['ARRENDAMIENTOS', 'ALQUILERES', 'VEHICULOS', 'SERVICIOS', 'ARTISTAS'],
                  },
                  periodoColeccion: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  descripcionPeriodoColeccion: { type: Type.STRING },
                  duracionPeriodoColeccion: { type: Type.STRING },
                  periodoRetencion: {
                    type: Type.STRING,
                    enum: ['SI', 'NO', 'NO_ESPECIFICADO'],
                  },
                  descripcionPeriodoRetencion: { type: Type.STRING },
                  duracionPeriodoRetencion: { type: Type.STRING },
                  resumenGeneral: { type: Type.STRING },
                },
                propertyOrdering: [
                  'tituloContrato',
                  'artistas',
                  'nombreGrupo',
                  'fechaInicio',
                  'fechaFin',
                  'esPosibleExpandirlo',
                  'tiempoExtensionPosible',
                  'estatusContrato',
                  'tipoContrato',
                  'periodoColeccion',
                  'descripcionPeriodoColeccion',
                  'duracionPeriodoColeccion',
                  'periodoRetencion',
                  'descripcionPeriodoRetencion',
                  'duracionPeriodoRetencion',
                  'resumenGeneral',
                ],
              },
            },
          },
        });
        console.log('response', responses.text);

        const parsedResponse = responses.text ? JSON.parse(responses.text)[0] : null; // Parse JSON and get the first item if text exists
        console.log('parsedResponse', parsedResponse);
        let contractsTable;

        const existingContract = await prisma.contract.findFirst({
          where: { documentId: documentId },
        });

        if (existingContract) {
          console.log('Ya existe el contrato, actualizando');
          contractsTable = await prisma.contract.update({
            where: { id: existingContract.id },
            data: {
              // documentId: documentId,
              // fileName: fileName,
              // artists: parsedResponse.artistas
              //   .map((artist: { nombre: string }) => artist.nombre)
              //   .join(', '),
              // endDate:
              //   parsedResponse.fechaFin === 'NO ESPECIFICADO' ||
              //   parsedResponse.fechaFin === 'NO_ESPECIFICADO'
              //     ? null
              //     : parsedResponse.fechaFin,
              // startDate:
              //   parsedResponse.fechaInicio === 'NO ESPECIFICADO' ||
              //   parsedResponse.fechaInicio === 'NO_ESPECIFICADO'
              //     ? null
              //     : parsedResponse.fechaInicio,
              // status: parsedResponse.estatusContrato,
              // teamId: teamId,
              // userId: userId,
              // title: parsedResponse.tituloContrato,
              // isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
              // possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
              // contractType: parsedResponse.tipoContrato,
              // collectionPeriod: parsedResponse.periodoColeccion,
              // collectionPeriodDescription: parsedResponse.descripcionPeriodoColeccion,
              // collectionPeriodDuration: parsedResponse.duracionPeriodoColeccion,
              // retentionPeriod: parsedResponse.periodoRetencion,
              // retentionPeriodDescription: parsedResponse.descripcionPeriodoRetencion,
              // retentionPeriodDuration: parsedResponse.duracionPeriodoRetencion,
              summary: parsedResponse.resumenGeneral,
            },
          });
          console.log('contractsTable', contractsTable);
        } else {
          console.log('No existe el contrato, creando uno nuevo');
          contractsTable = await prisma.contract.create({
            data: {
              documentId: documentId,
              fileName: fileName,
              artists: parsedResponse.artistas
                .map((artist: { nombre: string }) => artist.nombre)
                .join(', '),
              endDate: parsedResponse.fechaFin,
              startDate: parsedResponse.fechaInicio,
              teamId: teamId,
              userId: userId,
              status: parsedResponse.estatusContrato,
              title: parsedResponse.tituloContrato,
              isPossibleToExpand: parsedResponse.esPosibleExpandirlo,
              possibleExtensionTime: parsedResponse.tiempoExtensionPosible,
              contractType: parsedResponse.tipoContrato,
              collectionPeriod: parsedResponse.periodoColeccion,
              collectionPeriodDescription: parsedResponse.descripcionPeriodoColeccion,
              collectionPeriodDuration: parsedResponse.duracionPeriodoColeccion,
              retentionPeriod: parsedResponse.periodoRetencion,
              retentionPeriodDescription: parsedResponse.descripcionPeriodoRetencion,
              retentionPeriodDuration: parsedResponse.duracionPeriodoRetencion,
              summary: parsedResponse.resumenGeneral,
            },
          });
          console.log('contractsTable', contractsTable);
        }

        return contractsTable;
      }

      const pepe = await prisma.document.update({
        where: { id: documentId },
        data: { status: 'COMPLETED' },
      });

      console.log('pepe', pepe);
      console.log(`✅ Documento ${documentId} procesado con éxito`);
    } catch (error) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'ERROR' },
      });
      console.log('documentId', documentId);
      console.log('Error procesando el PDF:', error);
      console.error('Error procesando el PDF:', error);
    }
  },
});
