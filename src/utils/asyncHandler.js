//try-catch method
const asyncHandler = (fn) = async(req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}
export { asyncHandler }

//using promises method
/*
const asyncHandler = (fn) => {
    (req, res, next) => {
        Promise.resolve(fn(req, res, next).catch(err) => next(err))
    }
}
export {asyncHandler }
*/