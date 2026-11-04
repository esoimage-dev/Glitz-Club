// Builds the two models the site loads from scripts/model-source/glitz-full.glb. Run: node scripts/build-models.mjs
// Never run a geometric simplify on this model: its meshes are merged by colour and can span 100 metres,
// so even a small relative error wipes out trunks, steps and roof tiles. Only the tree and vine leaves get thinned, and only on phones.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive, dedup, join, meshopt, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';


await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

// The model's five leaf colours, in linear space. Anything else (bushes, stones, the spiral stair) is left whole.
const LEAVES = [[0.036, 0.07, 0.023], [0.054, 0.112, 0.032], [0.098, 0.165, 0.044], [0.13, 0.202, 0.061], [0.065, 0.13, 0.037]];
const isLeaf = ([r, g, b]) => LEAVES.some(([x, y, z]) => Math.abs(r - x) + Math.abs(g - y) + Math.abs(b - z) < 0.012);

// Groups triangles that share vertices: one group is one leaf, so a leaf is kept or dropped whole.
function keepWholeLeaves(prim, keep, rnd) {
  const indices = prim.getIndices().getArray();
  const position = prim.getAttribute('POSITION');
  const count = position.getCount();
  const parent = new Uint32Array(count).map((_, i) => i);
  const find = (v) => { while (parent[v] !== v) { parent[v] = parent[parent[v]]; v = parent[v]; } return v; };
  for (let i = 0; i < indices.length; i += 3) { const a = find(indices[i]); parent[find(indices[i + 1])] = a; parent[find(indices[i + 2])] = a; }
  const choice = new Map(); const kept = [];
  for (let i = 0; i < indices.length; i += 3) {
    const root = find(indices[i]);
    if (!choice.has(root)) choice.set(root, rnd() < keep);
    if (choice.get(root)) kept.push(indices[i], indices[i + 1], indices[i + 2]);
  }
  // Fewer leaves, each a bit larger: the crown covers the same area instead of looking bare.
  const grow = Math.min(1.3, Math.sqrt(1 / keep));
  const sum = new Map(); const v = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const root = find(i); if (!choice.get(root)) continue;
    position.getElement(i, v);
    const e = sum.get(root) ?? [0, 0, 0, 0];
    e[0] += v[0]; e[1] += v[1]; e[2] += v[2]; e[3]++; sum.set(root, e);
  }
  for (let i = 0; i < count; i++) {
    const root = find(i); if (!choice.get(root)) continue;
    const e = sum.get(root); position.getElement(i, v);
    position.setElement(i, [0, 1, 2].map((k) => e[k] / e[3] + (v[k] - e[k] / e[3]) * grow));
  }
  prim.setIndices(prim.getIndices().clone().setArray(new Uint32Array(kept)));
}

for (const [out, keep] of [['glitz', 1], ['glitz-mobile', 0.48]]) {
  const doc = await io.read('scripts/model-source/glitz-full.glb');
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let before = 0; let after = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const count = prim.getAttribute('POSITION').getCount();
      before += count;
      if (keep < 1 && isLeaf(prim.getMaterial()?.getBaseColorFactor() ?? [1, 1, 1])) {
        keepWholeLeaves(prim, keep, rnd);
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
