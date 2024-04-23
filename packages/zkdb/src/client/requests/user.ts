import { query, mutate } from '../graphql-client.js';

export type SignatureProofData = {
  signature: {
    scalar: string;
    field: string;
  };
  publicKey: string;
  data: string;
};

export type SignUpData = {
  userName: string;
  email: string;
  timestamp: number;
  userData: any;
};

export interface UserSignInResponse {
  success: boolean;
  error: string | null;
  userName: string;
  sessionKey: string;
  sessionId: string;
  userData: JSON;
}

export interface UserSignUpResponse {
  success: boolean;
  error: string;
  userName: string;
  email: string;
  publicKey: string;
}

export interface UserSignOutResponse {
  success: boolean;
}

export const USER_SIGN_IN_MUTATION = `
  mutation UserSignIn($proof: SignatureProof!) {
    userSignIn(proof: $proof) {
      success
      error
      userName
      sessionKey
      sessionId
      userData
    }
  }
`;

export const USER_SIGN_OUT_MUTATION = `
  mutation UserSignOut {
    userSignOut
  }
`;

export const USER_SIGN_UP_MUTATION = `
  mutation UserSignUp($signUp: SignUp!, $proof: SignatureProof!) {
    userSignUp(signUp: $signUp, proof: $proof) {
      success
      error
      userName
      email
      publicKey
    }
  }
`;

export const USER_SIGN_IN_DATA_QUERY = `
  query UserSignInData {
    userSignInData {
      success
      error
      userName
      sessionKey
      sessionId
      userData
    }
  }
`;

export const signIn = async (
  signature: SignatureProofData
): Promise<UserSignInResponse> => {
  try {
    const variables = { proof: signature };
    const response = await mutate<{ userSignIn: UserSignInResponse }>(
      USER_SIGN_IN_MUTATION,
      variables
    );
    const { userSignIn } = response;

    if (!userSignIn) {
      throw new Error('Authentication failed: No response from server');
    }

    return {
      ...userSignIn,
    };
  } catch (error) {
    console.error('SignIn error:', error);
    throw new Error('SignIn failed: ' + error);
  }
};

export const signUp = async (
  signature: SignatureProofData,
  signUpData: SignUpData
): Promise<UserSignUpResponse> => {
  try {
    const variables = { signUp: signUpData, proof: signature };
    const response = await mutate<{ userSignUp: UserSignUpResponse }>(
      USER_SIGN_UP_MUTATION,
      variables
    );
    const { userSignUp } = response;

    return {
      ...userSignUp,
    };
  } catch (error) {
    console.error('SignUp error:', error);
    throw new Error('SignUp failed: ' + error);
  }
};

export const signOut = async (): Promise<UserSignOutResponse> => {
  try {
    const response = await mutate<{ userSignOut: UserSignOutResponse }>(
      USER_SIGN_OUT_MUTATION,
      {}
    );
    const { userSignOut } = response;

    return {
      ...userSignOut,
    };
  } catch (error) {
    console.error('SignOut error:', error);
    throw new Error('SignOut failed: ' + error);
  }
};

export const getUser = async (): Promise<UserSignInResponse> => {
  try {
    const response = await query<{ userSignInData: UserSignInResponse }>(
      USER_SIGN_IN_DATA_QUERY,
      {}
    );
    const { userSignInData } = response;

    if (!userSignInData) {
      throw new Error('Authentication failed: No response from server');
    }

    return {
      ...userSignInData,
    };
  } catch (error) {
    console.error('getUser error:', error);
    throw new Error('getUser failed: ' + error);
  }
};
