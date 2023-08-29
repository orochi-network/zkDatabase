import { NextFunction, Request, Response } from 'express';
import config from '../helper/config';
import axios from 'axios';
import { UploadedFile } from 'express-fileupload';

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

const kuboProxy = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  const apiKey = req.header('X-API-KEY');
  console.log(req.url);

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

export default kuboProxy;
