import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// 1. Routes for "/" (fetching all videos or uploading a new one)
router
    .route("/")
    .get(optionalVerifyJWT, getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishAVideo
    );

// 2. Routes for "/:videoId" (getting, updating, or deleting a specific video)
router
    .route("/:videoId")
    .get(optionalVerifyJWT, getVideoById)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo)
    .delete(verifyJWT, deleteVideo);

// 3. Route for toggling publish status
router
    .route("/toggle/publish/:videoId")
    .patch(verifyJWT, togglePublishStatus);

export default router;
