import { useState } from 'react';

import { Circle, Loader2 } from 'lucide-react';

import type { QueryExplanation } from '@documenso/ui/lib/types';
import { Button } from '@documenso/ui/primitives/button';

import { explainQuery } from '../../../utils/actions';
import { QueryWithTooltips } from './query-with-tooltips';

export const QueryViewer = ({
  activeQuery,
  inputValue,
}: {
  activeQuery: string;
  inputValue: string;
}) => {
  const activeQueryCutoff = 100;

  const [queryExplanations, setQueryExplanations] = useState<QueryExplanation[] | null>();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [queryExpanded, setQueryExpanded] = useState(activeQuery.length > activeQueryCutoff);

  const handleExplainQuery = async () => {
    setQueryExpanded(true);
    setLoadingExplanation(true);
    const { explanations } = await explainQuery(inputValue, activeQuery);
    setQueryExplanations(explanations);
    setLoadingExplanation(false);
  };

  if (activeQuery.length === 0) return null;

  return (
    <div className="group relative mb-4">
      <div className={`bg-muted rounded-md p-4 ${queryExpanded ? '' : 'text-muted-foreground'}`}>
        <div className="font-mono text-sm">
          {queryExpanded ? (
            queryExplanations && queryExplanations.length > 0 ? (
              <>
                <QueryWithTooltips query={activeQuery} queryExplanations={queryExplanations} />
                <p className="mt-4 font-sans text-base">
                  Generated explanation! Hover over different parts of the SQL query to see
                  explanations.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="">{activeQuery}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExplainQuery}
                  className="hover:text-muted-foreground hidden h-fit sm:inline-block"
                  aria-label="Explain query"
                  disabled={loadingExplanation}
                >
                  {loadingExplanation ? (
                    <Loader2 className="h-10 w-10 animate-spin p-2" />
                  ) : (
                    <Circle className="h-10 w-10 p-2" />
                  )}
                </Button>
              </div>
            )
          ) : (
            <span>
              {activeQuery.slice(0, activeQueryCutoff)}
              {activeQuery.length > activeQueryCutoff ? '...' : ''}
            </span>
          )}
        </div>
      </div>
      {!queryExpanded && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setQueryExpanded(true)}
          className="absolute inset-0 h-full opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
        >
          Show full query
        </Button>
      )}
    </div>
  );
};
