"use client";
import React, { useState } from "react";
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
} from "@apollo/client";

import { ContextProviderApollo } from "./Apollo";

export function ApolloContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentEndpoint, setCurrentEndpoint] =
    React.useState<ApolloClient<NormalizedCacheObject> | null>(null);

  return (
    <ContextProviderApollo value={{ currentEndpoint, setCurrentEndpoint }}>
      {currentEndpoint !== null && (
        <ApolloProvider client={currentEndpoint}>{children}</ApolloProvider>
      )}
      {children}
    </ContextProviderApollo>
  );
}
