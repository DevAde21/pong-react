import React from 'react';

const ControlsInfo = ({ mode, borderThickness, boardWidth }) => {
    // Use calculated borderThickness or a default fallback
    const currentBorder = borderThickness ? `${borderThickness}px` : 'calc(2px + 0.2vmin)';
    // Estimate width based on boardWidth if available, otherwise use viewport units
    const controlsWidth = boardWidth > 0 ? `min(90vw, ${boardWidth * 0.9}px)` : 'min(90vw, 600px)';
    const controlBoxWidth = boardWidth > 0 ? `min(35vw, ${boardWidth * 0.35}px)` : 'min(35vw, 200px)';
    const padding = '0.8em'; // Relative padding

    return (
        <div style={{
            border: `${currentBorder} solid white`,
            padding: padding,
            width: controlsWidth,
            maxWidth: '95%', // Ensure it doesn't overflow viewport width
            textAlign: 'center',
            borderRadius: 0,
            flexShrink: 0, // Don't shrink this container
            marginTop: '1.5vh', // Space above controls
            // Font size is inherited from body/parent
        }}>
            {/* Use slightly larger font size for title relative to text */}
            <div style={{ paddingBottom: padding, fontSize: '1.1em' }}>CONTROLS</div>
            <div style={{
                display: 'flex',
                justifyContent: mode === 'ONE_PLAYER' ? 'center' : 'space-around',
                alignItems: 'stretch',
                marginTop: padding,
                marginBottom: padding,
                borderTop: `${currentBorder} solid white`,
                paddingTop: padding,
                paddingBottom: padding,
            }}>
                <div style={{ border: `${currentBorder} solid white`, padding: padding, width: controlBoxWidth, textAlign: 'center' }}>
                    <div>PLAYER 1</div>
                    <div style={{ marginTop: '0.5em' }}>
                        {mode === 'ONE_PLAYER' ? 'W / S OR ↑ / ↓' : 'W / S'}
                    </div>
                </div>
                {mode === 'TWO_PLAYERS' && (
                    <div style={{ border: `${currentBorder} solid white`, padding: padding, width: controlBoxWidth, textAlign: 'center' }}>
                        <div>PLAYER 2</div>
                        <div style={{ marginTop: '0.5em' }}>↑ / ↓</div>
                    </div>
                )}
            </div>
            <div style={{ borderTop: `${currentBorder} solid white`, paddingTop: padding }}>
                SPACE TO PAUSE
            </div>
        </div>
    );
};

export default ControlsInfo;