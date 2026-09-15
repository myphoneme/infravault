import { createPortal } from "react-dom";
import SearchableSelect from "../../components/UI/SearchableSelect";

function ProjectForm({
  formData,
  devices,
  repositories,
  repositoriesLoading,
  users,
  usersLoading,
  assignedUser,
  currentAssignedUser,
  editingProject,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {


const usersForDisplay = [...users];

if (
  assignedUser &&
  !usersForDisplay.some(
    (user) => Number(user.id) === Number(assignedUser.id)
  )
) {
  usersForDisplay.push(assignedUser);
}

const userNameCounts = usersForDisplay.reduce(
  (counts, user) => {
    const normalizedName =
      user.name?.trim().toLowerCase();

    if (normalizedName) {
      counts[normalizedName] =
        (counts[normalizedName] || 0) + 1;
    }

    return counts;
  },
  {}
);

  const modal = (
    <div
      className="modal-overlay"
      onClick={onCancel}
    >
      <div
        className="device-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>

            <p>
              {editingProject
                ? "Update project information"
                : "Add a new infrastructure project"}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-grid">

            {/* Project Name */}
            <div className="form-group">
              <label>Project Name</label>

              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={onChange}
                required
              />
            </div>

            {/* Repository */}
<div className="form-group">
  <label>Repository Name</label>

  <SearchableSelect
    value={formData.repo_name}
    options={repositories}
    onChange={(value) =>
      onChange({
        target: {
          name: "repo_name",
          value,
        },
      })
    }
    placeholder="Select Repository"
    searchPlaceholder="Search repository..."
    disabled={repositoriesLoading || saving}
    loading={repositoriesLoading}
    getOptionValue={(repo) => repo.name}
    getOptionLabel={(repo) => repo.name}
  />
</div>

            {/* Start Date */}
            <div className="form-group">
              <label>Start Date</label>

              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={onChange}
                required
              />
            </div>

            {/* Deadline */}
            <div className="form-group">
              <label>Deadline</label>

              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={onChange}
                required
              />
            </div>

            {/* Device */}
            <div className="form-group">
              <label>Device</label>

              <select
                name="device_master_id"
                value={formData.device_master_id}
                onChange={onChange}
                required
              >
                <option value="">
                  Select Device
                </option>

                {devices
                  .filter(
                    (device) =>
                      device.device_status === "Active"
                  )
                  .map((device) => (
                    <option
                      key={device.id}
                      value={device.id}
                    >
                      {device.device_name} - {device.host}
                    </option>
                  ))}
              </select>
            </div>



          {/* Assigned To */}
<div className="form-group">
  <label>Assigned To</label>

  <SearchableSelect
    value={formData.assigned_to}
    options={usersForDisplay}
    onChange={(value) =>
      onChange({
        target: {
          name: "assigned_to",
          value,
        },
      })
    }
    placeholder="Select User"
    searchPlaceholder="Search user..."
    disabled={usersLoading || saving}
    loading={usersLoading}
    getOptionValue={(user) => user.id}
    getOptionLabel={(user) => {
      const normalizedName =
        user.name?.trim().toLowerCase();

      const isDuplicateName =
        userNameCounts[normalizedName] > 1;

      let label = user.name?.trim() || "";

      if (isDuplicateName) {
        label += ` — ${user.email}`;
      }

      if (user.is_active === false) {
        label += " (Inactive)";
      }

      return label;
    }}
  />
</div>
 

            {/* Project Path */}
            <div className="form-group">
              <label>Project Path</label>

              <input
                type="text"
                name="project_path"
                value={formData.project_path}
                onChange={onChange}
                placeholder="/var/www/project"
                required
              />
            </div>

            {/* Deployment Script */}
            <div className="form-group">
              <label>Deployment Script Path</label>

              <input
                type="text"
                name="deployment_script_path"
                value={formData.deployment_script_path}
                onChange={onChange}
                placeholder="/var/scripts/deploy.sh"
              />
            </div>

            {/* Tech Stack */}
            <div className="form-group">
              <label>Tech Stack</label>

              <input
                type="text"
                name="tech_stack"
                value={formData.tech_stack}
                onChange={onChange}
                placeholder="React, FastAPI, MariaDB"
                required
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label>Status</label>

              <select
                name="project_status"
                value={formData.project_status}
                onChange={onChange}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Comments */}
            <div className="form-group full-width">
              <label>Comments</label>

              <textarea
                name="comments"
                value={formData.comments}
                onChange={onChange}
                rows="3"
              />
            </div>

          </div>

          <div className="modal-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? editingProject
                  ? "Updating..."
                  : "Creating..."
                : editingProject
                  ? "Update Project"
                  : "Create Project"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default ProjectForm;