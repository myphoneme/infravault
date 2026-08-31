import { createPortal } from "react-dom";

function ProjectForm({
  formData,
  devices,
  editingProject,
  saving,
  onChange,
  onSubmit,
  onCancel,
}) {
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

              <input
                type="text"
                name="repo_name"
                value={formData.repo_name}
                onChange={onChange}
                required
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

              <input
                type="number"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={onChange}
                placeholder="User ID"
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
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Archived">Archived</option>
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