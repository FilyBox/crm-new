import { z } from 'zod';

import { DistributionStatementSchema } from '@documenso/prisma/generated/zod/modelSchema/DistributionStatementSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';

/**
 * The full document response schema.
 *
 * Mainly used for returning a single document from the API.
 */

const ZMusicPlatformSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
});

const ZTerritorySchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
});

export const ZDistributionSchema = DistributionStatementSchema.pick({
  id: true,
  codigoDelTerritorio: true,
  copyright: true,
  costoCarga: true,
  costoDistribucion: true,
  cuotaAdministracion: true,
  ingresosRecibidos: true,
  isrc: true,
  localProductNumber: true,
  marketingOwner: true,
  nombreDelTerritorio: true,
  mesReportado: true,
  nombreDistribucion: true,
  teamId: true,
  userId: true,
  numeroDeCatalogo: true,
  otrosCostos: true,
  ppd: true,
  proyecto: true,
  rbp: true,
  regaliasArtisticas: true,
  rtl: true,
  territorio: true,
  tipoDeCambio: true,
  tipoDeIngreso: true,
  tipoDePrecio: true,
  tituloCatalogo: true,
  upc: true,
  updatedAt: true,
  valorRecibido: true,
  venta: true,
  createdAt: true,
}).extend({
  distributionStatementMusicPlatforms: z.array(ZMusicPlatformSchema).optional(),
  distributionStatementTerritories: z.array(ZTerritorySchema).optional(),
});

export type TDistribution = z.infer<typeof ZDistributionSchema>;

/**
 * A lite version of the document response schema without relations.
 */
export const ZDistributionLiteSchema = DistributionStatementSchema.pick({
  id: true,
  codigoDelTerritorio: true,
  copyright: true,
  costoCarga: true,
  costoDistribucion: true,
  cuotaAdministracion: true,
  ingresosRecibidos: true,
  isrc: true,
  localProductNumber: true,
  marketingOwner: true,
  nombreDelTerritorio: true,
  mesReportado: true,
  nombreDistribucion: true,
  numeroDeCatalogo: true,
  otrosCostos: true,
  ppd: true,
  proyecto: true,
  rbp: true,
  regaliasArtisticas: true,
  rtl: true,
  territorio: true,
  tipoDeCambio: true,
  tipoDeIngreso: true,
  tipoDePrecio: true,
  tituloCatalogo: true,
  upc: true,
  updatedAt: true,
  valorRecibido: true,
  venta: true,
  createdAt: true,
});

export type TDistributionLite = z.infer<typeof ZDistributionLiteSchema>;

/**
 * A version of the document response schema when returning multiple documents at once from a single API endpoint.
 */
export const ZDistributionManySchema = DistributionStatementSchema.pick({
  id: true,
  codigoDelTerritorio: true,
  copyright: true,
  costoCarga: true,
  costoDistribucion: true,
  cuotaAdministracion: true,
  ingresosRecibidos: true,
  isrc: true,
  localProductNumber: true,
  marketingOwner: true,
  nombreDelTerritorio: true,
  mesReportado: true,
  nombreDistribucion: true,
  teamId: true,
  userId: true,
  numeroDeCatalogo: true,
  otrosCostos: true,
  ppd: true,
  proyecto: true,
  rbp: true,
  regaliasArtisticas: true,
  rtl: true,
  territorio: true,
  tipoDeCambio: true,
  tipoDeIngreso: true,
  tipoDePrecio: true,
  tituloCatalogo: true,
  upc: true,
  updatedAt: true,
  valorRecibido: true,
  venta: true,
  createdAt: true,
}).extend({
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }),
  team: TeamSchema.pick({
    id: true,
    url: true,
  }).nullable(),
});

export type TDocumentMany = z.infer<typeof ZDistributionManySchema>;
