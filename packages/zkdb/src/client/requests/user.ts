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