import React from 'react';

const DifficultySelectScreen = ({ onSelect }) => (
  <>
      <h2>SELECT DIFFICULTY</h2>
      <button onClick={() => onSelect('EASY')}>EASY</button>
      <button onClick={() => onSelect('MEDIUM')}>MEDIUM</button>
      <button onClick={() => onSelect('HARD')}>HARD</button>
  </>
);

export default DifficultySelectScreen;