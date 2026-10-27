// Teneriffa – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const tenerife = {
  id: 'tenerife',
  name: 'Teneriffa',
  seed: 103,
  theme: { sky: ['#1a7fd8', '#7cc8ff', '#eaf7ff'], fog: '#cfeaff', sea: '#1f8fc9' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Teneriffa wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
