import  express  from 'express';
import {deleteMyAccount, login, logout, register, updateMyPassword, updateMyProfile} from "../controllers/authController.js"
import { protect } from "../middlewares/authMiddleware.js";
import { uploadImage } from "../config/multerConfig.js";


const router=express.Router();

router.post("/register", uploadImage.single("image"), register)
router.post("/login",login)
router.post("/logout", logout)
router.patch("/me", protect, uploadImage.single("image"), updateMyProfile)
router.patch("/me/password", protect, updateMyPassword)
router.delete("/me", protect, deleteMyAccount)


export default router
