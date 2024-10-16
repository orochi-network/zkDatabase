import { Cache } from 'o1js';
import { getZkDbSmartContractClass } from '@contracts';
import { RollUpProgram } from '@proof';
import { getNodeDependencies } from 'src/helper/environment';

export async function buildCircuitCache(
  merkleHeight: number,
  baseDestination: string
) {
  const node = await getNodeDependencies();
  if (node) {
    const rollUpProof = RollUpProgram(merkleHeight);
    const rollUpProgramPath = node.path.join(
      baseDestination,
      'rollup-zkprogram',
      merkleHeight.toString()
    );
    await rollUpProof.compile({
      cache: Cache.FileSystem(rollUpProgramPath),
      forceRecompile: true,
    });
    const zkDatabaseApp = getZkDbSmartContractClass(merkleHeight, rollUpProof);

    const zkdbAppPath = node.path.join(
      baseDestination,
      'user-database-zkapp',
      merkleHeight.toString()
    );
    await zkDatabaseApp.compile({
      cache: Cache.FileSystem(zkdbAppPath),
      forceRecompile: true,
    });
  }
}
