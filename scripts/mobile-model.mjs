// Builds public/models/glitz-mobile.glb: same club, but the hedges keep only a fraction of their leaves.
// Five foliage meshes hold about 80% of all vertices. Run: node scripts/mobile-model.mjs
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, meshopt, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HEAVY = 20000;   // vertices above which a mesh is treated as foliage
const KEEP = 0.16;

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read('public/models/glitz.glb');

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const count = prim.getAttribute('POSITION').getCount();
    const white = (prim.getMaterial()?.getBaseColorFactor() ?? [0, 0, 0]).slice(0, 3).every((c) => c > 0.5);
    if (count < HEAVY || white) continue;
    const old = prim.getIndices().getArray();
    // Leaves are small triangle clusters: dropping whole runs thins the hedge without tearing the shapes left.
    const RUN = 12; const kept = [];
    for (let i = 0; i < old.length; i += RUN * 3) if (rnd() < KEEP) for (let j = i; j < Math.min(i + RUN * 3, old.length); j++) kept.push(old[j]);
    prim.setIndices(prim.getIndices().clone().setArray(new Uint32Array(kept)));
    compactPrimitive(prim);
    console.log(mesh.getName(), count, '->', prim.getAttribute('POSITION').getCount());
  }
}
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write('public/models/glitz-mobile.glb', doc);
