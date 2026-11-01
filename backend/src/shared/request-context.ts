import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextStore = {
  correlationId: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore();
}

export function getCorrelationId(): string | undefined {
  const store = requestContext.getStore();
  return store?.correlationId;
}
