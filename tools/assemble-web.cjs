const { cpSync, mkdirSync, rmSync } = require('node:fs');
const { resolve } = require('node:path');

// Independently built apps share the existing URLs on the Vercel deployment.
const output = resolve(__dirname, '../dist/site');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(__dirname, '../dist/studio/browser'), output, { recursive: true });
cpSync(resolve(__dirname, '../dist/growing-human/browser'), resolve(output, 'growing-human'), { recursive: true });
