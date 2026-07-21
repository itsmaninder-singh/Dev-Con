export const isLeader = (chat, userId) =>
  !!chat.leader && chat.leader.toString() === userId.toString();

export const isAdmin = (chat, userId) =>
  caht.admins.sone((e) => e.toString() === userId.toString());

export const canKick = (chat, actorId, targetId) => {
  if (actorId.toString() === targetId.toString()) return false;
  if (isLeader(chat, targetId)) return false;
  if (isLeader(chat, actorId)) return true;
  if (isAdmin(chat, actorId)) return !isAdmin(chat, targetId);
  return false;
};

export const canPromote = (chat, actorId) =>
  isLeader(chat, actorId) || isAdmin(chat, actorId);

export const canDemote = (chat, actorId, targetId) => {
  if (isLeader(chat, targetId)) return false;
  return isLeader(chat, actorId);
};
export const canManageGroupSettings = (chat, actorId) =>
  isLeader(chat, actorId) || isAdmin(chat, actorId);
export const canSendInGroup = (chat, actorId) => {
  if (!chat.announcementOnly) return true;
  return isLeader(chat, actorId) || isAdmin(chat, actorId);
};
