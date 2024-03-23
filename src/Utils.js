import { NOTE_LETTERS } from "./Defs";

const NUM_GAMES = 3;
const MIDPOINT_GAME_INDEX = (1 + NUM_GAMES) / 2;

const SIDEBAR_SPACING = 128;
const MENU_SPACING = 300;

function getSideBarCoords(gameId) {
  console.log(window.innerHeight);
  return {
    x: 128,
    y:
      window.innerHeight / 2 +
      SIDEBAR_SPACING * (gameId + 1 - MIDPOINT_GAME_INDEX),
  };
}

function getMenuCoords(gameId) {
  return {
    x:
      window.innerWidth / 2 + MENU_SPACING * (gameId + 1 - MIDPOINT_GAME_INDEX),
    y: window.innerHeight / 2,
  };
}

const FREQ_TO_NOTE_DENOM = Math.log10(Math.pow(2, 1 / 12));

function freqToNote(freq) {
  const midi = Math.log10(freq / 27.5) / FREQ_TO_NOTE_DENOM;
  return NOTE_LETTERS[Math.round(midi) % 12];
}

export { getSideBarCoords, getMenuCoords, freqToNote };
