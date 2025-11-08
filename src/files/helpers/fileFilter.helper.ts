

export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {
    if (!file) return callback(new Error('File is empty'), false);

    const fileExtention: string[] = file.mimetype.split('/');
    const validExtensions: string[] = ['jpg', 'jpeg', 'png'];

    if (validExtensions.includes(fileExtention[1])) {
        return callback(null, true);
    }

    return callback(null, false);
}