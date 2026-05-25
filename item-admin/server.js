// Local web admin for the Unturned market item list (sv_market).
// The browser can't talk to MySQL directly, so this tiny backend holds ONE in-memory
// connection (set via the connect form) and exposes a small CRUD API. The connection
// (incl. password) lives only in RAM and is gone when the server stops.
//
//   npm install   &&   npm start    ->   http://localhost:3777
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(express.json());

// CORS — allow the local Expo web app (different port) to call this API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, "public")));

let pool = null;
let prefix = "sv_";

const cleanPrefix = (p) => String(p || "sv_").replace(/[^a-zA-Z0-9_]/g, "") || "sv_";
const marketTable = () => "`" + cleanPrefix(prefix) + "market`";

function requirePool(req, res, next) {
  if (!pool) return res.status(401).json({ error: "not connected" });
  next();
}

app.post("/api/connect", async (req, res) => {
  const { host, port, database, user, password, tablePrefix } = req.body || {};
  try {
    const p = mysql.createPool({
      host: host || "localhost",
      port: Number(port) || 3306,
      user: user || "root",
      password: password || "",
      database,
      waitForConnections: true,
      connectionLimit: 4,
    });
    const conn = await p.getConnection();
    await conn.query("SELECT 1");
    const tbl = "`" + cleanPrefix(tablePrefix) + "market`";
    await conn.query(
      `CREATE TABLE IF NOT EXISTS ${tbl} (` +
        "`item_id` INT UNSIGNED PRIMARY KEY,`name` VARCHAR(64) NOT NULL," +
        "`price` DOUBLE NOT NULL DEFAULT 0,`amount` INT NOT NULL DEFAULT 0," +
        "`image_url` VARCHAR(512) NULL,`enabled` TINYINT(1) NOT NULL DEFAULT 1" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    conn.release();
    if (pool) pool.end().catch(() => {});
    pool = p;
    prefix = cleanPrefix(tablePrefix);
    res.json({ ok: true, database, user, prefix });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post("/api/disconnect", (req, res) => {
  if (pool) { pool.end().catch(() => {}); pool = null; }
  res.json({ ok: true });
});

app.get("/api/items", requirePool, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT item_id,name,price,amount,image_url,enabled FROM ${marketTable()} ORDER BY name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/items", requirePool, async (req, res) => {
  const { item_id, name, price, amount, image_url, enabled } = req.body || {};
  if (!item_id || !name) return res.status(400).json({ error: "item_id และ name จำเป็น" });
  try {
    await pool.query(
      `INSERT INTO ${marketTable()} (item_id,name,price,amount,image_url,enabled) VALUES (?,?,?,?,?,?) ` +
        "ON DUPLICATE KEY UPDATE name=VALUES(name),price=VALUES(price),amount=VALUES(amount)," +
        "image_url=VALUES(image_url),enabled=VALUES(enabled)",
      [Number(item_id), name, Number(price) || 0, Number(amount) || 0, image_url || null, enabled ? 1 : 0]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/items/:id", requirePool, async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${marketTable()} WHERE item_id=?`, [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3777;
app.listen(PORT, "127.0.0.1", () =>
  console.log(`tubertools item-admin -> http://localhost:${PORT}`)
);
