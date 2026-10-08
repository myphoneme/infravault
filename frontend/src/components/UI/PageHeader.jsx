import "./PageHeader.css";

const PageHeader = ({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <header className="app-page-header app-page-header-card">
      <div className="app-page-header-content">
        <h1>{title}</h1>

        {description && <p>{description}</p>}
      </div>
     
     <div className="app-page-header-actions">
  {secondaryActionLabel && onSecondaryAction && (
    <button
      type="button"
      className="app-page-header-button app-page-header-button-secondary"
      onClick={onSecondaryAction}
    >
      {secondaryActionLabel}
    </button>
  )}
      {actionLabel && onAction && (
        <button
          type="button"
          className="app-page-header-button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
      </div>
   
    </header>
  );
};

export default PageHeader;