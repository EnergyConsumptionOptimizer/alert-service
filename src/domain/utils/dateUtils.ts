const ISO_8601_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const parseISO8601DateTime = (value: string): Date => {
  if (!ISO_8601_DATETIME.test(value)) {
    throw new Error(`Invalid ISO-8601 DateTime format: ${value}`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO-8601 DateTime value: ${value}`);
  }

  return date;
};
