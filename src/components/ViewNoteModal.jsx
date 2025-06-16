function ViewNoteModal({ isOpen, onClose, note }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Catatan Produk</h2>
        <div className="max-h-60 overflow-y-auto text-slate-700 whitespace-pre-wrap">
          {note || "Tidak ada catatan."}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewNoteModal;
