import React, { Component, Fragment } from "react";
import { Button, Grid, TextField, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as l from "./lib";
import * as pektinApi from "./apis/pektin";
import DataDisplay from "../components/DataDisplay";

const defaultSOA: t.RedisEntry = {
    name: ".:SOA",
    value: {
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

interface AddDomainProps {
    config: t.Config;
}

interface AddDomainState {
    readonly ttl: number;
    readonly mname: string;
    readonly rname: string;
    readonly name: string;
    readonly dnssec: boolean;
    readonly rec0: t.RedisEntry;
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

    handleChange = (e: any, mode: string = "default") => {
        const n = mode === "default" ? e?.target?.name : e.name;
        const v = mode === "default" ? e?.target?.value : e.value;
        if (!n || !v === undefined) return;

        this.setState((prevState): any => {
            const { rec0 } = prevState;
            const rec1 = rec0.value;
            //if (event.target.name === "dnssec") rec1.dnssec = event.target.checked;
            if (n === "ttl") rec1.rr_set[0].ttl = parseInt(v);
            const soa = rec1.rr_set[0].value as t.SOA;
            if (n === "mname") soa.SOA.mname = l.absoluteName(v);
            if (n === "rname") soa.SOA.rname = l.absoluteName(v).replace("@", ".");
            if (n === "name") rec0.name = l.absoluteName(v) + ":SOA";
            return { rec0, [n]: v };
        });
    };
    cmAction = (name: string, action: string, value: string | number) => {
        if (action === "paste") {
            this.handleChange({ name, value }, action);
        }
    };

    render = () => {
        return (
            <Container style={{ marginTop: "20px" }}>
                <Grid container spacing={3} style={{ maxWidth: "100%" }}>
                    <Grid item xs={4}>
                        <Paper elevation={3}>
                            <Container className="form" style={{ paddingBottom: "20px" }}>
                                <div className="cardHead">
                                    <Ballot />
                                    <span className="caps label">data</span>
                                </div>
                                <div>
                                    <TextField
                                        variant="standard"
                                        required
                                        name="name"
                                        label="NAME"
                                        onChange={this.handleChange}
                                        value={this.state.name}
                                        helperText="Name of the domain you want to add"
                                    />
                                </div>

                                <div>
                                    <TextField
                                        variant="standard"
                                        onChange={this.handleChange}
                                        name="mname"
                                        required
                                        label="MNAME"
                                        placeholder="ns1.example.com"
                                        value={this.state.mname}
                                        helperText="Address of the primary name server"
                                    />
                                </div>

                                <div>
                                    <TextField
                                        variant="standard"
                                        onChange={this.handleChange}
                                        name="rname"
                                        required
                                        label="RNAME"
                                        placeholder="hostmaster.example.com"
                                        value={this.state.rname}
                                        helperText="Contact of the domain admin"
                                    />
                                </div>
                                <div>
                                    <TextFieldWithVar
                                        config={this.props.config}
                                        cmAction={this.cmAction}
                                        variant="standard"
                                        type="number"
                                        onChange={this.handleChange}
                                        name="ttl"
                                        value={this.state.ttl}
                                        required
                                        label="ttl"
                                        helperText="Time to cache the dns response"
                                    />
                                </div>
                                <div>
                                    <Button color="primary" variant="contained" onClick={() => pektinApi.addDomain(this.props.config, [this.state.rec0])}>
                                        Add Domain
                                    </Button>
                                </div>
                            </Container>
                        </Paper>
                    </Grid>
                    <DataDisplay style={{ marginTop: "15px" }} config={this.props.config} data={this.state.rec0}></DataDisplay>
                </Grid>
            </Container>
        );
    };
}
/*
<div>
    <Switch defaultChecked color="primary" value={this.state.dnssec} name="dnssec" onChange={this.handleChange} />
    DNSSEC
</div>
*/

interface TextFieldWithVarState {
    readonly contextMenu: any;
}

export class TextFieldWithVar extends Component<any, TextFieldWithVarState> {
    state: TextFieldWithVarState = {
        contextMenu: false
    };
    handleRightClick = (e: any) => {
        e.preventDefault();
        this.setState({ contextMenu: e });
    };
    render = () => {
        const contextMenu = () => {
            return (
                <div className="contextMenu" style={{ position: "fixed", left: this.state.contextMenu.clientX, top: this.state.contextMenu.clientY, background: "var(--b1)", zIndex: 10 }}>
                    <div className="contextMenu"></div>
                    {this.props.config.local.variables.map((e: any, i: number) => {
                        return (
                            <div
                                className="contextMenu"
                                key={i}
                                style={{ background: "var(--b1)", cursor: "pointer" }}
                                onClick={() => {
                                    this.props.cmAction("ttl", "paste", e.value);
                                    this.setState({ contextMenu: false });
                                }}
                            >
                                {e.key}
                            </div>
                        );
                    })}
                </div>
            );
        };

        return (
            <Fragment>
                <TextField {...this.props} onContextMenu={this.handleRightClick} />
                {this.state.contextMenu ? contextMenu() : ""}
            </Fragment>
        );
    };
}
