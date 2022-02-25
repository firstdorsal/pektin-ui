import { Button, Container, Grid, Paper } from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { Component } from "react";
import { Config, Glob } from "./types";
import Editor from "@monaco-editor/react";
import { codeEditorOptions } from "./lib";

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
    const options = this.props.config.local.codeEditor ?? codeEditorOptions;
    return (
      <div className="ExecuteQuery">
        <Container style={{ margin: "20px auto" }}>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <Editor
                defaultLanguage="yaml"
                onChange={(value, event) => this.setState({ query: value ?? "" })}
                value={this.state.query}
                height="90vh"
                width="100%"
                className="codeEditor"
                options={options}
                theme="vs-dark"
              />
              <Button variant="contained" color="primary" endIcon={<Send />}>
                Send
              </Button>
            </Grid>
            <Grid item xs={4} style={{ background: "none" }}>
              <Editor
                defaultLanguage="yaml"
                onChange={(value, event) => this.setState({ query: value ?? "" })}
                value={this.state.query}
                height="90vh"
                width="100%"
                options={{ ...options, readOnly: true }}
                theme="vs-dark"
              />
            </Grid>
          </Grid>
        </Container>
      </div>
    );
  };
}
