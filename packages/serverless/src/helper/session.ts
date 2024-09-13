import express from 'express';

export const sessionGenerate = (req: express.Request) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};

export const sessionDestroy = (req: express.Request) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
};
