function ProjectList({ projects, onView ,onEdit , onDelete }) {
  if (projects.length === 0) {
    return (
      <div className="table-card">
        <p>No projects found.</p>
      </div>
    );
  }

  return (
    <div className="table-card">

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Project Name</th>
            <th>Repository</th>
            <th>Start Date</th>
            <th>Deadline</th>
            <th>Tech Stack</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {projects.map((project) => (
            <tr key={project.id}>

              <td>{project.id}</td>

              <td>{project.project_name}</td>

              <td>{project.repo_name}</td>

              <td>{project.start_date}</td>

              <td>{project.deadline}</td>

              <td>{project.tech_stack}</td>

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

              <td>
                <div className="action-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onView(project)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => onEdit(project)}
                >
                  Edit
                </button>
                <button
                   type="button"
                   className="delete-button"
                   onClick={() => onDelete(project)}
                 >
                   Delete
                </button>
              </div>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ProjectList;