import 'whatwg-fetch';

import { resolve } from 'path';
import { configure } from '.';
import { rmSync } from 'fs';

const SNAPSHOT_DIR = resolve(__dirname, '__xhr_snapshots__');

describe('xhr-snapshot', () => {
  beforeEach(() => {
    try {
      rmSync(SNAPSHOT_DIR, { recursive: true, force: true });
    } catch (e) {
    }
  });

  it('should fetch and cache', async () => {
    const event: string[] = [];
    configure({
      snapshotDir: SNAPSHOT_DIR,
      onResponseFromServer: (xhr) => {
        event.push('server');
        expect(xhr.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
      },
      onResponseFromCache: (xhr) => {
        event.push('cache');
        expect(xhr.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
      }
    });
    await fetch('https://jsonplaceholder.typicode.com/posts/1');
    await fetch('https://jsonplaceholder.typicode.com/posts/1');
    expect(event).toStrictEqual(['server', 'cache']);
  });

  it('shouldn\'t cache with config.updateSnapshot', async () => {
    const event: string[] = [];
    configure({
      snapshotDir: SNAPSHOT_DIR,
      updateSnapshot: true,
      onResponseFromServer: (xhr) => {
        event.push('server');
        expect(xhr.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
      },
      onResponseFromCache: (xhr) => {
        event.push('cache');
        expect(xhr.url).toBe('https://jsonplaceholder.typicode.com/posts/1');
      }
    });
    await fetch('https://jsonplaceholder.typicode.com/posts/1');
    await fetch('https://jsonplaceholder.typicode.com/posts/1');
    expect(event).toStrictEqual(['server', 'server']);
  });

});
