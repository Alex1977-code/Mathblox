// Halloween – Platzhalter, wird ersetzt
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';

export const halloween = {
  id: 'halloween',
  name: 'Halloween',
  seed: 102,
  theme: { sky: ['#0d0a1f', '#3b1f5c', '#ff8a3d'], fog: '#2a1840', sea: '#1d1640', light: { hemi: 0.6, sun: 0.7, sunColor: '#b9a6ff', sky: '#8f7fd6', ground: '#2a1840' } },
  stars: {},
  build(w) {
    w.island(80, '#6cc24a', '#f1d38b');
    exitPortal(w, 36, 'hub');
    w.sign('Halloween wird gerade gebaut', 0, 4, 10, { bg: '#ffffff', fg: '#17233b', size: 1 });
  },
};
