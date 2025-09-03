import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import {
  AlertTriangle,
  CheckCircle,
  Disc,
  FileCheck,
  FileClock,
  FileCog,
  Music,
  Package,
  TrendingUp,
} from 'lucide-react';

import { getDocumentStats } from '@documenso/lib/server-only/admin/get-documents-stats';
import { getRecipientsStats } from '@documenso/lib/server-only/admin/get-recipients-stats';
import {
  getUserWithSignedDocumentMonthlyGrowth,
  getUsersCount,
} from '@documenso/lib/server-only/admin/get-users-stats';
import { getSignerConversionMonthly } from '@documenso/lib/server-only/user/get-signer-conversion';
import { trpc } from '@documenso/trpc/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { ResultsNoChart } from '~/components/general/advance-filters/results-no-chart';
import { CardMetric } from '~/components/general/metric-card';

import type { Route } from './+types/stats';

export async function loader() {
  const [
    usersCount,
    docStats,
    recipientStats,
    signerConversionMonthly,
    // userWithAtLeastOneDocumentPerMonth,
    // userWithAtLeastOneDocumentSignedPerMonth,
    MONTHLY_USERS_SIGNED,
  ] = await Promise.all([
    getUsersCount(),
    getDocumentStats(),
    getRecipientsStats(),
    getSignerConversionMonthly(),
    // getUserWithAtLeastOneDocumentPerMonth(),
    // getUserWithAtLeastOneDocumentSignedPerMonth(),
    getUserWithSignedDocumentMonthlyGrowth(),
  ]);

  return {
    usersCount,
    docStats,
    recipientStats,
    signerConversionMonthly,
    MONTHLY_USERS_SIGNED,
  };
}

export default function AdminStatsPage({ loaderData }: Route.ComponentProps) {
  const { _ } = useLingui();
  const { data, isLoading, isLoadingError, refetch } =
    trpc.contracts.findContractsStatsByCurrentTeam.useQuery();

  const { data: tuStreamsStats, isLoading: isTuStreamsStatsLoading } =
    trpc.tuStreams.findTuStreamsStatsByCurrentTeam.useQuery();

  const { data: lpmStats, isLoading: isLpmStatsLoading } =
    trpc.lpm.findLpmStatsByCurrentTeam.useQuery();

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
      <h2 className="text-4xl font-semibold">
        <Trans>Team Stats</Trans>
      </h2>

      <Tabs defaultValue="contracts" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">
            <Trans>Contracts</Trans>
          </TabsTrigger>
          <TabsTrigger value="tustreams">
            <Trans>TuStreams</Trans>
          </TabsTrigger>
          <TabsTrigger value="lpm">
            <Trans>Virgin</Trans>
          </TabsTrigger>
          <TabsTrigger value="data">
            <Trans>Data Tables</Trans>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-8">
          <div>
            <h3 className="mb-6 text-3xl font-semibold">
              <Trans>Contracts Statistics</Trans>
            </h3>
            <div className="mb-8 grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
              <CardMetric
                icon={FileCog}
                title={_(msg`Total Contracts`)}
                value={data?.TOTAL_CONTRACTS || 0}
              />
              <CardMetric
                icon={FileClock}
                title={_(msg`Finalized Contracts`)}
                value={data?.FINALIZADO || 0}
              />
              <CardMetric
                icon={FileCheck}
                title={_(msg`Ongoing Contracts`)}
                value={data?.VIGENTE || 0}
              />
              <CardMetric
                icon={FileCheck}
                title={_(msg`Active Rate`)}
                valueFormat="percent"
                value={
                  data?.TOTAL_CONTRACTS
                    ? Math.round((data.VIGENTE / data.TOTAL_CONTRACTS) * 100)
                    : 0
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tustreams" className="mt-8">
          <div>
            <h3 className="mb-6 text-3xl font-semibold">
              <Trans>TuStreams Statistics</Trans>
            </h3>
            <div className="mb-8 grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
              <CardMetric
                icon={FileCog}
                title={_(msg`Total Rows TuStreams`)}
                value={tuStreamsStats?.TOTAL_TUSTREAMS || 0}
              />
              <CardMetric
                icon={FileClock}
                title={_(msg`Total`)}
                value={tuStreamsStats?.TOTAL || 0}
              />
              <CardMetric
                icon={FileCheck}
                title={_(msg`Singles`)}
                value={tuStreamsStats?.Single || 0}
              />
              <CardMetric
                icon={FileCheck}
                title={_(msg`Albums`)}
                value={tuStreamsStats?.Album || 0}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lpm" className="mt-8">
          <div>
            <h3 className="mb-6 text-3xl font-semibold">
              <Trans>Virgin Statistics</Trans>
            </h3>
            <div className="mb-8 grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
              <CardMetric
                icon={Package}
                title={_(msg`Total LPM Records`)}
                value={lpmStats?.TOTAL_LPM || 0}
              />
              <CardMetric
                icon={Disc}
                title={_(msg`Unique Products`)}
                value={lpmStats?.TOTAL_PRODUCTS || 0}
              />
              <CardMetric
                icon={Music}
                title={_(msg`Unique Tracks`)}
                value={lpmStats?.TOTAL_TRACKS || 0}
              />
              <CardMetric
                icon={TrendingUp}
                title={_(msg`Recent Releases`)}
                value={lpmStats?.RECENT_RELEASES || 0}
              />
            </div>

            <div className="mb-8 grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
              <CardMetric
                icon={CheckCircle}
                title={_(msg`Submitted Records`)}
                value={lpmStats?.SUBMITTED_RECORDS || 0}
              />
              <CardMetric
                icon={AlertTriangle}
                title={_(msg`Explicit Content`)}
                value={lpmStats?.EXPLICIT_CONTENT || 0}
              />
              <CardMetric
                icon={TrendingUp}
                title={_(msg`Submission Rate`)}
                value={
                  lpmStats?.TOTAL_LPM && lpmStats?.SUBMITTED_RECORDS !== undefined
                    ? Math.round(((lpmStats?.SUBMITTED_RECORDS || 0) / lpmStats.TOTAL_LPM) * 100)
                    : 0
                }
              />
            </div>

            {lpmStats?.BY_PRODUCT_TYPE && Object.keys(lpmStats.BY_PRODUCT_TYPE).length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 text-xl font-semibold">
                  <Trans>By Product Type</Trans>
                </h4>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.entries(lpmStats.BY_PRODUCT_TYPE || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <CardMetric key={type} icon={Disc} title={type} value={count as number} />
                    ))}
                </div>
              </div>
            )}

            {lpmStats?.BY_SUBMISSION_STATUS &&
              Object.keys(lpmStats.BY_SUBMISSION_STATUS).length > 0 && (
                <div className="mb-8">
                  <h4 className="mb-4 text-xl font-semibold">
                    <Trans>By Submission Status</Trans>
                  </h4>
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                    {Object.entries(lpmStats.BY_SUBMISSION_STATUS || {})
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 3)
                      .map(([status, count]) => (
                        <CardMetric
                          key={status}
                          icon={TrendingUp}
                          title={status}
                          value={count as number}
                        />
                      ))}
                  </div>
                </div>
              )}

            {lpmStats?.BY_GENRE && Object.keys(lpmStats.BY_GENRE).length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 text-xl font-semibold">
                  <Trans>Popular Genres</Trans>
                </h4>
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.entries(lpmStats.BY_GENRE || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([genre, count]) => (
                      <CardMetric key={genre} icon={Music} title={genre} value={count as number} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-8">
          <div>
            <h3 className="mb-6 text-3xl font-semibold">
              <Trans>Data Tables</Trans>
            </h3>

            <div className="mb-8">
              <h4 className="mb-4 text-xl font-semibold">
                <Trans>TuStreams Data</Trans>
              </h4>
              <ResultsNoChart
                results={tuStreamsStats?.data || []}
                data={tuStreamsStats?.data || []}
                columns={Object.keys(tuStreamsStats?.data?.[0] || {})}
                isLoading={isTuStreamsStatsLoading}
              />
            </div>

            {lpmStats?.data && lpmStats.data.length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 text-xl font-semibold">
                  <Trans>Virgin Recent Data (Last 10 Records)</Trans>
                </h4>
                <ResultsNoChart
                  results={lpmStats.data.slice(0, 10) || []}
                  data={lpmStats.data.slice(0, 10) || []}
                  columns={Object.keys(lpmStats.data[0] || {})}
                  isLoading={isLpmStatsLoading}
                />
              </div>
            )}

            {data?.data && data.data.length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 text-xl font-semibold">
                  <Trans>Recent Contracts (Last 10 Records)</Trans>
                </h4>
                <ResultsNoChart
                  results={data.data.slice(0, 10) || []}
                  data={data.data.slice(0, 10) || []}
                  columns={Object.keys(data.data[0] || {})}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
