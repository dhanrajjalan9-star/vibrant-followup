const SUPABASE_URL = 'https://lnljprrdxwfsdorqovew.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpwcnJkeHdmc2RvcnFvdmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mjg0MDksImV4cCI6MjA5MjEwNDQwOX0.WIyX6-0o3rdkwywnFKhNYVvnMWIxXZ1Kyb9WkrN-d3E';
const TELEGRAM_TOKEN = '8644673879:AAHXm57E8MXspMXuGuZYRGNBq18WIWb1Z2Y';
const TELEGRAM_CHAT_ID = '1645408902';
const DASHBOARD_URL = 'https://vibrant-followup.netlify.app';
const STAFF_LIST = ['Mahendra', 'Pintu', 'Saurabh', 'Amin Master', 'Self'];

function getIST(offsetDays) {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  if (offsetDays) ist.setDate(ist.getDate() + offsetDays);
  return ist;
}
function istDateStr(offsetDays) {
  return getIST(offsetDays || 0).toISOString().split('T')[0];
}
function istHour() {
  return getIST(0).getHours();
}
function istTimeLabel() {
  return getIST(0).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function istDayLabel() {
  return getIST(0).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function fetchTasks() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/tasks?done=eq.false&select=*', {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY
    }
  });
  return res.json();
}

async function sendTelegram(text) {
  await fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text.length > 4000 ? text.slice(0, 3990) + '...' : text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildPersonalMsg(name, tasks, isMorning) {
  const today    = istDateStr(0);
  const tomorrow = istDateStr(1);
  const overdue  = tasks.filter(t => t.deadline && t.deadline < today);
  const dueToday = tasks.filter(t => t.deadline === today);
  const dueTmrw  = tasks.filter(t => t.deadline === tomorrow);
  const other    = tasks.filter(t => !t.deadline || t.deadline > tomorrow);

  if (tasks.length === 0) return null;

  const lines = [];
  lines.push(isMorning ? 'Good morning ' + name + ' \uD83D\uDC4B' : 'Afternoon check-in ' + name + ' \u23F0');
  lines.push('');

  if (overdue.length) {
    lines.push('\uD83D\uDD34 <b>Overdue:</b>');
    overdue.forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.deadline).getTime()) / 86400000);
      lines.push('  \u2022 ' + t.title + ' (' + days + 'd late)');
    });
    lines.push('');
  }
  if (dueToday.length) {
    lines.push('\uD83D\uDFE1 <b>Due today:</b>');
    dueToday.forEach(t => lines.push('  \u2022 ' + t.title));
    lines.push('');
  }
  if (isMorning && dueTmrw.length) {
    lines.push('\uD83D\uDCC5 <b>Due tomorrow:</b>');
    dueTmrw.forEach(t => lines.push('  \u2022 ' + t.title));
    lines.push('');
  }
  if (other.length) {
    lines.push('\uD83D\uDCCB <b>Other pending:</b>');
    other.slice(0, 3).forEach(t => lines.push('  \u2022 ' + t.title));
    if (other.length > 3) lines.push('  ...and ' + (other.length - 3) + ' more');
    lines.push('');
  }
  lines.push('\uD83D\uDC49 ' + DASHBOARD_URL);
  return lines.join('\n');
}

function buildGroupMsg(tasks, isMorning) {
  const today    = istDateStr(0);
  const tomorrow = istDateStr(1);
  const overdue  = tasks.filter(t => t.deadline && t.deadline < today);
  const dueToday = tasks.filter(t => t.deadline === today);
  const dueTmrw  = tasks.filter(t => t.deadline === tomorrow);

  const lines = [];
  lines.push(isMorning
    ? '\u2600\uFE0F <b>VIBRANT CLOTHING \u2014 MORNING BRIEF</b>'
    : '\uD83D\uDD51 <b>VIBRANT CLOTHING \u2014 AFTERNOON BRIEF</b>');
  lines.push('\uD83D\uDCC6 ' + istDayLabel() + ' | ' + istTimeLabel() + ' IST');
  lines.push('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  lines.push('');

  let snap = '\uD83D\uDCCA ' + tasks.length + ' open task' + (tasks.length !== 1 ? 's' : '');
  if (overdue.length)  snap += ' \u2502 \uD83D\uDD34 ' + overdue.length + ' overdue';
  if (dueToday.length) snap += ' \u2502 \uD83D\uDFE1 ' + dueToday.length + ' due today';
  lines.push(snap);
  lines.push('');

  if (dueToday.length) {
    lines.push('\uD83D\uDCCC <b>Focus for today:</b>');
    dueToday.forEach(t => lines.push('  \u2022 ' + t.title + (t.assign ? ' \u2014 ' + t.assign : '')));
    lines.push('');
  }
  if (overdue.length) {
    lines.push('\uD83D\uDD34 <b>Needs urgent attention:</b>');
    overdue.forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.deadline).getTime()) / 86400000);
      lines.push('  \u2022 ' + t.title + (t.assign ? ' \u2014 ' + t.assign : '') + ' (' + days + 'd late)');
    });
    lines.push('');
  }
  if (isMorning && dueTmrw.length) {
    lines.push('\uD83D\uDCC5 <b>Due tomorrow:</b>');
    dueTmrw.forEach(t => lines.push('  \u2022 ' + t.title + (t.assign ? ' \u2014 ' + t.assign : '')));
    lines.push('');
  }

  lines.push('\uD83D\uDC65 <b>Team load:</b>');
  STAFF_LIST.forEach(name => {
    const mine = tasks.filter(t => t.assign === name);
    if (mine.length > 0) {
      const hasOverdue = mine.some(t => t.deadline && t.deadline < today);
      lines.push('  \u2022 ' + name + ': ' + mine.length + ' task' + (mine.length > 1 ? 's' : '') + (hasOverdue ? ' \uD83D\uDD34' : ''));
    }
  });

  lines.push('');
  lines.push('\uD83D\uDC49 ' + DASHBOARD_URL);
  return lines.join('\n');
}

export default async function handler(req, res) {
  try {
    const rows = await fetchTasks();
    if (!Array.isArray(rows)) throw new Error('Supabase fetch failed: ' + JSON.stringify(rows));

    const tasks = rows.map(r => ({
      title:    r.title || '',
      assign:   r.assign || '',
      deadline: r.deadline || '',
      cat:      r.cat || '',
      priority: r.priority || 'medium'
    }));

    const isMorning = istHour() < 13;
    const sessionLabel = isMorning ? 'MORNING SUMMARY' : 'AFTERNOON SUMMARY';

    // 1. Header
    const headerLines = [
      (isMorning ? '\uD83C\uDF05' : '\u2615') + ' <b>VIBRANT OPS \u2014 ' + sessionLabel + '</b>',
      '\uD83D\uDD50 ' + istTimeLabel() + ' IST \u2014 ' + istDayLabel(),
      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
      tasks.length + ' open task' + (tasks.length !== 1 ? 's' : '') + ' total'
    ];
    await sendTelegram(headerLines.join('\n'));
    await delay(500);

    // 2. One message per staff member
    let sent = 0;
    for (const name of STAFF_LIST) {
      const myTasks = tasks.filter(t => t.assign === name);
      const msg = buildPersonalMsg(name, myTasks, isMorning);
      if (msg) {
        await sendTelegram(msg);
        await delay(500);
        sent++;
      }
    }
    if (sent === 0) {
      await sendTelegram('\u2705 No pending tasks for any staff member today');
      await delay(500);
    }

    // 3. Group message
    const groupIntro = '<b>\uD83D\uDC65 GROUP MESSAGE</b>\n<i>(copy &amp; paste to your WhatsApp group)</i>\n\n';
    await sendTelegram(groupIntro + buildGroupMsg(tasks, isMorning));

    res.status(200).json({ ok: true, tasks: tasks.length, staff_sent: sent });

  } catch (err) {
    console.error('Reminder error:', err.message);
    try {
      await sendTelegram('\u26A0\uFE0F Reminder error: ' + err.message);
    } catch (e) {}
    res.status(500).json({ ok: false, error: err.message });
  }
}
