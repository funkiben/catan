import express, {Express, Router} from "express";
import sessions from "client-sessions";


export function addCatanAPI(app: Express, cookieDuration: number, path: string) {
  app.use(sessions({
    cookieName: 'playerId', // cookie name dictates the key name added to the request object
    secret: 'n6judezfV2oBq64D7Kvj', // should be a large unguessable string
    duration: cookieDuration, // how long the session will stay valid in ms
    cookie: {
      path: path, // cookie will only be sent to requests under '/api'
      httpOnly: true, // when true, cookie is not accessible from javascript
      secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
    }
  }));

  app.use(path, getRouter());
}

function getRouter(): Router {
  const router = express.Router();

  router.get("/", );

  return router;
}