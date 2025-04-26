// src/globals.d.ts

import type { DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';

declare global {
  interface Window {
    // Define the expected structure under window.midnight
    midnight?: {
      // Allow any string key (like 'mnLace') to hold a DAppConnectorAPI object
      [key: string]: DAppConnectorAPI | undefined;
    };
  }
}

// Export {}; // Needed if file doesn't import/export anything else, makes it a module