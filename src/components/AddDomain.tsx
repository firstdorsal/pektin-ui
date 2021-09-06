import React, { Component } from "react";
import { Button, Grid, TextField, Switch, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as lib from "./lib";
import DataDisplay from "../components/DataDisplay";

const defaultSOA: t.Rec0 = {
    name: "",
    value: {
        dnssec: true,
        rr_type: "SOA",
        rr_set: [
            {
                ttl: 3600,
                value: {
                    SOA: {
                        mname: "",
                        rname: "hostmaster.",
                        serial: 0,
                        refresh: 0,
                        retry: 0,
                        expire: 0,
                        minimum: 0
                    }
                }
            }
        ]
    }
};

interface AddDomainProps {}

interface AddDomainState {
    readonly ttl: number;
    readonly mname: string;
    readonly rname: string;
    readonly name: string;
    readonly dnssec: boolean;
    readonly rec0: t.Rec0;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
    state: AddDomainState = {
        ttl: 3600,
        mname: "",
        rname: "hostmaster.",
        name: "",
        dnssec: true,
        rec0: defaultSOA
    };

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event?.target?.name || !event?.target?.value === undefined) return;

        this.setState((prevState): any => {
            const { rec0 } = prevState;
            const rec1 = rec0.value;
            if (event.target.name === "dnssec") rec1.dnssec = event.target.checked;
            if (event.target.name === "ttl") rec1.rr_set[0].ttl = parseInt(event.target.value);
            const soa = rec1.rr_set[0].value as t.SOA;
            if (event.target.name === "mname") soa.SOA.mname = lib.absoluteName(event.target.value);
            if (event.target.name === "rname") soa.SOA.rname = lib.absoluteName(event.target.value).replace("@", ".");
            if (event.target.name === "name") rec0.name = lib.absoluteName(event.target.value) + ":SOA";
            return { rec0, [event.target.name]: event.target.value };
        });
    };

    render = () => {
        console.log("add-domain");

        return (
            <Container style={{ marginTop: "20px" }}>
                <Grid container spacing={3} style={{ maxWidth: "100%" }}>
                    <Grid item xs={4}>
                        <Paper>
                            <Container style={{ paddingBottom: "20px" }}>
                                <div className="cardHead">
                                    <Ballot />
                                    <span className="caps label">form</span>
                                </div>
                                <div>
                                    <TextField required name="name" label="NAME" onChange={this.handleChange} value={this.state.name} helperText="Name of the domain you want to add" />
                                </div>
                                <div>
                                    <Switch defaultChecked color="primary" value={this.state.dnssec} name="dnssec" onChange={this.handleChange} />
                                    DNSSEC
                                </div>
                                <div>
                                    <TextField
                                        onChange={this.handleChange}
                                        name="mname"
                                        required
                                        label="MNAME"
                                        placeholder="ns1.example.com"
                                        value={this.state.mname}
                                        helperText="Address of the primary name server"
                                    />
                                </div>
                                <br />
                                <div>
                                    <TextField
                                        onChange={this.handleChange}
                                        name="rname"
                                        required
                                        label="RNAME"
                                        placeholder="hostmaster.example.com"
                                        value={this.state.rname}
                                        helperText="Contact of the domain admin"
                                    />
                                </div>
                                <br />
                                <div>
                                    <TextField type="number" onChange={this.handleChange} name="ttl" value={this.state.ttl} required label="ttl" helperText="Time to cache the dns response" />
                                </div>
                                <br />
                                <div>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={() => {
                                            fetch("/api/add-domain", { method: "POST", body: JSON.stringify([this.state.rec0]) });
                                        }}
                                    >
                                        Add Domain
                                    </Button>
                                </div>
                            </Container>
                        </Paper>
                    </Grid>
                    <DataDisplay data={this.state.rec0}></DataDisplay>
                </Grid>
            </Container>
        );
    };
}