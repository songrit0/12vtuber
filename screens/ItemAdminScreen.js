import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, Switch, Platform, StyleSheet,
} from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Colors } from '../theme/colors';
import { app } from '../services/firebaseConfig';

// Calls the marketAdmin Cloud Function (asia-southeast1) which talks to the external MySQL.
const marketAdmin = httpsCallable(getFunctions(app, 'asia-southeast1'), 'marketAdmin');
const CONN_KEY = 'tubertools_item_conn';

const loadConn = () => {
  if (Platform.OS !== 'web') return {};
  try { return JSON.parse(window.localStorage.getItem(CONN_KEY) || '{}'); } catch { return {}; }
};
const saveConn = (c) => {
  if (Platform.OS === 'web') window.localStorage.setItem(CONN_KEY, JSON.stringify(c));
};

const emptyItem = { item_id: '', name: '', price: '0', amount: '0', image_url: '', enabled: true };

export default function ItemAdminScreen({ navigation }) {
  const saved = loadConn();
  const [conn, setConn] = useState({
    host: saved.host || 'localhost', port: saved.port || '3306', database: saved.database || 'unturned',
    user: saved.user || 'root', tablePrefix: saved.tablePrefix || 'sv_', password: '',
  });
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...emptyItem });
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState('');

  const setC = (k, v) => setConn((p) => ({ ...p, [k]: v }));
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function connect() {
    setErr('');
    try {
      await marketAdmin({ action: 'ping', conn });
      saveConn({ host: conn.host, port: conn.port, database: conn.database, user: conn.user, tablePrefix: conn.tablePrefix });
      setConnected(true);
      loadItems();
    } catch (e) {
      setErr('เชื่อมต่อไม่สำเร็จ: ' + (e.message || String(e)));
    }
  }

  async function loadItems() {
    try { const r = await marketAdmin({ action: 'list', conn }); setItems((r.data && r.data.items) || []); }
    catch (e) { setErr(e.message || String(e)); }
  }

  async function saveItem() {
    setErr('');
    if (!form.item_id || !form.name) { setErr('ต้องมี Item ID และ ชื่อ'); return; }
    try {
      await marketAdmin({ action: 'upsert', conn, payload: {
        item_id: Number(form.item_id), name: form.name, price: Number(form.price) || 0,
        amount: Number(form.amount) || 0, image_url: form.image_url || null, enabled: form.enabled,
      } });
      setForm({ ...emptyItem }); setEditing(false); loadItems();
    } catch (e) { setErr(e.message || String(e)); }
  }

  function editItem(it) {
    setForm({
      item_id: String(it.item_id), name: it.name, price: String(Math.round(it.price)),
      amount: String(it.amount), image_url: it.image_url || '', enabled: !!it.enabled,
    });
    setEditing(true);
  }

  async function delItem(id) {
    try { await marketAdmin({ action: 'delete', conn, payload: { item_id: id } }); loadItems(); }
    catch (e) { setErr(e.message || String(e)); }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎮 Item Admin — Market</Text>
        {connected ? (
          <TouchableOpacity onPress={() => { setConnected(false); setItems([]); }} style={styles.ghostBtn}>
            <Text style={styles.ghostTxt}>ตัดการเชื่อมต่อ</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 90 }} />}
      </View>

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {!connected ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เชื่อมต่อ MySQL</Text>
          <Text style={styles.hint}>จำทุกช่องยกเว้นรหัสผ่าน (กรอกใหม่ทุกครั้ง)</Text>
          <Field label="Host" value={conn.host} onChange={(v) => setC('host', v)} />
          <Field label="Port" value={conn.port} onChange={(v) => setC('port', v)} />
          <Field label="Database" value={conn.database} onChange={(v) => setC('database', v)} />
          <Field label="User" value={conn.user} onChange={(v) => setC('user', v)} />
          <Field label="Table prefix" value={conn.tablePrefix} onChange={(v) => setC('tablePrefix', v)} />
          <Field label="Password" value={conn.password} onChange={(v) => setC('password', v)} secure />
          <TouchableOpacity style={styles.primaryBtn} onPress={connect}>
            <Text style={styles.primaryTxt}>เชื่อมต่อ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</Text>
            <Field label="Item ID" value={form.item_id} onChange={(v) => setF('item_id', v)} keyboard="numeric" />
            <Field label="ชื่อ / Name" value={form.name} onChange={(v) => setF('name', v)} />
            <Field label="ราคา / Price" value={form.price} onChange={(v) => setF('price', v)} keyboard="numeric" />
            <Field label="สต็อก / Amount (0=ซ่อน)" value={form.amount} onChange={(v) => setF('amount', v)} keyboard="numeric" />
            <Field label="ลิงก์รูป / Image URL" value={form.image_url} onChange={(v) => setF('image_url', v)} />
            <View style={styles.switchRow}>
              <Text style={styles.label}>เปิดใช้งาน (enabled)</Text>
              <Switch value={form.enabled} onValueChange={(v) => setF('enabled', v)} />
            </View>
            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.greenBtn} onPress={saveItem}>
                <Text style={styles.primaryTxt}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => { setForm({ ...emptyItem }); setEditing(false); }}>
                <Text style={styles.ghostTxt}>ล้างฟอร์ม</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.listHeader}>
              <Text style={styles.cardTitle}>รายการทั้งหมด ({items.length})</Text>
              <TouchableOpacity style={styles.ghostBtn} onPress={loadItems}>
                <Text style={styles.ghostTxt}>รีเฟรช</Text>
              </TouchableOpacity>
            </View>
            {items.length === 0 ? <Text style={styles.hint}>ยังไม่มีรายการ</Text> : items.map((it) => (
              <View key={it.item_id} style={styles.itemRow}>
                {it.image_url ? <Image source={{ uri: it.image_url }} style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.name} <Text style={styles.itemId}>#{it.item_id}</Text></Text>
                  <Text style={styles.itemMeta}>
                    ราคา {Math.round(it.price)} · สต็อก {it.amount} · {it.enabled ? 'on' : 'off'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.ghostBtn} onPress={() => editItem(it)}>
                  <Text style={styles.ghostTxt}>แก้ไข</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.redBtn} onPress={() => delItem(it.item_id)}>
                  <Text style={styles.primaryTxt}>ลบ</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Field({ label, value, onChange, secure, keyboard }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input} value={value} onChangeText={onChange}
        secureTextEntry={!!secure} keyboardType={keyboard || 'default'}
        placeholderTextColor={Colors.fg3} autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg0 },
  content: { padding: 20, maxWidth: 820, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { paddingVertical: 6, paddingRight: 10 },
  backTxt: { color: Colors.fg2, fontSize: 15 },
  title: { color: Colors.fg0, fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: Colors.bg1, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { color: Colors.fg0, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  hint: { color: Colors.fg2, fontSize: 12, marginBottom: 8 },
  label: { color: Colors.fg2, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: Colors.bg0, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: 8, color: Colors.fg0, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: { backgroundColor: Colors.accent, borderRadius: 8, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  primaryTxt: { color: Colors.accentFg, fontWeight: '700', fontSize: 14 },
  greenBtn: { backgroundColor: Colors.green, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignItems: 'center' },
  redBtn: { backgroundColor: Colors.red, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  ghostBtn: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  ghostTxt: { color: Colors.fg1, fontSize: 13, fontWeight: '600' },
  err: { color: Colors.red, fontSize: 13, marginBottom: 10 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  thumb: { width: 40, height: 40, borderRadius: 6, backgroundColor: Colors.bg3 },
  itemName: { color: Colors.fg0, fontSize: 14, fontWeight: '600' },
  itemId: { color: Colors.fg3, fontSize: 12 },
  itemMeta: { color: Colors.fg2, fontSize: 12, marginTop: 2 },
});
