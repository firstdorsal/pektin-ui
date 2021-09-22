import { Container, MenuItem, Paper, Select, Step, StepLabel, Stepper } from "@material-ui/core";
import React, { Component } from "react";
import Domain from "./Domain";
//import * as l from "./lib";
import * as t from "./types";

interface ImportDomainProps {
    readonly config: t.Config;
    readonly g: t.Glob;
}
interface ImportDomainState {
    readonly activeStep: number;
    readonly selectedApi: number;
    readonly records: t.RedisEntry[];
}

const stepNames = ["How?", "Which ones?", "Approve import?"];

export default class ImportDomain extends Component<ImportDomainProps, ImportDomainState> {
    state: ImportDomainState = {
        activeStep: 0,
        selectedApi: 0,
        records: []
    };

    handleChange = (e: any) => {
        this.setState(({ selectedApi }) => {
            if (e.target.name === "apiPicker") selectedApi = e.target.value;
            return { selectedApi };
        });
    };

    import = (records: t.RedisEntry[]) => {
        this.setState({ records, activeStep: 1 });
    };

    render = () => {
        const fapi = this.props.config.foreignApis[this.state.selectedApi];
        const step1 = () => {
            return (
                <Container>
                    <Paper elevation={3} style={{ padding: "30px 20px" }}>
                        <Container>
                            <h2 style={{ display: "inline-block", paddingRight: "10px" }}>Method</h2>
                            <Select
                                name="apiPicker"
                                onChange={e => this.handleChange(e)}
                                style={{ width: "200px" }}
                                value={this.state.selectedApi}
                            >
                                {this.props.config.foreignApis.map((api, i) => {
                                    return (
                                        <MenuItem key={i} value={i}>
                                            {api.name}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </Container>
                        <br />
                        <Container>
                            <div style={{ width: "500px" }}>{fapi.description}</div>
                            <br />
                            {React.createElement(fapi.class, { import: this.import })}
                        </Container>
                    </Paper>
                </Container>
            );
        };
        const step2 = () => {
            return (
                <Domain
                    variant="import"
                    g={this.props.g}
                    style={{ height: "calc(100% - 70px)" }}
                    records={this.state.records}
                    config={this.props.config}
                ></Domain>
            );
        };

        const steps = [step1, step2];

        return (
            <React.Fragment>
                <div style={{ height: "70px" }}>
                    <Stepper activeStep={this.state.activeStep}>
                        {stepNames.map(stepName => {
                            return (
                                <Step key={stepName}>
                                    <StepLabel>{stepName}</StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>
                </div>
                {steps[this.state.activeStep]()}
            </React.Fragment>
        );
    };
}
