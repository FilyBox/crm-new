import { motion } from 'framer-motion';

import { Button } from '@documenso/ui/primitives/button';

export const SuggestedQueries = ({
  handleSuggestionClick,
  tableToConsult,
}: {
  handleSuggestionClick: (suggestion: string) => void;
  tableToConsult: string;
}) => {
  const suggestionQueries = [
    {
      desktop:
        'Lista de Contratos finalizados, solo el titulo, fecha de finalización, no null, ordenados por fecha de finalización de mas reciente a mas antiguo',
      mobile: 'Contratos finalizados',
    },
  ];

  const pepe = (() => {
    switch (tableToConsult) {
      case 'Contracts':
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de Contratos finalizados, solo el titulo, fecha de finalización, no null, ordenados por fecha de finalización de mas reciente a mas antiguo',
              mobile: 'Contratos finalizados',
            },
          ],
        };
      case 'Isrc':
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de ISRCs, solo el titulo, fecha de creación, no null, ordenados por fecha de creación de mas reciente a mas antiguo',
              mobile: 'ISRCs recientes',
            },
          ],
        };

      case 'Virgin':
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de lanzamientos de lpm, solo el titulo, fecha de lanzamiento, no null, ordenados por fecha de lanzamiento de mas reciente a mas antiguo',
              mobile: 'Lanzamientos de lpm',
            },
          ],
        };
      case 'Releases':
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de lanzamientos, solo el titulo, fecha de lanzamiento, no null, ordenados por fecha de lanzamiento de mas reciente a mas antiguo',
              mobile: 'Lanzamientos',
            },
          ],
        };

      case 'Distribution':
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de distribuciones, solo el titulo, fecha de distribución, no null, ordenados por fecha de distribución de mas reciente a mas antiguo',
              mobile: 'Distribuciones',
            },
          ],
        };
      case 'TuStreams':
        return {
          suggestionQueries: [],
        };

      default:
        return {
          suggestionQueries: [
            {
              desktop:
                'Lista de Contratos finalizados, solo el titulo, fecha de finalización, no null, ordenados por fecha de finalización de mas reciente a mas antiguo',
              mobile: 'Contratos finalizados',
            },
          ],
        };
    }
  })();

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-foreground mb-4 text-lg font-semibold sm:text-xl">Try these queries:</h2>
      <div className="flex flex-wrap gap-2">
        {pepe.suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? 'hidden sm:inline-block' : ''}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="">{suggestion.mobile}</span>
            <span className="hidden">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
