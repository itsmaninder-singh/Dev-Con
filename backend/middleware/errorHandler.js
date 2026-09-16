import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err,req,res,next) => {
    let error = err;

    if(!(error instanceof ApiError)){
        let statusCode = error.statusCode || 500;
        let message = error.message || "Something went wrong. Please try again later.";

        if (error.name === "CastError" || error.name === "CasteError") {
            statusCode = 404;
            message = "Resource Not Found";
        }
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            statusCode = 401;
            message = "Invalid or expired token";
        }
        if (error.code === 11000) {
            statusCode = 400;
            const field = Object.keys(error.keyValue || {})[0];
            if (field === "email") {
                message = "An account with this email already exists.";
            } else if (field === "username") {
                message = "This username is already taken. Please choose another.";
            } else if (field === "phoneNumber") {
                message = "An account with this phone number already exists.";
            } else if (field) {
                message = `${field} is already in use.`;
            } else {
                message = "Duplicate field value entered.";
            }
        }
        if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
    }
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);

    }
    const response = {
        success: false,
        message: error.message,
        errors:error.errors,
        ...(process.env.NODE_ENV === "development" && {stack :error.stack}),
    };
    return res.status(error.statusCode || 500).json(response);


};
export {errorHandler};
