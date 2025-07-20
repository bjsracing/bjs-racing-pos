// src/components/Header.jsx

import { FiMenu } from "react-icons/fi";

function Header({ onMenuClick }) {
  return (
    // Header sekarang lebih ringkas dan menempel di atas
    <header className="md:hidden sticky top-0 bg-slate-100/80 backdrop-blur-md p-4 z-10">
      <button onClick={onMenuClick} className="text-slate-800">
        <FiMenu size={24} />
      </button>
    </header>
  );
}

export default Header;
