const { transports, createLogger, format } = require("winston");
const util = require("util");
const moment = require("moment");
const path = require("path");

const MESSAGE = Symbol.for("message");

module.exports = function (module) {
  let logger;
  const filename = path.basename(module.filename);
  //   console.log(module);

  if (!logger) {
    logger = createLogger({
      format: format.combine(
        format(function (info, opts) {
          prefix = util.format(
            "[%s] [%s] [%s]",
            moment().format("YYYY-MM-DD hh:mm:ss").trim(),
            info.level.toUpperCase(),
            filename
          );
          if (info.splat) {
            info.message = util.format(
              "%s %s",
              prefix,
              util.format(info.message, ...info.splat)
            );
          } else {
            info.message = util.format(
              "%s %s",
              prefix,
              JSON.stringify(info.message)
            );
          }
          return info;
        })(),
        format(function (info) {
          info[MESSAGE] = info.message;
          return info;
        })()
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: "logs/error/error.log",
          level: "error",
        }),
        new transports.File({
          filename: "logs/activity/activity.log",
          level: "info",
        }),
      ],
    });

    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    //   if (process.env.NODE_ENV !== "production") {
    //     logger.add(
    //       new transports.Console({
    //         format: format.simple(),
    //       })
    //     );
    //   }
  }
  return logger;
};
