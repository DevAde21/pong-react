import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ModeSelectScreen from './components/ModeSelectScreen';
import DifficultySelectScreen from './components/DifficultySelectScreen';
import Game from './components/Game';
import PauseMenu from './components/PauseMenu';
import './App.css';

// Constants remain the same
const ASPECT_RATIO = 4 / 3;
const VERTICAL_MARGIN_FACTOR = 0.25;
const HORIZONTAL_MARGIN_FACTOR = 0.38;
const AppPhase = { MODE_SELECT: 'MODE_SELECT', DIFFICULTY_SELECT: 'DIFFICULTY_SELECT', PLAYING: 'PLAYING', PAUSED: 'PAUSED' };
const GameMode = { ONE_PLAYER: 'ONE_PLAYER', TWO_PLAYERS: 'TWO_PLAYERS' };

const initialLayout = { boardWidth: 0, boardHeight: 0, boardTop: 0, boardLeft: 0, borderThicknessPx: 2, borderThicknessVmin: '0.3vmin', titleCenterY: 10, pauseTextCenterY: 10, infoBlockP1Left: 10, infoBlockP2Right: 10, infoBlockCenterY: 50, fontSize: 16 };

// --- Sound Paths ---
// Paths relative to the 'public' folder root
const SOUND_PATHS = {
    BUTTON_CLICK: 'sounds/button.aac',
    PAUSE: 'sounds/pause.aac',
    BALL_PADDLE: 'sounds/ball_collision_bar.aac',
    BALL_WALL: 'sounds/ball_collision_wall.aac',
    SCORE: 'sounds/score.aac',
};

// --- Sound Player Helper ---
const playSound = (soundPath) => {
    try {
        // Create a new Audio object each time to allow overlapping sounds if needed
        const audio = new Audio(soundPath);
        // Play the sound - use catch for potential browser restrictions/errors
        audio.play().catch(error => {
            // Log errors, especially useful for auto-play restrictions
            console.warn(`Audio play failed for ${soundPath}:`, error);
        });
    } catch (error) {
        console.error(`Error loading or playing sound ${soundPath}:`, error);
    }
};

function App() {
    const [appPhase, setAppPhase] = useState(AppPhase.MODE_SELECT);
    const [gameMode, setGameMode] = useState(null);
    const [difficulty, setDifficulty] = useState(null);
    const [gameKey, setGameKey] = useState(0);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [layout, setLayout] = useState(initialLayout);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // --- Layout Calculation (remains the same) ---
    const calculateLayout = useCallback(() => {
        const vw = window.innerWidth; const vh = window.innerHeight; if (vw <= 0 || vh <= 0) return;
        const availableWidth = vw * (1 - HORIZONTAL_MARGIN_FACTOR); const availableHeight = vh * (1 - VERTICAL_MARGIN_FACTOR);
        let boardWidth = availableWidth; let boardHeight = boardWidth / ASPECT_RATIO; if (boardHeight > availableHeight) { boardHeight = availableHeight; boardWidth = boardHeight * ASPECT_RATIO; }
        boardWidth = Math.max(100, boardWidth); boardHeight = Math.max(75, boardHeight);
        const boardTop = (vh - boardHeight) / 2; const boardBottom = boardTop + boardHeight; const boardLeft = (vw - boardWidth) / 2;
        const borderThicknessVmin = '0.3vmin'; const vminValue = Math.min(vw, vh) / 100; const borderThicknessPx = Math.max(1, vminValue * 0.3);
        const baseFontSize = parseFloat(window.getComputedStyle(document.body).fontSize || '16');
        const titleCenterY = boardTop / 2; const pauseTextCenterY = boardBottom + (vh - boardBottom) / 2;
        const infoBlockCenterY = boardTop + boardHeight / 2; const infoBlockP1Left = boardLeft * 0.4; const infoBlockP2Right = boardLeft * 0.4;
        setLayout({ boardWidth, boardHeight, boardTop, boardLeft, borderThicknessPx, borderThicknessVmin, titleCenterY, pauseTextCenterY, infoBlockP1Left, infoBlockP2Right, infoBlockCenterY, fontSize: baseFontSize });
        setIsLayoutReady(true);
    }, []);
    useEffect(() => { const t = setTimeout(calculateLayout, 0); window.addEventListener('resize', calculateLayout); return () => { clearTimeout(t); window.removeEventListener('resize', calculateLayout); } }, [calculateLayout]);

    // --- Handlers (Modified for sound) ---
    const handleModeSelect = (m) => {
        playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
        setGameMode(m);
        setScores({ p1: 0, p2: 0 });
        setGameKey(p => p + 1);
        if (m === GameMode.TWO_PLAYERS) {
            setDifficulty(null);
            setAppPhase(AppPhase.PLAYING);
        } else {
            setAppPhase(AppPhase.DIFFICULTY_SELECT);
        }
    };
    const handleDifficultySelect = (l) => {
        playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
        setDifficulty(l);
        setAppPhase(AppPhase.PLAYING);
    };
    const handleScoreUpdate = useCallback((s) => { setScores(s); }, []);
    const handlePauseToggle = useCallback(() => {
        if (appPhase === AppPhase.PLAYING) {
            playSound(SOUND_PATHS.PAUSE); // Play sound ON PAUSE
            setAppPhase(AppPhase.PAUSED);
        } else if (appPhase === AppPhase.PAUSED) {
            playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
            // Você pode adicionar um som de "unpause" aqui se quiser
            // playSound(SOUND_PATHS.UNPAUSE); // Exemplo
            setAppPhase(AppPhase.PLAYING);
        }
    }, [appPhase]); // Dependencies: appPhase (playSound é definida fora e não muda)

    const handleResume = () => {
        playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
        handlePauseToggle(false);
    }

    const handleRestart = () => {
        playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
        setScores({ p1: 0, p2: 0 });
        setGameKey(p => p + 1);
        setAppPhase(AppPhase.PLAYING); // Go back to playing state
    };

    const handleBackToStart = () => {
        playSound(SOUND_PATHS.BUTTON_CLICK); // Play sound
        setGameMode(null);
        setDifficulty(null);
        setScores({ p1: 0, p2: 0 });
        setAppPhase(AppPhase.MODE_SELECT);
    };

    // --- Memos (remain the same) ---
    const gameWrapperStyle = useMemo(() => ({ position: 'absolute', top: `${layout.boardTop}px`, left: `${layout.boardLeft}px`, width: `${layout.boardWidth}px`, height: `${layout.boardHeight}px`, visibility: isLayoutReady ? 'visible' : 'hidden', }), [layout, isLayoutReady]);
    const cssVariables = useMemo(() => ({ '--border-thickness': layout.borderThicknessVmin, '--half-border-thickness': `calc(${layout.borderThicknessVmin} / 2)` }), [layout.borderThicknessVmin]);

    // --- Render Logic ---
    const isGamePhase = appPhase === AppPhase.PLAYING || appPhase === AppPhase.PAUSED;
    const showGameElements = isGamePhase && isLayoutReady;

    return (
        <div className="App" style={cssVariables}>
            <h1 className="main-title" style={{ top: `${layout.titleCenterY}px` }}>PONG REACT</h1>

            {/* Pass playSound to selection screens */}
            {appPhase === AppPhase.MODE_SELECT && <div className="selection-overlay"><ModeSelectScreen onSelect={handleModeSelect} /></div>}
            {appPhase === AppPhase.DIFFICULTY_SELECT && <div className="selection-overlay"><DifficultySelectScreen onSelect={handleDifficultySelect} /></div>}

            {showGameElements && (
                <>
                    <div className="game-wrapper" style={gameWrapperStyle}>
                        <Game
                            key={gameKey} mode={gameMode} difficulty={difficulty} isPaused={appPhase === AppPhase.PAUSED}
                            boardWidth={layout.boardWidth} boardHeight={layout.boardHeight}
                            borderThickness={layout.borderThicknessPx}
                            onScoreUpdate={handleScoreUpdate}
                            onPauseRequest={() => handlePauseToggle(true)}
                            // Pass sound functions/paths to Game
                            playSound={playSound}
                            soundPaths={SOUND_PATHS}
                        />
                    </div>
                    <div className="info-block" style={{ top: `${layout.infoBlockCenterY}px`, left: `${layout.infoBlockP1Left}px`, transform: 'translateY(-50%)', visibility: 'visible' }}>
                        <div className="score-display">{scores.p1}</div>
                        <div className="controls-display"><div>PLAYER 1</div>{gameMode === GameMode.ONE_PLAYER ? 'W/S or UP / DOWN' : 'W / S'}</div>
                    </div>
                    <div className="info-block" style={{ top: `${layout.infoBlockCenterY}px`, right: `${layout.infoBlockP2Right}px`, transform: 'translateY(-50%)', visibility: 'visible' }}>
                        <div className="score-display">{scores.p2}</div>
                        <div className="controls-display"><div>PLAYER 2</div>{gameMode === GameMode.ONE_PLAYER ? 'BOT' : 'UP / DOWN'}</div>
                    </div>
                    <div className="pause-text" style={{ top: `${layout.pauseTextCenterY}px`, transform: 'translate(-50%, -50%)', visibility: 'visible' }}>SPACE TO PAUSE</div>
                </>
            )}

            {/* Pass handlers with sound included to PauseMenu */}
            {appPhase === AppPhase.PAUSED && isLayoutReady && (
                <div className="pause-overlay">
                    <PauseMenu
                        onResume={handleResume} // Use handler that includes sound
                        onRestart={handleRestart} // Use handler that includes sound
                        onChangeMode={handleBackToStart} // Use handler that includes sound
                    />
                </div>
            )}
        </div>
    );
}

export default App;