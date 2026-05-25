const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');

admin.initializeApp();

async function requireAdmin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Not authenticated');
  const snap = await admin.database().ref(`users/${request.auth.uid}/role`).get();
  if (snap.val() !== 'admin') throw new HttpsError('permission-denied', 'Admin only');
}

// Item-admin: CRUD on the Unturned market list against the external MySQL.
// Connection details (incl. password) are passed per call from the client.
exports.marketAdmin = onCall(
  { region: 'asia-southeast1', timeoutSeconds: 30 },
  async (request) => {
    await requireAdmin(request);
    const { conn, action, payload } = request.data || {};
    if (!conn || !conn.host) throw new HttpsError('invalid-argument', 'conn required');

    const prefix = String(conn.tablePrefix || 'sv_').replace(/[^a-zA-Z0-9_]/g, '') || 'sv_';
    const table = '`' + prefix + 'market`';

    let c;
    try {
      c = await mysql.createConnection({
        host: conn.host, port: Number(conn.port) || 3306, user: conn.user,
        password: conn.password, database: conn.database, connectTimeout: 10000,
      });

      if (action === 'ping') {
        await c.query(
          `CREATE TABLE IF NOT EXISTS ${table} (` +
            '`item_id` INT UNSIGNED PRIMARY KEY,`name` VARCHAR(64) NOT NULL,' +
            '`price` DOUBLE NOT NULL DEFAULT 0,`amount` INT NOT NULL DEFAULT 0,' +
            '`image_url` VARCHAR(512) NULL,`enabled` TINYINT(1) NOT NULL DEFAULT 1' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
        return { ok: true };
      }
      if (action === 'list') {
        const [rows] = await c.query(
          `SELECT item_id,name,price,amount,image_url,enabled FROM ${table} ORDER BY name`
        );
        return { items: rows };
      }
      if (action === 'upsert') {
        const p = payload || {};
        if (!p.item_id || !p.name) throw new HttpsError('invalid-argument', 'item_id และ name จำเป็น');
        await c.query(
          `INSERT INTO ${table} (item_id,name,price,amount,image_url,enabled) VALUES (?,?,?,?,?,?) ` +
            'ON DUPLICATE KEY UPDATE name=VALUES(name),price=VALUES(price),amount=VALUES(amount),' +
            'image_url=VALUES(image_url),enabled=VALUES(enabled)',
          [Number(p.item_id), p.name, Number(p.price) || 0, Number(p.amount) || 0, p.image_url || null, p.enabled ? 1 : 0]
        );
        return { ok: true };
      }
      if (action === 'delete') {
        await c.query(`DELETE FROM ${table} WHERE item_id=?`, [Number((payload || {}).item_id)]);
        return { ok: true };
      }
      throw new HttpsError('invalid-argument', 'unknown action');
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', e.message || 'db error');
    } finally {
      if (c) { try { await c.end(); } catch (_) {} }
    }
  }
);

exports.setUserPassword = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Not authenticated');
  }

  // Verify caller is admin via Realtime Database role
  const callerSnap = await admin.database()
    .ref(`users/${request.auth.uid}/role`)
    .get();
  const callerRole = callerSnap.val();

  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { uid, password } = request.data;

  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }

  await admin.auth().updateUser(uid, { password });
  return { success: true };
});
