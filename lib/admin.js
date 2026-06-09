const crypto = require('crypto');
const community = require('./community');

function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function ensureHostInbox(project) {
  if (!Array.isArray(project.hostInbox)) project.hostInbox = [];
  return project.hostInbox;
}

function sendHostDm(project, adminUser, message, options = {}) {
  const body = message.trim();
  if (!body) return null;

  const dm = {
    id: createId('dm'),
    fromAdminName: adminUser.name,
    fromAdminEmail: adminUser.email,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    type: options.type || 'general'
  };

  ensureHostInbox(project).unshift(dm);

  community.ensureCommunity(project);
  const noticeTitle =
    options.type === 'reject'
      ? '❌ 심사 거절 안내'
      : options.type === 'approve'
        ? '✅ 심사 승인 안내'
        : '📩 운영팀 메시지';

  project.community.notices.unshift({
    id: createId('notice'),
    title: noticeTitle,
    body,
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    authorUserId: adminUser.id,
    authorName: 'Duckrowd 운영팀',
    pinned: true,
    isAdminDm: true
  });

  return dm;
}

function collectHostInbox(userId, projects) {
  const messages = [];
  projects.forEach((project) => {
    if (project.hostUserId !== userId) return;
    ensureHostInbox(project).forEach((dm) => {
      messages.push({
        ...dm,
        projectId: project.id,
        projectTitle: project.title
      });
    });
  });
  return messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = {
  sendHostDm,
  collectHostInbox,
  ensureHostInbox
};
