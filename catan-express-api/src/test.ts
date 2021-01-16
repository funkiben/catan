import express, {Express, Request, Response} from "express";
import {addCatanAPI} from "./index";

const app: Express = express();

const cookieDuration = 24 * 60 * 60 * 1000;

addCatanAPI(app, cookieDuration, "/api");


const port = 4000;
console.log("starting server on port " + port);
app.listen(port);