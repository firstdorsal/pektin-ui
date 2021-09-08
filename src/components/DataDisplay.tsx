import { Component } from "react";
import * as t from "./types";
import * as l from "./lib";

import { Box, Container, Grid, Paper, Tab, Tabs } from "@material-ui/core";
import { AccountTree, Code } from "@material-ui/icons";
import { SiJavascript, SiTypescript } from "react-icons/si";
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
    data: t.Rec0;
    config: t.Config;
}

interface DataDisplayState {
    activeTab: number;
}

export default class DataDisplay extends Component<DataDisplayProps, DataDisplayState> {
    state: DataDisplayState = {
        activeTab: this.props.config.defaultActiveTab
    };

    render = () => {
        const tabs = [
            <SyntaxHighlighter showLineNumbers={true} style={codeStyles[this.props.config.codeStyle]} language="json">
                {JSON.stringify(this.props.data, null, "    ")}
            </SyntaxHighlighter>,
            <SyntaxHighlighter showLineNumbers={true} style={codeStyles[this.props.config.codeStyle]} language="javascript">
                {jsTemp(this.props.config.pektinApiAuth?.endpoint, [this.props.data])}
            </SyntaxHighlighter>,
            <SyntaxHighlighter style={codeStyles[this.props.config.codeStyle]} language="text">
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
                                <Tab label="TYPESCRIPT" icon={<SiTypescript style={{ width: "25px" }} />} value={2} />
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

const jsTemp = (endpoint: string, data: t.Rec0[]) => {
    return `
    const token = process.env.PEKTIN_API_TOKEN;
    const endpoint="${endpoint}";
    const res = await fetch(endpoint + "/set", {
       method: "POST",
       body: JSON.stringify({
           token,
           records: ${JSON.stringify(data, null, "    ")}
       })
   }).catch(e => {
       console.log(e);
   });
   console.log(res);
     `;
};

const tsTemp = (endpoint: string, data: t.Rec0[]) => {
    return `
    const token = process.env.PEKTIN_API_TOKEN;
     const endpoint="${endpoint}";
     const res = await fetch(endpoint + "/set", {
        method: "POST",
        body: JSON.stringify({
            token,
            records: ${JSON.stringify(data, null, "    ")}
        })
    }).catch(e => {
        console.log(e);
    });
    console.log(res);
     `;
};
