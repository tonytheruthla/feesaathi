import { Pool } from "pg";

// Postgres data layer. Works with any Postgres — local dev, or a free
// hosted DB (Neon/Supabase) via DATABASE_URL. SSL auto-enabled for
// hosted URLs (sslmode=require / neon.tech).

// --- Types (camelCase — queries alias snake_case columns) ---

export type Tutor = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  businessName: string;
  phone: string;
  upiId: string;
  msgLanguage: string;
};

export type Student = {
  id: string;
  tutorId: string;
  name: string;
  parentName: string;
  parentPhone: string;
  monthlyFee: number;
  dueDay: number;
  batch: string;
  active: boolean;
  notes: string;
};

export type Due = {
  id: string;
  studentId: string;
  month: string;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt: string | null;
  paymentMethod: string;
  razorpayLinkId: string;
  razorpayLinkUrl: string;
};

export type ReminderLog = {
  id: string;
  dueId: string;
  channel: string;
  status: string;
  detail: string;
  sentAt: string;
};

export type ClassSlot = {
  id: string;
  tutorId: string;
  batch: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // "17:00"
  endTime: string; // "18:00"
};

export type AttendanceMark = {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: "P" | "A";
};

// --- Connection ---

const globalForDb = globalThis as unknown as {
  __pool?: Pool;
  __initPromise?: Promise<void>;
};

function makePool() {
  const url =
    process.env.DATABASE_URL ||
    "postgres://feesaathi:localdev@localhost:5432/feesaathi";
  const needsSsl =
    /sslmode=require/.test(url) || /neon\.tech|supabase|render\.com/.test(url);
  return new Pool({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 3, // friendly to free-tier connection limits
  });
}

const pool = globalForDb.__pool || makePool();
globalForDb.__pool = pool;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tutor (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  upi_id TEXT NOT NULL DEFAULT '',
  msg_language TEXT NOT NULL DEFAULT 'hinglish',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS student (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutor(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_name TEXT NOT NULL DEFAULT '',
  parent_phone TEXT NOT NULL,
  monthly_fee INTEGER NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 5,
  batch TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS due (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL DEFAULT '',
  razorpay_link_id TEXT NOT NULL DEFAULT '',
  razorpay_link_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, month)
);
CREATE TABLE IF NOT EXISTS reminder_log (
  id TEXT PRIMARY KEY,
  due_id TEXT NOT NULL REFERENCES due(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT',
  detail TEXT NOT NULL DEFAULT '',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS class_slot (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutor(id) ON DELETE CASCADE,
  batch TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(student_id, date)
);
`;

async function ensureSchema() {
  if (!globalForDb.__initPromise) {
    globalForDb.__initPromise = pool.query(SCHEMA).then(() => undefined);
  }
  return globalForDb.__initPromise;
}

export async function q<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

export function cuid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
  );
}

// --- Column lists (aliased to camelCase) ---

const TUTOR_COLS = `id, email, password_hash AS "passwordHash", name,
  business_name AS "businessName", phone, upi_id AS "upiId",
  msg_language AS "msgLanguage"`;

const STUDENT_COLS = `id, tutor_id AS "tutorId", name,
  parent_name AS "parentName", parent_phone AS "parentPhone",
  monthly_fee AS "monthlyFee", due_day AS "dueDay", batch, active, notes`;

const DUE_COLS = `id, student_id AS "studentId", month, amount, status,
  paid_at AS "paidAt", payment_method AS "paymentMethod",
  razorpay_link_id AS "razorpayLinkId", razorpay_link_url AS "razorpayLinkUrl"`;

const SLOT_COLS = `id, tutor_id AS "tutorId", batch,
  day_of_week AS "dayOfWeek", start_time AS "startTime", end_time AS "endTime"`;

// --- Tutors ---

export const tutors = {
  byEmail: async (email: string) =>
    (await q<Tutor>(`SELECT ${TUTOR_COLS} FROM tutor WHERE email = $1`, [email]))[0],
  byId: async (id: string) =>
    (await q<Tutor>(`SELECT ${TUTOR_COLS} FROM tutor WHERE id = $1`, [id]))[0],
  create: async (t: {
    email: string; passwordHash: string; name: string;
    businessName: string; upiId: string; phone?: string;
  }) => {
    const id = cuid();
    await q(
      `INSERT INTO tutor (id, email, password_hash, name, business_name, phone, upi_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, t.email, t.passwordHash, t.name, t.businessName, t.phone || "", t.upiId]
    );
    return tutors.byId(id);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const map: Record<string, string> = {
      name: "name", businessName: "business_name", phone: "phone",
      upiId: "upi_id", msgLanguage: "msg_language",
    };
    const keys = Object.keys(data).filter((k) => map[k]);
    if (keys.length) {
      const sets = keys.map((k, i) => `${map[k]} = $${i + 2}`).join(", ");
      await q(`UPDATE tutor SET ${sets} WHERE id = $1`, [id, ...keys.map((k) => data[k])]);
    }
    return tutors.byId(id);
  },
};

// --- Students ---

export const students = {
  list: async (tutorId: string) =>
    q<Student>(
      `SELECT ${STUDENT_COLS} FROM student WHERE tutor_id = $1
       ORDER BY active DESC, name ASC`, [tutorId]),
  listActive: async (tutorId: string) =>
    q<Student>(
      `SELECT ${STUDENT_COLS} FROM student WHERE tutor_id = $1 AND active = true`,
      [tutorId]),
  byId: async (id: string) =>
    (await q<Student>(`SELECT ${STUDENT_COLS} FROM student WHERE id = $1`, [id]))[0],
  create: async (s: {
    tutorId: string; name: string; parentName: string; parentPhone: string;
    monthlyFee: number; dueDay: number; batch: string; notes: string;
  }) => {
    const id = cuid();
    await q(
      `INSERT INTO student (id, tutor_id, name, parent_name, parent_phone,
        monthly_fee, due_day, batch, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, s.tutorId, s.name, s.parentName, s.parentPhone,
       s.monthlyFee, s.dueDay, s.batch, s.notes]
    );
    return students.byId(id);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const map: Record<string, string> = {
      name: "name", parentName: "parent_name", parentPhone: "parent_phone",
      monthlyFee: "monthly_fee", dueDay: "due_day", batch: "batch",
      notes: "notes", active: "active",
    };
    const keys = Object.keys(data).filter((k) => map[k]);
    if (keys.length) {
      const sets = keys.map((k, i) => `${map[k]} = $${i + 2}`).join(", ");
      await q(`UPDATE student SET ${sets} WHERE id = $1`, [id, ...keys.map((k) => data[k])]);
    }
    return students.byId(id);
  },
  remove: async (id: string) => q(`DELETE FROM student WHERE id = $1`, [id]),
};

// --- Dues ---

export type DueWithStudent = Due & { student: Student; reminders: { sentAt: string; channel: string }[] };

export const dues = {
  boardForMonth: async (tutorId: string, month: string): Promise<DueWithStudent[]> => {
    const rows = await q<Due>(
      `SELECT d.id, d.student_id AS "studentId", d.month, d.amount, d.status,
         d.paid_at AS "paidAt", d.payment_method AS "paymentMethod",
         d.razorpay_link_id AS "razorpayLinkId", d.razorpay_link_url AS "razorpayLinkUrl"
       FROM due d
       JOIN student s ON s.id = d.student_id
       WHERE s.tutor_id = $1 AND d.month = $2
       ORDER BY d.status DESC, d.created_at ASC`, [tutorId, month]);
    const out: DueWithStudent[] = [];
    for (const d of rows) {
      const student = await students.byId(d.studentId);
      const rem = await q<{ sentAt: string; channel: string }>(
        `SELECT sent_at AS "sentAt", channel FROM reminder_log
         WHERE due_id = $1 ORDER BY sent_at DESC LIMIT 1`, [d.id]);
      out.push({ ...d, student, reminders: rem });
    }
    return out;
  },
  byId: async (id: string) =>
    (await q<Due>(`SELECT ${DUE_COLS} FROM due WHERE id = $1`, [id]))[0],
  byStudentMonth: async (studentId: string, month: string) =>
    (await q<Due>(
      `SELECT ${DUE_COLS} FROM due WHERE student_id = $1 AND month = $2`,
      [studentId, month]))[0],
  byRazorpayLinkId: async (linkId: string) =>
    (await q<Due>(`SELECT ${DUE_COLS} FROM due WHERE razorpay_link_id = $1`, [linkId]))[0],
  create: async (studentId: string, month: string, amount: number) => {
    const id = cuid();
    await q(`INSERT INTO due (id, student_id, month, amount) VALUES ($1,$2,$3,$4)`,
      [id, studentId, month, amount]);
    return dues.byId(id);
  },
  setRazorpayLink: (id: string, linkId: string, url: string) =>
    q(`UPDATE due SET razorpay_link_id = $2, razorpay_link_url = $3 WHERE id = $1`,
      [id, linkId, url]),
  markPaid: (id: string, method: string) =>
    q(`UPDATE due SET status = 'PAID', paid_at = now(), payment_method = $2 WHERE id = $1`,
      [id, method]),
  markPending: (id: string) =>
    q(`UPDATE due SET status = 'PENDING', paid_at = NULL, payment_method = '' WHERE id = $1`,
      [id]),
};

// --- Reminder logs ---

export const reminderLogs = {
  create: (l: { dueId: string; channel: string; status: string; detail: string }) =>
    q(`INSERT INTO reminder_log (id, due_id, channel, status, detail)
       VALUES ($1,$2,$3,$4,$5)`, [cuid(), l.dueId, l.channel, l.status, l.detail]),
};

// --- Class schedule ---

export const classSlots = {
  list: (tutorId: string) =>
    q<ClassSlot>(
      `SELECT ${SLOT_COLS} FROM class_slot WHERE tutor_id = $1
       ORDER BY day_of_week, start_time`, [tutorId]),
  byId: async (id: string) =>
    (await q<ClassSlot>(`SELECT ${SLOT_COLS} FROM class_slot WHERE id = $1`, [id]))[0],
  create: async (s: {
    tutorId: string; batch: string; dayOfWeek: number;
    startTime: string; endTime: string;
  }) => {
    const id = cuid();
    await q(
      `INSERT INTO class_slot (id, tutor_id, batch, day_of_week, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, s.tutorId, s.batch, s.dayOfWeek, s.startTime, s.endTime]);
    return classSlots.byId(id);
  },
  remove: (id: string) => q(`DELETE FROM class_slot WHERE id = $1`, [id]),
};

// --- Attendance ---

export const attendance = {
  forDate: (tutorId: string, date: string) =>
    q<AttendanceMark>(
      `SELECT a.id, a.student_id AS "studentId", a.date, a.status
       FROM attendance a JOIN student s ON s.id = a.student_id
       WHERE s.tutor_id = $1 AND a.date = $2`, [tutorId, date]),
  mark: async (studentId: string, date: string, status: "P" | "A") => {
    await q(
      `INSERT INTO attendance (id, student_id, date, status)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (student_id, date) DO UPDATE SET status = $4`,
      [cuid(), studentId, date, status]);
  },
  monthlyPct: async (studentId: string, monthPrefix: string) => {
    const rows = await q<{ p: string; t: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'P') AS p, COUNT(*) AS t
       FROM attendance WHERE student_id = $1 AND date LIKE $2`,
      [studentId, monthPrefix + "%"]);
    const t = Number(rows[0]?.t || 0);
    return t === 0 ? null : Math.round((Number(rows[0].p) / t) * 100);
  },
};
