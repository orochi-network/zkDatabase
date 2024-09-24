import { gql, request } from 'graphql-request';
import { config } from '../helper/config.js';
import logger from '../helper/logger.js';
import { NetworkResult } from '../utils/network.js';

const GET_TASK_ID = gql`
  query GetTaskId {
    taskId
  }
`;

export async function getNextTaskId(): Promise<NetworkResult<string | null>> {
  try {
    const data = await request<{ taskId: string }>(
      config.BROKER_SERVICE,
      GET_TASK_ID
    );

    return {
      type: 'success',
      data: data.taskId ? data.taskId.toString() : null,
    };
  } catch (error: unknown) {
    logger.error('Error fetching tasks:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      type: 'error',
      message: errorMessage,
    };
  }
}
