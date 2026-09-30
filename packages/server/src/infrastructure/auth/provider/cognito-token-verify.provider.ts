import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Resource } from 'sst';

export const COGNITO_TOKEN_VERIFIER = Symbol('CognitoTokenVerifier');

export const CognitoTokenVerifierProvider = {
  provide: COGNITO_TOKEN_VERIFIER,
  useFactory: async () => {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: Resource['shuttle-connect-user-pool'].id,
      tokenUse: 'id',
      clientId: Resource.Web.id,
    });

    await verifier.hydrate();

    return verifier;
  },
};

export type CognitoTokenVerifier = Awaited<ReturnType<typeof CognitoTokenVerifierProvider.useFactory>>
