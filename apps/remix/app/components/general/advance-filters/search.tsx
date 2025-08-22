import { Search as SearchIcon } from 'lucide-react';

import { Button } from '@documenso/ui/primitives/button';
import { Input } from '@documenso/ui/primitives/input';

export const Search = ({
  handleSubmit,
  inputValue,
  setInputValue,
  submitted,
  handleClear,
}: {
  handleSubmit: () => Promise<void>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  submitted: boolean;
  handleClear: () => void;
}) => {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await handleSubmit();
      }}
      className="mb-6"
    >
      <div className="flex flex-col items-stretch space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Ask..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10 text-base"
          />
          <SearchIcon className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 transform" />
        </div>
        <div className="flex items-center justify-center gap-2 sm:flex-row">
          {submitted ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
          ) : (
            <Button type="submit" className="w-full sm:w-auto">
              Send
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
