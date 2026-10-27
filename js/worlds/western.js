// Wilder Westen – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const western = {
  id: 'western',
  name: 'Wilder Westen',
  seed: 104,
  theme: { sky: ['#3f8fd8', '#a7d8ff', '#ffe9c4'], fog: '#f2d9b0', sea: '#3a8fd8' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Wilder Westen wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
