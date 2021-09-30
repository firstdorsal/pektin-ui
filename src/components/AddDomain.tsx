import { Component } from "react";
import { Button, Grid, TextField, Container, Paper } from "@material-ui/core";
import { Ballot } from "@material-ui/icons";
import * as t from "./types";
import * as l from "./lib";
import DataDisplay from "../components/DataDisplay";
import { ContextMenu } from "./ContextMenu";
import { cloneDeep } from "lodash";
import { RouteComponentProps } from "react-router-dom";

const defaultSOA: t.DisplayRecord = {
    name: "",
    type: "SOA",
    ttl: 3600,
    value: l.rrTemplates.SOA.template
};

interface AddDomainProps extends Partial<RouteComponentProps> {
    readonly config: t.Config;
    readonly g: t.Glob;
    readonly loadDomains: Function;
}

interface AddDomainState {
    readonly record: t.DisplayRecord;
    readonly error: string;
}

export default class AddDomain extends Component<AddDomainProps, AddDomainState> {
    state: AddDomainState = {
        record: defaultSOA,
        error: ""
    };

    handleChange = (e: any, mode: string = "default") => {
        const n = mode === "default" ? e?.target?.name : e.name;
        const v = mode === "default" ? e?.target?.value : e.value;
        if (!n || !v === undefined) return;

        this.setState(({ record }) => {
            record = cloneDeep(record);
            if (n === "ttl") record.ttl = parseInt(v);
            /*@ts-ignore*/
            if (n === "mname") record.value[record.type].mname = v;
            /*@ts-ignore*/
            if (n === "rname") record.value[record.type].rname = v;
            if (n === "name") record.name = v;
            return { record };
        });
    };
    cmClick = (target: any, action: string, value: string | number) => {
        if (action === "paste") {
            this.handleChange({ name: target.name, value }, action);
        }
    };

    render = () => {
        return (
            <Container style={{ marginTop: "20px" }}>
                <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />
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
                                        className="cm"
                                        variant="standard"
                                        required
                                        name="name"
                                        label="name"
                                        onChange={this.handleChange}
                                        value={this.state.record.name}
                                        helperText="Name of the domain you want to add"
                                    />
                                </div>

                                <div>
                                    <TextField
                                        className="cm"
                                        variant="standard"
                                        onChange={this.handleChange}
                                        name="mname"
                                        required
                                        label="mname"
                                        placeholder="ns1.example.com"
                                        /*@ts-ignore*/
                                        value={this.state.record.value.SOA.mname}
                                        helperText="Address of the primary name server"
                                    />
                                </div>

                                <div>
                                    <TextField
                                        className="cm"
                                        variant="standard"
                                        onChange={this.handleChange}
                                        name="rname"
                                        required
                                        label="rname"
                                        placeholder="hostmaster.example.com"
                                        /*@ts-ignore*/
                                        value={this.state.record.value.SOA.rname}
                                        helperText="Contact of the domain admin"
                                    />
                                </div>
                                <div>
                                    <TextField
                                        className="cm"
                                        variant="standard"
                                        type="number"
                                        onChange={this.handleChange}
                                        name="ttl"
                                        value={this.state.record.ttl}
                                        required
                                        label="ttl"
                                        helperText="Time to cache the dns response"
                                    />
                                </div>
                                <div>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={async () => {
                                            const req = await l.addDomain(this.props.config, this.state.record);
                                            if (req.error) this.setState({ error: req.message });
                                            await this.props.loadDomains();
                                            if (this.props.history) this.props.history.push(`/domain/${this.state.record.name}`);
                                        }}
                                    >
                                        Add Domain
                                    </Button>
                                </div>
                                <div style={{ color: "var(--error)" }}></div>
                            </Container>
                        </Paper>
                    </Grid>
                    <DataDisplay style={{ marginTop: "15px" }} config={this.props.config} data={this.state.record}></DataDisplay>
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
