// Südamerika – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const southamerica = {
  id: 'southamerica',
  name: 'Südamerika',
  seed: 205,
  theme: { sky: ['#2f8fd8', '#9fe0ff', '#f0fff0'], fog: '#d0eedc', sea: '#2f9fc0' },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'worldtour');
    w.sign('Südamerika wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
