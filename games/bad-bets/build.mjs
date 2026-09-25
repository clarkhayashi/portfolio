import {cp,mkdir,rm} from 'node:fs/promises';
// Start from an empty dist so stale or sync-duplicated files never pile up.
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
