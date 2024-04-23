import multer from 'multer';

export const multerUpload = multer({ limits: { fileSize: 1024 * 1024 * 5 } });

export const singleAvatar = (key) => {
  return multerUpload.single(key);
};

export const singleImageAvatar = singleAvatar('avatar');
export const attachmentsMulter = multerUpload.array('files', 5);
