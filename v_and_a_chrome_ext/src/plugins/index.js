// Plugins entry point - imports all plugins in alphabetical order
// This replicates the Grunt uglify:compile_plugins behavior

import './0_console_fixer.js';
import './0_modernizr.js';
import './1_doTimeout_throttle_debounce.js';
import './1_pointereventspolyfill.js';
import './2_imagesloaded.js';
import './3_fittr.js';
import './4_velocity.js'; 