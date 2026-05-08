type ErrorWithDetails = Error & { details?: unknown[] };

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error') {
  return error instanceof Error ? error.message : fallback;
}

export function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) return [];

  const details = (error as ErrorWithDetails).details;
  if (!Array.isArray(details)) return [];

  return details
    .map((detail) => String(detail))
    .filter(Boolean);
}

export function notifyErrorPayload(error: unknown, fallback = 'Ocurrió un error') {
  const message = getErrorMessage(error, fallback);
  const details = getErrorDetails(error);
  return {
    message,
    details: details.length > 0 ? details : undefined,
  };
}
