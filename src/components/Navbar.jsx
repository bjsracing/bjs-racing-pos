import { Link, useNavigate } from "react-router-dom";
import { RxDashboard, RxCube, RxArrowRight } from "react-icons/rx";
import {
  FiTruck,
  FiLogOut,
  FiArchive,
  FiClipboard,
  FiTrendingDown,
  FiFileText,
  FiUsers,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi"; // <-- IMPORT IKON BARU
import { supabase } from "../supabaseClient.js";

function Navbar({ isOpen, onLinkClick }) {
  const navigate = useNavigate();
  const navLinks = [
    { name: "Dashboard", path: "/", icon: <RxDashboard /> },
    { name: "POS", path: "/pos", icon: <RxArrowRight /> },
    { name: "Manajemen Produk", path: "/produk", icon: <RxCube /> },
    { name: "Manajemen Supplier", path: "/suppliers", icon: <FiTruck /> },
    {
      name: "Manajemen Pembelian",
      path: "/pembelian",
      icon: <FiShoppingCart />,
    },
    { name: "Manajemen Pelanggan", path: "/pelanggan", icon: <FiUsers /> }, // <-- LINK MENU BARU
    {
      name: "Permintaan Pelanggan",
      path: "/permintaan-pelanggan",
      icon: <FiStar />,
    },
    {
      name: "Manajemen Pengeluaran",
      path: "/pengeluaran",
      icon: <FiTrendingDown />,
    },
    { name: "Laporan Keuangan", path: "/laporan", icon: <FiFileText /> },
    {
      name: "Riwayat Transaksi",
      path: "/histori-transaksi",
      icon: <FiArchive />,
    },
    { name: "Riwayat Stok", path: "/histori-stok", icon: <FiClipboard /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 h-full bg-slate-800 text-white p-4 flex flex-col justify-between z-30`}
    >
      <div>
        <h1 className="text-2xl font-bold text-primary-500 mb-8">
          BJS RACING POS
        </h1>
        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.name} className="mb-4">
                <Link
                  to={link.path}
                  onClick={onLinkClick}
                  className="flex items-center p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="mr-3 text-xl">{link.icon}</span>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-2 rounded-lg hover:bg-red-500 transition-colors"
        >
          <span className="mr-3 text-xl">
            <FiLogOut />
          </span>
          Logout
        </button>
      </div>
    </div>
  );
}
export default Navbar;
