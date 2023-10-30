// import * as React from "react";
// import Box from "@mui/material/Box";
// import Grid from "@mui/material/Grid";
// import CircularProgress from "@mui/material/CircularProgress";
// import {
//   ApolloClient,
//   ApolloProvider,
//   NormalizedCacheObject,
//   useQuery,
// } from "@apollo/client";
// import Connector from "./Connector";
// import { ContextProviderApollo } from "./context/Apollo";
// import { QUERY_METADATA } from "./GraphQLQuery";

// export function FullWidthGrid() {
//   const { loading, error, data } = useQuery(QUERY_METADATA);

//   return (
//     <Box sx={{ flexGrow: 1 }}>
//       <Grid container spacing={2}>
//         {loading && (
//           <Grid item xs={12} md={12}>
//             <CircularProgress />
//           </Grid>
//         )}

//         {!loading &&
//           typeof error === "undefined" &&
//           Object.entries<string>(data.getMetadata).map(
//             ([key, value]: [string, string]) => (
//               <Grid item xs={12} md={12}>
//                 <strong>Collection: {key}</strong>
//                 <br />
//                 CID: {value}
//               </Grid>
//             )
//           )}
//       </Grid>
//     </Box>
//   );
// }

// function App() {
//   const [currentEndpoint, setCurrentEndpoint] =
//     React.useState<ApolloClient<NormalizedCacheObject> | null>(null);

//   React.useEffect(() => {
//     console.log(currentEndpoint);
//   }, [currentEndpoint]);

//   return (
//     <ContextProviderApollo value={{ currentEndpoint, setCurrentEndpoint }}>
//       <Box padding={2} sx={{ flexGrow: 1 }}>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={12}>
//             <Connector />
//           </Grid>
//           <Grid item xs={6} md={4}></Grid>
//           <Grid item xs={6} md={4}></Grid>
//           <Grid item xs={6} md={8}></Grid>
//         </Grid>
//         {currentEndpoint !== null && (
//           <ApolloProvider client={currentEndpoint}>
//             <FullWidthGrid />
//           </ApolloProvider>
//         )}
//       </Box>
//     </ContextProviderApollo>
//   );
// }

// export default App;
