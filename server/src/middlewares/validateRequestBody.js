import AppError from "./AppError.js";

const validateRequestBody = (req, res, next) => {
    const data = req.body;
    // ensure body exists and not empty
    if (!data || Object.keys(data).length === 0) {
        throw new AppError("Request body is required", 400);
    }

    // check data format
    if (typeof data !== "object") {
        throw new AppError("Request body must be a valid JSON object", 400);
    }

    next();
};

export default validateRequestBody;
