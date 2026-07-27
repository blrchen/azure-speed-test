/**
 * Single-export adapter for the Azure Storage Blob SDK.
 *
 * The upload pages dynamically import this module instead of '@azure/storage-blob'
 * directly. Dynamically importing the package namespace forces the bundler to keep
 * every dynamic export alive, because it cannot know which ones the caller reads off
 * the namespace object. Naming the one export we need here lets esbuild tree-shake the
 * rest (~30 kB raw / ~5 kB Brotli off the SDK chunk).
 *
 * Keep this file to re-exports only - anything else added here lands in the SDK chunk.
 */
export { BlockBlobClient } from '@azure/storage-blob'
