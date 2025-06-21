/**
 * Error Handler
 * 
 * Centralized error handling system for the Chrome extension.
 * Provides error categorization, logging, user notifications, and recovery options.
 */

class ErrorHandler {
    constructor(options = {}) {
        this.options = {
            enableLogging: options.enableLogging !== false,
            enableNotifications: options.enableNotifications !== false,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            ...options
        };
        
        this.errorCounts = new Map();
        this.retryAttempts = new Map();
        this.isOnline = navigator.onLine;
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.handleAPIError = this.handleAPIError.bind(this);
        this.handleNetworkError = this.handleNetworkError.bind(this);
        this.handleStateError = this.handleStateError.bind(this);
        this.handleComponentError = this.handleComponentError.bind(this);
        this.retryOperation = this.retryOperation.bind(this);
        this.showUserError = this.showUserError.bind(this);
        this.logError = this.logError.bind(this);
        
        // Set up network status monitoring
        this.setupNetworkMonitoring();
    }
    
    /**
     * Initialize the error handler
     */
    async init() {
        try {
            console.log('[ErrorHandler] Initializing error handler...');
            
            // Set up global error handlers
            this.setupGlobalErrorHandlers();
            
            // Set up unhandled promise rejection handler
            this.setupPromiseRejectionHandler();
            
            console.log('[ErrorHandler] Error handler initialized successfully');
        } catch (error) {
            console.error('[ErrorHandler] Failed to initialize error handler:', error);
        }
    }
    
    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle window errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'window',
                error: event.error,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || 'Unhandled promise rejection'
            });
        });
    }
    
    /**
     * Set up promise rejection handler
     */
    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || 'Unhandled promise rejection'
            });
        });
    }
    
    /**
     * Set up network status monitoring
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('[ErrorHandler] Network connection restored');
            this.handleNetworkRestored();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('[ErrorHandler] Network connection lost');
            this.handleNetworkLost();
        });
    }
    
    /**
     * Main error handling method
     */
    handleError(errorInfo) {
        const {
            type = 'unknown',
            error,
            message,
            context = {},
            retryable = false,
            severity = 'error'
        } = errorInfo;
        
        // Create error object
        const errorObject = {
            id: this.generateErrorId(),
            type,
            message: message || error?.message || 'An unknown error occurred',
            error,
            context,
            retryable,
            severity,
            timestamp: Date.now(),
            stack: error?.stack
        };
        
        // Log the error
        this.logError(errorObject);
        
        // Update error counts
        this.updateErrorCount(type);
        
        // Handle based on error type
        switch (type) {
            case 'api':
                this.handleAPIError(errorObject);
                break;
            case 'network':
                this.handleNetworkError(errorObject);
                break;
            case 'state':
                this.handleStateError(errorObject);
                break;
            case 'component':
                this.handleComponentError(errorObject);
                break;
            default:
                this.handleGenericError(errorObject);
        }
        
        // Show user notification if enabled
        if (this.options.enableNotifications) {
            this.showUserError(errorObject);
        }
        
        return errorObject;
    }
    
    /**
     * Handle API-specific errors
     */
    handleAPIError(errorObject) {
        console.log('[ErrorHandler] Handling API error:', errorObject.message);
        
        // Check if this is a retryable error
        if (this.isRetryableAPIError(errorObject) && errorObject.retryable !== false) {
            this.retryOperation(errorObject);
        } else {
            // Non-retryable API error
            this.handleNonRetryableAPIError(errorObject);
        }
    }
    
    /**
     * Handle network errors
     */
    handleNetworkError(errorObject) {
        console.log('[ErrorHandler] Handling network error:', errorObject.message);
        
        if (!this.isOnline) {
            // Offline - show offline message
            this.showOfflineMessage();
        } else {
            // Online but network error - might be temporary
            if (errorObject.retryable !== false) {
                this.retryOperation(errorObject);
            }
        }
    }
    
    /**
     * Handle state management errors
     */
    handleStateError(errorObject) {
        console.log('[ErrorHandler] Handling state error:', errorObject.message);
        
        // Try to recover state
        this.recoverState(errorObject);
    }
    
    /**
     * Handle component errors
     */
    handleComponentError(errorObject) {
        console.log('[ErrorHandler] Handling component error:', errorObject.message);
        
        // Try to reinitialize component
        this.reinitializeComponent(errorObject);
    }
    
    /**
     * Handle generic errors
     */
    handleGenericError(errorObject) {
        console.log('[ErrorHandler] Handling generic error:', errorObject.message);
        
        // Show generic error message
        this.showGenericErrorMessage(errorObject);
    }
    
    /**
     * Check if API error is retryable
     */
    isRetryableAPIError(errorObject) {
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        const retryableMessages = [
            'timeout',
            'network',
            'connection',
            'server',
            'temporary'
        ];
        
        // Check status code if available
        if (errorObject.context?.statusCode) {
            return retryableStatusCodes.includes(errorObject.context.statusCode);
        }
        
        // Check error message
        const message = errorObject.message.toLowerCase();
        return retryableMessages.some(keyword => message.includes(keyword));
    }
    
    /**
     * Retry an operation with exponential backoff
     */
    async retryOperation(errorObject) {
        const operationId = errorObject.context?.operationId || errorObject.id;
        const attempts = this.retryAttempts.get(operationId) || 0;
        
        if (attempts >= this.options.maxRetries) {
            console.log('[ErrorHandler] Max retries reached for operation:', operationId);
            this.handleMaxRetriesReached(errorObject);
            return;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, attempts);
        
        console.log(`[ErrorHandler] Retrying operation ${operationId} in ${delay}ms (attempt ${attempts + 1})`);
        
        // Update retry count
        this.retryAttempts.set(operationId, attempts + 1);
        
        // Wait before retry
        await this.delay(delay);
        
        // Attempt retry
        try {
            if (errorObject.context?.retryFunction) {
                await errorObject.context.retryFunction();
                console.log('[ErrorHandler] Retry successful for operation:', operationId);
                this.retryAttempts.delete(operationId);
            }
        } catch (retryError) {
            console.log('[ErrorHandler] Retry failed for operation:', operationId);
            // Recursively handle the retry error
            this.handleError({
                ...errorObject,
                error: retryError,
                message: `Retry attempt ${attempts + 1} failed: ${retryError.message}`
            });
        }
    }
    
    /**
     * Handle when max retries are reached
     */
    handleMaxRetriesReached(errorObject) {
        const message = `Failed after ${this.options.maxRetries} attempts. Please try again later.`;
        
        // Update state with error
        if (window.appState) {
            window.appState.dispatch({
                type: 'SET_ERROR',
                payload: {
                    message,
                    type: 'max_retries',
                    originalError: errorObject
                }
            });
        }
        
        // Show user notification
        this.showUserError({
            ...errorObject,
            message,
            severity: 'warning'
        });
    }
    
    /**
     * Handle non-retryable API errors
     */
    handleNonRetryableAPIError(errorObject) {
        const message = this.getUserFriendlyMessage(errorObject);
        
        // Update state
        if (window.appState) {
            window.appState.dispatch({
                type: 'SET_ERROR',
                payload: {
                    message,
                    type: 'api_error',
                    originalError: errorObject
                }
            });
        }
    }
    
    /**
     * Show offline message
     */
    showOfflineMessage() {
        const message = 'You are currently offline. Some features may be limited.';
        
        if (window.appState) {
            window.appState.dispatch({
                type: 'SET_ERROR',
                payload: {
                    message,
                    type: 'offline',
                    severity: 'info'
                }
            });
        }
    }
    
    /**
     * Handle network restored
     */
    handleNetworkRestored() {
        // Clear offline errors
        if (window.appState) {
            const currentError = window.appState.getError();
            if (currentError && currentError.type === 'offline') {
                window.appState.dispatch({
                    type: 'CLEAR_ERROR',
                    payload: null
                });
            }
        }
        
        // Retry any pending operations
        this.retryPendingOperations();
    }
    
    /**
     * Handle network lost
     */
    handleNetworkLost() {
        this.showOfflineMessage();
    }
    
    /**
     * Recover state after error
     */
    recoverState(errorObject) {
        console.log('[ErrorHandler] Attempting state recovery...');
        
        try {
            // Try to reload state from storage
            if (window.appState) {
                window.appState.loadPersistedState();
            }
        } catch (error) {
            console.error('[ErrorHandler] State recovery failed:', error);
        }
    }
    
    /**
     * Reinitialize component after error
     */
    reinitializeComponent(errorObject) {
        const componentName = errorObject.context?.componentName;
        
        if (componentName && window.componentManager) {
            console.log(`[ErrorHandler] Reinitializing component: ${componentName}`);
            
            try {
                const component = window.componentManager.getComponent(componentName);
                if (component && typeof component.init === 'function') {
                    component.init();
                }
            } catch (error) {
                console.error(`[ErrorHandler] Failed to reinitialize component ${componentName}:`, error);
            }
        }
    }
    
    /**
     * Show generic error message
     */
    showGenericErrorMessage(errorObject) {
        const message = this.getUserFriendlyMessage(errorObject);
        
        if (window.appState) {
            window.appState.dispatch({
                type: 'SET_ERROR',
                payload: {
                    message,
                    type: 'generic',
                    originalError: errorObject
                }
            });
        }
    }
    
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(errorObject) {
        const messages = {
            'api': {
                'timeout': 'The request took too long. Please try again.',
                'network': 'Network connection issue. Please check your internet connection.',
                'server': 'Server is temporarily unavailable. Please try again later.',
                'not_found': 'The requested information could not be found.',
                'unauthorized': 'Access denied. Please check your permissions.',
                'default': 'An error occurred while fetching data. Please try again.'
            },
            'network': {
                'offline': 'You are currently offline. Please check your internet connection.',
                'timeout': 'Connection timed out. Please try again.',
                'default': 'Network connection issue. Please try again.'
            },
            'state': {
                'default': 'An error occurred while saving your data. Please try again.'
            },
            'component': {
                'default': 'A component error occurred. Please refresh the page.'
            },
            'generic': {
                'default': 'An unexpected error occurred. Please try again.'
            }
        };
        
        const typeMessages = messages[errorObject.type] || messages.generic;
        const messageKey = this.getMessageKey(errorObject);
        
        return typeMessages[messageKey] || typeMessages.default;
    }
    
    /**
     * Get message key based on error
     */
    getMessageKey(errorObject) {
        const message = errorObject.message.toLowerCase();
        
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('network')) return 'network';
        if (message.includes('server')) return 'server';
        if (message.includes('not found') || message.includes('404')) return 'not_found';
        if (message.includes('unauthorized') || message.includes('401')) return 'unauthorized';
        if (message.includes('offline')) return 'offline';
        
        return 'default';
    }
    
    /**
     * Show user error notification
     */
    showUserError(errorObject) {
        const message = this.getUserFriendlyMessage(errorObject);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `error-notification ${errorObject.severity}`;
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-message">${message}</span>
                <button class="error-close">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Handle close button
        notification.querySelector('.error-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    /**
     * Log error for debugging
     */
    logError(errorObject) {
        if (!this.options.enableLogging) return;
        
        const logData = {
            timestamp: new Date().toISOString(),
            errorId: errorObject.id,
            type: errorObject.type,
            message: errorObject.message,
            severity: errorObject.severity,
            context: errorObject.context,
            stack: errorObject.stack
        };
        
        console.error('[ErrorHandler] Error logged:', logData);
        
        // Could also send to external logging service here
        // this.sendToLoggingService(logData);
    }
    
    /**
     * Update error count for type
     */
    updateErrorCount(type) {
        const count = this.errorCounts.get(type) || 0;
        this.errorCounts.set(type, count + 1);
    }
    
    /**
     * Get error count for type
     */
    getErrorCount(type) {
        return this.errorCounts.get(type) || 0;
    }
    
    /**
     * Clear error counts
     */
    clearErrorCounts() {
        this.errorCounts.clear();
    }
    
    /**
     * Retry pending operations
     */
    retryPendingOperations() {
        // Implementation would depend on how operations are queued
        console.log('[ErrorHandler] Retrying pending operations...');
    }
    
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if currently online
     */
    isOnline() {
        return this.isOnline;
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
            errorCounts: Object.fromEntries(this.errorCounts),
            isOnline: this.isOnline
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
} 