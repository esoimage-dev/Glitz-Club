// Builds the two models the site loads from scripts/model-source/glitz-full.glb. Run: node scripts/build-models.mjs
// Never run a geometric simplify on this model: its meshes are merged by colour and can span 100 metres,
// so even a small relative error wipes out trunks, steps and roof tiles. Only the hedge leaves get thinned.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, join, meshopt, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';


await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

for (const [out, keep, HEAVY] of [['glitz', 0.9, 20000], ['glitz-mobile', 0.2, 5000]]) { // HEAVY: vertices above which a green mesh counts as foliage
  const doc = await io.read('scripts/model-source/glitz-full.glb');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let before = 0; let after = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const count = prim.getAttribute('POSITION').getCount();
      before += count;
      const [r, g, b] = prim.getMaterial()?.getBaseColorFactor() ?? [0, 0, 0];
      if (count >= HEAVY && g > r && g > b) {
        const old = prim.getIndices().getArray();
        // Leaves are clusters of 4 triangles: dropping whole clusters thins the hedge without tearing leaves.
        const RUN = 4 * 3; const kept = [];
        for (let i = 0; i < old.length; i += RUN) if (rnd() < keep) for (let j = i; j < Math.min(i + RUN, old.length); j++) kept.push(old[j]);
        prim.setIndices(prim.getIndices().clone().setArray(new Uint32Array(kept)));
        compactPrimitive(prim);
      }
      after += prim.getAttribute('POSITION').getCount();
    }
  }
  // Same-colour pieces become one draw call. Tables keep their names: they light up one by one.
  for (const node of doc.getRoot().listNodes()) if (!/^TABLE_/.test(node.getName())) node.setName('');
  await doc.transform(dedup(), join({ keepNamed: true }), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(`public/models/${out}.glb`, doc);
  console.log(out, before, '->', after);
}
