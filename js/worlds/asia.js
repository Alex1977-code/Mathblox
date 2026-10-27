// Asien – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const asia = {
  id: 'asia',
  name: 'Asien',
  seed: 202,
  theme: { sky: ['#3a7fd0', '#a8d4ff', '#fff0f5'], fog: '#e8e4f2', sea: '#2f8fc9' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Asien wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
