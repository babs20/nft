import os from 'os';
import { glob } from 'glob';
import { getPackageBase } from './get-package-base';
import { Job } from '../node-file-trace';
import path from 'path';

let sharedlibGlob = '';
switch (os.platform()) {
  case 'darwin':
    sharedlibGlob = '/**/*.@(dylib|so?(.*))';
    break;
  case 'win32':
    sharedlibGlob = '/**/*.dll';
    break;
  default:
    sharedlibGlob = '/**/*.so?(.*)';
}

// helper for emitting the associated shared libraries when a binary is emitted
export async function sharedLibEmit(filePath: string, job: Job) {
  const pkgPath = getPackageBase(filePath);
  if (!pkgPath) return;

  const normalizedPkgPath = pkgPath.split(path.sep).join('/');
  const normalizedSharedlibGlob = sharedlibGlob.startsWith('/')
    ? sharedlibGlob
    : '/' + sharedlibGlob;

  const globPattern = path.posix.join(
    normalizedPkgPath,
    normalizedSharedlibGlob,
  );
  const ignorePattern = path.posix.join(
    normalizedPkgPath,
    '**/node_modules/**/*',
  );

  try {
    const files = await glob(globPattern, {
      ignore: ignorePattern,
      dot: true,
      windowsPathsNoEscape: true,
    });

    await Promise.all(
      files.map((file) => job.emitFile(file, 'sharedlib', filePath)),
    );
  } catch (err) {
    console.error(
      `Error occurred while emitting shared libraries for ${filePath}:`,
      err,
    );
  }
}
