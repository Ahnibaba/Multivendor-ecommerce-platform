export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: any;
    constructor(message: string, statusCode: number, isOperational?: boolean, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class AuthError extends AppError {
    constructor(message: "Unauthorized");
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=index.d.ts.map