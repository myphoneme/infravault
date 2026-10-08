import "./Pagination.css";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="app-pagination">
      <span className="app-pagination-summary">
        Showing {startItem}–{endItem} of {totalItems}
      </span>

      <div className="app-pagination-navigation">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          ‹ Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={
              page === currentPage
                ? "app-pagination-page active"
                : "app-pagination-page"
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;