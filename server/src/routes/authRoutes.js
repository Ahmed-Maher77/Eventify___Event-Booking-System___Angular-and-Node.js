import  express  from 'express';
import {register,login} from "../controllers/authController.js"
import { uploadImage } from "../config/multerConfig.js";


const router=express.Router();

router.post("/register", uploadImage.single("image"), register)
router.post("/login",login)


export default router
