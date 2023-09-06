import { NextFunction, Request, Response } from 'express';
import config from '../helper/config';
import axios from 'axios';
import { UploadedFile } from 'express-fileupload';
import JWTAuthenInstance from '../helper/jwt';
import { ModelUser } from '../model/user';
import { ModelApiKey } from '../model/api_key';
import logger from '../helper/logger';
import { ModelFileLog } from '../model/file_log';

export const REQUIRED_AUTHENTICATION = [
  'files/rm',
  'files/cp',
  'add',
  'pin/add',
  'name/publish',
];

export const REMOVE_ACTION = 'files/rm';
export const ADD_ACTION = 'add';
export const PIN_ADD_ACTION = 'pin/add';

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
    data,
  });

  return response.data;
};

const addFileRequest = async (
  req: Request,
  res: Response,
  userId: number,
  _next: NextFunction
) => {
  const imFileLog = new ModelFileLog();
  const result = await transferRequest(req, res);
  await imFileLog.addFile(userId, result?.Name);
  return res.json({ result });
};

const removeFileRequest = async (
  req: Request,
  res: Response,
  userId: number,
  _next: NextFunction
) => {};

const kuboProxy = async (req: Request, res: Response, _next: NextFunction) => {
  const imUser = new ModelUser();
  const imApiKey = new ModelApiKey();
  const token = req.headers.authorization;
  const apiKey = req.header('X-API-KEY');

  const requireAuth = REQUIRED_AUTHENTICATION.some(
    (arg) => req.url.indexOf(arg) >= 0
  );

  logger.info(
    `Proxy to ${config.kuboUrl}${req.url} with requireAuth = ${requireAuth}`
  );

  if (requireAuth) {
    const isAdd =
      req.url.indexOf(ADD_ACTION) >= 0 && req.url.indexOf('pin/add') < 0;
    const isRemove = req.url.indexOf(REMOVE_ACTION) >= 0;
    if (token) {
      const { uuid } = await JWTAuthenInstance.verifyHeader(token);
      if (uuid) {
        const [dbUser] = await imUser.get([{ field: 'uuid', value: uuid }]);
        if (dbUser) {
          if (isAdd) {
            return addFileRequest(req, res, dbUser.id, _next);
          }
        }
      }
    }
    if (apiKey) {
      const [dbUser] = await imApiKey.get([{ field: 'key', value: apiKey }]);
      if (dbUser) {
        if (isAdd) {
          return addFileRequest(req, res, dbUser.id, _next);
        }
        const result = await transferRequest(req, res);
        return res.json({ result });
      }
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  return transferRequest(req, res);
};

export default kuboProxy;
