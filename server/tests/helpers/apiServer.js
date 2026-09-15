import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function startApiServer() {
  const directory = mkdtempSync(path.join(tmpdir(), 'pos-api-'));
  const originalSqlitePath = process.env.SQLITE_PATH;
  const databasePath = path.join(directory, 'portfolio.sqlite');

  process.env.SQLITE_PATH = databasePath;

  try {
    const { createApp } = await import(`../../app.js?test=${randomUUID()}`);
    const { default: db } = await import('../../config/db.js');
    const listener = createApp().listen(0);

    await new Promise((resolve, reject) => {
      listener.once('listening', resolve);
      listener.once('error', reject);
    });

    const { port } = listener.address();

    return {
      url: `http://127.0.0.1:${port}`,
      close: async () => {
        await new Promise((resolve) => listener.close(resolve));
        db.close();
        if (originalSqlitePath === undefined) delete process.env.SQLITE_PATH;
        else process.env.SQLITE_PATH = originalSqlitePath;
        rmSync(directory, { recursive: true, force: true });
      }
    };
  } catch (error) {
    if (originalSqlitePath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = originalSqlitePath;
    rmSync(directory, { recursive: true, force: true });
    return { startupError: error };
  }
}
