import * as l from "./lib";
import * as t from "./types";
import React, { Component } from "react";
import { Collapse, IconButton, TableCell, TableRow, Checkbox, TextField, Input, Fab, Select, MenuItem, Grid, Paper, Container, Switch } from "@material-ui/core";
import DataDisplay from "./DataDisplay";
import { Ballot, Check, Info, KeyboardArrowDown, KeyboardArrowUp } from "@material-ui/icons";

interface RowProps {
    handleChange: Function;
    saveRecord: any;
    changeMeta: Function;
    rec_index: number;
    rr_index: number;
    rr: t.ResourceRecord;
    rec0: t.RedisEntry;
    meta: t.DomainMeta;
    config: t.Config;
}
interface RowState {
    dnssec: boolean;
}

export default class Row extends Component<RowProps, RowState> {
    advancedView = (rec0: t.RedisEntry, rr: t.ResourceRecord) => {
        const p = this.props;

        if (rec0.value.rr_type === "SOA") {
            const v = rr.value["SOA"] as t.SOAValue;
            return (
                <React.Fragment>
                    <div>
                        <Switch defaultChecked color="primary" value={this.state.dnssec} name="dnssec" onChange={e => this.props.handleChange(e, p.rec_index, p.rr_index, "switch")} />
                        DNSSEC
                    </div>
                    <br />
                    <div>
                        <TextField
                            onChange={e => this.props.handleChange(e, p.rec_index, p.rr_index, "rrField")}
                            helperText={l.rrTemplates["SOA"].fields[0].helperText}
                            placeholder="ns1.example.com"
                            name="mname"
                            label="MNAME"
                            value={v.mname}
                        />
                    </div>
                    <br />
                    <div>
                        <TextField
                            onChange={e => this.props.handleChange(e, p.rec_index, p.rr_index, "rrField")}
                            helperText={l.rrTemplates["SOA"].fields[1].helperText}
                            placeholder="hostmaster.example.com"
                            name="rname"
                            label="RNAME"
                            value={v.rname}
                        />
                    </div>
                </React.Fragment>
            );
        }
    };
    simpleView = (rec0: t.RedisEntry, rr: t.ResourceRecord) => {
        const p = this.props;

        const v: any = rr.value[rec0.value.rr_type];
        const fields = l.rrTemplates[rec0.value.rr_type]?.fields;
        if (!fields) return;
        return (
            <Grid spacing={2} container className="simpleValues">
                {fields.map((field: any) => {
                    return (
                        <Grid key={field.name} xs={field.width} item>
                            <TextField
                                size="small"
                                type={field.inputType}
                                style={{ width: "100%" }}
                                onChange={e => this.props.handleChange(e, p.rec_index, p.rr_index, "rrField")}
                                placeholder={field.placeholder}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                label={field.name}
                                name={field.name}
                                value={v[field.name]}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    render = () => {
        const p = this.props;
        const { rr, rec0 } = p;
        const editable = rec0.value.rr_type === "SOA" ? false : true;
        const name = l.getName(rec0);

        return (
            <React.Fragment>
                <TableRow className={`recRow `} style={{ borderColor: l.rrTemplates[rec0.value.rr_type]?.color || "black" }}>
                    <TableCell padding="checkbox">
                        <Checkbox checked={this.props.meta?.selected} onChange={e => this.props.changeMeta(e, p.rec_index, p.rr_index, "selected")} />
                    </TableCell>

                    <TableCell style={{ width: "300px" }}>
                        <Input disabled={!editable} style={{ width: "100%" }} value={name} />
                    </TableCell>
                    <TableCell style={{ width: "160px" }}>
                        {rec0.value.rr_type === "SOA" ? (
                            <Input disabled={!editable} value={rec0.value.rr_type} />
                        ) : (
                            <Select style={{ width: "100%" }} name="type" disabled={!editable} value={rec0.value.rr_type} onChange={e => this.props.handleChange(e, p.rec_index, p.rr_index, "type")}>
                                {["A", "AAAA", "NS", "CNAME", "MX", "TXT", "SRV", "CAA", "OPENPGPKEY", "TLSA"].map(e => (
                                    <MenuItem key={e} value={e}>
                                        {e}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </TableCell>
                    <TableCell style={{ width: "100px" }}>
                        <Input onInput={e => this.props.handleChange(e, p.rec_index, p.rr_index, "ttl")} type="number" value={rr.ttl} />
                    </TableCell>
                    <TableCell style={{ width: "500px" }}>{this.simpleView(rec0, rr)}</TableCell>

                    <TableCell padding="checkbox" align="right" style={{ width: "30px", paddingRight: "15px" }}>
                        <IconButton aria-label="expand row" size="small" onClick={e => this.props.changeMeta(e, p.rec_index, p.rr_index, "expanded")}>
                            {this.props.meta?.expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                    </TableCell>
                    <TableCell padding="checkbox" align="right" style={{ paddingRight: "15px" }}>
                        <Fab onClick={this.props.saveRecord} disabled={!this.props.meta?.changed} color="secondary" size="small">
                            <Check />
                        </Fab>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell
                        style={{ padding: 0, borderLeft: `10px solid ${l.rrTemplates[rec0.value.rr_type]?.color || "black"}`, borderBottom: this.props.meta?.expanded ? "" : "unset", width: "100%" }}
                        colSpan={8}
                    >
                        <Collapse in={this.props.meta?.expanded} style={{ padding: "16px" }} timeout={{ appear: 100, enter: 100, exit: 100 }} unmountOnExit>
                            <Grid container spacing={3} style={{ maxWidth: "100%", margin: "20px 0px" }}>
                                <Grid item xs={4}>
                                    <Grid item xs={12} style={{ marginBottom: "20px" }}>
                                        <Paper>
                                            <Container style={{ paddingBottom: "20px" }}>
                                                <div className="cardHead">
                                                    <Ballot />
                                                    <span className="caps label">form</span>
                                                </div>
                                                {this.advancedView(rec0, rr)}
                                            </Container>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Paper>
                                            <Container style={{ paddingBottom: "20px" }}>
                                                <div className="cardHead">
                                                    <Info />
                                                    <span className="caps label">info</span>
                                                </div>
                                                <div>{l.rrTemplates[rec0.value.rr_type]?.info}</div>
                                            </Container>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <DataDisplay config={this.props.config} data={rec0}></DataDisplay>
                            </Grid>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };
}
// {rec0ToBind(rec0, rec0.name, true)}
