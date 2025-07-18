// src/pages/Pos.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import {
  FiSearch,
  FiPlusCircle,
  FiPlus,
  FiMinusCircle,
  FiTrash2,
  FiUserCheck,
  FiXCircle,
  FiSave,
  FiClock,
  FiShoppingCart,
  FiChevronUp,
  FiChevronDown,
  FiEdit,
} from "react-icons/fi";
import HeldTransactionsModal from "../components/HeldTransactionsModal.jsx";
import ReceiptModal from "../components/ReceiptModal.jsx";
import CustomerRequestModal from "../components/CustomerRequestModal.jsx";

// Helper Hook untuk debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Kartu Produk dengan interaksi yang lebih dinamis dan profesional
const ProductCard = ({ product, onAddToCart }) => {
  return (
    // 'group' ditambahkan agar elemen di dalamnya bisa bereaksi saat kartu di-hover
    // 'hover:-translate-y-1' untuk efek kartu terangkat
    <div className="group relative bg-gradient-to-br from-slate-100 to-slate-50 hover:from-orange-100 hover:to-orange-50 border-2 border-transparent hover:border-orange-400 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden hover:-translate-y-1">
      {/* Bagian Informasi Produk */}
      <div className="flex-grow z-10">
        <p className="font-bold text-slate-800 text-lg leading-tight">
          {product.nama}
        </p>
        <p className="text-base font-semibold text-blue-600 italic mt-1">
          {product.merek || "Tanpa Merek"}
        </p>
        <p className="text-base text-slate-500 italic mt-1">
          {" "}
          {product.kode || "-"}
        </p>
        <p
          className={`mt-2 font-bold ${product.stok <= product.stok_min ? "text-red-600" : "text-slate-700"}`}
        >
          <span className="text-sm">Stok: </span>
          <span className="text-base">{product.stok}</span>
        </p>
      </div>

      {/* Bagian Harga */}
      <div className="mt-1 pt-4 border-t border-orange-400 z-10">
        <p className="text-xl font-bold text-orange-500">
          Rp{new Intl.NumberFormat("id-ID").format(product.harga_jual)}
        </p>
      </div>

      {/* Tombol Aksi Melingkar */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={() => onAddToCart(product)}
          // Tombol berubah warna saat kartu di-hover (group-hover)
          className="w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 group-hover:bg-green-500 group-hover:text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:scale-100"
          disabled={product.stok === 0}
        >
          <FiShoppingCart size={20} />
        </button>
      </div>
    </div>
  );
};

// Komponen kecil untuk isi Keranjang, agar bisa dipakai ulang di desktop & mobile
const CartComponent = ({
  selectedCustomer,
  cart,
  handleRemoveFromCart,
  handleCartChange,
  subtotal,
  totalDiscount,
  finalTotal,
  cashPaid,
  handleCashInputChange,
  change,
  processCheckout,
  handleHoldTransaction,
}) => (
  <fieldset
    disabled={!selectedCustomer}
    className="flex flex-col flex-1 min-h-0"
  >
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      {cart.length === 0 ? (
        <p className="text-slate-400 text-center mt-20">Keranjang kosong.</p>
      ) : (
        cart.map((item) => (
          <div key={item.id} className="pb-4 border-b last:border-b-0">
            <div className="flex justify-between items-start">
              <p className="font-bold w-full pr-2">{item.nama}</p>
              <button
                onClick={() => handleRemoveFromCart(item.id)}
                className="text-red-500 flex-shrink-0"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Rp {new Intl.NumberFormat("id-ID").format(item.harga_jual)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCartChange(item.id, "quantity", item.quantity - 1)
                  }
                  className="text-slate-500"
                >
                  <FiMinusCircle />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleCartChange(item.id, "quantity", e.target.value)
                  }
                  className="w-12 text-center font-semibold border rounded"
                />
                <button
                  onClick={() =>
                    handleCartChange(item.id, "quantity", item.quantity + 1)
                  }
                  className="text-slate-500"
                >
                  <FiPlusCircle />
                </button>
              </div>
              <p className="font-semibold">
                Rp{" "}
                {new Intl.NumberFormat("id-ID").format(
                  item.harga_jual * item.quantity,
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={item.discountType}
                onChange={(e) =>
                  handleCartChange(item.id, "discountType", e.target.value)
                }
                className="p-2 border rounded text-sm"
              >
                <option value="Tidak Ada">Diskon</option>
                <option value="Nominal">Rp</option>
                <option value="Persen">%</option>
              </select>
              <input
                type={item.discountType === "Nominal" ? "text" : "number"}
                value={
                  item.discountType === "Nominal"
                    ? item.discountValue
                      ? new Intl.NumberFormat("id-ID").format(
                          item.discountValue,
                        )
                      : ""
                    : item.discountValue
                }
                onChange={(e) =>
                  handleCartChange(item.id, "discountValue", e.target.value)
                }
                className="p-2 border rounded w-full"
                placeholder="0"
                disabled={item.discountType === "Tidak Ada"}
              />
            </div>
          </div>
        ))
      )}
    </div>
    <div className="border-t pt-4 mt-auto">
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {new Intl.NumberFormat("id-ID").format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Diskon</span>
          <span className="text-red-500">
            - Rp {new Intl.NumberFormat("id-ID").format(totalDiscount)}
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total Akhir</span>
          <span>Rp {new Intl.NumberFormat("id-ID").format(finalTotal)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium">Uang Tunai</label>
          <input
            type="text"
            value={
              cashPaid ? new Intl.NumberFormat("id-ID").format(cashPaid) : ""
            }
            onChange={handleCashInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-between font-bold text-lg bg-slate-100 p-2 rounded">
          <span>Kembalian</span>
          <span>Rp {new Intl.NumberFormat("id-ID").format(change)}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={handleHoldTransaction}
          disabled={cart.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400"
        >
          <FiSave /> Tahan
        </button>
        <button
          onClick={() => processCheckout(false)}
          disabled={!selectedCustomer?.id || cart.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400"
        >
          Hutang
        </button>
        <button
          onClick={() => processCheckout(true)}
          disabled={cart.length === 0 || parseFloat(cashPaid) < finalTotal}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400"
        >
          Bayar
        </button>
      </div>
    </div>
  </fieldset>
);

function Pos() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    merek: "semua",
    kategori: "semua",
  });
  const [merekOptions, setMerekOptions] = useState([]);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [cashPaid, setCashPaid] = useState("");
  const [change, setChange] = useState(0);
  const [receiptData, setReceiptData] = useState(null);
  const [heldTransactions, setHeldTransactions] = useState([]);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [activeQuickFilter, setActiveQuickFilter] = useState("semua");

  const forceRefresh = () => setRefreshTrigger((t) => t + 1);

  useEffect(() => {
    if (customerSearch.trim() === "") {
      setCustomers([]);
      return;
    }
    const searchCustomers = async () => {
      const { data } = await supabase.rpc("search_customers", {
        search_term: customerSearch,
      });
      setCustomers(data || []);
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const fetchProducts = useCallback(async () => {
    if (!selectedCustomer) return;
    setLoadingProducts(true);
    const { data, error } = await supabase.rpc("search_products", {
      search_term: debouncedProductSearch,
      merek_filter: activeFilters.merek,
      kategori_filter: activeFilters.kategori,
      status_filter: "Aktif",
      low_stock_only: false,
    });
    if (error) {
      console.error("Error fetching products on POS:", error);
      alert("Gagal memuat produk.");
    } else {
      setFilteredProducts(data || []);
    }
    setLoadingProducts(false);
  }, [selectedCustomer, debouncedProductSearch, activeFilters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data: mereksData } = await supabase
        .from("products")
        .select("merek");
      if (Array.isArray(mereksData)) {
        const uniqueMereks = [
          ...new Set(mereksData.map((item) => item.merek).filter(Boolean)),
        ];
        setMerekOptions(uniqueMereks.sort());
      }
      const { data: kategorisData } = await supabase
        .from("products")
        .select("kategori");
      if (Array.isArray(kategorisData)) {
        const uniqueKategoris = [
          ...new Set(
            kategorisData.map((item) => item.kategori).filter(Boolean),
          ),
        ];
        setKategoriOptions(uniqueKategoris.sort());
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchHeldTransactions = async () => {
      const { data, error } = await supabase
        .from("held_transactions")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching held transactions:", error);
      } else {
        setHeldTransactions(data || []);
      }
    };
    fetchHeldTransactions();
  }, [refreshTrigger]);

  const selectCustomer = (customer) => {
    if (
      cart.length > 0 &&
      !window.confirm("Keranjang akan dikosongkan. Lanjutkan?")
    )
      return;
    setCart([]);
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCustomers([]);
  };
  const resetCustomer = () => {
    if (
      cart.length > 0 &&
      !window.confirm(
        "Mengganti pelanggan akan mengosongkan keranjang. Lanjutkan?",
      )
    )
      return;
    setCart([]);
    setSelectedCustomer(null);
  };
  const handleAddToCart = (product) => {
    setCart((curr) => {
      const existing = curr.find((i) => i.id === product.id);
      if (existing) {
        return existing.quantity < product.stok
          ? curr.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : (alert("Stok tidak cukup!"), curr);
      }
      return [
        ...curr,
        {
          ...product,
          quantity: 1,
          discountType: "Tidak Ada",
          discountValue: "",
        },
      ];
    });
  };
  const handleCartChange = (productId, field, value) => {
    setCart((curr) =>
      curr.map((item) => {
        if (item.id === productId) {
          let pVal = value;
          if (field === "discountValue" && item.discountType === "Nominal")
            pVal = value.replace(/[^0-9]/g, "");
          const uItem = { ...item, [field]: pVal };
          if (field === "discountType") uItem.discountValue = "";
          if (field === "discountValue") {
            const numVal = Number(pVal) || 0;
            if (uItem.discountType === "Nominal" && numVal > item.harga_jual) {
              uItem.discountValue = item.harga_jual.toString();
              alert("Diskon > harga.");
            }
            if (
              uItem.discountType === "Persen" &&
              (numVal < 0 || numVal > 100)
            ) {
              uItem.discountValue = "100";
              alert("Diskon % 0-100.");
            }
          }
          if (field === "quantity") {
            const numVal = Number(value) || 1;
            if (numVal > item.stok) {
              uItem.quantity = item.stok;
              alert("Kuantitas > stok.");
            } else if (numVal <= 0) {
              uItem.quantity = 1;
            } else {
              uItem.quantity = numVal;
            }
          }
          return uItem;
        }
        return item;
      }),
    );
  };
  const handleRemoveFromCart = (id) =>
    setCart((curr) => curr.filter((i) => i.id !== id));

  useEffect(() => {
    let sub = 0,
      disc = 0;
    cart.forEach((i) => {
      const total = i.harga_jual * i.quantity;
      sub += total;
      const dVal = Number(i.discountValue) || 0;
      if (i.discountType === "Nominal") disc += dVal * i.quantity;
      else if (i.discountType === "Persen") disc += total * (dVal / 100);
    });
    setSubtotal(sub);
    setTotalDiscount(disc);
    setFinalTotal(sub - disc);
  }, [cart]);

  useEffect(() => {
    const paid = parseFloat(cashPaid) || 0;
    setChange(paid >= finalTotal ? paid - finalTotal : 0);
  }, [cashPaid, finalTotal]);

  const resetPage = () => {
    setCart([]);
    setProductSearch("");
    setFilteredProducts([]);
    setCashPaid("");
    setSelectedCustomer(null);
    setIsSubmitting(false);
    setActiveFilters({ merek: "semua", kategori: "semua" });
    forceRefresh();
  };
  const processCheckout = async (isPaid) => {
    const paid = parseFloat(cashPaid) || 0;
    if (isPaid && paid < finalTotal) {
      alert("Pembayaran kurang.");
      return;
    }
    setIsSubmitting(true);
    let profit =
      cart.reduce((p, i) => p + (i.harga_jual - i.harga_beli) * i.quantity, 0) -
      totalDiscount;
    const trxData = {
      customer_id: selectedCustomer?.id,
      total: subtotal,
      diskon: totalDiscount,
      total_akhir: finalTotal,
      bayar: paid,
      kembalian: isPaid ? change : 0,
      total_laba: profit,
      items: cart,
      status_pembayaran: isPaid ? "Lunas" : "Belum Lunas",
      sisa_hutang: isPaid ? 0 : finalTotal - paid,
    };

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert(trxData)
      .select()
      .single();

    if (error) {
      alert("Gagal menyimpan transaksi: " + error.message);
      setIsSubmitting(false);
      return;
    }

    for (const item of cart) {
      await supabase
        .from("products")
        .update({ stok: item.stok - item.quantity })
        .eq("id", item.id);
      await supabase.from("stock_logs").insert({
        product_id: item.id,
        perubahan: -item.quantity,
        keterangan: `Terjual via POS (Trx ID: ${newTransaction.id})`,
      });
    }

    setIsSubmitting(false);
    const successMsg = isPaid
      ? `Transaksi Lunas! Kembalian: Rp ${new Intl.NumberFormat("id-ID").format(change)}`
      : `Transaksi berhasil disimpan sebagai hutang.`;

    if (
      window.confirm(successMsg + "\n\nApakah Anda ingin menampilkan struk?")
    ) {
      setReceiptData({ ...newTransaction, customer_data: selectedCustomer });
    } else {
      resetPage();
    }
  };
  const handleCashInputChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setCashPaid(rawValue);
  };
  const handleHoldTransaction = async () => {
    if (cart.length === 0) return;
    const notes = prompt("Tambahkan catatan untuk transaksi ini (opsional):");
    if (notes === null) return;
    const { error } = await supabase
      .from("held_transactions")
      .insert([
        { notes: notes, cart_data: cart, customer_data: selectedCustomer },
      ]);
    if (error) {
      alert("Gagal menahan transaksi: " + error.message);
    } else {
      alert("Transaksi berhasil ditahan!");
      resetPage();
    }
  };
  const handleResumeTransaction = async (heldTransaction) => {
    if (
      cart.length > 0 &&
      !window.confirm("Ini akan menimpa keranjang saat ini. Lanjutkan?")
    ) {
      return;
    }
    setCart(heldTransaction.cart_data || []);
    setSelectedCustomer(heldTransaction.customer_data || null);
    const { error } = await supabase
      .from("held_transactions")
      .delete()
      .eq("id", heldTransaction.id);
    if (error) {
      alert(
        "Gagal menghapus transaksi tertahan, namun transaksi sudah dimuat.",
      );
    }
    setIsResumeModalOpen(false);
    forceRefresh();
  };

  const handleQuickFilterClick = (brand) => {
    // Jika tombol yang sama diklik lagi, reset filter
    if (brand === activeQuickFilter) {
      setActiveFilters({ merek: "semua", kategori: "semua" });
      setActiveQuickFilter("semua");
    } else {
      // Terapkan filter kategori 'Pilok' dan merek sesuai tombol
      setActiveFilters({ merek: brand, kategori: "Pilok" });
      setActiveQuickFilter(brand);
    }
  };

  const cartProps = {
    selectedCustomer,
    cart,
    handleRemoveFromCart,
    handleCartChange,
    subtotal,
    totalDiscount,
    finalTotal,
    cashPaid,
    handleCashInputChange,
    change,
    processCheckout,
    handleHoldTransaction,
  };

  return (
    <div className="md:flex md:flex-row md:gap-8 h-[calc(100vh-4rem)] p-4 relative bg-slate-50 overflow-hidden">
      <CustomerRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
      <HeldTransactionsModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        transactions={heldTransactions}
        onResume={handleResumeTransaction}
      />
      <ReceiptModal
        isOpen={receiptData !== null}
        onClose={() => {
          setReceiptData(null);
          resetPage();
        }}
        transaction={receiptData}
        shopInfo={{
          name: "BJS RACING",
          address:
            "Jl. Wijaya Kusuma, Bangsri, Jepara (Sebelah Timur SMP N 1 Bangsri)",
          phone: "0881 0116 69213",
          footerNote: "Belanja Gak Pake Drama, Disini Tempatnya!",
        }}
      />
      <div className="w-full md:w-3/5 flex flex-col h-full">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-green-500"
            >
              <FiEdit />
              <span>Catat Permintaan</span>
            </button>
            <button
              onClick={() => setIsResumeModalOpen(true)}
              disabled={heldTransactions.length === 0}
              className="relative flex items-center gap-2 bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiClock />
              <span>Lanjutkan</span>
              {heldTransactions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {heldTransactions.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-2 mb-2">
          {!selectedCustomer ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pilih Pelanggan (Wajib)
              </label>
              <div className="relative">
                <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full p-2 pl-10 border rounded-lg"
                />
              </div>
              {customerSearch.trim() !== "" && (
                <div className="bg-white border rounded-lg mt-1 absolute z-10 w-full md:w-1/3 shadow-lg">
                  {customers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => selectCustomer(cust)}
                      className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-semibold">{cust.nama_pelanggan}</p>
                      <p className="text-sm text-slate-500">{cust.telepon}</p>
                    </div>
                  ))}
                  <div
                    onClick={() =>
                      selectCustomer({
                        id: null,
                        nama_pelanggan: "Pelanggan Umum",
                      })
                    }
                    className="p-3 hover:bg-slate-100 cursor-pointer border-t-2 border-dashed"
                  >
                    <p className="font-semibold text-blue-600">
                      Pilih Pelanggan Umum (Tunai)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center bg-green-100 p-3 rounded-lg">
              <div className="w-full">
                <p className="text-sm text-green-800">Pelanggan:</p>
                <p className="font-bold text-lg text-green-900 flex items-center gap-2">
                  <FiUserCheck />
                  {selectedCustomer.nama_pelanggan}
                </p>
              </div>
              <button
                onClick={resetCustomer}
                title="Ganti Pelanggan"
                className="text-red-500 hover:text-red-700 p-2"
              >
                <FiXCircle size={24} />
              </button>
            </div>
          )}
        </div>
        <fieldset
          disabled={!selectedCustomer}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="grid grid-cols-2 gap-2 mb-1">
            <select
              value={activeFilters.merek}
              onChange={(e) =>
                setActiveFilters((prev) => ({ ...prev, merek: e.target.value }))
              }
              className="w-full p-2 border rounded-lg bg-white text-sm"
            >
              <option value="semua">Semua Merek</option>
              {merekOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={activeFilters.kategori}
              onChange={(e) =>
                setActiveFilters((prev) => ({
                  ...prev,
                  kategori: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-lg bg-white text-sm"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* BLOK BARU TANPA .MAP() */}
          <div className="mb-1 p-1 bg-slate-100 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Tombol DITON */}
              <button
                onClick={() => handleQuickFilterClick("DITON")}
                className={`w-full py-2 px-3 text-sm font-bold rounded-md transition-colors border ${
                  activeQuickFilter === "DITON"
                    ? "bg-[#FBAC18] text-black shadow-md"
                    : "bg-white text-slate-700 hover:bg-[#FBAC18] hover:text-black"
                }`}
              >
                DITON
              </button>

              {/* Tombol NIPPON PAINT */}
              <button
                onClick={() => handleQuickFilterClick("NIPPON PAINT")}
                className={`w-full py-2 px-3 text-sm font-bold rounded-md transition-colors border ${
                  activeQuickFilter === "NIPPON PAINT"
                    ? "bg-black text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-black hover:text-white"
                }`}
              >
                NIPPON PAINT
              </button>

              {/* Tombol SAMURAI (Silver direpresentasikan dengan abu-abu) */}
              <button
                onClick={() => handleQuickFilterClick("SAMURAI")}
                className={`w-full py-2 px-3 text-sm font-bold rounded-md transition-colors border ${
                  activeQuickFilter === "SAMURAI"
                    ? "bg-slate-600 text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-slate-600 hover:text-white"
                }`}
              >
                SAMURAI
              </button>

              {/* Tombol SAPPORO */}
              <button
                onClick={() => handleQuickFilterClick("SAPPORO")}
                className={`w-full py-2 px-3 text-sm font-bold rounded-md transition-colors border ${
                  activeQuickFilter === "Sapporo"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-blue-600 hover:text-white"
                }`}
              >
                SAPPORO
              </button>
            </div>
          </div>

          <div className="relative mb-2">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode produk..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg"
            />
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-inner p-4 overflow-y-auto pb-32 md:pb-4">
            {loadingProducts && (
              <p className="text-center text-slate-500">Memuat...</p>
            )}
            {!loadingProducts && filteredProducts.length === 0 && (
              <p className="text-center text-slate-500 pt-10">
                Produk tidak ditemukan.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </fieldset>
      </div>
      <div className="hidden md:flex md:w-2/5 bg-white rounded-lg shadow p-6 flex-col">
        <h2 className="text-2xl font-bold border-b pb-4 mb-4">Keranjang</h2>
        <CartComponent {...cartProps} />
      </div>
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl transition-transform duration-300 ease-in-out ${isCartExpanded ? "translate-y-0" : "translate-y-[calc(100%-7.5rem)]"} z-20 border-t`}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => setIsCartExpanded(!isCartExpanded)}
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FiShoppingCart className="text-orange-500" size={24} />
              <div>
                <p className="font-semibold text-slate-700">
                  {cart.length} Item di Keranjang
                </p>
                <p className="font-bold text-lg text-orange-500">
                  Rp {new Intl.NumberFormat("id-ID").format(finalTotal)}
                </p>
              </div>
            </div>
            {isCartExpanded ? (
              <FiChevronDown size={24} className="text-slate-500" />
            ) : (
              <FiChevronUp size={24} className="text-slate-500" />
            )}
          </div>
        </div>
        <div
          className="px-4 pb-4 overflow-y-auto"
          style={{ maxHeight: "calc(85vh - 8rem)" }}
        >
          <h2 className="text-2xl font-bold border-b pb-4 mb-4">Keranjang</h2>
          <CartComponent {...cartProps} />
        </div>
      </div>
    </div>
  );
}
export default Pos;
