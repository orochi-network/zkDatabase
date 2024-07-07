import axios from 'axios';
import { NetworkResult } from '../utils/network';

export async function getNextTaskId(): Promise<NetworkResult<string | null>> {
  const response = await axios.get('http://localhost:3000/task');
  if (response.status === 200 && response.data) {
    return {
      type: 'success',
      data: response.data.id ? response.data.id.toString() : null,
    };
  }
  return {
    type: 'error',
    message: response.data,
  };
}
