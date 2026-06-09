const roles = require('./roles');
const admin = require('./admin');
const csvExport = require('./csvExport');

function registerAdminRoutes(app, db) {
  app.post('/api/admin/mode', roles.requireAdmin, (req, res) => {
    const enabled = req.body.enabled !== false;
    const sessionId = req.cookies.session_id;
    const user = { ...req.user, adminMode: enabled };
    db.sessionStore.set(sessionId, user);
    req.user = user;
    res.json({
      success: true,
      adminMode: enabled,
      user: roles.toAuthUser(user)
    });
  });

  app.get('/api/admin/overview', roles.requireAdmin, (req, res) => {
    const all = db.getAllProjects();
    const pending = all.filter((p) => p.status === '심사 중');
    const rejected = all.filter((p) => p.status === '심사 거절');
    res.json({
      success: true,
      stats: {
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        totalCount: all.length,
        fundingCount: all.filter((p) => p.status === '펀딩 진행 중').length
      },
      pending: pending.map((p) => roles.toAdminListItem(p)),
      recentRejected: rejected.slice(0, 5).map((p) => roles.toAdminListItem(p))
    });
  });

  app.get('/api/admin/projects', roles.requireAdmin, (req, res) => {
    const status = req.query.status;
    let projects = db.getAllProjects();
    if (status) projects = projects.filter((p) => p.status === status);
    projects.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    res.json({
      success: true,
      projects: projects.map((p) => roles.toAdminListItem(p))
    });
  });

  app.delete('/api/admin/projects/:id', roles.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const project = db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
    }

    const holding = db.getAllDonations().filter(
      (d) => d.projectId === id && d.status === 'holding'
    );
    if (holding.length > 0) {
      return res.status(400).json({
        error: '결제 보관 중인 후원이 있어 삭제할 수 없습니다. 먼저 환불 처리하세요.',
        code: 'DELETE_NOT_ALLOWED'
      });
    }

    db.deleteProject(id);
    res.json({ success: true, deletedId: id });
  });

  app.post('/api/admin/projects/:id/dm', roles.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const project = db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
    }

    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: '메시지 내용을 입력해 주세요.', code: 'VALIDATION_ERROR' });
    }

    const dm = admin.sendHostDm(project, req.user, message.trim());
    db.saveProject(project);
    res.json({ success: true, dm });
  });

  app.get('/api/users/me/host-inbox', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    const messages = admin.collectHostInbox(req.user.id, db.getAllProjects());
    res.json({ success: true, messages });
  });

  app.get('/api/admin/export/donations.csv', roles.requireAdmin, (req, res) => {
    const donations = db.getAllDonations();
    const rows = donations.map((d) => {
      const p = db.getProjectById(d.projectId);
      return {
        projectId: d.projectId,
        projectTitle: p ? p.title : '알 수 없음',
        userId: d.userId,
        amount: d.amount,
        status: d.status,
        paymentMethod: d.paymentMethod,
        createdAt: d.createdAt
      };
    });

    csvExport.sendCsv(res, 'admin-donations.csv', rows, [
      { key: 'projectId', label: '프로젝트ID' },
      { key: 'projectTitle', label: '프로젝트' },
      { key: 'userId', label: '후원자ID' },
      { key: 'amount', label: '금액' },
      { key: 'status', label: '상태' },
      { key: 'paymentMethod', label: '결제수단' },
      { key: 'createdAt', label: '일시' }
    ]);
  });

  app.post('/api/users/me/host-inbox/:projectId/:dmId/read', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    const projectId = parseInt(req.params.projectId, 10);
    const project = db.getProjectById(projectId);
    if (!project || project.hostUserId !== req.user.id) {
      return res.status(403).json({ error: '접근 권한이 없습니다.', code: 'FORBIDDEN' });
    }
    const dm = admin.ensureHostInbox(project).find((m) => m.id === req.params.dmId);
    if (dm) dm.read = true;
    db.saveProject(project);
    res.json({ success: true });
  });
}

module.exports = { registerAdminRoutes };
