// Ritterburg – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const knights = {
  id: 'knights',
  name: 'Ritterburg',
  seed: 105,
  theme: { sky: ['#3d7fcf', '#a9d2f5', '#eef6ff'], fog: '#d5e4f2', sea: '#3a7fc0' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Ritterburg wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
