// Gemeinsame Helfer für alle Welten.
export const inRects = (x, z, rects) => rects.some(([x1, z1, x2, z2]) => x >= x1 && x <= x2 && z >= z1 && z <= z2);

// Bäume zufällig verteilen, aber nicht in freizuhaltenden Bereichen
export function scatterTrees(w, kinds, n, half, avoid, s = [0.9, 1.3]) {
  let placed = 0, tries = 0;
  while (placed < n && tries++ < n * 30) {
    const x = w.r(-half, half), z = w.r(-half, half);
    if (inRects(x, z, avoid)) continue;
    w.tree(w.pick(kinds), x, z, w.r(s[0], s[1]));
    placed++;
  }
}

export function exitPortal(w, z = 53, target = 'hub') {
  w.portal({ x: 0, z, facing: 'n', label: target === 'hub' ? 'Zur Mathe-Insel' : 'Zum Flughafen', color: '#2f7df6', target });
  w.spawn.set(0, w.heightAt(0, z - 16), z - 16);
  w.spawnYaw = 0;
}



