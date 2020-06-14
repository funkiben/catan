import express, {Express, Request, Response} from "express";
import {Admin, makeAdmin} from "catan";

const app: Express = express();

app.get('/api', function (req: Request, res: Response) {
  res.send('Hello World!')
});

const port = 4000;
console.log("starting server on port " + port);
app.listen(port);