import "./SearchFilterBar.css";

const SearchFilterBar = ({
  search,
  filters = [],
  onSearch,
  onClear,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-filter-bar">

      <input
        type="text"
        placeholder={search.placeholder || "Search..."}
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(event) =>
            filter.onChange(event.target.value)
          }
        >
          {filter.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      ))}

      <button
        type="button"
        className="search-filter-search-btn"
        onClick={onSearch}
      >
        Search
      </button>

      <button
        type="button"
        className="search-filter-clear-btn"
        onClick={onClear}
      >
        Clear
      </button>

    </div>
  );
};

export default SearchFilterBar;