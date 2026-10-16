
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] =
        useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!usuario.trim() || !password) {
            setError(
                "Debes ingresar usuario y contraseña."
            );
            return;
        }

        try {
            setCargando(true);
            await login(usuario.trim(), password);

        } catch (err) {
            setError(
                err.response?.data?.mensaje ||
                "No se pudo iniciar sesión."
            );

        } finally {
            setCargando(false);
        }
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center p-3"
            style={{
                background:
                    "linear-gradient(135deg, #0f172a, #1e3a5f)"
            }}
        >
            <div
                className="card border-0 shadow-lg w-100"
                style={{
                    maxWidth: "420px",
                    borderRadius: "18px"
                }}
            >
                <div className="card-body p-4 p-md-5">

                    <div className="text-center mb-4">
                        <div
                            className="d-inline-flex align-items-center justify-content-center text-white mb-3"
                            style={{
                                width: 66,
                                height: 66,
                                borderRadius: 18,
                                background: "#2563eb"
                            }}
                        >
                            <i
                                className="bi bi-cash-coin"
                                style={{ fontSize: 30 }}
                            />
                        </div>

                        <h3 className="fw-bold mb-1">
                            CrediControl
                        </h3>

                        <p className="text-muted mb-0">
                            Gestión de créditos
                        </p>
                    </div>

                    <h5 className="fw-semibold mb-1">
                        Iniciar sesión
                    </h5>

                    <p className="text-muted small mb-4">
                        Ingresa tus credenciales
                        para continuar.
                    </p>

                    {error && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            <i className="bi bi-exclamation-circle me-2" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label
                                htmlFor="login-usuario"
                                className="form-label fw-semibold"
                            >
                                Usuario
                            </label>

                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-person" />
                                </span>

                                <input
                                    id="login-usuario"
                                    className="form-control"
                                    type="text"
                                    autoComplete="username"
                                    value={usuario}
                                    onChange={(e) =>
                                        setUsuario(e.target.value)
                                    }
                                    placeholder="Ingresa tu usuario"
                                    disabled={cargando}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="login-password"
                                className="form-label fw-semibold"
                            >
                                Contraseña
                            </label>

                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-lock" />
                                </span>

                                <input
                                    id="login-password"
                                    className="form-control"
                                    type={
                                        mostrarPassword
                                            ? "text"
                                            : "password"
                                    }
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Ingresa tu contraseña"
                                    disabled={cargando}
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setMostrarPassword(
                                            !mostrarPassword
                                        )
                                    }
                                    title={
                                        mostrarPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >
                                    <i
                                        className={
                                            mostrarPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 fw-semibold"
                            disabled={cargando}
                        >
                            {cargando ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Validando...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2" />
                                    Iniciar sesión
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
