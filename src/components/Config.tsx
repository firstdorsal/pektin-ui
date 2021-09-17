import { Container, MenuItem, Select } from "@mui/material";
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
        const codeStyle = this.props?.config?.local?.codeStyle;
        return (
            <Container>
                <br />
                <h1>Config</h1>
                <h2>Code Style</h2>
                <Select variant="standard" style={{ width: "230px" }} onChange={this.props.updateConfig} name="codeStyle" value={codeStyle}>
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
