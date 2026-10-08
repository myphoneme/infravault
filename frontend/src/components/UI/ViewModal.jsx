import "./ViewModal.css";

const ViewModal = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  className = "",
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className={`modal-overlay ${className}`}
      onClick={onClose}
    >
      <div
        className="device-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="view-modal-body">
          {children}

          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewModal;