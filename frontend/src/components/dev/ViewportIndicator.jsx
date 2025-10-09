import React from 'react';

const ViewportIndicator = () => {
  // This component shows the current viewport size in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 m-1 rounded-md opacity-75">
      <div className="sm:hidden">XS</div>
      <div className="hidden sm:block md:hidden">SM</div>
      <div className="hidden md:block lg:hidden">MD</div>
      <div className="hidden lg:block xl:hidden">LG</div>
      <div className="hidden xl:block 2xl:hidden">XL</div>
      <div className="hidden 2xl:block">2XL</div>
    </div>
  );
};

export default ViewportIndicator;