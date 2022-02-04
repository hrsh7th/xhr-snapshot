# xhr-snapshot

Create snapshot of XMLHttpRequest for testing.


### Usage

1. Setup [jest](https://jestjs.io)

```tsx
# jest.config.js

module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: '%YOUR SISE ORIGIN%'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
```

```tsx
# jest.setup.js

import 'whatwg-fetch';
import { resolve } from 'path';
import { configure } from 'xhr-snapshot';

configure({
  snapshotDir: resolve(__dirname, '__xhr_snapshots__'),
  updateSnapshot: process.argv.includes('--update-snapshot'),
})
```

2. Run your jest tests with actual fetch requests.

```tsx
import { normalize } from '../src/normalize';

describe('awesome tests', () => {

  it('should create the normalized state', () => {
      const response = await fetch('...').then(res => res.json());
      expect(normalize(response)).toMatchSnapshot();
  });

});
```

### How does it works?

In the current jsdom environment, all ajax requests is done via `XMLHttpRequest`.

So we can hijack it via replacing `window.XMLHttpRequest`.

The `XMLHttpRequest` hijacking is done via `nise` module provided by the SinonJS team.

The `fetch` isn't defined in current Node.js and jsdom environment so your `fetch` request will be passed for `XMLHttpRequest` via `whatwg-fetch`.

