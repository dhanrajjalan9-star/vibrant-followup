const SUPABASE_URL = 'https://lnljprrdxwfsdorqovew.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpwcnJkeHdmc2RvcnFvdmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mjg0MDksImV4cCI6MjA5MjEwNDQwOX0.WIyX6-0o3rdkwywnFKhNYVvnMWIxXZ1Kyb9WkrN-d3E';
const TELEGRAM_TOKEN = '8644673879:AAHXm57E8MXspMXuGuZYRGNBq18WIWb1Z2Y';
const TELEGRAM_CHAT_ID = '1645408902';
const DASHBOARD_URL = 'https://vibrant-followup.netlify.app';

function getISTDate(offsetDays = 0) {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().split('T')[0];
}

function getISTHour() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.getHours();
}

function getISTTimeStr() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getISTDateStr() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function fetchTasks() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?done=eq.false&select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text.length > 4096 ? text.substring(0, 4090) + '...' : text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  return res.json();
}

function personalMsg(name, tasks, isMorning) {
  const today    = getISTDate(0);
  const tomorrow = getISTDate(1);
  const overdue  = tasks.filter(t => t.deadline && t.deadline < today);
  const dueToday = tasks.filter(t => t.deadline === today);
  const dueTmrw  = tasks.filter(t => t.deadline === tomorrow);
  const other    = tasks.filter(t => !t.deadline || t.deadline > tomorrow);

  if (tasks.length === 0) return null;

  let m = isMorning
    ? `Good morning ${name} \uD83D\uDC4B\n\n`
    : `Afternoon check-in ${name} \u23F0\n\n`;

  if (overdue.length) {
    m += `\uD83D\uDD34 <b>Overdue:</b>\n`;
    overdue.forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.deadline).getTime()) / 86400000);
      m += `  \u2022 ${t.title} (${days}d late)\n`;
    });
    m += '\n';
  }
  if (dueToday.length) {
    m += `\uD83D\uDFE1 <b>Due today:</b>\n`;
    dueToday.forEach(t => { m += `  \u2022 ${t.title}\n`; });
    m += '\n';
  }
  if (isMorning && dueTmrw.length) {
    m += `\uD83D\uDCC5 <b>Due tomorrow:</b>\n`;
    dueTmrw.forEach(t => { m += `  \u2022 ${t.title}\n`; });
    m += '\n';
  }
  if (other.length) {
    m += `\uD83D\uDCCB <b>Other pending:</b>\n`;
    other.slice(0, 3).forEach(t => { m += `  \u2022 ${t.title}\n`; });
    if (other.length > 3) m += `  ...and ${other.length - 3} more\n`;
    m += '\n';
  }
  m += `\uD83D\uDC49 ${DASHBOARD_URL}`;
  return m;
}

function groupMsg(tasks, isMorning) {
  const today    = getISTDate(0);
  const tomorrow = getISTDate(1);
  const overdue  = tasks.filter(t => t.deadline && t.deadline < today);
  const dueToday = tasks.filter(t => t.deadline === today);
  const dueTmrw  = tasks.filter(t => t.deadline === tomorrow);
  const staff    = ['Mahendra', 'Pintu', 'Saurabh', 'Amin Master', 'Self'];

  let m = isMorning
    ? `\u2600\uFE0F <b>VIBRANT CLOTHING \u2014 MORNING BRIEF</b>\n`
    : `\uD83D\uDD51 <b>VIBRANT CLOTHING \u2014 AFTERNOON BRIEF</b>\n`;
  m += `\uD83D\uDCC6 ${getISTDateStr()} | ${getISTTimeStr()} IST\n`;
  m += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n`;

  m += `\uD83D\uDCCA ${tasks.length} open task${tasks.length !== 1 ? 's' : ''}`;
  if (overdue.length)  m += ` \u2502 \uD83D\uDD34 ${overdue.length} overdue`;
  if (dueToday.length) m += ` \u2502 \uD83D\uDFE1 ${dueToday.length} due today`;
  m += '\n\n';

  if (dueToday.length) {
    m += `\uD83D\uDCCC <b>Focus for today:</b>\n`;
    dueToday.forEach(t => { m += `  \u2022 ${t.title}${t.assign ? ` \u2014 ${t.assign}` : ''}\n`; });
    m += '\n';
  }
  if (overdue.length) {
    m += `\uD83D\uDD34 <b>Needs urgent attention:</b>\n`;
    overdue.forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.deadline).getTime()) / 86400000);
      m += `  \u2022 ${t.title}${t.assign ? ` \u2014 ${t.assign}` : ''} (${days}d late)\n`;
    });
    m += '\n';
  }
  if (isMorning && dueTmrw.length) {
    m += `\uD83D\uDCC5 <b>Due tomorrow:</b>\n`;
    dueTmrw.forEach(t => { m += `  \u2022 ${t.title}${t.assign ? ` \u2014 ${t.assign}` : ''}\n`; });
    m += '\n';
  }

  m += `\uD83D\uDC65 <b>Team load:</b>\n`;
  staff.forEach(name => {
    const mine = tasks.filter(t => t.assign === name);
    if (mine.length > 0) {
      const myOverdue = mine.filter(t => t.deadline && t.deadline < today).length;
      m += `  \u2022 ${name}: ${mine.length} task${mine.length > 1 ? 's' : ''}${myOverdue > 0 ? ' \uD83D\uDD34' : ''}\n`;
    }
  });

  m += `\n\uD83D\uDC49 ${DASHBOARD_URL}`;
  return m;
}

export default async function handler(req, res) {
  try {
    const rows = await fetchTasks();
    if (!Array.isArray(rows)) throw new Error('Failed to fetch tasks from Supabase');

    const tasks = rows.map(r => ({
      title:    r.title,
      assign:   r.assign || '',
      deadline: r.deadline || '',
      cat:      r.cat,
      priority: r.priority || 'medium'
    }));

    const isMorning = getISTHour() < 13;
    const staffList = ['Mahendra', 'Pintu', 'Saurabh', 'Amin Master', 'Self'];

    // Build personal messages block
    let personalBlock = isMorning
      ? `\uD83C\uDF05 <b>VIBRANT OPS \u2014 MORNING SUMMARY</b>\n`
      : `\u2615 <b>VIBRANT OPS \u2014 AFTERNOON SUMMARY</b>\n`;
    personalBlock += `\uD83D\uDD50 ${getISTTimeStr()} IST \u2014 ${getISTDateStr()}\n`;
    personalBlock += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n`;
    personalBlock += `<b>\uD83D\uDCCB PERSONAL MESSAGES</b>\n<i>(copy &amp; paste to each person on WhatsApp)</i>\n\n`;

    let hasPersonal = false;
    for (const name of staffList) {
      const myTasks = tasks.filter(t => t.assign === name);
      const msg = personalMsg(name, myTasks, isMorning);
      if (msg) {
        personalBlock += `\uD83D\uDC64 <b>${name}</b>\n${msg}\n\n\u2796\u2796\u2796\u2796\u2796\u2796\u2796\n\n`;
        hasPersonal = true;
      }
    }
    if (!hasPersonal) personalBlock += 'No pending tasks for any staff member today \u2705\n\n';

    // Build group message block
    let groupBlock = `<b>\uD83D\uDC65 GROUP MESSAGE</b>\n<i>(copy &amp; paste to your WhatsApp team group)</i>\n\n`;
    groupBlock += groupMsg(tasks, isMorning);

    // Send both messages to Telegram
    await sendTelegram(personalBlock);
    await new Promise(r => setTimeout(r, 500));
    await sendTelegram(groupBlock);

    res.status(200).json({ ok: true, tasks: tasks.length, time: getISTTimeStr() });
  } catch (err) {
    console.error(err);
    await sendTelegram(`\u26A0\uFE0F Vibrant reminder error:\n${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
}
