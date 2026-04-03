import { migration0To1 } from './migration0To1.js';
import { migration1To2 } from './migration1To2.js';
import { migration2To3 } from './migration2To3.js';
import { migration3To4 } from './migration3To4.js';
import { migration4To5 } from './migration4To5.js';
import { migration5To6 } from './migration5To6.js';
import { migration6To7 } from './migration6To7.js';
import { migration7To8 } from './migration7To8.js';

export const SESSION_MIGRATION_STEPS = Object.freeze([
  migration0To1,
  migration1To2,
  migration2To3,
  migration3To4,
  migration4To5,
  migration5To6,
  migration6To7,
  migration7To8,
]);
