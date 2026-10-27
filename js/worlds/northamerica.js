// Nordamerika – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const northamerica = {
  id: 'northamerica',
  name: 'Nordamerika',
  seed: 204,
  theme: { sky: ['#2f7fd0', '#9fd2ff', '#f2f8ff'], fog: '#d8e8f5', sea: '#2f7fc0' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Nordamerika wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
