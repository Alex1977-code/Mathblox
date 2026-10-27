// Australien – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const australia = {
  id: 'australia',
  name: 'Australien',
  seed: 206,
  theme: { sky: ['#1f7fe0', '#8fd0ff', '#fff2dc'], fog: '#f2e2c8', sea: '#1fb0d0' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Australien wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
