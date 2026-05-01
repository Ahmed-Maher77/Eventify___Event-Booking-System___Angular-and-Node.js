import  express  from 'express';
import {login, logout, register} from "../controllers/authController.js"
import { uploadImage } from "../config/multerConfig.js";


const router=express.Router();

router.post("/register", uploadImage.single("image"), register)
router.post("/login",login)
router.post("/logout", logout)


export default router
