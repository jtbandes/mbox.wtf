import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";
import * as cheerio from "cheerio";

const CLOUDFLARE_HEADERS_FILE_NAME = "_headers";

/**
 * Generate `_headers` file with CSP directive based on hashes of script and style elements.
 * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#hash-algorithm-base64-value
 *
 * Also serve these headers in the preview server.
 *
 * Inspired by: https://github.com/RockiRider/csp
 */
function generateHeadersPlugin(): Plugin {
  const algorithm = "sha256";
  const scriptSrcElemHashes: string[] = [];
  const styleSrcElemHashes: string[] = [];

  return {
    name: "mbox-wtf-csp-plugin",

    generateBundle: {
      order: "post",
      handler(_options, bundle, _isWrite) {
        const indexHtml = bundle["index.html"];
        if (indexHtml.type !== "asset" || typeof indexHtml.source !== "string") {
          throw new Error("Unexpected index.html asset");
        }
        const $ = cheerio.load(indexHtml.source);
        $("script").each((_i, el) => {
          const content = $(el).text();
          if (content.length > 0) {
            scriptSrcElemHashes.push(`${algorithm}-${crypto.hash(algorithm, content, "base64")}`);
          }
        });
        $("style").each((_i, el) => {
          const content = $(el).text();
          if (content.length > 0) {
            styleSrcElemHashes.push(`${algorithm}-${crypto.hash(algorithm, content, "base64")}`);
          }
        });

        console.log("Found script-src-elem hashes:", scriptSrcElemHashes);
        console.log("Found style-src-elem hashes:", styleSrcElemHashes);

        const cspDirectives = [
          // sandbox seems to work in Chrome and Firefox, but not Safari
          // "sandbox allow-scripts",
          "default-src 'none'",
          `script-src-elem ${scriptSrcElemHashes.map((hash) => `'${hash}'`).join(" ")}`,
          `style-src-elem ${styleSrcElemHashes.map((hash) => `'${hash}'`).join(" ")}`,
          "worker-src blob:",
        ];

        bundle[CLOUDFLARE_HEADERS_FILE_NAME] = {
          type: "asset",
          fileName: CLOUDFLARE_HEADERS_FILE_NAME,
          name: CLOUDFLARE_HEADERS_FILE_NAME,
          originalFileName: null,
          needsCodeReference: false,
          source: `/*\n  Content-Security-Policy: ${cspDirectives.join("; ")};`,
        };
      },
    },

    // Read _headers file and set headers for preview server
    configurePreviewServer(server) {
      const headers = fs
        .readFileSync(
          path.join(server.config.root, server.config.build.outDir, CLOUDFLARE_HEADERS_FILE_NAME),
          "utf-8",
        )
        .split("\n");
      const firstLine = headers.shift();
      if (firstLine !== "/*") {
        throw new Error(`Unexpected _headers pattern: ${firstLine}`);
      }
      server.middlewares.use((_req, res, next) => {
        for (const line of headers) {
          if (!line.startsWith("  ")) {
            throw new Error("Expected indented header rule");
          }
          const [name, value] = line.split(": ", 2);
          res.setHeader(name.trim(), value);
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), viteSingleFile(), generateHeadersPlugin()],
});
