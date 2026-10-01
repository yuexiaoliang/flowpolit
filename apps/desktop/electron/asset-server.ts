import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createAssetHandler(clientRoot: string): (request: Request) => Promise<Response> {
  const root = path.resolve(clientRoot);
  return async function serve(request) {
    const url = new URL(request.url);
    if (url.host !== 'app') return new Response('Not found', { status: 404 });

    let pathname: string;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { return new Response('Bad path', { status: 400 }); }

    const target = path.resolve(root, `.${pathname}`);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      return new Response('Not found', { status: 404 });
    }

    let file = target;
    try {
      if (!(await stat(file)).isFile()) file = path.join(root, 'index.html');
    } catch {
      if (path.extname(pathname)) return new Response('Not found', { status: 404 });
      file = path.join(root, 'index.html');
    }

    try {
      return new Response(await readFile(file), {
        headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  };
}
