import React from 'react';

const PauseMenu = ({ onResume, onRestart, onChangeMode }) => {
    // No need to calculate border here, use CSS variable

    return (
        <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'black',
            /* Use CSS Variable for border */
            border: `var(--border-thickness) solid white`,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            zIndex: 10,
            padding: '1em 2em', // Relative padding
        }}>
            <h2 style={{fontSize: '1.5em', marginBottom: '.35em'}}>PAUSED</h2>
            <button onClick={onResume}>RETURN</button>
            <button onClick={onRestart}>RESTART</button>
            <button onClick={onChangeMode}>BACK TO START</button>
        </div>
    );
}

export default PauseMenu;