import { Container, Paper, TextField } from "@material-ui/core";
import { Component } from "react";
import * as t from "./types";
import * as l from "./lib";
import { Security } from "@material-ui/icons";
import HelpPopper from "./HelpPopper";
import { RouteComponentProps } from "react-router-dom";

const defaultAuthHelper = "JSON blob containing the URL, username, and password for vault";

interface AuthProps extends RouteComponentProps {
    config: t.Config;
    saveAuth: Function;
}
interface AuthState {
    open: boolean;
    authField: string;
    authError: boolean;
    authHelper: string;
}
export default class Auth extends Component<AuthProps, AuthState> {
    state: AuthState = {
        open: false,
        authField: "",
        authError: false,
        authHelper: defaultAuthHelper
    };
    authChange = async (e: any) => {
        let value = e?.target?.value;
        if (value === undefined) return;
        let authError = false;
        let authHelper = defaultAuthHelper;
        try {
            const parsed = JSON.parse(value);
            ["vaultEndpoint", "username", "password"].some(field => {
                if (parsed[field] === undefined) {
                    authError = true;
                    authHelper = `missing ${field}`;
                    return true;
                } else if (!parsed[field]) {
                    authError = true;
                    authHelper = `${field} can't be empty`;
                    return true;
                }
                return false;
            });
            // send the config to vault and try to get a token
            if (!authError) {
                const r: any = await l.getVaultToken(parsed);
                console.log(r);

                if (r.error) {
                    authHelper = r.error;
                    authError = true;
                } else {
                    value = { vaultEndpoint: parsed.vaultEndpoint };
                    value.token = r.auth?.client_token;
                    authError = false;
                }
            }
        } catch (err) {
            authHelper = "Invalid JSON";
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
                        name="vault-access-config"
                        label="Vault Access Config"
                        helperText={this.state.authHelper}
                        onChange={this.authChange}
                    ></TextField>

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
