import React from 'react';

// Constants
const NAVIGATION_ITEMS = [
  { name: 'home', active: false },
  { name: 'live', active: false },
  { name: 'motion', active: true }
];

const SITE_TITLE = 'Cat Detector';

function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="font-jacquard-12 text-4xl text-text-gray">
        {SITE_TITLE}
      </h1>
      
      <nav className="flex gap-8">
        {NAVIGATION_ITEMS.map((item) => (
          <span
            key={item.name}
            className={`font-jacquard-24 text-text-gray ${
              item.active ? 'underline' : ''
            }`}
          >
            {item.name}
          </span>
        ))}
      </nav>
    </div>
  );
}

export default Header;
