import { Container, Grid, Paper } from "@material-ui/core";
import { AccountTree, Message } from "@material-ui/icons";
import { Component } from "react";
import JSONPretty from "react-json-pretty";
import * as t from "./types";
import * as lib from "./lib";

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
                            <code>
                                <JSONPretty id="json-pretty" data={this.props.data}></JSONPretty>
                            </code>
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
                            <code>
                                <pre>{lib.rec0ToBind(this.props.data)}</pre>
                            </code>
                            <br />
                        </Container>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}
