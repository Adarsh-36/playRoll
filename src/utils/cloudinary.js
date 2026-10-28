import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return response
    } catch (error) {
        console.log("Cloudinary upload failed", error)
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

const deleteFromCloudinary = async (publicIdOrUrl, resourceType = "image") => {
    try {
        if (!publicIdOrUrl) return null
        let publicId = publicIdOrUrl
        if (publicIdOrUrl.includes("cloudinary.com")) {
            const parts = publicIdOrUrl.split("/")
            const filenameWithExt = parts.pop()
            const filename = filenameWithExt.split(".")[0]
            publicId = filename
        }
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        })
        return result
    } catch (error) {
        console.log("Error deleting from Cloudinary:", error)
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }
