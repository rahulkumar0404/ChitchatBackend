import { userSocketIds } from '../socket.js';

export const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIds.get(user.toString()));
  return sockets;
};

export const getBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

export const getMemberIdsFromMember = async (members) => {
  const memberIds = members.map((member) => member.user.toString());
  return memberIds;
};
