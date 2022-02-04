import { fakeXhr, FakeXMLHttpRequest } from "nise";
import { createHash } from 'crypto';
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';

type Config = {
  snapshotDir: string;
  updateSnapshot?: boolean;
  responseDelay?: number;
  onResponseFromServer?: (xhr: FakeXMLHttpRequest, responseData: ResponseData) => void,
  onResponseFromCache?: (xhr: FakeXMLHttpRequest, responseData: ResponseData) => void;
  createCacheKey?: (xhr: FakeXMLHttpRequest) => string;
};

type ResponseData = {
  status: number;
  headers: Record<string, string>;
  body: string
};

/**
 * Configure xhr-snapshot.
 */
export const configure = (config: Config) => {
  fakeXhr.useFakeXMLHttpRequest().onCreate = (xhr) => {
    // @ts-expect-error: The FakeXMLHttpRequest implicit extends XMLHttpRequest.
    const send = xhr.send;
    // @ts-expect-error: The FakeXMLHttpRequest implicit extends XMLHttpRequest.
    xhr.send = (...args: unknown[]) => {
      setTimeout(async () => {
        const { status, headers, body } = await fetchWithCache(xhr, config);
        xhr.respond(status, headers, body);
      }, config.responseDelay ?? 10);
      return send.call(xhr, ...args);
    };
  };
};

/**
 * fetch with the cache checking.
 */
const fetchWithCache = async (xhr: FakeXMLHttpRequest, config: Config): Promise<ResponseData> => {
  const cacheKey = (config.createCacheKey ?? createCacheKeyDefault)(xhr);
  if (existsSync(resolve(config.snapshotDir, `${cacheKey}.json`)) && !config.updateSnapshot) {
    const responseData = JSON.parse(readFileSync(resolve(config.snapshotDir, `${cacheKey}.json`)).toString('utf-8')) as ResponseData;
    config.onResponseFromCache?.(xhr, responseData);
    return responseData;
  }
  const response = await fetch(xhr.url, {
    method: xhr.method,
    headers: xhr.requestHeaders,
    body: xhr.requestBody,
  });
  const responseData = {
    status: response.status,
    headers: response.headers.raw() as unknown as Record<string, string>,
    body: await response.text()
  };
  config.onResponseFromServer?.(xhr, responseData);
  mkdirSync(config.snapshotDir, { recursive: true });
  writeFileSync(resolve(config.snapshotDir, `${cacheKey}.json`), JSON.stringify(responseData, undefined, 2));
  return responseData;
};

/**
 * The default implementation of config.createCacheKey.
 */
const createCacheKeyDefault = (xhr: FakeXMLHttpRequest) => {
  const url = new URL(xhr.url);
  return createHash('md5').update(JSON.stringify([
    xhr.method,
    xhr.requestBody,
    xhr.requestHeaders,
    url.origin,
    url.pathname,
    url.searchParams.entries()
  ]), 'binary').digest('hex');
};

