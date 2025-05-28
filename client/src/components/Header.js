import React from 'react';

const Header = ({ isAdmin }) => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tournament Bracket</h1>
        <div className="flex items-center">
          {isAdmin ? (
            <div className="bg-secondary px-3 py-1 rounded-full text-sm font-semibold">
              Mode Admin
            </div>
          ) : (
            <a 
              href="?admin=true" 
              className="text-sm underline hover:text-gray-200"
            >
              Passer en mode admin
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
