import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await mkdir('.test-build',{recursive:true});
for(const entry of ['hand-layout.test.ts','grouped-hand.test.tsx','bot-play.test.ts']){
 const outfile='.test-build/'+entry.replace(/\.tsx?$/,'.cjs');
 await build({entryPoints:['tests/'+entry],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile});
 const result=spawnSync(process.execPath,[outfile],{stdio:'inherit'});
 if(result.error)throw result.error;if(result.status)process.exit(result.status);
}
