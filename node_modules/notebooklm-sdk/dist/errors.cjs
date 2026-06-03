'use strict';

// src/types/errors.ts
var NotebookLMError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};
var NetworkError = class extends NotebookLMError {
  methodId;
  originalError;
  constructor(message, opts = {}) {
    super(message);
    this.methodId = opts.methodId;
    this.originalError = opts.originalError;
  }
};
var RPCTimeoutError = class extends NetworkError {
};
var RPCError = class extends NotebookLMError {
  methodId;
  rawResponse;
  rpcCode;
  foundIds;
  constructor(message, opts = {}) {
    super(message);
    this.methodId = opts.methodId;
    this.rawResponse = opts.rawResponse ? opts.rawResponse.slice(0, 500) : void 0;
    this.rpcCode = opts.rpcCode;
    this.foundIds = opts.foundIds ?? [];
  }
};
var AuthError = class extends RPCError {
};
var RateLimitError = class extends RPCError {
  retryAfter;
  constructor(message, opts = {}) {
    super(message, opts);
    this.retryAfter = opts.retryAfter;
  }
};
var ServerError = class extends RPCError {
  statusCode;
  constructor(message, opts = {}) {
    super(message, opts);
    this.statusCode = opts.statusCode;
  }
};
var ClientError = class extends RPCError {
  statusCode;
  constructor(message, opts = {}) {
    super(message, opts);
    this.statusCode = opts.statusCode;
  }
};
var NotebookError = class extends NotebookLMError {
};
var NotebookNotFoundError = class extends NotebookError {
  notebookId;
  constructor(notebookId) {
    super(`Notebook not found: ${notebookId}`);
    this.notebookId = notebookId;
  }
};
var SourceError = class extends NotebookLMError {
};
var SourceNotFoundError = class extends SourceError {
  sourceId;
  constructor(sourceId) {
    super(`Source not found: ${sourceId}`);
    this.sourceId = sourceId;
  }
};
var SourceAddError = class extends SourceError {
  url;
  cause;
  constructor(url, opts = {}) {
    super(
      opts.message ?? `Failed to add source: ${url}
Possible causes:
  - URL is invalid or inaccessible
  - Content is behind a paywall or requires authentication
  - Rate limiting or quota exceeded`
    );
    this.url = url;
    this.cause = opts.cause;
  }
};
var SourceProcessingError = class extends SourceError {
  sourceId;
  status;
  constructor(sourceId, status = 3, message) {
    super(message ?? `Source ${sourceId} failed to process`);
    this.sourceId = sourceId;
    this.status = status;
  }
};
var SourceTimeoutError = class extends SourceError {
  sourceId;
  timeout;
  lastStatus;
  constructor(sourceId, timeout, lastStatus) {
    const statusInfo = lastStatus != null ? ` (last status: ${lastStatus})` : "";
    super(`Source ${sourceId} not ready after ${timeout.toFixed(1)}s${statusInfo}`);
    this.sourceId = sourceId;
    this.timeout = timeout;
    this.lastStatus = lastStatus;
  }
};
var ArtifactError = class extends NotebookLMError {
};
var ArtifactNotFoundError = class extends ArtifactError {
  artifactId;
  artifactType;
  constructor(artifactId, artifactType) {
    const typeInfo = artifactType ? ` ${artifactType}` : "";
    super(`${typeInfo.trim() || "Artifact"} ${artifactId} not found`);
    this.artifactId = artifactId;
    this.artifactType = artifactType;
  }
};
var ArtifactNotReadyError = class extends ArtifactError {
  artifactType;
  artifactId;
  status;
  constructor(artifactType, opts = {}) {
    const base = opts.artifactId ? `${artifactType} artifact ${opts.artifactId} is not ready` : `No completed ${artifactType} found`;
    const statusInfo = opts.status ? ` (status: ${opts.status})` : "";
    super(`${base}${statusInfo}`);
    this.artifactType = artifactType;
    this.artifactId = opts.artifactId;
    this.status = opts.status;
  }
};
var ArtifactParseError = class extends ArtifactError {
  artifactType;
  artifactId;
  details;
  cause;
  constructor(artifactType, opts = {}) {
    let msg = `Failed to parse ${artifactType} artifact`;
    if (opts.artifactId) msg += ` ${opts.artifactId}`;
    if (opts.details) msg += `: ${opts.details}`;
    super(msg);
    this.artifactType = artifactType;
    this.artifactId = opts.artifactId;
    this.details = opts.details;
    this.cause = opts.cause;
  }
};
var ArtifactDownloadError = class extends ArtifactError {
  artifactType;
  artifactId;
  details;
  cause;
  constructor(artifactType, opts = {}) {
    let msg = `Failed to download ${artifactType} artifact`;
    if (opts.artifactId) msg += ` ${opts.artifactId}`;
    if (opts.details) msg += `: ${opts.details}`;
    super(msg);
    this.artifactType = artifactType;
    this.artifactId = opts.artifactId;
    this.details = opts.details;
    this.cause = opts.cause;
  }
};
var ChatError = class extends NotebookLMError {
};

exports.ArtifactDownloadError = ArtifactDownloadError;
exports.ArtifactError = ArtifactError;
exports.ArtifactNotFoundError = ArtifactNotFoundError;
exports.ArtifactNotReadyError = ArtifactNotReadyError;
exports.ArtifactParseError = ArtifactParseError;
exports.AuthError = AuthError;
exports.ChatError = ChatError;
exports.ClientError = ClientError;
exports.NetworkError = NetworkError;
exports.NotebookError = NotebookError;
exports.NotebookLMError = NotebookLMError;
exports.NotebookNotFoundError = NotebookNotFoundError;
exports.RPCError = RPCError;
exports.RPCTimeoutError = RPCTimeoutError;
exports.RateLimitError = RateLimitError;
exports.ServerError = ServerError;
exports.SourceAddError = SourceAddError;
exports.SourceError = SourceError;
exports.SourceNotFoundError = SourceNotFoundError;
exports.SourceProcessingError = SourceProcessingError;
exports.SourceTimeoutError = SourceTimeoutError;
//# sourceMappingURL=errors.cjs.map
//# sourceMappingURL=errors.cjs.map