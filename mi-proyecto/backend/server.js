const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "host.docker.internal",  // 🔥 obligatorio si MySQL está en tu PC
    user: "root",
    password: "1234",
    database: "notas_app"
  });

// 🔹 REGISTRO
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "INSERT INTO usuarios (email, password) VALUES (?, ?)",
    [email, password],
    (err) => {
      if (err) return res.status(400).json({ error: "Email ya existe" });
      res.json({ message: "Usuario creado" });
    }
  );
});

// 🔹 LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT id FROM usuarios WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (results.length === 0)
        return res.status(400).json({ error: "Credenciales incorrectas" });

      res.json({ userId: results[0].id });
    }
  );
});

// 🔹 CREAR NOTA
app.post("/api/notas", (req, res) => {
  const { userId, titulo, contenido } = req.body;

  db.query(
    "INSERT INTO notas (user_id, titulo, contenido) VALUES (?, ?, ?)",
    [userId, titulo, contenido],
    () => {
      res.json({ message: "Nota creada" });
    }
  );
});

// 🔹 OBTENER NOTAS
app.get("/api/notas/:userId", (req, res) => {
  db.query(
    "SELECT * FROM notas WHERE user_id = ?",
    [req.params.userId],
    (err, results) => {
      res.json(results);
    }
  );
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});

