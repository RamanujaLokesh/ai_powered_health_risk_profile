import { Router } from "express";
import { analyze } from "../controller/profile.controller.js";
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
    
const router = Router();
const uploadDir = 'uploads/';
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });
router.post('/analyze', upload.single('surveyImage'),analyze)

export default router;

