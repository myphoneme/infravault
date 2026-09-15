import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

const Icon = ({ children, className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/login", {
        email: email.trim(),
        password,
      });

      const { access_token, user } = response.data;

      // Keep the existing JWT-based authentication contract.
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Preserve the user's preference without storing the password.
      if (rememberMe) {
        localStorage.setItem("remembered_email", email.trim());
      } else {
        localStorage.removeItem("remembered_email");
      }

      navigate("/");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      console.log("LOGIN ERROR:", err.response?.data?.detail);
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
      <div className="login-brand-content">

     <div className="logo-container">
      <img
        src="/phoneme-logo.png"
        alt="Phoneme Solutions"
        className="phoneme-logo"
      />
    </div>

    <h2 className="login-brand-title">
      INFRA<span>VAULT</span>
    </h2>

    <div className="login-brand-line" />
          <p className="login-brand-description">
            A unified platform to manage your projects, devices, and users
            efficiently.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <Icon>
                  <path d="M3 8.5h18" />
                  <path d="M5 8.5V20h14V8.5" />
                  <path d="M8 8.5V5h8v3.5" />
                  <path d="M8 13h8" />
                </Icon>
              </div>
              <div>
                <h3>Project Management</h3>
                <p>Plan, organize, and track all your projects in one place.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <Icon>
                  <rect x="3" y="4" width="18" height="13" rx="1.5" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </Icon>
              </div>
              <div>
                <h3>Device Management</h3>
                <p>Monitor, manage, and maintain your infrastructure devices.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <Icon>
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
                  <path d="M16 5.5a3 3 0 0 1 0 5.5" />
                  <path d="M18 14.5c1.8.8 3 2.7 3 5" />
                </Icon>
              </div>
              <div>
                <h3>User Management</h3>
                <p>Manage users, roles, and permissions with ease.</p>
              </div>
            </div>
          </div>
        </div>

        <svg className="login-wave" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 270 C140 210 180 350 340 285 S610 150 1000 265" />
          <path d="M0 285 C140 225 190 365 350 300 S625 165 1000 280" />
          <path d="M0 300 C135 240 200 380 360 315 S640 180 1000 295" />
          <path d="M0 315 C130 255 205 395 370 330 S655 195 1000 310" />
          <path d="M0 330 C125 270 215 410 380 345 S670 210 1000 325" />
          <path d="M0 345 C120 285 225 425 390 360 S685 225 1000 340" />
        </svg>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Sign in to your InfraVault account</p>

          <button
            type="button"
            className="login-google-button"
            disabled
            title="Google sign-in is not configured yet"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.27c0-.77-.07-1.51-.22-2.22H12v4.2h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.37Z" />
              <path fill="#34A853" d="M12 21.99c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99Z" />
              <path fill="#FBBC05" d="M6.54 14.08A5.85 5.85 0 0 1 6.24 12c0-.72.12-1.42.3-2.08V7.39H3.3A9.99 9.99 0 0 0 2.25 12c0 1.67.4 3.24 1.05 4.61l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 5.89c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 2.98 14.63 2.01 12 2.01a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.61 9.46 5.89 12 5.89Z" />
            </svg>
            Sign in with Google
          </button>

          <div className="login-divider">or continue with</div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <div className="login-input-wrap">
                <Icon className="login-input-icon">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </Icon>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Icon className="login-input-icon">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </Icon>
                <input
                  id="login-password"
                  className="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon>
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.4 3.1" />
                        <path d="M6.2 6.3C4.5 7.4 3.3 9 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.8-.5" />
                      </>
                    ) : (
                      <>
                        <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </>
                    )}
                  </Icon>
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="login-forgot"
                onClick={() => setError("Password reset is not available yet.")}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-access-note">
            Only authorized users can sign in.<br />
            Contact your <strong>administrator</strong> for access.
          </p>
        </div>

        <div className="login-footer">
          © 2026 <span>InfraVault</span>. All rights reserved.
        </div>
      </section>
    </main>
  );
}

export default Login;
