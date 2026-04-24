import { useState } from "react";

export default function Login({ onLogin }: any) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#050505",
      color: "#fff",
      fontFamily: "monospace"
    }}>
      <div style={{
        padding: "40px",
        background: "#0a0a0a",
        borderRadius: "10px",
        border: "1px solid #222"
      }}>
        <h2 style={{ marginBottom: "20px" }}>🔐 ShadowSCAN Login</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUser(e.target.value)}
          style={input}
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPass(e.target.value)}
          style={input}
        />

        <button
          onClick={() => onLogin()}
          style={btn}
        >
          Login
        </button>
      </div>
    </div>
  );
}

const input = {
  display: "block",
  marginBottom: "15px",
  padding: "10px",
  width: "250px",
  background: "#111",
  border: "1px solid #222",
  color: "#fff"
};

const btn = {
  padding: "10px",
  width: "100%",
  background: "#00ffcc",
  border: "none",
  cursor: "pointer"
};