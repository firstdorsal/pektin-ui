import { Container, MenuItem, Select } from "@material-ui/core";
import { Component } from "react";
import * as t from "./types";
import * as l from "./lib";

interface ConfigProps {
    readonly config: t.Config;
    readonly updateConfig: any;
}
interface ConfigState {}
export default class Config extends Component<ConfigProps, ConfigState> {
    render = () => {
        return (
            <Container>
                <br />
                <h1>Config</h1>
                <h2>Code Style</h2>
                <Select onChange={this.props.updateConfig} name="codeStyle" value={this.props.config.codeStyle}>
                    {l.codeStyles.map(codeStyle => (
                        <MenuItem value={codeStyle} key={codeStyle}>
                            {codeStyle}
                        </MenuItem>
                    ))}
                </Select>
            </Container>
        );
    };
}
