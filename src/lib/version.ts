// src/lib/version.ts
// Source of truth is package.json version field.

import packageJson from '../../package.json';

export const APP_VERSION: string = packageJson.version;
