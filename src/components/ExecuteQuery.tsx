import { Button, Container, Grid, Paper } from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Component } from "react";
import { Config, Glob } from "./types";

interface ExecuteQueryProps {
  g: Glob;
  config: Config;
}
interface ExecuteQueryState {
  query: string;
}
export default class ExecuteQuery extends Component<ExecuteQueryProps, ExecuteQueryState> {
  state = {
    query: "",
  };
  render = () => {
    return (
      <div className="ExecuteQuery">
        <Container style={{ margin: "20px auto" }}>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <Button variant="contained" color="primary" endIcon={<Send />}>
                Send
              </Button>
            </Grid>
            <Grid item xs={4} style={{ background: "none" }}></Grid>
          </Grid>
        </Container>
      </div>
    );
  };
}
