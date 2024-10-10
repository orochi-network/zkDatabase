import { Cache } from 'o1js';
import { join } from 'path';
import { getZkDbSmartContractClass } from '@contracts';
import { RollUpProgram } from '@proof';

export async function buildCircuitCache(
  merkleHeight: number,
  baseDestination: string
) {
  const rollUpProof = RollUpProgram(merkleHeight);
  const rollUpProgramPath = join(
    baseDestination,
    'rollup-zkprogram',
    merkleHeight.toString()
  );
  await rollUpProof.compile({
    cache: Cache.FileSystem(rollUpProgramPath),
    forceRecompile: true,
  });
  const zkDatabaseApp = getZkDbSmartContractClass(merkleHeight, rollUpProof);

  const zkdbAppPath = join(
    baseDestination,
    'user-database-zkapp',
    merkleHeight.toString()
  );
  await zkDatabaseApp.compile({
    cache: Cache.FileSystem(zkdbAppPath),
    forceRecompile: true,
  });
}
