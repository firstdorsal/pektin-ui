import { Container, Grid, Paper } from "@material-ui/core";
import { AccountTree, Message } from "@material-ui/icons";
import { Component } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/hljs";
import * as t from "./types";
import * as l from "./lib";
/*
import jsonParser from "prettier/parser-html";
import prettier from "prettier/standalone";
prettier.format(CODE, { parser: "json", plugins: [jsonParser] });*/

interface DataDisplayProps {
    data: t.Rec0;
}

interface DataDisplayState {}

export default class DataDisplay extends Component<DataDisplayProps, DataDisplayState> {
    render() {
        return (
            <Grid container item xs={8}>
                <Grid style={{ marginBottom: "20px" }} item xs={12}>
                    <Paper>
                        <Container>
                            <div className="cardHead">
                                <AccountTree />
                                <span className="caps label">json</span>
                            </div>

                            <SyntaxHighlighter showLineNumbers={true} style={dracula} language="json">
                                {JSON.stringify(this.props.data, null, "    ")}
                            </SyntaxHighlighter>

                            <br />
                        </Container>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper>
                        <Container>
                            <div className="cardHead">
                                <Message />
                                <span className="caps label">raw (bind syntax)</span>
                            </div>
                            <SyntaxHighlighter style={dracula} language="text">
                                {l.rec0ToBind(this.props.data)}
                            </SyntaxHighlighter>
                            <br />
                        </Container>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}
