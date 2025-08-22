import { addDays, endOfDay, startOfDay } from 'date-fns';

export type FilterStructure = {
  id: never;
  value: string | string[];
  variant:
    | 'number'
    | 'boolean'
    | 'date'
    | 'text'
    | 'range'
    | 'dateRange'
    | 'select'
    | 'multiSelect';
  operator:
    | 'eq'
    | 'gt'
    | 'gte'
    | 'iLike'
    | 'inArray'
    | 'isBetween'
    | 'isEmpty'
    | 'isNotEmpty'
    | 'isRelativeToToday'
    | 'lt'
    | 'lte'
    | 'ne'
    | 'notILike'
    | 'notInArray';
  filterId: string;
};

type JoinOperator = 'and' | 'or';

export function filterColumns({
  filters,
  joinOperator,
}: {
  filters: FilterStructure[];
  joinOperator: JoinOperator;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];
  filters.forEach((filter) => {
    const fieldName = filter.id as string;

    switch (filter.operator) {
      case 'iLike':
        if (filter.variant === 'text' && typeof filter.value === 'string') {
          conditions.push({
            [fieldName]: {
              contains: filter.value,
              mode: 'insensitive',
            },
          });
        }
        break;

      case 'notILike':
        if (filter.variant === 'text' && typeof filter.value === 'string') {
          conditions.push({
            NOT: {
              [fieldName]: {
                contains: filter.value,
                mode: 'insensitive',
              },
            },
          });
        }
        break;

      case 'eq':
        if (filter.variant === 'boolean' && filter.value === 'true') {
          conditions.push({ [fieldName]: true });
        } else if (filter.variant === 'number') {
          conditions.push({ [fieldName]: Number(filter.value) });
        } else if (filter.variant === 'boolean' && filter.value === 'false') {
          conditions.push({ [fieldName]: false });
        } else if (filter.variant === 'date' || filter.variant === 'dateRange') {
          const date = new Date(Number(filter.value));
          const startOfDayDate = new Date(date);
          startOfDayDate.setHours(0, 0, 0, 0);
          const endOfDayDate = new Date(date);
          endOfDayDate.setHours(23, 59, 59, 999);
          conditions.push({
            [fieldName]: {
              gte: startOfDayDate,
              lte: endOfDayDate,
            },
          });
        } else {
          conditions.push({ [fieldName]: filter.value });
        }
        break;

      case 'ne':
        if (filter.variant === 'boolean' && typeof filter.value === 'string') {
          conditions.push({ [fieldName]: { not: true } });
        } else if (filter.variant === 'boolean' && filter.value === 'false') {
          conditions.push({ [fieldName]: { not: false } });
        } else if (filter.variant === 'date' || filter.variant === 'dateRange') {
          const date = new Date(Number(filter.value));
          const startOfDayDate = new Date(date);
          startOfDayDate.setHours(0, 0, 0, 0);
          const endOfDayDate = new Date(date);
          endOfDayDate.setHours(23, 59, 59, 999);
          conditions.push({
            OR: [{ [fieldName]: { lt: startOfDayDate } }, { [fieldName]: { gt: endOfDayDate } }],
          });
        } else {
          conditions.push({ [fieldName]: { not: filter.value } });
        }
        break;

      case 'inArray':
        if (Array.isArray(filter.value)) {
          conditions.push({ [fieldName]: { in: filter.value } });
        }
        break;

      case 'notInArray':
        if (Array.isArray(filter.value)) {
          conditions.push({ [fieldName]: { notIn: filter.value } });
        }
        break;

      case 'lt':
        if (filter.variant === 'number' || filter.variant === 'range') {
          conditions.push({ [fieldName]: { lt: Number(filter.value) } });
        } else if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          typeof filter.value === 'string'
        ) {
          const date = new Date(Number(filter.value));
          date.setHours(23, 59, 59, 999);
          conditions.push({ [fieldName]: { lt: date } });
        }
        break;

      case 'lte':
        if (filter.variant === 'number' || filter.variant === 'range') {
          conditions.push({ [fieldName]: { lte: Number(filter.value) } });
        } else if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          typeof filter.value === 'string'
        ) {
          const date = new Date(Number(filter.value));
          date.setHours(23, 59, 59, 999);
          conditions.push({ [fieldName]: { lte: date } });
        }
        break;

      case 'gt':
        if (filter.variant === 'number' || filter.variant === 'range') {
          conditions.push({ [fieldName]: { gt: Number(filter.value) } });
        } else if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          typeof filter.value === 'string'
        ) {
          const date = new Date(Number(filter.value));
          date.setHours(0, 0, 0, 0);
          conditions.push({ [fieldName]: { gt: date } });
        }
        break;

      case 'gte':
        if (filter.variant === 'number' || filter.variant === 'range') {
          conditions.push({ [fieldName]: { gte: Number(filter.value) } });
        } else if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          typeof filter.value === 'string'
        ) {
          const date = new Date(Number(filter.value));
          date.setHours(0, 0, 0, 0);
          conditions.push({ [fieldName]: { gte: date } });
        }
        break;

      case 'isBetween':
        if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const whereClause: any = {};
          if (filter.value[0]) {
            const startDate = new Date(Number(filter.value[0]));
            startDate.setHours(0, 0, 0, 0);
            whereClause.gte = startDate;
          }
          if (filter.value[1]) {
            const endDate = new Date(Number(filter.value[1]));
            endDate.setHours(23, 59, 59, 999);
            whereClause.lte = endDate;
          }
          if (Object.keys(whereClause).length > 0) {
            conditions.push({ [fieldName]: whereClause });
          }
        } else if (
          (filter.variant === 'number' || filter.variant === 'range') &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          const firstValue =
            filter.value[0] && filter.value[0].trim() !== '' ? Number(filter.value[0]) : null;
          const secondValue =
            filter.value[1] && filter.value[1].trim() !== '' ? Number(filter.value[1]) : null;

          if (firstValue !== null || secondValue !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const whereClause: any = {};
            if (firstValue !== null) whereClause.gte = firstValue;
            if (secondValue !== null) whereClause.lte = secondValue;
            conditions.push({ [fieldName]: whereClause });
          }
        }
        break;

      case 'isRelativeToToday':
        if (
          (filter.variant === 'date' || filter.variant === 'dateRange') &&
          typeof filter.value === 'string'
        ) {
          const today = new Date();
          const [amount, unit] = filter.value.split(' ') ?? [];
          let startDate: Date;
          let endDate: Date;

          if (!amount || !unit) break;

          switch (unit) {
            case 'days':
              startDate = startOfDay(addDays(today, Number.parseInt(amount)));
              endDate = endOfDay(startDate);
              break;
            case 'weeks':
              startDate = startOfDay(addDays(today, Number.parseInt(amount) * 7));
              endDate = endOfDay(addDays(startDate, 6));
              break;
            case 'months':
              startDate = startOfDay(addDays(today, Number.parseInt(amount) * 30));
              endDate = endOfDay(addDays(startDate, 29));
              break;
            default:
              break;
          }

          if (startDate! && endDate!) {
            conditions.push({
              [fieldName]: {
                gte: startDate,
                lte: endDate,
              },
            });
          }
        }
        break;

      case 'isEmpty':
        if (filter.variant === 'text') {
          conditions.push({ OR: [{ [fieldName]: '' }, { [fieldName]: null }] });
        } else {
          conditions.push({ [fieldName]: { equals: null } });
        }
        break;

      case 'isNotEmpty':
        if (fieldName) {
          conditions.push({ [fieldName]: { not: { equals: null } } });
        }

        break;

      default:
        throw new Error(`Unsupported operator: ${filter.operator}`);
    }
  });

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];

  return joinOperator === 'and' ? { AND: conditions } : { OR: conditions };
}
