import React from 'react';
import PropTypes from 'prop-types';

const FullscreenOverlay = ({ bgcolor,textcolor, children }) => {
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: bgcolor,
    color: textcolor??'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection:'column',
  };

  return (
    <div style={overlayStyle}>
      {children}
    </div>
  );
};

FullscreenOverlay.propTypes = {
  color: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default FullscreenOverlay;