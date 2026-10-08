import "./FormModal.css";

const FormModal = ({
  title,
  subtitle,
  onClose,
  onSubmit,
  saving = false,
  submitText = "Save",
  savingText = "Saving...",
  showSubmitButton = true,
  modalClassName = "",
  children,
}) => {
  return (
   <div
      className={`modal-overlay ${modalClassName}`}
      onClick={onClose}
    >
      <div
        className="form-modal"
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
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {children}

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            {showSubmitButton && (
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? savingText : submitText}
            </button>
          )}


          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;