import { readFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, 'public', 'data');
const PAYLOADS = ['index', 'detail', 'funding', 'meta', 'calendar'] as const;

/**
 * The single-file build runs from a file:// URL, where `fetch` of a sibling JSON file is blocked
 * by the browser's origin rules. So the four payloads are inlined into the document and
 * src/data/load.ts reads them from `window.__DOOR3_DATA__` instead.
 */
function inlineData(): Plugin {
  return {
    name: 'door3-inline-data',
    apply: 'build',
    transformIndexHtml() {
      const data: Record<string, unknown> = {};
      for (const name of PAYLOADS) {
        const file = join(DATA, `${name}.json`);
        if (!existsSync(file)) {
          throw new Error(`missing public/data/${name}.json — run "npm run data" first`);
        }
        data[name] = JSON.parse(readFileSync(file, 'utf8'));
      }
      // `<` is escaped so the payload can never terminate the script element early.
      const json = JSON.stringify(data).replace(/</g, '\\u003c');
      return [
        {
          tag: 'script',
          attrs: { id: 'door3-data' },
          children: `window.__DOOR3_DATA__=${json};`,
          injectTo: 'head-prepend' as const,
        },
      ];
    },
  };
}

/**
 * programmes.json lives in public/ because it is the seam the research pipeline writes to, but
 * it is only ever an input: the app fetches index.json and detail.json. Shipping it would put
 * 1.7 MB of duplicate JSON in every deploy.
 */
function prunePublicSource(outDir: string): Plugin {
  return {
    name: 'door3-prune-public-source',
    apply: 'build',
    closeBundle() {
      const file = join(ROOT, outDir, 'data', 'programmes.json');
      if (existsSync(file)) rmSync(file);
    },
  };
}

/**
 * The single-file build inlines the four faces as data: URIs, which means the preload link in
 * index.html is rewritten to point at a data: URI too — a second copy of the 31 KB body face,
 * base64'd, preloading something that is already in the document. Strip it. In the hosted build
 * the same link is a real preload of a real file and stays exactly as it is.
 */
function dropInlinedPreload(): Plugin {
  return {
    name: 'door3-drop-inlined-preload',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/<link rel="preload"[^>]*href="data:[^"]*"[^>]*>/g, '');
    },
  };
}

/** vite-plugin-singlefile emits index.html; the offline artefact is named door3.html. */
function renameSingleOutput(outDir: string): Plugin {
  return {
    name: 'door3-rename-single-output',
    apply: 'build',
    closeBundle() {
      const from = join(ROOT, outDir, 'index.html');
      if (existsSync(from)) renameSync(from, join(ROOT, outDir, 'door3.html'));
    },
  };
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    // Hosted under <user>.github.io/master/; the single file uses relative paths so it works from
    // a USB stick. Routing is hash-based in both, so neither needs a server rewrite.
    base: single ? './' : '/master/',
    plugins: single
      ? [preact(), inlineData(), viteSingleFile(), dropInlinedPreload(), renameSingleOutput('dist-single')]
      : [preact(), prunePublicSource('dist')],
    // In single mode the payloads are inlined, so copying public/data/ next to the file would
    // ship 2 MB of JSON nobody reads.
    publicDir: single ? false : 'public',
    // zustand ships a React entry point; preact/compat satisfies it at 3 KB. Declared here
    // rather than left to the preset so the same alias applies under Vitest.
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: single ? 8192 : 500,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      // zustand is externalised by default, which would bypass the react → preact/compat
      // alias above and fail to resolve. Inlining it puts it back through Vite's resolver.
      server: { deps: { inline: ['zustand'] } },
    },
  };
});
