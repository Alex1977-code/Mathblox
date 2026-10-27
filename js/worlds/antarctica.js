// Antarktis – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const antarctica = {
  id: 'antarctica',
  name: 'Antarktis',
  seed: 207,
  theme: { sky: ['#3a6fb0', '#a8d0f0', '#f4fbff'], fog: '#e4f2fc', sea: '#2a5f8f', light: { hemi: 1.8, sun: 2.0, sunColor: '#ffffff' } },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Antarktis wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
