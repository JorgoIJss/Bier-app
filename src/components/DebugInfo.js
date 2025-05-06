import React from 'react';

const DebugInfo = ({ showSplash, appHidden, beersCount }) => {
    return (
        <div className="debug-info">
            <p><strong>Debug Info:</strong></p>
            <p>showSplash: {showSplash ? 'true' : 'false'}</p>
            <p>appHidden: {appHidden ? 'true' : 'false'}</p>
            <p>beersCount: {beersCount}</p>
        </div>
    );
};

export default DebugInfo; 