import "./PageHeader.css";

const PageHeader = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <header className="app-page-header">
      <div className="app-page-header-content">
        <h1>{title}</h1>

        {description && <p>{description}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          className="app-page-header-button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </header>
  );
};

export default PageHeader;