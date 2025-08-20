import * as React from 'react';

export function useMediaQuery(query: string) {
  const throttleMs = 100;
  const [value, setValue] = React.useState(true);
  const throttleRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }

      throttleRef.current = setTimeout(() => {
        setValue(event.matches);
        throttleRef.current = null;
      }, throttleMs);
    }

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => {
      result.removeEventListener('change', onChange);
      // Limpiar timeout al desmontar
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [query, throttleMs]);

  return value;
}
