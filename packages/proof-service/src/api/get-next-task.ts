import axios from 'axios';
import { NetworkResult } from '../utils/network';

export async function getNextTaskId(): Promise<NetworkResult<string | null>> {
  const response = await axios.get('http://localhost:3000/task');
  if (response.status === 200) {
    const id = response.data.id;
    
    return {
      type: 'success',
      data: id ? id.toString() : null,
    };
  } else {
    return {
      type: 'error',
      message: response.data,
    };
  }
}
