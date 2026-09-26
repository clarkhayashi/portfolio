// 12-second silent loop that shows a Herd round: write → pick → smaller side loses → Black Sheep.
// Built on the shared intro-animation base in game-anims.js (em-sized, CSS injected once, reduced motion shows the last frame).
import {gameAnim} from './game-anims.js';
export const herdAnim=()=>gameAnim('herd');
