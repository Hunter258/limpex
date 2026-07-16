const Sentry = require('@sentry/node');
const logger = require('./logger');

const initSentry = (app) => {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger.info('Sentry not configured (SENTRY_DSN not set). Error telemetry disabled.');
        return false;
    }

    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || '1.0.0',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new Sentry.Integrations.Postgres(),
        ],
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.2,
        beforeSend(event) {
            if (event.request?.headers?.authorization) {
                event.request.headers.authorization = '[FILTERED]';
            }
            if (event.request?.data?.password) {
                event.request.data.password = '[FILTERED]';
            }
            return event;
        },
    });

    logger.info('Sentry error telemetry initialized');
    return true;
};

const captureException = (error, context = {}) => {
    if (process.env.SENTRY_DSN) {
        Sentry.withScope((scope) => {
            Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
            Sentry.captureException(error);
        });
    }
};

const sentryRequestHandler = () => Sentry.Handlers.requestHandler();
const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();
const sentryErrorHandler = () => {
    if (!process.env.SENTRY_DSN) return (req, res, next) => next();
    return Sentry.Handlers.errorHandler();
};

module.exports = {
    initSentry,
    captureException,
    sentryRequestHandler,
    sentryTracingHandler,
    sentryErrorHandler,
    Sentry,
};
