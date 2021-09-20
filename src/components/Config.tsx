import { Container, IconButton, MenuItem, Select, TextField } from "@material-ui/core";
import { Component } from "react";
import * as t from "./types";
import * as l from "./lib";
import { AddCircle, RemoveCircle } from "@material-ui/icons";

interface ConfigProps {
    readonly config: t.Config;
    readonly updateLocalConfig: any;
}
interface ConfigState {
    readonly newKey: string;
    readonly newValue: string;
}
export default class Config extends Component<ConfigProps, ConfigState> {
    state: ConfigState = {
        newKey: "",
        newValue: ""
    };
    handleInputChange = (e: any) => {
        this.setState(state => ({ ...state, [e.target.name]: e.target.value }));
    };

    render = () => {
        const codeStyle = this.props?.config?.local?.codeStyle;
        return (
            <Container>
                <br />
                <h2>Code Style</h2>
                <Select variant="standard" style={{ width: "230px" }} onChange={e => this.props.updateLocalConfig(e, "codeStyle")} name="codeStyle" value={codeStyle}>
                    {l.codeStyles.map(codeStyle => (
                        <MenuItem value={codeStyle} key={codeStyle}>
                            {codeStyle}
                        </MenuItem>
                    ))}
                </Select>
                <br />
                <br />
                <h2>Variables</h2>
                <div>
                    <TextField value={this.state.newKey} name="newKey" onChange={this.handleInputChange} placeholder="key" />
                    <TextField value={this.state.newValue} name="newValue" onChange={this.handleInputChange} placeholder="value" />
                    <IconButton
                        onClick={() => {
                            this.props.updateLocalConfig({ key: this.state.newKey, value: this.state.newValue }, "newVariable");
                            this.setState({ newKey: "", newValue: "" });
                        }}
                    >
                        <AddCircle />
                    </IconButton>
                </div>

                {this.props.config.local.variables.map((v, i) => {
                    return (
                        <div key={i}>
                            <TextField onChange={e => this.props.updateLocalConfig(e, "updateVariable", i)} name="key" placeholder="key" value={v.key} />
                            <TextField onChange={e => this.props.updateLocalConfig(e, "updateVariable", i)} name="value" placeholder="value" value={v.value} />
                            <IconButton onClick={e => this.props.updateLocalConfig(i, "removeVariable")}>
                                <RemoveCircle />
                            </IconButton>
                        </div>
                    );
                })}
            </Container>
        );
    };
}
