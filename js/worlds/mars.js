// Mars – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const mars = {
  id: 'mars',
  name: 'Mars',
  seed: 106,
  theme: { sky: ['#2b0f0a', '#a14a2a', '#e3a37a'], fog: '#c27a52', sea: '#7a3a22', light: { hemi: 1.2, sun: 2.0, sunColor: '#ffd9b0', sky: '#ffcfa8', ground: '#7a3a22' } },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Mars wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
