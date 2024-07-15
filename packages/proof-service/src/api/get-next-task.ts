import pkg from '@apollo/client';
const { gql } = pkg;
import client from './client.js';
import logger from '../helper/logger.js';
import { NetworkResult } from '../utils/network.js';

const GET_TASK_ID = gql`
  query GetTaskId {
    tasks {
      id
    }
  }
`;

export async function getNextTaskId(): Promise<NetworkResult<string | null>> {
  try {
    const { data } = await client.query({
      query: GET_TASK_ID,
    });

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
