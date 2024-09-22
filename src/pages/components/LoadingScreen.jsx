import React from 'react';
import './component.css'; // Ensure to create this CSS file

const LoadingScreen = () => {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
        <div className="loading-cubes">
          <div className="loading-cube">
            <div className="loading-cube__inner"></div>
          </div>
          <div className="loading-cube">
            <div className="loading-cube__inner"></div>
          </div>
          <div className="loading-cube">
            <div className="loading-cube__inner"></div>
          </div>
        </div>
      </div>
    );
  };
  
  export default LoadingScreen;
