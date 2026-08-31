import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/Devices/DeviceDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/Projects/ProjectDetails";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<Users />} />
          <Route path="devices" element={<Devices />} />

          <Route
            path="devices/:deviceId"
            element={<DeviceDetails />}
          />

          <Route path="projects" element={<Projects />} />

          <Route
            path="projects/:projectId"
            element={<ProjectDetails />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;