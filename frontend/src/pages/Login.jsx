import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import "./Login.css";

function Login() {
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter email");
      return;
    }

    // ✅ Pass object, not string
    login({ email });

    // optional: clear input
    setEmail("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🔐 AI Screener Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
