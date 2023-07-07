import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import React from "react";
import { createContext } from "react";

export interface IContextApollo {
  currentEndpoint: ApolloClient<NormalizedCacheObject> | null;
  setCurrentEndpoint: Function;
}

const ContextApollo = createContext<IContextApollo>({
  currentEndpoint: null,
  setCurrentEndpoint: () => {},
});

export const ContextProviderApollo: React.FC<{
  children?: React.ReactNode;
  value: IContextApollo;
}> = (props) => {
  return (
    <ContextApollo.Provider value={props.value}>
      {props.children}
    </ContextApollo.Provider>
  );
};

export default ContextApollo;
