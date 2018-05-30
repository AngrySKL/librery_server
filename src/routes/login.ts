import { Router } from "express";
import { LoginSuccess, LoginFail } from '../models/response';

import * as bodyParser from 'body-parser';

const loginRouter: Router = Router();
const urlParser = bodyParser.json();

loginRouter.post('/', urlParser, (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  console.log(`username = ${username}`);
  console.log(`password = ${password}`);

  if (username === 'Veal' && password === "Elekta") {
    res.json(new LoginSuccess({ nickname: 'Veal', id: 32}));
  } else {
    res.json(new LoginFail());
  }
});

export { loginRouter };