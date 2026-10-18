import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT to all routes if you want them secured,
// or apply it selectively per route:
router.use(verifyJWT);

// 1. Routes for "/" (fetching all videos or uploading a new one)
router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishAVideo
    );

// 2. Routes for "/:videoId" (getting, updating, or deleting a specific video)
router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo);

// 3. Route for toggling publish status
router
    .route("/toggle/publish/:videoId")
    .patch(togglePublishStatus);

export default router;
