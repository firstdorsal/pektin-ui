import { Container, IconButton, Paper, TextField } from "@material-ui/core";
import React, { Component, ReactElement } from "react";
import * as t from "./types";
import * as l from "./lib";
import { Refresh, Security } from "@material-ui/icons";
import HelpPopper from "./HelpPopper";
import { RouteComponentProps } from "react-router-dom";
import { PektinClient } from "@pektin/client";
import { PektinClientConnectionConfigOverride } from "@pektin/client/src/types";
import App from "../App";

const defaultAuthHelper = (
  <span>JSON blob containing the URL, client username, and passwords for vault</span>
);

// TODO make session storage optional

interface AuthProps extends RouteComponentProps {
  readonly config: t.Config;
  readonly saveAuth: InstanceType<typeof App>["saveAuth"]; // HOWTO define function type
}
interface AuthState {
  readonly open: boolean;
  readonly authField: string;
  readonly authError: boolean;
  readonly authHelper: ReactElement;
  readonly lastValue: string;
}
export default class Auth extends Component<AuthProps, AuthState> {
  state: AuthState = {
    open: false,
    authField: "",
    authError: false,
    authHelper: defaultAuthHelper,
    lastValue: "",
  };

  authChange = async (e: any, button: boolean = false) => {
    let value = button ? e : e?.target?.value;
    let client;
    if (value === undefined) return;
    this.setState({ lastValue: value });
    let authError = false;
    let authHelper = defaultAuthHelper;
    let parsed: any;
    try {
      parsed = JSON.parse(value);

      ["vaultEndpoint", "username", "confidantPassword"].some((field) => {
        if (parsed[field] === undefined) {
          authError = true;
          authHelper = <span>missing {field}</span>;
          return true;
        } else if (!parsed[field]) {
          authError = true;
          authHelper = <span>{field} can't be empty</span>;
          return true;
        }
        return false;
      });
    } catch (err) {
      authHelper = <span>Invalid JSON</span>;
      authError = true;
    }

    // send the config to vault and try to get a token
    if (!authError) {
      try {
        client = new PektinClient(parsed);
        await client.getDomains();
        value = parsed;
        authError = false;
      } catch (e) {
        // TODO: more error handling;
        let error = "";
        if (typeof e === "string") {
          error = e;
        } else if (e instanceof Error) {
          error = e.message;
        }

        if (error.includes("Couldn't fetch")) {
          authHelper = (
            <React.Fragment>
              Couldn't fetch: Is Vault sealed?{" "}
              <a
                target="blank"
                rel="norefferer"
                href={`${parsed.vaultEndpoint}/ui/vault/unseal`}
                style={{ textDecoration: "underline" }}
              >
                You can unseal it here
              </a>
            </React.Fragment>
          );
          authError = true;
        } else {
          authHelper = <span>An error occured: {error}</span>;
          authError = true;
        }
      }
    }

    if (!authError && client !== undefined) {
      await this.props.saveAuth(value as PektinClientConnectionConfigOverride, client);
      return this.props.history.push("/");
    }
    this.setState({ authField: value, authError, authHelper });
  };

  // TODO button ploppt manchmal nochmal kurz auf

  // TODO: Add manual input
  render = () => {
    return (
      <Container maxWidth="sm" style={{ marginTop: "30vh" }}>
        <Paper
          style={{ padding: "20px", position: "relative", paddingBottom: "70px" }}
          elevation={3}
        >
          <div className="cardHead">
            <Security />
            <span className="caps label">Auth</span>
          </div>
          <TextField
            error={this.state.authError}
            style={{ width: "90%", float: "left" }}
            required
            value={this.state.authField}
            name="pektin-client-connection-config"
            label="Pektin Client Connection Config"
            helperText={this.state.authHelper}
            onChange={this.authChange}
          />
          <IconButton
            onClick={() => this.authChange(this.state.lastValue, true)}
            style={{
              float: "right",
              marginTop: "10px",
            }}
          >
            <Refresh />
          </IconButton>

          <HelpPopper style={{ top: "10px", right: "10px", position: "absolute" }}>
            {l.help.auth}
          </HelpPopper>
          <br />
          <br />
        </Paper>
      </Container>
    );
  };
}
/*


{"vaultEndpoint":"http://127.0.0.1:8200","username":"test","password":"test"}

 */
