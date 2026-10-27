// Europa – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const europe = {
  id: 'europe',
  name: 'Europa',
  seed: 203,
  theme: { sky: ['#3a7fd0', '#a8d4ff', '#eef6ff'], fog: '#d8e6f2', sea: '#2f8fc9' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Europa wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
