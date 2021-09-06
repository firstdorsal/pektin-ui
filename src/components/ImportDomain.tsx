import { Container, MenuItem, Select, Step, StepLabel, Stepper } from "@material-ui/core";
import React, { Component } from "react";
import * as l from "./lib";
import * as t from "./types";

interface ImportDomainProps {
    config: t.Config;
}
interface ImportDomainState {
    readonly activeStep: number;
    readonly selectedApi: number;
}

const steps = ["Where from?", "Which ones?", "Approve import?"];

export default class ImportDomain extends Component<ImportDomainProps, ImportDomainState> {
    state: ImportDomainState = {
        activeStep: 0,
        selectedApi: 0
    };

    handleChange = (e: React.ChangeEvent<any>) => {
        this.setState(({ selectedApi }) => {
            if (e.target.name === "apiPicker") selectedApi = e.target.value;
            return { selectedApi };
        });
    };
    render = () => {
        return (
            <Container>
                <Container>
                    <Container>
                        <br />
                        <br />
                        <h1>{steps[this.state.activeStep]}</h1>
                    </Container>
                    <Stepper activeStep={this.state.activeStep}>
                        {steps.map(stepName => {
                            return (
                                <Step>
                                    <StepLabel>{stepName}</StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>
                </Container>
                <Container>
                    <h2>Select Method</h2>
                    <Select name="apiPicker" onChange={e => this.handleChange(e)} style={{ width: "200px" }} value={this.state.selectedApi}>
                        {this.props.config.apis.map((api, i) => {
                            return (
                                <MenuItem key={i} value={i}>
                                    {api.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </Container>
                <Container>{React.createElement(this.props.config.apis[this.state.selectedApi].class)}</Container>
            </Container>
        );
    };
}
