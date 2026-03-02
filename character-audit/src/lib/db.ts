import { openDB, DBSchema } from "idb";

export interface RelationDetail {
  name: string;
  past: string;
  present: string;
  future: string;
  isDeceased: boolean;
  causeOfDeath?: string;
}

export interface AuditData {
  id?: number;
  name: string;
  summary: string;
  whereabouts?: string;
  friends: RelationDetail[];
  associates: RelationDetail[];
  enemies: RelationDetail[];
  sources?: { title: string; uri: string }[];
  createdAt: number;
}

interface AuditDB extends DBSchema {
  audits: {
    key: number;
    value: AuditData;
    indexes: { "by-date": number };
  };
}

const DB_NAME = "character-audit-db";
const STORE_NAME = "audits";

export async function initDB() {
  return openDB<AuditDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("by-date", "createdAt");
    },
  });
}

export async function saveAudit(data: Omit<AuditData, "id" | "createdAt">) {
  const db = await initDB();
  return db.add(STORE_NAME, {
    ...data,
    createdAt: Date.now(),
  });
}

export async function getAudits() {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, "by-date");
}

export async function getAudit(id: number) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function deleteAudit(id: number) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

export async function clearAudits() {
  const db = await initDB();
  return db.clear(STORE_NAME);
}
