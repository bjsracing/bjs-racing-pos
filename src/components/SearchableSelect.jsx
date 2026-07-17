import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi";

const SearchableSelect = ({
  label,
  value,
  options = [],
  placeholder = "Ketik untuk cari...",
  allLabel = "Semua",
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const isAllSelected = value === "semua";

  const displayLabel = useMemo(() => {
    if (isAllSelected) return allLabel;
    return value || allLabel;
  }, [value, isAllSelected, allLabel]);

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    const term = searchText.toLowerCase();
    return options.filter((opt) => {
      const label = typeof opt === "string" ? opt : opt.label || opt.nama || "";
      return label.toLowerCase().includes(term);
    });
  }, [options, searchText]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchText]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    onSelect(optValue);
    setIsOpen(false);
    setSearchText("");
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex === 0) {
          handleSelect("semua");
        } else if (highlightedIndex > 0 && highlightedIndex <= filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex - 1];
          handleSelect(typeof opt === "string" ? opt : opt.label || opt.nama || "");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchText("");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchText("");
        }}
        className={`w-full p-2 border rounded-lg bg-white text-left flex items-center justify-between ${
          isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-300"
        }`}
      >
        <span className={isAllSelected ? "text-slate-500" : "text-slate-800"}>
          {displayLabel}
        </span>
        <FiChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                ref={inputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-7 pr-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>
          <ul ref={listRef} className="max-h-48 overflow-y-auto">
            <li
              onClick={() => handleSelect("semua")}
              className={`px-3 py-2 text-sm cursor-pointer ${
                isAllSelected
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              } ${highlightedIndex === 0 ? "bg-slate-100" : ""}`}
            >
              {allLabel}
            </li>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => {
                const optValue = typeof opt === "string" ? opt : opt.label || opt.nama || "";
                const isSelected = value === optValue;
                return (
                  <li
                    key={typeof opt === "string" ? opt : opt.id || opt.label || i}
                    onClick={() => handleSelect(optValue)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    } ${highlightedIndex === i + 1 ? "bg-slate-100" : ""}`}
                  >
                    {optValue}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-sm text-slate-400 text-center">
                Tidak ditemukan
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
