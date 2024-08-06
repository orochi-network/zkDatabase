import { FtpSrv } from 'ftp-srv';
import { join } from 'path';

const hostname = '127.0.0.1';
const port = 2121;

const ftpServer = new FtpSrv({
  url: `ftp://${hostname}:${port}`,
  anonymous: true,
  pasv_url: hostname, // Passive URL
  pasv_min: 1024,     // Minimum passive port
  pasv_max: 1050      // Maximum passive port
});

ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
  resolve({ root: join(process.cwd(), 'ftp-root') });
});

ftpServer.on('client-error', (err) => {
  console.error('FTP Server error:', err);
});

ftpServer.listen()
  .then(() => {
    console.log(`FTP server running at ftp://${hostname}:${port}/`);
  })
  .catch(err => {
    console.error('Error starting FTP server:', err);
  });
