function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getAdminIdentifiers() {
  const fromEnv = (process.env.ADMIN_IDENTIFIERS || 'dodamm111')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv;
}

function matchesAdminIdentifier(profile) {
  const identifiers = getAdminIdentifiers();
  if (!identifiers.length) return false;

  const email = (profile.email || '').toLowerCase();
  const name = (profile.name || '').toLowerCase();
  const id = String(profile.id || '').toLowerCase();
  const localPart = email.split('@')[0] || '';

  return identifiers.some(
    (token) =>
      email.includes(token) ||
      localPart === token ||
      name.includes(token) ||
      id.includes(token)
  );
}

function isAdminUser(profile) {
  if (!profile) return false;
  const adminEmails = getAdminEmails();
  const email = (profile.email || '').toLowerCase();
  if (adminEmails.length > 0 && adminEmails.includes(email)) return true;
  return matchesAdminIdentifier(profile);
}

function assignRole(profile) {
  const isAdmin = isAdminUser(profile);
  return {
    ...profile,
    role: isAdmin ? 'admin' : 'user',
    adminMode: isAdmin ? profile.adminMode !== false : false
  };
}

function isAdmin(user) {
  return user?.role === 'admin';
}

function isAdminModeActive(user) {
  return isAdmin(user) && user.adminMode !== false;
}

function toAuthUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    role: user.role,
    adminMode: isAdminModeActive(user)
  };
}

function isProjectHost(user, project) {
  return Boolean(user && project?.hostUserId && project.hostUserId === user.id);
}

function getViewerRole(user, project) {
  if (!user) return 'guest';
  if (isAdminModeActive(user)) return 'admin';
  if (isProjectHost(user, project)) return 'host';
  return 'backer';
}

function toAdminListItem(project) {
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    hostName: project.hostName,
    hostUserId: project.hostUserId,
    status: project.status,
    goalAmount: project.goalAmount,
    currentAmount: project.currentAmount,
    percentFunded: project.percentFunded,
    daysLeft: project.daysLeft,
    gradient: project.gradient,
    emoji: project.emoji,
    submittedAt: project.submittedAt || null,
    rejectedReason: project.rejectedReason || ''
  };
}

function toPublicProject(project, options = {}) {
  const { includeAdminFields = false, includeHostFields = false } = options;
  const base = {
    id: project.id,
    title: project.title,
    category: project.category,
    hostName: project.hostName,
    hostUserId: project.hostUserId || null,
    trustTemperature: project.trustTemperature,
    successCount: project.successCount,
    status: project.status,
    goalAmount: project.goalAmount,
    currentAmount: project.currentAmount,
    percentFunded: project.percentFunded,
    daysLeft: project.daysLeft,
    gradient: project.gradient,
    emoji: project.emoji,
    coverImage: project.coverImage || null,
    featured: project.featured,
    popularRank: project.popularRank,
    story: project.story,
    community: project.community,
    refundPolicy: project.refundPolicy
  };

  if (includeHostFields) {
    base.escrowPlan = project.escrowPlan || '';
    base.sponsorCount = options.sponsorCount ?? 0;
    base.escrowHolding = options.escrowHolding ?? 0;
  }

  if (includeAdminFields) {
    base.escrowPlan = project.escrowPlan || '';
    base.reviewNotes = project.reviewNotes || [];
    base.rejectedReason = project.rejectedReason || '';
    base.submittedAt = project.submittedAt || null;
    base.sponsorCount = options.sponsorCount ?? 0;
    base.escrowHolding = options.escrowHolding ?? 0;
  }

  return base;
}

function getProjectStats(projectId, donations) {
  const projectDonations = donations.filter(
    (d) => d.projectId === projectId && d.status !== 'refunded'
  );
  const holding = projectDonations
    .filter((d) => d.status === 'holding')
    .reduce((sum, d) => sum + d.amount, 0);
  const uniqueSponsors = new Set(
    projectDonations.filter((d) => d.status === 'holding' || d.status === 'released').map((d) => d.userId)
  );

  return {
    sponsorCount: uniqueSponsors.size,
    escrowHolding: holding,
    totalDonations: projectDonations.length
  };
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.', code: 'FORBIDDEN' });
  }
  next();
}

function requireHostOrAdmin(projectGetter) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    const project = projectGetter(req);
    if (!project) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
    }
    if (!isAdmin(req.user) && !isProjectHost(req.user, project)) {
      return res.status(403).json({ error: '프로젝트 총대만 수정할 수 있습니다.', code: 'FORBIDDEN' });
    }
    req.project = project;
    next();
  };
}

module.exports = {
  assignRole,
  isAdmin,
  isAdminModeActive,
  isAdminUser,
  toAuthUser,
  isProjectHost,
  getViewerRole,
  toAdminListItem,
  toPublicProject,
  getProjectStats,
  requireAuth,
  requireAdmin,
  requireHostOrAdmin
};
