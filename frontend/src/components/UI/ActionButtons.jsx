import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPenToSquare,
  faTrash,
  faToggleOn,
  faToggleOff,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

import "./ActionButtons.css";

const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onChangePassword,
}) => {
  return (
    <div className="action-buttons">
      {onView && (
        <button
          type="button"
          className="action-button action-view"
          onClick={onView}
          title="View"
          aria-label="View"
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
      )}

      

      {onEdit && (
        <button
          type="button"
          className="action-button action-edit"
          onClick={onEdit}
          title="Edit"
          aria-label="Edit"
        >
          <FontAwesomeIcon icon={faPenToSquare} />
        </button>
      )}


      {onChangePassword && (
  <button
    type="button"
    className="action-button action-change-password"
    onClick={onChangePassword}
    title="Change Password"
    aria-label="Change Password"
  >
    <FontAwesomeIcon icon={faKey} />
  </button>
)}



      {onDelete && (
        <button
          type="button"
          className="action-button action-delete"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}

  

      {onActivate && (
        <button
          type="button"
          className="action-button action-activate"
          onClick={onActivate}
          title="Activate"
          aria-label="Activate"
        >
          <FontAwesomeIcon icon={faToggleOn} />
        </button>
      )}

      {onDeactivate && (
        <button
          type="button"
          className="action-button action-deactivate"
          onClick={onDeactivate}
          title="Deactivate"
          aria-label="Deactivate"
        >
          <FontAwesomeIcon icon={faToggleOff} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;