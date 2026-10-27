// Großstadt – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const city = {
  id: 'city',
  name: 'Großstadt',
  seed: 101,
  theme: { sky: ['#4f86c6', '#9cc7ec', '#e6f1fb'], fog: '#cfe0f0', sea: '#3a7fc0' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Großstadt wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
