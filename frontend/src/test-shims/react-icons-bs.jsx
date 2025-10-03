import React from 'react';

// Minimal react-icons/bs shim for tests - return simple functional components
export const BsBell = (props) => React.createElement('span', props, '🔔');
export const BsBellFill = (props) => React.createElement('span', props, '🔔');
export const BsFillAlarmFill = (props) => React.createElement('span', props, '⏰');

export default { BsBell, BsBellFill, BsFillAlarmFill };
