import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err,req,res,next) => {
    let error = err;

    if(!(error instanceof ApiError)){
        let statusCode = error.statusCode || 500;
        let message = error.message || "somethign went wrong please wait for couple of mins";

        if (error.name === "CastError" || error.name === "CasteError") {
            statusCode = 404;
            message = "Resource Not Found";
        }
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            statusCode = 401;
            message = "Invalid or expired token";
        }
        if(error.code === 11000){
            statusCode =400;
            const field = Object.keys(error.keyValue || {})[0];
            message = field?`${field} already exists buddy`: "Duplicate field value buddy";
        }
        if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
    }
    error = new ApiError(statusCode , message, error?.errors || [],err.stack);

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
