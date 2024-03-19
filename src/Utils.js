const NUM_GAMES = 3;
const MIDPOINT_SIDEBAR_INDEX = (1 + NUM_GAMES) / 2;

const SIDEBAR_SPACING = 200;

function getSideBarCoords(gameId) {
  console.log(window.innerHeight);
  return [
    150,
    window.innerHeight / 2 +
      SIDEBAR_SPACING * (gameId + 1 - MIDPOINT_SIDEBAR_INDEX),
  ];
}

export { getSideBarCoords };
