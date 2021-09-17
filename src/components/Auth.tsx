import { Container, Paper, TextField } from "@material-ui/core";
import React, { Component, ReactElement } from "react";
import * as t from "./types";
import * as l from "./lib";
import * as vaultApi from "./apis/vault";
import { Refresh, Security } from "@material-ui/icons";
import HelpPopper from "./HelpPopper";
import { RouteComponentProps } from "react-router-dom";

const defaultAuthHelper = <span>JSON blob containing the URL, username, and password for vault</span>;

interface AuthProps extends RouteComponentProps {
    config: t.Config;
    saveAuth: Function;
}
interface AuthState {
    open: boolean;
    authField: string;
    authError: boolean;
    authHelper: ReactElement;
    lastValue: string;
}
export default class Auth extends Component<AuthProps, AuthState> {
    state: AuthState = {
        open: false,
        authField: "",
        authError: false,
        authHelper: defaultAuthHelper,
        lastValue: ""
    };

    authChange = async (e: any, button: boolean = false) => {
        let value = button ? e : e?.target?.value;

        if (value === undefined) return;
        this.setState({ lastValue: value });
        let authError = false;
        let authHelper = defaultAuthHelper;
        try {
            const parsed = JSON.parse(value);
            ["vaultEndpoint", "username", "password"].some(field => {
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
            // send the config to vault and try to get a token
            if (!authError) {
                const r: any = await vaultApi.getToken(parsed);

                if (r.error) {
                    authHelper = r.error;
                    authError = true;
                } else if (r.errors) {
                    if (r.errors[0] === "Vault is sealed") {
                        authHelper = (
                            <React.Fragment>
                                {r.errors[0]}.{" "}
                                <a href={`${parsed.vaultEndpoint}/ui/vault/unseal`} style={{ textDecoration: "underline" }}>
                                    You can unseal it here
                                </a>
                            </React.Fragment>
                        );
                        authError = true;
                    } else {
                        authHelper = <span>{r.errors[0]}</span>;
                        authError = true;
                    }
                } else {
                    value = { endpoint: parsed.vaultEndpoint };
                    value.token = r.auth?.client_token;
                    authError = false;
                    delete parsed.password;
                }
            }
        } catch (err) {
            authHelper = <span>Invalid JSON</span>;
            authError = true;
        }

        if (!authError) {
            this.props.saveAuth(value);
            return this.props.history.push("/");
        }
        this.setState({ authField: value, authError, authHelper });
    };
    render() {
        return (
            <Container maxWidth="sm" style={{ marginTop: "30vh" }}>
                <Paper style={{ padding: "20px" }} elevation={3}>
                    <div className="cardHead">
                        <Security />
                        <span className="caps label">Auth</span>
                    </div>
                    <TextField
                        error={this.state.authError}
                        style={{ width: "90%", float: "left" }}
                        required
                        value={this.state.authField}
                        name="pektin-ui-connection-config"
                        label="Pektin Ui Connection Config"
                        helperText={this.state.authHelper}
                        onChange={this.authChange}
                    ></TextField>
                    <Refresh onClick={() => this.authChange(this.state.lastValue, true)} />

                    <HelpPopper style={{ marginTop: "10px" }}>{l.help.auth}</HelpPopper>
                    <br />
                    <br />
                </Paper>
            </Container>
        );
    }
}
/*


{"vaultEndpoint":"http://127.0.0.1:8200","username":"test","password":"test"}

 */
