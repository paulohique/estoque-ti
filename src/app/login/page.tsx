"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [status, setStatus] = useState<string | null>(null);

  const handleLogin = async () => {
    setStatus(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.ok) {
        setStatus("Login ok. Redirecionando...");
        window.location.href = "/";
      } else {
        setStatus("Credenciais invalidas.");
      }
    } catch (error) {
      setStatus("Erro ao autenticar.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-title">Acesso ao sistema</div>
        <div className="login-sub">Use sua conta para continuar. Prefixe com .\ para autenticar fora do AD.</div>
        <div className="form-grid">
          <div>
            <label>Usuario</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleLogin}>Entrar</button>
          {status && <div className="login-status">{status}</div>}
        </div>
      </div>
    </div>
  );
}
