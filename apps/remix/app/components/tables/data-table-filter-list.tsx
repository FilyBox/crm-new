import * as React from 'react';

import type { Column, ColumnMeta, Table } from '@tanstack/react-table';
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  GripVertical,
  ListFilter,
  Trash2,
} from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import { dataTableConfig } from '@documenso/ui/config/data-table';
import { usePage } from '@documenso/ui/hooks/usePage';
import { getDefaultFilterOperator, getFilterOperators } from '@documenso/ui/lib/data-table';
import { formatDate } from '@documenso/ui/lib/format';
import { generateId } from '@documenso/ui/lib/id';
import { getFiltersStateParser } from '@documenso/ui/lib/parsers';
import { useDebouncedCallback } from '@documenso/ui/lib/use-debounced-callback';
import { useIsMobile } from '@documenso/ui/lib/use-mobile';
import { cn } from '@documenso/ui/lib/utils';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@documenso/ui/primitives/command';
import {
  Faceted,
  FacetedBadgeList,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedList,
  FacetedTrigger,
} from '@documenso/ui/primitives/faceted';
import { Input } from '@documenso/ui/primitives/input';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@documenso/ui/primitives/sortable';
import type {
  ExtendedColumnFilter,
  FilterOperator,
  JoinOperator,
} from '@documenso/ui/types/data-table';

import { DataTableRangeFilter } from './data-table-range-filter';

const FILTERS_KEY = 'filters';
const JOIN_OPERATOR_KEY = 'joinOperator';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
const OPEN_MENU_SHORTCUT = 'f';
const REMOVE_FILTER_SHORTCUTS = ['backspace', 'delete'];

interface DataTableFilterListProps<TData> extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  debounceMs?: number;
  throttleMs?: number;
  shallow?: boolean;
  loading: boolean;
}

export function DataTableFilterList<TData>({
  table,
  debounceMs = DEBOUNCE_MS,
  loading,
  throttleMs = THROTTLE_MS,
  shallow = true,
  // ...props
}: DataTableFilterListProps<TData>) {
  const id = React.useId();
  const labelId = React.useId();
  const descriptionId = React.useId();
  const [open, setOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const { setPage } = usePage();

  const columns = React.useMemo(() => {
    return table.getAllColumns().filter((column) => column.columnDef.enableColumnFilter);
  }, [table]);

  const [filters, setFilters] = useQueryState(
    FILTERS_KEY,
    getFiltersStateParser<TData>(columns.map((field) => field.id))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        shallow,
        throttleMs,
      }),
  );

  const [localFilters, setLocalFilters] = React.useState<ExtendedColumnFilter<TData>[]>(filters);

  const debouncedSetFilters = useDebouncedCallback(setLocalFilters, debounceMs);

  const [joinOperator, setJoinOperator] = useQueryState(
    JOIN_OPERATOR_KEY,
    parseAsStringEnum(['and', 'or']).withDefault('and').withOptions({
      clearOnDefault: true,
      shallow,
    }),
  );

  const onFilterAdd = React.useCallback(() => {
    const column = columns[0];

    if (!column) return;
    debouncedSetFilters([
      ...localFilters,
      {
        id: column.id as Extract<keyof TData, string>,
        value: '',
        variant: column.columnDef.meta?.variant ?? 'text',
        operator: getDefaultFilterOperator(column.columnDef.meta?.variant ?? 'text'),
        filterId: generateId({ length: 8 }),
      },
    ]);
  }, [columns, localFilters, debouncedSetFilters]);

  const onFilterUpdate = React.useCallback(
    (filterId: string, updates: Partial<Omit<ExtendedColumnFilter<TData>, 'filterId'>>) => {
      debouncedSetFilters((prevFilters) => {
        const updatedFilters = prevFilters.map((filter) => {
          if (filter.filterId === filterId) {
            return { ...filter, ...updates } as ExtendedColumnFilter<TData>;
          }
          return filter;
        });
        return updatedFilters;
      });
    },
    [debouncedSetFilters],
  );

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = localFilters.filter((filter) => filter.filterId !== filterId);
      void setLocalFilters(updatedFilters);
      if (updatedFilters.length === 0) {
        void setFilters(null);
      }

      requestAnimationFrame(() => {
        addButtonRef.current?.focus();
      });
    },
    [localFilters, setLocalFilters],
  );

  const onFiltersReset = React.useCallback(() => {
    void setFilters(null);
    void setJoinOperator('and');
    void setLocalFilters([]);
  }, [setFilters, setJoinOperator, setLocalFilters]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === OPEN_MENU_SHORTCUT && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === OPEN_MENU_SHORTCUT && event.shiftKey && localFilters.length > 0) {
        event.preventDefault();
        onFilterRemove(localFilters[localFilters.length - 1]?.filterId ?? '');
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [localFilters, onFilterRemove]);

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (REMOVE_FILTER_SHORTCUTS.includes(event.key) && localFilters.length > 0) {
        event.preventDefault();
        onFilterRemove(localFilters[localFilters.length - 1]?.filterId ?? '');
      }
    },
    [localFilters, onFilterRemove],
  );

  return (
    <Sortable
      value={localFilters}
      onValueChange={setLocalFilters}
      getItemValue={(item) => item.filterId}
    >
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
            onKeyDown={onTriggerKeyDown}
          >
            <ListFilter className="size-4" />
            {/* Filtros */}
            {localFilters.length > 0 && (
              <Badge
                variant={filters.length > 0 ? 'default' : 'secondary'}
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono text-[10.4px] font-normal"
              >
                {localFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-describedby={descriptionId}
          aria-labelledby={labelId}
          className="dark:bg-backgroundDark flex w-full max-w-[88vw] origin-[var(--radix-popover-content-transform-origin)] flex-col gap-3.5 overflow-hidden p-4 sm:min-w-[380px]"
        >
          <div className="flex flex-col gap-1">
            <h4 id={labelId} className="font-medium leading-none">
              {localFilters.length > 0 ? `Filtros` : `No hay filtros aplicados`}
            </h4>
            <p
              id={descriptionId}
              className={cn('text-muted-foreground text-sm', localFilters.length > 0 && 'sr-only')}
            >
              {localFilters.length > 0
                ? `Modifica los filtros para refinar tu búsqueda.`
                : `Agrega filtros para refinar tu busqueda.`}
            </p>
          </div>
          {localFilters.length > 0 ? (
            <SortableContent asChild>
              <div role="list" className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
                {localFilters.map((filter, index) => (
                  <DataTableFilterItem<TData>
                    key={filter.filterId}
                    filter={filter}
                    index={index}
                    filterItemId={`${id}-filter-${filter.filterId}`}
                    joinOperator={joinOperator}
                    setJoinOperator={setJoinOperator}
                    columns={columns}
                    onFilterUpdate={onFilterUpdate}
                    onFilterRemove={onFilterRemove}
                  />
                ))}
              </div>
            </SortableContent>
          ) : null}
          <div className="flex w-full items-center gap-2">
            <Button
              size="sm"
              className="rounded"
              // disabled={filters.length >= 1}
              ref={addButtonRef}
              onClick={onFilterAdd}
              disabled={loading}
            >
              {isMobile ? 'Agregar' : 'Agregar filtro'}
            </Button>
            {localFilters.length > 0 ? (
              <Button
                disabled={loading}
                variant="outline"
                size="sm"
                className="rounded"
                onClick={onFiltersReset}
              >
                {isMobile ? 'Limpiar' : 'Limpiar filtros'}
              </Button>
            ) : null}
            {localFilters.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded"
                loading={loading}
                disabled={loading}
                onClick={() => {
                  void setFilters(localFilters);
                  void setPage(1);
                }}
              >
                {isMobile ? 'Aplicar' : 'Aplicar filtros'}
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 h-8 min-w-[72px] rounded-sm" />
          <div className="bg-primary/10 h-8 w-32 rounded-sm" />
          <div className="bg-primary/10 h-8 w-32 rounded-sm" />
          <div className="bg-primary/10 h-8 min-w-36 flex-1 rounded-sm" />
          <div className="bg-primary/10 size-4 shrink-0 rounded-sm" />
          <div className="bg-primary/10 size-4 shrink-0 rounded-sm" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}

interface DataTableFilterItemProps<TData> {
  filter: ExtendedColumnFilter<TData>;
  index: number;
  filterItemId: string;
  joinOperator: JoinOperator;
  setJoinOperator: (value: JoinOperator) => void;
  columns: Column<TData>[];
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, 'filterId'>>,
  ) => void;
  onFilterRemove: (filterId: string) => void;
}

function DataTableFilterItem<TData>({
  filter,
  index,
  filterItemId,
  joinOperator,
  setJoinOperator,
  columns,
  onFilterUpdate,
  onFilterRemove,
}: DataTableFilterItemProps<TData>) {
  const [showFieldSelector, setShowFieldSelector] = React.useState(false);
  const [showOperatorSelector, setShowOperatorSelector] = React.useState(false);
  const [showValueSelector, setShowValueSelector] = React.useState(false);

  const onItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showFieldSelector || showOperatorSelector || showValueSelector) {
        return;
      }

      // if (REMOVE_FILTER_SHORTCUTS.includes(event.key)) {
      //   event.preventDefault();
      //   (onFilterRemovefilter.filterId);
      // }
    },
    [filter.filterId, showFieldSelector, showOperatorSelector, showValueSelector, onFilterRemove],
  );

  const column = columns.find((column) => column.id === filter.id);
  const joinOperatorListboxId = `${filterItemId}-join-operator-listbox`;
  const fieldListboxId = `${filterItemId}-field-listbox`;
  const operatorListboxId = `${filterItemId}-operator-listbox`;
  const inputId = `${filterItemId}-input`;
  const filterOperators = getFilterOperators(filter.variant);

  if (!column) return null;

  const columnMeta = column.columnDef.meta;

  return (
    <SortableItem value={filter.filterId} asChild>
      <div
        role="listitem"
        id={filterItemId}
        tabIndex={-1}
        className="flex items-center gap-2"
        onKeyDown={onItemKeyDown}
      >
        <div className="min-w-[72px] text-center">
          {index === 0 ? (
            <div className="border-muted-foreground/30 h-full w-full min-w-[72px] rounded-sm border py-1">
              <span className="text-muted-foreground text-sm">Dónde</span>
            </div>
          ) : index === 1 ? (
            <Select
              value={joinOperator}
              onValueChange={(value: JoinOperator) => setJoinOperator(value)}
            >
              <SelectTrigger
                aria-label="Select join operator"
                aria-controls={joinOperatorListboxId}
                className="h-8 rounded lowercase [&[data-size]]:h-8"
              >
                <SelectValue placeholder={joinOperator} />
              </SelectTrigger>
              <SelectContent
                id={joinOperatorListboxId}
                position="popper"
                className="min-w-(--radix-select-trigger-width) lowercase"
              >
                {dataTableConfig.joinOperators.map((joinOperator) => (
                  <SelectItem key={joinOperator} value={joinOperator}>
                    {joinOperator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-sm">{joinOperator === 'and'}</span>
          )}
        </div>
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              role="combobox"
              aria-controls={fieldListboxId}
              variant="outline"
              size="sm"
              className="w-32 justify-between rounded font-normal"
            >
              <span className="truncate">
                {columns.find((column) => column.id === filter.id)?.id ?? 'Select field'}
              </span>
              <ChevronsUpDown size={16} className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={fieldListboxId}
            align="start"
            className="w-40 origin-[var(--radix-popover-content-transform-origin)] p-0"
          >
            <Command>
              <CommandInput placeholder="Buscar campos..." />
              <CommandList>
                <CommandEmpty>No se encontraron campos.</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      disabled={false}
                      onSelect={() => {
                        onFilterUpdate(filter.filterId, {
                          id: column.id as Extract<keyof TData, string>,
                          variant: column.columnDef.meta?.variant ?? 'text',
                          operator: getDefaultFilterOperator(
                            column.columnDef.meta?.variant ?? 'text',
                          ),
                          value: '',
                        });

                        setShowFieldSelector(false);
                      }}
                    >
                      <span className="truncate">{column.id}</span>
                      <Check
                        size={16}
                        className={cn(
                          'ml-auto',
                          column.id === filter.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          open={showOperatorSelector}
          onOpenChange={setShowOperatorSelector}
          value={filter.operator}
          onValueChange={(value: FilterOperator) =>
            onFilterUpdate(filter.filterId, {
              operator: value,
              value: filter.value,
            })
          }
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            className="h-8 w-32 rounded lowercase [&[data-size]]:h-8"
          >
            <div className="truncate">
              <SelectValue placeholder={filter.operator} />
            </div>
          </SelectTrigger>
          <SelectContent
            id={operatorListboxId}
            className="origin-[var(--radix-select-content-transform-origin)]"
          >
            {filterOperators.map((operator) => (
              <SelectItem key={operator.value} value={operator.value} className="lowercase">
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="min-w-36 flex-1">
          {onFilterInputRender({
            filter,
            inputId,
            column,
            columnMeta,
            onFilterUpdate,
            showValueSelector,
            setShowValueSelector,
          })}
        </div>
        <Button
          aria-controls={filterItemId}
          variant="outline"
          size="icon"
          className="size-8 min-w-8 rounded"
          onClick={() => onFilterRemove(filter.filterId)}
        >
          <Trash2 className="size-5" />
        </Button>
        <SortableItemHandle asChild>
          <Button variant="ghost" size="icon" className="size-8 min-w-8 rounded">
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </div>
    </SortableItem>
  );
}

function onFilterInputRender<TData>({
  filter,
  inputId,
  column,
  columnMeta,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: {
  filter: ExtendedColumnFilter<TData>;
  inputId: string;
  column: Column<TData>;
  columnMeta?: ColumnMeta<TData, unknown>;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, 'filterId'>>,
  ) => void;
  showValueSelector: boolean;
  setShowValueSelector: (value: boolean) => void;
}) {
  if (filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty') {
    return (
      <div
        id={inputId}
        role="status"
        aria-label={`${columnMeta?.label} filter is ${
          filter.operator === 'isEmpty' ? 'empty' : 'not empty'
        }`}
        aria-live="polite"
        className="dark:bg-input/30 h-8 w-full rounded border bg-transparent"
      />
    );
  }

  switch (filter.variant) {
    case 'text':
    case 'number':
    case 'range': {
      if (
        (filter.variant === 'range' && filter.operator === 'isBetween') ||
        filter.operator === 'isBetween'
      ) {
        return (
          <DataTableRangeFilter
            filter={filter}
            column={column}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
          />
        );
      }

      const isNumber = filter.variant === 'number' || filter.variant === 'range';

      return (
        <Input
          id={inputId}
          type={isNumber ? 'number' : filter.variant}
          aria-label={`${columnMeta?.label} filter value`}
          aria-describedby={`${inputId}-description`}
          inputMode={isNumber ? 'numeric' : undefined}
          placeholder={columnMeta?.placeholder ?? 'Escribe un valor...'}
          className="h-8 w-full rounded"
          defaultValue={typeof filter.value === 'string' ? filter.value : undefined}
          onChange={(event) =>
            onFilterUpdate(filter.filterId, {
              value: event.target.value,
            })
          }
        />
      );
    }

    case 'boolean': {
      if (Array.isArray(filter.value)) return null;

      const inputListboxId = `${inputId}-listbox`;

      return (
        <Select
          open={showValueSelector}
          onOpenChange={setShowValueSelector}
          value={filter.value}
          onValueChange={(value) =>
            onFilterUpdate(filter.filterId, {
              value,
            })
          }
        >
          <SelectTrigger
            id={inputId}
            aria-controls={inputListboxId}
            aria-label={`${columnMeta?.label} boolean filter`}
            className="h-8 w-full rounded [&[data-size]]:h-8"
          >
            <SelectValue placeholder={filter.value ? 'True' : 'Select a value'} />
          </SelectTrigger>
          <SelectContent id={inputListboxId}>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    case 'select':
    case 'multiSelect': {
      const inputListboxId = `${inputId}-listbox`;

      const multiple = filter.variant === 'multiSelect';
      const selectedValues = multiple
        ? Array.isArray(filter.value)
          ? filter.value
          : []
        : typeof filter.value === 'string'
          ? filter.value
          : undefined;

      return (
        <Faceted
          open={showValueSelector}
          onOpenChange={setShowValueSelector}
          value={selectedValues}
          onValueChange={(value) => {
            onFilterUpdate(filter.filterId, {
              value,
            });
          }}
          multiple={multiple}
        >
          <FacetedTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              aria-label={`${columnMeta?.label} filtrar valor${multiple ? 'es' : ''}`}
              variant="outline"
              size="sm"
              className="w-full rounded font-normal"
              disabled={false}
            >
              <FacetedBadgeList
                options={columnMeta?.options}
                placeholder={
                  columnMeta?.placeholder ?? `Seleccionar opci${multiple ? 'ones' : 'ón'}...`
                }
              />
            </Button>
          </FacetedTrigger>
          <FacetedContent
            id={inputListboxId}
            className="w-[250px] origin-[var(--radix-popover-content-transform-origin)]"
          >
            <FacetedInput
              aria-label={`Buscar ${columnMeta?.label} opciones`}
              placeholder={columnMeta?.placeholder ?? 'Buscar opciones...'}
            />
            <FacetedList>
              <FacetedEmpty>No options found.</FacetedEmpty>
              <FacetedGroup>
                {columnMeta?.options?.map((option) => (
                  <FacetedItem key={option.value} value={option.value}>
                    {option.icon && <option.icon className="size-5" />}
                    <span>{option.label}</span>
                    {option.count && (
                      <span className="ml-auto font-mono text-xs">{option.count}</span>
                    )}
                  </FacetedItem>
                ))}
              </FacetedGroup>
            </FacetedList>
          </FacetedContent>
        </Faceted>
      );
    }

    case 'date':
    case 'dateRange': {
      const inputListboxId = `${inputId}-listbox`;

      const dateValue = Array.isArray(filter.value)
        ? filter.value.filter(Boolean)
        : [filter.value, filter.value].filter(Boolean);

      const displayValue =
        filter.operator === 'isBetween' && dateValue.length === 2
          ? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(
              new Date(Number(dateValue[1])),
            )}`
          : dateValue[0]
            ? formatDate(new Date(Number(dateValue[0])))
            : 'Pick a date';

      return (
        <Popover open={showValueSelector} onOpenChange={setShowValueSelector}>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              aria-controls={inputListboxId}
              aria-label={`${columnMeta?.label} date filter`}
              variant="outline"
              size="sm"
              className={cn(
                'w-full justify-start rounded text-left font-normal',
                !filter.value && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="size-5" />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={inputListboxId}
            align="start"
            className="w-auto origin-[var(--radix-popover-content-transform-origin)] p-0"
          >
            {filter.operator === 'isBetween' ? (
              <Calendar
                aria-label={`Select ${columnMeta?.label} date range`}
                mode="range"
                initialFocus
                captionLayout={'dropdown'}
                numberOfMonths={2}
                selected={
                  dateValue.length === 2
                    ? {
                        from: new Date(Number(dateValue[0])),
                        to: new Date(Number(dateValue[1])),
                      }
                    : {
                        from: new Date(),
                        to: new Date(),
                      }
                }
                onSelect={(date) => {
                  onFilterUpdate(filter.filterId, {
                    value: date
                      ? [
                          (date.from?.getTime() ?? '').toString(),
                          (date.to?.getTime() ?? '').toString(),
                        ]
                      : [],
                  });
                }}
              />
            ) : (
              <>
                <Calendar
                  aria-label={`Select ${columnMeta?.label} date`}
                  mode="single"
                  initialFocus
                  captionLayout={'dropdown'}
                  selected={dateValue[0] ? new Date(Number(dateValue[0])) : undefined}
                  onSelect={(date) => {
                    onFilterUpdate(filter.filterId, {
                      value: (date?.getTime() ?? '').toString(),
                    });
                  }}
                />
                {/* <div className="flex flex-col gap-4">
                  <Calendar
                    mode="single"
                    defaultMonth={date}
                    selected={date}
                    onSelect={setDate}
                    captionLayout={dropdown}
                    className="rounded-lg border shadow-sm"
                  />
                </div> */}
              </>
            )}
          </PopoverContent>
        </Popover>
      );
    }

    default:
      return null;
  }
}
