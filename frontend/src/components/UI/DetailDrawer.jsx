import "./DetailDrawer.css";

const DetailDrawer = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  headerBackground,
  titleColor,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="detail-drawer-overlay"
      onClick={onClose}
    >
      <aside
        className="detail-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="detail-drawer-header"
          style={{
            background: headerBackground,
          }}
        >
          <div>
            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="detail-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="detail-drawer-body">
          {children}
        </div>

        {footer && (
          <div className="detail-drawer-footer">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
};

export default DetailDrawer;