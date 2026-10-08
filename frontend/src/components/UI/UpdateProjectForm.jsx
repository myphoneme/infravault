import { useEffect, useState } from "react";
import api from "../../api/axios";
import ProjectForm from "../../pages/Projects/ProjectForm";

const initialFormData = {
  project_name: "",
  repo_name: "",
  start_date: "",
  deadline: "",
  assigned_to: "",
  comments: "",
  device_master_id: "",
  project_path: "",
  deployment_script_path: "",
  tech_stack: "",
  project_status: "Pending",
};

function UpdateProjectForm({
  projectId,
  onClose,
  onUpdated,
}) {
  const [formData, setFormData] = useState(initialFormData);

  const [editingProject, setEditingProject] = useState(null);

  const [devices, setDevices] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [repositoriesLoading, setRepositoriesLoading] =
    useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [assignedUser, setAssignedUser] = useState(null);
  const [currentAssignedUser, setCurrentAssignedUser] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the selected project and the data needed by the form.
  useEffect(() => {
    if (!projectId) return;

    const loadFormData = async () => {
        try {
            setError("");
            setLoading(true);

            // Load the project first so the form can open
            // without waiting for the dropdown requests.
            const projectResponse = await api.get(
            `/projects/${projectId}`
            );

            const project = projectResponse.data;

            const assignedUserId = Number(project.assigned_to);

            setEditingProject(project);

            setFormData({
            project_name: project.project_name || "",
            repo_name: project.repo_name || "",
            start_date: project.start_date
                ? project.start_date.substring(0, 10)
                : "",
            deadline: project.deadline
                ? project.deadline.substring(0, 10)
                : "",
            assigned_to: project.assigned_to ?? "",
            comments: project.comments || "",
            device_master_id:
                project.device_master_id ?? "",
            project_path: project.project_path || "",
            deployment_script_path:
                project.deployment_script_path || "",
            tech_stack: project.tech_stack || "",
            project_status:
                project.project_status || "Pending",
            });

            setLoading(false);

            // Load dropdown data in parallel after the
            // project form has become visible.
            const [
            devicesResponse,
            repositoriesResponse,
            usersResponse,
            ] = await Promise.all([
            api.get("/devices/"),
            api.get("/github/repositories"),
            api.get("/users/assignable"),
            ]);

            const loadedDevices =
            devicesResponse.data?.data || [];

            const loadedRepositories =
            repositoriesResponse.data || [];

            const loadedUsers =
            usersResponse.data || [];

            let existingAssignedUser =
            loadedUsers.find(
                (user) =>
                Number(user.id) === assignedUserId
            ) || null;

            if (!existingAssignedUser && project.assigned_to) {
            try {
                const userResponse = await api.get(
                `/users/${project.assigned_to}`
                );

                existingAssignedUser = userResponse.data;
            } catch (err) {
                console.error(
                "Failed to load the project's assigned user:",
                err
                );
            }
            }

            const usersForForm = [...loadedUsers];

            if (
            existingAssignedUser &&
            !usersForForm.some(
                (user) =>
                Number(user.id) ===
                Number(existingAssignedUser.id)
            )
            ) {
            usersForForm.push(existingAssignedUser);
            }

            setDevices(loadedDevices);
            setRepositories(loadedRepositories);
            setUsers(usersForForm);

            setAssignedUser(existingAssignedUser);
            setCurrentAssignedUser(existingAssignedUser);
        } catch (err) {
            console.error(err);

            setError(
            err.response?.data?.detail ||
                "Failed to load project details"
            );
        } finally {
            setLoading(false);
        }
        };



    loadFormData();
  }, [projectId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "device_master_id" ||
        name === "assigned_to"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingProject) return;

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/projects/${editingProject.id}`,
        formData
      );

      if (onUpdated) {
        await onUpdated();
      }

      onClose();
    } catch (err) {
      console.error(err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail.map((item) => item.msg).join(", ")
        );
      } else {
        setError(
          detail || "Failed to update project"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) return null;

  if (error && !editingProject) {
    return (
      <div className="modal-overlay notification-record-modal">
        <div
          className="form-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="form-modal-header">
            <h2>Update Project</h2>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <p>{error}</p>

          <div className="form-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !editingProject) {
  return (
    <div className="modal-overlay notification-record-modal">
      <div className="form-modal">
        <div className="form-modal-header">
          <h2>Update Project</h2>
        </div>

        <p>Loading project...</p>
      </div>
    </div>
  );
}

if (!editingProject) {
  return null;
}

  return (
    <ProjectForm
      formData={formData}
      devices={devices}
      repositories={repositories}
      repositoriesLoading={repositoriesLoading}
      users={users}
      usersLoading={usersLoading}
      assignedUser={assignedUser}
      currentAssignedUser={currentAssignedUser}
      editingProject={editingProject}
      saving={saving}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={onClose}
      modalClassName="notification-record-modal"
    />
  );
}

export default UpdateProjectForm;