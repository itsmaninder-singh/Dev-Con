import multer from "multer";
import fs from "fs";
import path from "path";
import {ApiError } from "../utils/ApiError/js"
const TEMP_DIR = path.resolve("temp");
if(!fs.existsSync(TEMP_DIR)){
    fs.mkdirSync(TEMP_DIR, {recursive: true});
}

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,TEMP_DIR);
    },
    filename: (req,file,cb)=>{
        const suffixuniq = `${Date.now()}--${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.filename}--${suffixuniq}${ext}`);
    },
});
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];