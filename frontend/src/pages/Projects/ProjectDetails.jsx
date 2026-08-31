import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/projects/${projectId}`
      );

      setProject(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading project...</h2>;
  }

  if (error) {
    return (
      <div className="device-page">
        <div className="error-message">
          {error}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="device-page">
        <div className="error-message">
          Project not found.
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="device-page">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>{project.project_name}</h1>

          <p>
            Project Details
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/projects")}
        >
          ← Back to Projects
        </button>
      </div>

      {/* DETAILS */}

      <div className="table-card">

        <table>
          <tbody>

            <tr>
              <th>ID</th>
              <td>{project.id}</td>
            </tr>

            <tr>
              <th>Project Name</th>
              <td>{project.project_name}</td>
            </tr>

            <tr>
              <th>Repository</th>
              <td>{project.repo_name}</td>
            </tr>

            <tr>
              <th>Start Date</th>
              <td>{project.start_date}</td>
            </tr>

            <tr>
              <th>Deadline</th>
              <td>{project.deadline}</td>
            </tr>

            <tr>
              <th>Device ID</th>
              <td>{project.device_master_id}</td>
            </tr>

            <tr>
              <th>Assigned To</th>
              <td>{project.assigned_to || "Not assigned"}</td>
            </tr>

            <tr>
              <th>Project Path</th>
              <td>{project.project_path}</td>
            </tr>

            <tr>
              <th>Deployment Script</th>
              <td>
                {project.deployment_script_path || "Not specified"}
              </td>
            </tr>

            <tr>
              <th>Tech Stack</th>
              <td>{project.tech_stack}</td>
            </tr>

            <tr>
              <th>Status</th>
              <td>
                <span
                  className={
                    project.project_status === "Active"
                      ? "status-active"
                      : "status-inactive"
                  }
                >
                  {project.project_status}
                </span>
              </td>
            </tr>

            <tr>
              <th>Comments</th>
              <td>
                {project.comments || "No comments"}
              </td>
            </tr>

          </tbody>
        </table>

      </div>

    </div>
  );
}

export default ProjectDetails;