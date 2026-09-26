import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:3000/users", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setSuccessMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: "420px", margin: "48px auto", padding: "0 20px" }}>
      <h1>Register</h1>
      <p style={{ marginBottom: "24px" }}>Create your student account.</p>

      <form onSubmit={handleRegister} style={{ display: "grid", gap: "16px", textAlign: "left" }}>
        <label>
          Name
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}
          />
        </label>

        <label>
          Confirm Password
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={6}
            required
            style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px", marginTop: "6px" }}
          />
        </label>

        {errorMessage && <p style={{ color: "#b42318" }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: "#027a48" }}>{successMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Student Account"}
        </button>
      </form>

      <p style={{ marginTop: "24px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default Register;
