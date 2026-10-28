import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    getTweetComments,
    addTweetComment,
    updateComment
} from "../controllers/comment.controller.js"
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/:videoId").get(optionalVerifyJWT, getVideoComments).post(verifyJWT, addComment);
router.route("/t/:tweetId").get(optionalVerifyJWT, getTweetComments).post(verifyJWT, addTweetComment);
router.route("/c/:commentId").delete(verifyJWT, deleteComment).patch(verifyJWT, updateComment);

export default router
