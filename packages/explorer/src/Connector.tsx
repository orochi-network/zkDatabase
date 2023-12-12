import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useContext, useState } from "react";
import ContextApollo, { IContextApollo } from "@/contexts/Apollo";
import { ApolloClient, InMemoryCache } from "@apollo/client";

export default function Connector(props: any) {
  const { currentEndpoint, setCurrentEndpoint } =
    useContext<IContextApollo>(ContextApollo);

  const [value, setValue] = useState("http://localhost:4000/graphql");

  const handleConnectClick = () => {
    if (currentEndpoint === null) {
      console.log("Connecting to:", value);
      const client = new ApolloClient({
        uri: value,
        cache: new InMemoryCache(),
      });
      setCurrentEndpoint(client);
    } else {
      setCurrentEndpoint(null);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          disabled={currentEndpoint !== null}
          fullWidth={true}
          label="GraphQL Endpoint"
          value={value}
          variant="outlined"
          onChange={(v) => setValue(v.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Button
          style={{ height: "100%" }}
          variant="contained"
          color={currentEndpoint === null ? "success" : "error"}
          onClick={handleConnectClick}
        >
          {currentEndpoint === null ? "Connect" : "Disconnect"}
        </Button>
      </Grid>
    </Grid>
  );
}
