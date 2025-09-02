import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { ListFilter, Loader2 } from 'lucide-react';

import { trpc } from '@documenso/trpc/react';
import type { Config, Result } from '@documenso/ui/lib/types';
import { Button } from '@documenso/ui/primitives/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@documenso/ui/primitives/drawer';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { QueryViewer } from '../general/advance-filters/query-viewer';
import { Results } from '../general/advance-filters/results';
import { Search } from '../general/advance-filters/search';
import { SuggestedQueries } from '../general/advance-filters/suggested-queries';

export type AdvancedFiltersDialogProps = {
  trigger?: React.ReactNode;
  tableToConsult: string;
  from?: string;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

export const AdvancedFilterDialog = ({
  trigger,
  tableToConsult,
  from,
  ...props
}: AdvancedFiltersDialogProps) => {
  const aiQuery = trpc.document.aiConnection.useMutation();

  const { _ } = useLingui();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);

  const handleSubmit = async (suggestion?: string) => {
    const question = suggestion ?? inputValue;
    if (inputValue.length === 0 && !suggestion) return;
    clearExistingData();
    if (question.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery('');
    try {
      const { query, companies } = await aiQuery.mutateAsync({
        question,
        tableToConsult,
      });

      console.log('AI Query Result:', { query, companies });

      if (query === undefined) {
        toast({
          description: _(msg`An error occurred. Please try again.`),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      setActiveQuery(query);
      setLoadingStep(2);
      // const companies = await runGenerateSQLQuery(query);
      const columns = companies.length > 0 ? Object.keys(companies[0]) : [];
      setResults(companies);
      setColumns(columns);
      setLoading(false);
      // const generation = await generateChartConfig(companies, question);
      // if (generation && generation.config) {
      //   setChartConfig(generation.config);
      // }
    } catch (e) {
      console.error('Error generating query or running SQL:', e);
      toast({
        description: _(msg`An error occurred. Please try again.`),
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    try {
      await handleSubmit(suggestion);
    } catch (e) {
      toast({
        description: _(msg`An error occurred. Please try again.`),
        variant: 'destructive',
      });
    }
  };

  const clearExistingData = () => {
    setActiveQuery('');
    setResults([]);
    setColumns([]);
    setChartConfig(null);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue('');
    clearExistingData();
  };

  return (
    <Drawer modal={true}>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="flex w-full items-center gap-2 sm:w-fit">
            <ListFilter className="h-4 w-4" />
            <span>
              <Trans>AI Filters</Trans>
            </span>
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="z-9999 h-[90vh] !max-h-screen w-full">
        <DrawerHeader className="mx-4">
          <DrawerTitle>
            <Trans>AI Filters</Trans>
          </DrawerTitle>
          <DrawerDescription>
            <Trans>Use the input below to refine your search results.</Trans>
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="h-[90vh] w-full">
          <motion.div
            className="bg-card sm:border-border flex w-full flex-col rounded-xl sm:border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex w-full max-w-[100vw] flex-col p-6 sm:p-8">
              {/* <Header handleClear={handleClear} /> */}
              <Search
                handleClear={handleClear}
                handleSubmit={handleSubmit}
                inputValue={inputValue}
                setInputValue={setInputValue}
                submitted={submitted}
              />
              <div id="main-container" className="mx-auto flex w-full flex-col sm:min-h-[420px]">
                <div className="h-full w-full">
                  <AnimatePresence mode="wait">
                    {!submitted ? (
                      <SuggestedQueries
                        tableToConsult={tableToConsult}
                        handleSuggestionClick={handleSuggestionClick}
                      />
                    ) : (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        layout
                        className="flex min-h-[400px] flex-col sm:h-full"
                      >
                        {activeQuery.length > 0 && (
                          <QueryViewer activeQuery={activeQuery} inputValue={inputValue} />
                        )}
                        {loading ? (
                          <div className="bg-background/50 absolute flex h-full w-full flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-muted-foreground h-12 w-12 animate-spin" />
                            <p className="text-foreground">
                              {loadingStep === 1
                                ? 'Generating SQL query...'
                                : 'Running SQL query...'}
                            </p>
                          </div>
                        ) : results.length === 0 ? (
                          <div className="flex flex-grow items-center justify-center">
                            <p className="text-muted-foreground text-center">
                              <Trans>No results found.</Trans>
                            </p>
                          </div>
                        ) : (
                          <Results
                            from={from}
                            results={results}
                            data={results}
                            chartConfig={chartConfig}
                            columns={columns}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="w-full" variant="outline">
              <Trans>Cancel</Trans>
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
