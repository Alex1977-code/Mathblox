// Afrika – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const africa = {
  id: 'africa',
  name: 'Afrika',
  seed: 201,
  theme: { sky: ['#2f7fd0', '#9fd2ff', '#ffe8c0'], fog: '#f0dcb0', sea: '#2f8fc9' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Afrika wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
