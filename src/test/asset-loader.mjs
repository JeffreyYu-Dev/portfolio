// lets node tests load files the way vite does: the "#/" alias for src/, and images
import { register } from "node:module";

const src = new URL("../", import.meta.url).href;

register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith("#/")) {
          return next(${JSON.stringify(src)} + specifier.slice(2), context);
        }
        return next(specifier, context);
      }

      export async function load(url, context, next) {
        if (/\\.(png|jpe?g|svg|webp)$/.test(url)) {
          return { format: "module", shortCircuit: true, source: "export default " + JSON.stringify(url) };
        }
        return next(url, context);
      }
    `),
);
