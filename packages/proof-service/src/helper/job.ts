import { spawn } from 'child_process';
import logger from './logger';
export type JobStatus = 'ready' | 'processing' | 'done' | 'error';

export class Job {
  private file: string;
  private args: string[];
  private status: JobStatus;

  constructor(file: string, args: string[]) {
    this.status = 'ready';
    this.file = file;
    this.args = args;
  }

  start() {
    if (this.status !== 'ready') {
      return;
    }
    this.status = 'processing';
    const params = [this.file].concat(this.args);
    const jobProcess = spawn('node', params);

    jobProcess.stderr.on('data', (data) => {
      logger.error(`stderr: ${data}`);
    });

    jobProcess.on('close', (code) => {
      logger.debug(`Close with ${code}`);
      if (code === 0) {
        this.status = 'done';
      } else {
        this.status = 'error';
      }
    });
  }

  getStatus(): JobStatus {
    return this.status;
  }
}
