/**
 * Build ID Manager
 * Automatically increments and manages build IDs for distribution packages
 * Stores metadata in .build-metadata.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_METADATA_FILE = path.join(__dirname, '..', '.build-metadata.json');

interface BuildMetadata {
  buildId: number;
  lastBuildDate: string;
  version: string;
  artifacts: {
    web?: string;
    windows?: string[];
    docker?: string[];
  };
}

const DEFAULT_METADATA: BuildMetadata = {
  buildId: 1000,
  lastBuildDate: new Date().toISOString(),
  version: '1.0.0',
  artifacts: {},
};

export function getBuildMetadata(): BuildMetadata {
  try {
    if (fs.existsSync(BUILD_METADATA_FILE)) {
      const data = fs.readFileSync(BUILD_METADATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not read build metadata, using defaults:', error);
  }
  return DEFAULT_METADATA;
}

export function getNextBuildId(): number {
  const metadata = getBuildMetadata();
  return metadata.buildId + 1;
}

export function incrementBuildId(artifacts?: Record<string, unknown>): number {
  const metadata = getBuildMetadata();
  const newBuildId = metadata.buildId + 1;

  const updatedMetadata: BuildMetadata = {
    buildId: newBuildId,
    lastBuildDate: new Date().toISOString(),
    version: metadata.version,
    artifacts: artifacts || metadata.artifacts,
  };

  fs.writeFileSync(BUILD_METADATA_FILE, JSON.stringify(updatedMetadata, null, 2));
  console.log(`✓ Build ID incremented: ${metadata.buildId} → ${newBuildId}`);

  return newBuildId;
}

export function getCurrentBuildId(): number {
  return getBuildMetadata().buildId;
}

export function getVersionWithBuildId(): string {
  const metadata = getBuildMetadata();
  return `${metadata.version}+build.${metadata.buildId}`;
}
