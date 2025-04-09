import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Game.css';

// Constants
const BASE_PADDLE_SPEED_FACTOR = 0.8;
const BASE_BALL_SPEED_FACTOR = 1.5;
const DIFFICULTY_SPEEDS = { EASY: 0.5, MEDIUM: 0.8, HARD: 1 };
const POST_SCORE_SLOWDOWN = 0.5;
const MAX_BOUNCE_ANGLE_RATIO = 1.0;

function Game({
    mode, difficulty, isPaused, boardWidth, boardHeight, borderThickness,
    onScoreUpdate, onPauseRequest,
    // Receive sound props from App
    playSound, soundPaths,
}) {
    if (!boardWidth || boardWidth <= 0 || !boardHeight || boardHeight <= 0) {
        return <div className="game-loading-overlay">INVALID DIMENSIONS</div>;
    }

    // --- State and Derived Vars (Identical to previous) ---
    const initialPaddleY=boardHeight/2; const initialBallX=boardWidth/2; const initialBallY=boardHeight/2;
    const [paddle1Y, setPaddle1Y] = useState(initialPaddleY); const [paddle2Y, setPaddle2Y] = useState(initialPaddleY);
    const [ballX, setBallX] = useState(initialBallX); const [ballY, setBallY] = useState(initialBallY);
    const [ballSpeedX, setBallSpeedX] = useState(0); const [ballSpeedY, setBallSpeedY] = useState(0);
    const [keysPressed, setKeysPressed] = useState({}); const [isSlowed, setIsSlowed] = useState(true);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const paddleHeight=Math.max(10,boardHeight*0.18); const paddleWidth=Math.max(2,boardWidth*0.015);
    const ballSize=Math.max(5,boardWidth*0.015); const paddleSpeed=Math.max(1,boardHeight*(BASE_PADDLE_SPEED_FACTOR/100));
    const baseBallSpeed=Math.max(1,Math.sqrt(boardWidth*boardHeight)*(BASE_BALL_SPEED_FACTOR/100));
    const animationFrameId=useRef(null); const gameBoardRef=useRef(null);

    // --- Ball Reset (Identical logic, only dependencies changed slightly if needed) ---
    const resetBall = useCallback((winner) => {
        if(baseBallSpeed<=0||boardHeight<=0||boardWidth<=0||ballSize<=0) return;
        setBallX(boardWidth/2-ballSize/2); setBallY(boardHeight/2-ballSize/2);
        const speedX=baseBallSpeed*(winner===1?-1:1); const randomAngle=(Math.random()-0.5)*0.8; const speedY=baseBallSpeed*(Math.random()>0.5?1:-1)*(1+randomAngle);
        const initialMagnitude=Math.sqrt(speedX*speedX+speedY*speedY); let finalSpeedX=speedX; let finalSpeedY=speedY;
        if(initialMagnitude>0){finalSpeedX=speedX/initialMagnitude*baseBallSpeed; finalSpeedY=speedY/initialMagnitude*baseBallSpeed;}
        else{finalSpeedX=baseBallSpeed*(winner===1?-1:1); finalSpeedY=0;}
        setBallSpeedX(finalSpeedX); setBallSpeedY(finalSpeedY); setIsSlowed(true);
    }, [boardWidth, boardHeight, ballSize, baseBallSpeed]);
    useEffect(() => { resetBall(Math.random() > 0.5 ? 1 : 2); }, [resetBall]);
    useEffect(() => { onScoreUpdate(scores); }, [scores, onScoreUpdate]);

    // --- Game Loop ---
    const gameLoop = useCallback(() => {
        if (isPaused || !playSound || !soundPaths) { // Add checks for sound props
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        // --- Paddle Movement (Identical) ---
        let nP1Y=paddle1Y, nP2Y=paddle2Y; const mU=keysPressed['w']||(mode==='ONE_PLAYER'&&keysPressed['arrowup']); const mD=keysPressed['s']||(mode==='ONE_PLAYER'&&keysPressed['arrowdown']); if(mU)nP1Y=paddle1Y-paddleSpeed; if(mD)nP1Y=paddle1Y+paddleSpeed; nP1Y=Math.max(1.5, Math.min(boardHeight-paddleHeight - 4.5, nP1Y)); if(mode==='TWO_PLAYERS'){if(keysPressed['arrowup'])nP2Y=paddle2Y-paddleSpeed; if(keysPressed['arrowdown'])nP2Y=paddle2Y+paddleSpeed;} else{const aiF=DIFFICULTY_SPEEDS[difficulty]||DIFFICULTY_SPEEDS['MEDIUM']; const aiS=boardHeight*(aiF/100); const p2C=paddle2Y+paddleHeight/2; const dZ=paddleHeight*0.1; if(p2C<ballY-dZ)nP2Y=paddle2Y+aiS; else if(p2C>ballY+dZ)nP2Y=paddle2Y-aiS;} nP2Y=Math.max(1.5, Math.min(boardHeight-paddleHeight - 4.5, nP2Y)); setPaddle1Y(nP1Y); setPaddle2Y(nP2Y);

        // --- Ball Movement ---
        const speedFactor = isSlowed ? POST_SCORE_SLOWDOWN : 1.0;
        let currentMoveX = ballSpeedX * speedFactor; let currentMoveY = ballSpeedY * speedFactor;
        let nBX = ballX + currentMoveX; let nBY = ballY + currentMoveY;

        // Wall Collision
        let wallCollision = false;
        if (nBY <= 0) {
            nBY = 0; setBallSpeedY(p => -p); wallCollision = true;
        } else if (nBY >= boardHeight - ballSize) {
            nBY = boardHeight - ballSize; setBallSpeedY(p => -p); wallCollision = true;
        }
        if (wallCollision) {
            playSound(soundPaths.BALL_WALL); // Play wall collision sound
        }

        // Paddle Collision
        let hit = false;
        if (paddleHeight > 0 && baseBallSpeed > 0) {
            const nextBallLeft=nBX; const nextBallRight=nBX+ballSize; const nextBallTop=nBY; const nextBallBottom=nBY+ballSize;
            const paddle1LeftEdge=borderThickness; const paddle1RightEdge=borderThickness+paddleWidth;
            const paddle2LeftEdge=boardWidth-borderThickness-paddleWidth; const paddle2RightEdge=boardWidth-borderThickness;
            let newBaseSpeedX = ballSpeedX; let newBaseSpeedY = ballSpeedY;

            if (ballSpeedX < 0 && nextBallLeft <= paddle1RightEdge && ballX >= paddle1RightEdge) {
                if (nextBallBottom >= nP1Y && nextBallTop <= nP1Y + paddleHeight) {
                    hit = true; nBX = paddle1RightEdge; newBaseSpeedX = -ballSpeedX; setIsSlowed(false);
                    const hC=(nextBallTop+nextBallBottom)/2; const pC=nP1Y+paddleHeight/2; const rHP=Math.max(-1,Math.min(1,(hC-pC)/(paddleHeight/2)));
                    newBaseSpeedY = baseBallSpeed * Math.sign(ballSpeedY || (Math.random()-0.5)) * (1 + rHP*0.8);
                }
            } else if (ballSpeedX > 0 && nextBallRight >= paddle2LeftEdge && ballX + ballSize <= paddle2LeftEdge) {
                if (nextBallBottom >= nP2Y && nextBallTop <= nP2Y + paddleHeight) {
                    hit = true; nBX = paddle2LeftEdge - ballSize; newBaseSpeedX = -ballSpeedX; setIsSlowed(false);
                    const hC=(nextBallTop+nextBallBottom)/2; const pC=nP2Y+paddleHeight/2; const rHP=Math.max(-1,Math.min(1,(hC-pC)/(paddleHeight/2)));
                    newBaseSpeedY = baseBallSpeed * Math.sign(ballSpeedY || (Math.random()-0.5)) * (1 + rHP*0.8);
                }
            }

            if (hit) {
                 playSound(soundPaths.BALL_PADDLE); // Play paddle collision sound
                 if (Math.abs(newBaseSpeedY) > Math.abs(newBaseSpeedX) * MAX_BOUNCE_ANGLE_RATIO) {
                      newBaseSpeedY = Math.sign(newBaseSpeedY) * Math.abs(newBaseSpeedX) * MAX_BOUNCE_ANGLE_RATIO;
                 }
                 const currentMagnitude = Math.sqrt(newBaseSpeedX * newBaseSpeedX + newBaseSpeedY * newBaseSpeedY);
                 if (currentMagnitude > 0) {
                     const normFactor = baseBallSpeed / currentMagnitude;
                     setBallSpeedX(newBaseSpeedX * normFactor);
                     setBallSpeedY(newBaseSpeedY * normFactor);
                 } else {
                     setBallSpeedX(baseBallSpeed * Math.sign(newBaseSpeedX));
                     setBallSpeedY(0);
                 }
            }
        }

        // Score or Update Position
        if (!hit) {
            let scored = false;
            if (nBX + ballSize < 0) {
                setScores(s => ({ ...s, p2: s.p2 + 1 }));
                playSound(soundPaths.SCORE); // Play score sound
                resetBall(2);
                scored = true; // Prevent position update after reset
            } else if (nBX > boardWidth) {
                setScores(s => ({ ...s, p1: s.p1 + 1 }));
                playSound(soundPaths.SCORE); // Play score sound
                resetBall(1);
                scored = true; // Prevent position update after reset
            }

            if (!scored) { // Only update position if no score occurred
                 setBallX(nBX); setBallY(nBY);
            } else {
                return; // Exit loop early after scoring to use reset position
            }
        } else {
            // Update position after a hit
            setBallX(nBX); setBallY(nBY);
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);

    }, [
        isPaused, paddle1Y, paddle2Y, ballX, ballY, ballSpeedX, ballSpeedY, keysPressed, mode, difficulty,
        resetBall, scores, isSlowed, boardWidth, boardHeight, paddleHeight, paddleWidth, ballSize, paddleSpeed,
        baseBallSpeed, borderThickness,
        // Add sound props as dependencies
        playSound, soundPaths
    ]);

    // --- Effects (Loop, Keyboard) remain the same ---
    useEffect(() => { animationFrameId.current = requestAnimationFrame(gameLoop); return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); }; }, [gameLoop]);
    useEffect(() => { const kd = (e) => { if (e.key === ' ') { e.preventDefault(); onPauseRequest(); } else { setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true })); } }; const ku = (e) => { setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: false })); }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); }; }, [onPauseRequest]);

    // --- Render ---
    const paddle1Style = { top: `${paddle1Y}px`, width: `${paddleWidth}px`, height: `${paddleHeight}px`, left: `${borderThickness}px` };
    const paddle2Style = { top: `${paddle2Y}px`, width: `${paddleWidth}px`, height: `${paddleHeight}px`, right: `${borderThickness}px` };
    const ballStyle = { left: `${ballX}px`, top: `${ballY}px`, width: `${ballSize}px`, height: `${ballSize}px` };

    return (
        <div ref={gameBoardRef} className="game-board" style={{ width: '100%', height: '100%' }}>
            <div className="center-line"></div>
            <div className="paddle" style={paddle1Style}></div>
            <div className="paddle" style={paddle2Style}></div>
            <div className="ball" style={ballStyle}></div>
        </div>
    );
}

export default Game;