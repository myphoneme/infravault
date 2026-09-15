import { useEffect, useRef, useState } from "react";
import "./SearchableSelect.css";

function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  getOptionValue,
  getOptionLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const filteredOptions = options.filter((option) =>
    getOptionLabel(option)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedOption = options.find(
    (option) =>
      String(getOptionValue(option)) === String(value)
  );

  return (
    <div
      className="searchable-select"
      ref={containerRef}
    >
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span>
          {loading
            ? "Loading..."
            : selectedOption
              ? getOptionLabel(selectedOption)
              : placeholder}
        </span>

        <span>⌄</span>
      </button>

      {open && (
        <div className="searchable-select-menu">
          <input
            type="text"
            className="searchable-select-search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            autoFocus
          />

          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={getOptionValue(option)}
                  className="searchable-select-option"
                  onClick={() => {
                    onChange(
                      getOptionValue(option)
                    );
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {getOptionLabel(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;