import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // 1. Validate videoId
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing videoId")
    }
    const videoObjectId = new mongoose.Types.ObjectId(videoId)

    // 2. Build aggregation pipeline for comments
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: videoObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likesCount: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    // 3. Configure pagination options
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    // 4. Apply pagination using mongoose-aggregate-paginate-v2
    const result = await Comment.aggregatePaginate(commentsAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comments fetched successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    // 1. Validate inputs
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid or missing videoId")
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }
    // 2. Verify that the video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    // 3. Create comment document
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })
    if (!comment) {
        throw new ApiError(500, "Failed to create comment, please try again")
    }
    // 4. Return response
    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    // 1. Validate inputs
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID")
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }
    // 2. Find the comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    // 3. Authorization check: ensure only the owner can update the comment
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }
    // 4. Update comment content
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
            }
        },
        { new: true }
    )
    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment, please try again")
    }
    // 5. Return updated comment
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    // 1. Validate commentId
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid or missing commentId")
    }
    // 2. Find the comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    // 3. Authorization check: ensure only the owner can delete the comment
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    // 4. Delete the comment and associated likes
    await Comment.findByIdAndDelete(commentId)
    await Like.deleteMany({ comment: commentId })
    // 5. Return success response
    return res
        .status(200)
        .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}