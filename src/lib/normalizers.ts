/**
 * Ensure API responses that are expected to be arrays are safely normalized.
 * Some endpoints can wrap arrays inside a `data` property or return null.
 */
export const ensureArrayResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const dataField = (payload as { data?: unknown }).data;
    if (Array.isArray(dataField)) {
      return dataField as T[];
    }
  }

  return [];
};


