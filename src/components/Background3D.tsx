import React from 'react';

/*
 * Static image background (no WebGL, no animation — per current design step).
 * Artwork lives at print_integrated/public/hero-bg.png and is served at the
 * site root as /hero-bg.png.
 */
const Background3D: React.FC = () => {
  return <div className="scene-3d scene-3d--image" />;
};

export default Background3D;
