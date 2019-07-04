import { Request, Response, NextFunction } from 'express';

import OktaJwtVerifier from '@okta/jwt-verifier';

import { config } from '../../config/config';

import { getAttributes } from './get-attributes';

import { logger } from '../../lib/logger';

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: config.get('clientId'),
  issuer: config.get('issuer')
});

logger.info('checkJwt issuer: ' + config.get('issuer'));
logger.info('checkJwt clientId: ' + config.get('clientId'));

//
// Attribute-Based Access Control
//
// In ABAC terms, Policy Enforcement Point and Policy Decision Point
//

export const preAuthorise = (req: Request, res: Response, next: NextFunction) => {

  //
  // URI Path Design
  // See: https://github.com/Robinyo/restful-api-design-guidelines#uri-path-design
  //

  const path = req.route.path || '/';


  //
  // See: https://github.com/Robinyo/restful-api-design-guidelines#standard-request-methods
  //

  const method = req.route.stack[0].method.toUpperCase() || 'GET';

  logger.info(method + ' ' + path + 'HTTP/1.1');

  const attributes = getAttributes(path, method);

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    logger.error('preAuthorise !match');
    return res.status(401).end();
  }

  const accessToken = match[1];
  const expectedAudience = 'api://default';

  return oktaJwtVerifier.verifyAccessToken(accessToken, expectedAudience).then((jwt: any) => {
    // req.jwt = jwt;
    logger.info('preAuthorise jwt.claims: ' + JSON.stringify(jwt.claims));
    next();
  })
  .catch((error: any) => {
    logger.error('preAuthorise error: ' + error.message);
    res.status(401).send(error.message);
  });

};

// export default preAuthorise;

// logger.info('preAuthorise req.route: ' + JSON.stringify(req.route));

// https://developer.okta.com/docs/guides/validate-access-tokens/overview/

// https://github.com/okta/okta-oidc-js/tree/master/packages/jwt-verifier

/*

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: config.get('issuer'),
  clientId: config.get('clientId'),
  assertClaims: {
    aud: 'api://default',
  },
});

*/

/*

const authHeader = req.headers.authorization || '';
const match = authHeader.match(/Bearer (.+)/);

if (!match) {
  logger.error('preAuthorise !match');
  return res.status(401).end();
}

const accessToken = match[1];
const expectedAudience = 'api://default';

return oktaJwtVerifier.verifyAccessToken(accessToken, expectedAudience).then((jwt: any) => {
  // req.jwt = jwt;
  logger.info('preAuthorise jwt.claims: ' + JSON.stringify(jwt.claims));
  next();
})
.catch((error: any) => {
  logger.error('preAuthorise error: ' + error.message);
  res.status(401).send(error.message);
});

*/