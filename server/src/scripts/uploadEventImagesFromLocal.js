import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dns from "node:dns/promises";
import Event from "../models/Event.js";
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "../utils/cloudinaryUpload.js";
import { assertDiskImageAllowed } from "../config/multerConfig.js";

dotenv.config({ path: "./.env" });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(
  __dirname,
  "../../../client/images-to-upload",
);

/** Image N.jpg → event title (by order). */
const EVENT_IMAGE_MAP = [
  { file: "1.jpg", title: "Cairo Marathon 2027" },
  { file: "2.jpg", title: "Egypt Blockchain & Web3 Conference" },
  { file: "3.jpg", title: "Photography Masterclass — Street & Night" },
  { file: "4.jpg", title: "HR & Talent Readiness Seminar" },
  { file: "5.jpg", title: "Wellness & Mindfulness Retreat" },
  { file: "6.jpg", title: "Intro to Photography Workshop" },
  { file: "7.jpg", title: "Modern Art Exhibition Opening" },
  { file: "8.jpg", title: "Green Tech Sustainability Conference" },
  { file: "9.jpg", title: "Cairo Tech Innovation Summit 2027" },
  { file: "10.jpg", title: "Stand-Up Comedy Night Cairo" },
  { file: "11.jpg", title: "Volleyball Beach Cup Tournament" },
  { file: "12.jpg", title: "Kids STEM Coding Camp" },
  { file: "13.jpg", title: "Wine & Artisan Dining Experience" },
  { file: "14.jpg", title: "Night EDM Party Festival" },
];

const uploadEventImagesFromLocal = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    console.log(`Images directory: ${IMAGES_DIR}\n`);

    let updated = 0;

    for (const { file, title } of EVENT_IMAGE_MAP) {
      const filePath = path.join(IMAGES_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.error(`✗ Missing file: ${filePath}`);
        process.exit(1);
      }

      assertDiskImageAllowed(file);

      const event = await Event.findOne({ title });
      if (!event) {
        console.error(`✗ Event not found: ${title}`);
        process.exit(1);
      }

      const buffer = fs.readFileSync(filePath);
      console.log(
        `Uploading ${file} → ${title} (${(buffer.length / 1024).toFixed(1)} KB)`,
      );

      if (event.imagePublicId) {
        await deleteCloudinaryImage(event.imagePublicId);
      }

      const uploaded = await uploadImageBuffer(buffer, {
        folder: "eventify/events",
      });

      event.image = uploaded.secure_url;
      event.imagePublicId = uploaded.public_id;
      await event.save();
      updated += 1;

      console.log(`  ✓ ${uploaded.secure_url}\n`);
    }

    console.log(`Done. Updated ${updated} event image(s) on Cloudinary.`);
    await mongoose.connection.close();
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
};

uploadEventImagesFromLocal();
