import { NextFunction, Request, Response } from 'express';
import config from '../helper/config';
import axios from 'axios';
import { UploadedFile } from 'express-fileupload';
import JWTAuthenInstance from '../helper/jwt';
import { ModelUser } from '../model/user';
import { ModelApiKey } from '../model/api_key';

export const REQUIRED_AUTHENTICATION = [
  'files/rm',
  'files/cp',
  'add',
  'pin/add',
  'name/publish',
];

const getData = (req: Request) => {
  if (req.body['data']) return req.body['data'];
  if (req?.files?.file) {
    const file = req?.files?.file as UploadedFile;
    const formData = new FormData();
    formData.append('file', file.data.toString());
    return formData;
  }
  return null;
};

const transferRequest = async (req: Request, res: Response) => {
  const method = req.body['method'] ?? 'POST';
  const headers = req.body['headers'] ?? null;
  const params = req.body['params'] ?? null;
  const data = getData(req);

  const response = await axios({
    method: method,
    url: `${config.kuboUrl}${req.url}`,
    headers: headers,
    params: params,
    data: data,
    responseType: 'stream',
  });
  for (let key in response.headers) {
    res.setHeader(key, response.headers[key]);
  }

  const stream = response.data;
  stream.pipe(res);
};

const kuboProxy = async (req: Request, res: Response, next: NextFunction) => {
  const imUser = new ModelUser();
  const imApiKey = new ModelApiKey();
  const token = req.headers.authorization;
  const apiKey = req.header('X-API-KEY');
  console.log(req.url);

  const requireAuth = REQUIRED_AUTHENTICATION.some(
    (arg) => req.url.indexOf(arg) >= 0
  );
  console.log(requireAuth);

  if (requireAuth) {
    if (token) {
      const { uuid } = await JWTAuthenInstance.verifyHeader(token);
      if (uuid) {
        const [dbUser] = await imUser.get([{ field: 'uuid', value: uuid }]);
        if (dbUser) {
          return transferRequest(req, res);
        }
      }
    }
    if (apiKey) {
      const isExist = await imApiKey.isExist('key', apiKey);
      if (isExist) {
        return transferRequest(req, res);
      }
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  return transferRequest(req, res);
};

export default kuboProxy;
