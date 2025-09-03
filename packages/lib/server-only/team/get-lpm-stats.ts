import { prisma } from '@documenso/prisma';

export const getLpmStats = async (teamId?: number) => {
  if (!teamId) {
    return {
      TOTAL_LPM: 0,
      TOTAL_PRODUCTS: 0,
      TOTAL_TRACKS: 0,
      BY_PRODUCT_TYPE: {},
      BY_SUBMISSION_STATUS: {},
      BY_GENRE: {},
      RECENT_RELEASES: 0,
      data: [],
    };
  }

  // Obtener todos los registros LPM del equipo
  const lpmData = await prisma.lpm.findMany({
    where: {
      teamId,
    },
    orderBy: {
      importDate: 'desc',
    },
  });

  // Calcular estadísticas básicas
  const totalLpm = lpmData.length;

  // Contar productos únicos
  const uniqueProducts = new Set(lpmData.map((item) => item.productId).filter(Boolean));
  const totalProducts = uniqueProducts.size;

  // Contar tracks únicos
  const uniqueTracks = new Set(lpmData.map((item) => item.trackId).filter(Boolean));
  const totalTracks = uniqueTracks.size;

  // Agrupar por tipo de producto
  const byProductType: Record<string, number> = {};
  lpmData.forEach((item) => {
    if (item.productType) {
      byProductType[item.productType] = (byProductType[item.productType] || 0) + 1;
    }
  });

  // Agrupar por estado de envío
  const bySubmissionStatus: Record<string, number> = {};
  lpmData.forEach((item) => {
    if (item.submissionStatus) {
      bySubmissionStatus[item.submissionStatus] =
        (bySubmissionStatus[item.submissionStatus] || 0) + 1;
    }
  });

  // Agrupar por género
  const byGenre: Record<string, number> = {};
  lpmData.forEach((item) => {
    if (item.productGenre) {
      byGenre[item.productGenre] = (byGenre[item.productGenre] || 0) + 1;
    }
  });

  // Calcular lanzamientos recientes (último mes)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const recentReleases = lpmData.filter(
    (item) => item.releaseDate && item.releaseDate >= oneMonthAgo,
  ).length;

  // Calcular estadísticas adicionales
  const explicitContent = lpmData.filter(
    (item) => item.explicitLyrics && item.explicitLyrics.toLowerCase() === 'yes',
  ).length;

  const submittedRecords = lpmData.filter((item) => item.submittedAt !== null).length;

  return {
    TOTAL_LPM: totalLpm,
    TOTAL_PRODUCTS: totalProducts,
    TOTAL_TRACKS: totalTracks,
    BY_PRODUCT_TYPE: byProductType,
    BY_SUBMISSION_STATUS: bySubmissionStatus,
    BY_GENRE: byGenre,
    RECENT_RELEASES: recentReleases,
    EXPLICIT_CONTENT: explicitContent,
    SUBMITTED_RECORDS: submittedRecords,
    data: lpmData,
  };
};
