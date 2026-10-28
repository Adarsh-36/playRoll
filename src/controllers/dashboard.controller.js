import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // 1. Get channelId from params (or fallback to authenticated user ID)
    const channelId = req.params?.channelId || req.user?._id
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid or missing channel ID")
    }
    const channelObjectId = new mongoose.Types.ObjectId(channelId)

    // 2. Fetch subscribers, video stats (videos & views), and video IDs in parallel
    const [subscriberCount, videoStats, videoIds] = await Promise.all([
        Subscription.countDocuments({
            channel: channelObjectId
        }),
        Video.aggregate([
            {
                $match: {
                    owner: channelObjectId
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" }
                }
            }
        ]),
        Video.find({ owner: channelObjectId }).distinct("_id")
    ])

    // 3. Extract metrics
    const totalSubscribers = subscriberCount || 0
    const totalVideos = videoStats[0]?.totalVideos || 0
    const totalViews = videoStats[0]?.totalViews || 0

    // 4. Calculate total likes across all videos
    let totalLikes = 0
    if (videoIds.length > 0) {
        totalLikes = await Like.countDocuments({
            video: { $in: videoIds }
        })
    }

    const stats = {
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params?.channelId || req.user?._id
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const videos = await Video.find({ owner: channelId }).sort({ createdAt: -1 })
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}
