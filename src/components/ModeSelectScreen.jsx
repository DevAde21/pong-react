import React from 'react';

const GameMode = {
  ONE_PLAYER: 'ONE_PLAYER',
  TWO_PLAYERS: 'TWO_PLAYERS',
};

const ModeSelectScreen = ({ onSelect }) => (
  <>
    <h2>SELECT MODE</h2>
    <button onClick={() => onSelect(GameMode.ONE_PLAYER)}>ONE PLAYER</button>
    <button onClick={() => onSelect(GameMode.TWO_PLAYERS)}>TWO PLAYERS</button>
  </>
);

export default ModeSelectScreen;