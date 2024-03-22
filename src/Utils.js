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

export { getSideBarCoords, getMenuCoords };
