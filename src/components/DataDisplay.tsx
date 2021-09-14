import React, { Component } from "react";
import * as t from "./types";
import * as l from "./lib";

import { Box, Container, Grid, Paper, Switch, Tab, Tabs } from "@material-ui/core";
import { AccountTree, Code } from "@material-ui/icons";
import { SiCurl, SiJavascript } from "react-icons/si";
import { MdShortText } from "react-icons/md";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import * as codeStyles from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("json", json);
//import parserTypescript from "prettier/parser-typescript";
//import { format } from "prettier/standalone";

interface DataDisplayProps {
    data: t.RedisEntry;
    config: t.Config;
}

interface DataDisplayState {
    activeTab: number;
}

export default class DataDisplay extends Component<DataDisplayProps, DataDisplayState> {
    state: DataDisplayState = {
        activeTab: this.props.config.local.defaultActiveTab
    };

    render = () => {
        const codeStyle = codeStyles[this.props.config.local.codeStyle];
        const tabs = [
            <SyntaxHighlighter showLineNumbers={true} style={codeStyle} language="json">
                {JSON.stringify(this.props.data, null, "    ")}
            </SyntaxHighlighter>,
            <SyntaxHighlighter showLineNumbers={true} style={codeStyle} language="javascript">
                {l.jsTemp(l.getApiDomain(this.props.config), [this.props.data])}
            </SyntaxHighlighter>,
            <CurlTab config={this.props.config} data={this.props.data}></CurlTab>,
            <SyntaxHighlighter showLineNumbers={true} style={codeStyle} language="text">
                {l.rec0ToBind(this.props.data)}
            </SyntaxHighlighter>
        ];

        return (
            <Grid container item xs={8}>
                <Grid style={{ marginBottom: "20px" }} item xs={12}>
                    <Paper>
                        <Container>
                            <div className="cardHead">
                                <Code />
                                <span className="caps label">code</span>
                            </div>
                        </Container>
                        <Box>
                            <Tabs className="tabs" variant="fullWidth" value={this.state.activeTab} onChange={(e, n) => this.setState({ activeTab: n })}>
                                <Tab label="JSON" icon={<AccountTree style={{ width: "20px", height: "10px", transform: "scale(2)" }} />} value={0} />
                                <Tab label="JAVASCRIPT" icon={<SiJavascript style={{ width: "25px" }} />} value={1} />
                                <Tab label="CURL" icon={<SiCurl style={{ width: "25px" }} />} value={2} />
                                <Tab label="BIND" icon={<MdShortText style={{ width: "25px" }} />} value={3} />
                            </Tabs>
                        </Box>
                        <Box>{tabs[this.state.activeTab]}</Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    };
}

interface CurlTabProps {
    data: t.RedisEntry;
    config: t.Config;
}

interface CurlTabState {
    multiline: boolean;
}
class CurlTab extends Component<CurlTabProps, CurlTabState> {
    state: CurlTabState = {
        multiline: false
    };
    render = () => {
        const codeStyle = codeStyles[this.props.config.local.codeStyle];
        return (
            <React.Fragment>
                <Container style={{ textAlign: "center" }}>
                    <Switch onChange={() => this.setState(({ multiline }) => ({ multiline: !multiline }))} />
                    Multiline
                </Container>
                <SyntaxHighlighter showLineNumbers={true} style={codeStyle} language="sh">
                    {l.curl(l.getApiDomain(this.props.config), [this.props.data], this.state.multiline)}
                </SyntaxHighlighter>
            </React.Fragment>
        );
    };
}
