import { ObjectId } from "mongodb";
import { Job, JobStatus } from "../helper/job.js";
import path from "path";

export class ProofService {
  private static INSTANCE: ProofService | undefined = undefined;
  private job: Job | null = null;

  private constructor() {}

  static getInstance() {
    if (!this.INSTANCE) {
      this.INSTANCE = new ProofService();
    }
    return this.INSTANCE;
  }

  async createProof(id: ObjectId) {
    this.job = new Job(path.resolve(__dirname, '../domain/create-proof.js'), [id.toString()]);
    this.job.start();
  }

  status(): JobStatus | null {
    if (!this.job) {
      return null;
    }
    return this.job.getStatus();
  }
}