import { FtpSrv } from "ftp-srv";
import { join } from "path";
import { config } from "./helper/config.js";
import logger from "./helper/logger.js";

const hostname = "127.0.0.1";
const port = 2121;

const ftpServer = new FtpSrv({
  url: `ftp://${config.HOST_NAME}:${config.PORT}`,
  anonymous: true,
  pasv_url: config.HOST_NAME, // Passive URL
  pasv_min: config.PASV_MIN, //1024,     // Minimum passive port
  pasv_max: config.PASV_MAX, //1050      // Maximum passive port
});

ftpServer.on("login", ({ connection, username, password }, resolve, reject) => {
  resolve({ root: join(process.cwd(), "ftp-root") });
});

ftpServer.on("client-error", (err) => {
  logger.error("FTP Server error:", err);
});

ftpServer
  .listen()
  .then(() => {
    logger.info(`FTP server running at ftp://${hostname}:${port}/`);
  })
  .catch((err) => {
    logger.error("Error starting FTP server:", err);
  });
