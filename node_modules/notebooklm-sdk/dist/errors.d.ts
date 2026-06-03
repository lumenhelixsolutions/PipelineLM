/**
 * All exceptions for notebooklm-sdk.
 *
 * All errors extend NotebookLMError so you can catch everything with:
 *   try { ... } catch (e) { if (e instanceof NotebookLMError) ... }
 */
declare class NotebookLMError extends Error {
    constructor(message: string);
}
declare class NetworkError extends NotebookLMError {
    readonly methodId?: string;
    readonly originalError?: Error;
    constructor(message: string, opts?: {
        methodId?: string;
        originalError?: Error;
    });
}
declare class RPCTimeoutError extends NetworkError {
}
declare class RPCError extends NotebookLMError {
    readonly methodId?: string;
    readonly rawResponse?: string;
    readonly rpcCode?: string | number;
    readonly foundIds: string[];
    constructor(message: string, opts?: {
        methodId?: string;
        rawResponse?: string;
        rpcCode?: string | number;
        foundIds?: string[];
    });
}
declare class AuthError extends RPCError {
}
declare class RateLimitError extends RPCError {
    readonly retryAfter?: number;
    constructor(message: string, opts?: {
        retryAfter?: number;
        methodId?: string;
        rawResponse?: string;
        rpcCode?: string | number;
        foundIds?: string[];
    });
}
declare class ServerError extends RPCError {
    readonly statusCode?: number;
    constructor(message: string, opts?: {
        statusCode?: number;
        methodId?: string;
        rawResponse?: string;
        rpcCode?: string | number;
    });
}
declare class ClientError extends RPCError {
    readonly statusCode?: number;
    constructor(message: string, opts?: {
        statusCode?: number;
        methodId?: string;
        rawResponse?: string;
        rpcCode?: string | number;
    });
}
declare class NotebookError extends NotebookLMError {
}
declare class NotebookNotFoundError extends NotebookError {
    readonly notebookId: string;
    constructor(notebookId: string);
}
declare class SourceError extends NotebookLMError {
}
declare class SourceNotFoundError extends SourceError {
    readonly sourceId: string;
    constructor(sourceId: string);
}
declare class SourceAddError extends SourceError {
    readonly url: string;
    readonly cause?: Error;
    constructor(url: string, opts?: {
        cause?: Error;
        message?: string;
    });
}
declare class SourceProcessingError extends SourceError {
    readonly sourceId: string;
    readonly status: number;
    constructor(sourceId: string, status?: number, message?: string);
}
declare class SourceTimeoutError extends SourceError {
    readonly sourceId: string;
    readonly timeout: number;
    readonly lastStatus?: number;
    constructor(sourceId: string, timeout: number, lastStatus?: number);
}
declare class ArtifactError extends NotebookLMError {
}
declare class ArtifactNotFoundError extends ArtifactError {
    readonly artifactId: string;
    readonly artifactType?: string;
    constructor(artifactId: string, artifactType?: string);
}
declare class ArtifactNotReadyError extends ArtifactError {
    readonly artifactType: string;
    readonly artifactId?: string;
    readonly status?: string;
    constructor(artifactType: string, opts?: {
        artifactId?: string;
        status?: string;
    });
}
declare class ArtifactParseError extends ArtifactError {
    readonly artifactType: string;
    readonly artifactId?: string;
    readonly details?: string;
    readonly cause?: Error;
    constructor(artifactType: string, opts?: {
        details?: string;
        artifactId?: string;
        cause?: Error;
    });
}
declare class ArtifactDownloadError extends ArtifactError {
    readonly artifactType: string;
    readonly artifactId?: string;
    readonly details?: string;
    readonly cause?: Error;
    constructor(artifactType: string, opts?: {
        details?: string;
        artifactId?: string;
        cause?: Error;
    });
}
declare class ChatError extends NotebookLMError {
}

export { ArtifactDownloadError, ArtifactError, ArtifactNotFoundError, ArtifactNotReadyError, ArtifactParseError, AuthError, ChatError, ClientError, NetworkError, NotebookError, NotebookLMError, NotebookNotFoundError, RPCError, RPCTimeoutError, RateLimitError, ServerError, SourceAddError, SourceError, SourceNotFoundError, SourceProcessingError, SourceTimeoutError };
