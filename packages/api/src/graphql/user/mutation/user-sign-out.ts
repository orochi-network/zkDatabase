import { gql } from "@apollo/client";
import client from "../../client";
import { NetworkResult } from "../../../utils/network";

export const SIGN_OUT = gql`
  mutation UserSignOut {
    userSignOut
  }
`;

interface UserSignOutResponse {
  success: boolean;
}

export const signOut = async (
  token: string
): Promise<NetworkResult<undefined>> => {
  try {
    const { data } = await client.mutate<{ userSignOut: UserSignOutResponse }>({
      mutation: SIGN_OUT,
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.userSignOut;

    if (response && response.success) {
      return {
        type: "success",
        data: undefined
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  } catch (error) {
    return {
      type: "error",
      message: `${(error as any).message}` ?? "An unknown error occurred",
    };
  }
};
