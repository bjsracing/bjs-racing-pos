import { FiMenu } from "react-icons/fi";

function Header({ onMenuClick }) {
  return (
    <header className="md:hidden bg-white shadow-md p-4">
      <button onClick={onMenuClick} className="text-slate-800">
        <FiMenu size={24} />
      </button>
    </header>
  );
}

export default Header;
