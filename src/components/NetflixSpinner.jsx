import React from 'react';

const NetflixSpinner = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col justify-center items-center space-y-4">
      <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex justify-center items-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center py-8">
      {spinner}
    </div>
  );
};

export default NetflixSpinner;
