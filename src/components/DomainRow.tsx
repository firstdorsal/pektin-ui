import * as l from "./lib";
import * as t from "./types";
import { PureComponent, Fragment } from "react";
import { Collapse, IconButton, Checkbox, TextField, Input, Fab, Select, MenuItem, Grid, Paper, Container } from "@material-ui/core";
import DataDisplay from "./DataDisplay";
import { Ballot, Check, Info, KeyboardArrowDown, KeyboardArrowUp } from "@material-ui/icons";

interface RowProps {
    handleChange: Function;
    saveRecord: any;
    changeMeta: Function;
    index: number;
    rec0: t.RedisEntry;
    meta: t.DomainMeta;
    config: t.Config;
    style: any;
}
interface RowState {
    //dnssec: boolean;
}

export default class Row extends PureComponent<RowProps, RowState> {
    advancedView = (rec0: t.RedisEntry, rr: t.ResourceRecord) => {
        const p = this.props;

        if (rec0.value.rr_type === "SOA") {
            const v = rr.value["SOA"] as t.SOAValue;
            return (
                <Fragment>
                    <div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={l.rrTemplates["SOA"].fields[0].helperText}
                            placeholder="ns1.example.com"
                            name={`${p.index}:rrField:mname`}
                            label="mname"
                            value={v.mname + ""}
                        />
                    </div>
                    <br />
                    <div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={l.rrTemplates["SOA"].fields[1].helperText}
                            placeholder="hostmaster.example.com"
                            name={`${p.index}:rrField:rname`}
                            label="rname"
                            value={v.rname + ""}
                        />
                    </div>
                </Fragment>
            );
        }
    };
    simpleView = (rec0: t.RedisEntry) => {
        const p = this.props;
        const rr = rec0.value.rr_set[0];
        const v: any = rr.value[rec0.value.rr_type];
        const fields = l.rrTemplates[rec0.value.rr_type]?.fields;
        if (!fields) return;

        return (
            <Grid spacing={2} container>
                {fields.map((field: any) => {
                    return (
                        <Grid key={field.name} xs={field.width} item>
                            <TextField
                                size="small"
                                type={field.inputType}
                                style={{ width: "100%" }}
                                onChange={e => this.props.handleChange(e)}
                                placeholder={field.placeholder.toString()}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                label={field.name}
                                name={`${p.index}:rrField:${field.name}`}
                                value={fields.length > 1 ? v[field.name] + "" : v + ""}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    render = () => {
        const p = this.props;
        const { rec0 } = p;
        const editable = rec0.value.rr_type === "SOA" ? false : true;
        const rr = rec0.value.rr_set[0];
        const color = JSON.stringify(l.rrTemplates[rec0.value.rr_type]?.color).replace("[", "").replace("]", "") || "0 0 0";
        return (
            <div
                className="rowWrapper"
                style={{ ...this.props.style, background: this.props.config.local.synesthesia ? `rgba(${color},0.2)` : "", borderBottom: this.props.config.local.synesthesia ? "" : "1px solid" }}
            >
                <div className="recRow" style={{ borderColor: `rgb(${color})`, position: "relative" }}>
                    <span style={{ left: "10px", top: "10px" }}>
                        <Checkbox checked={this.props.meta?.selected} name="selected" onChange={e => this.props.changeMeta(e, p.index, "selected")} />
                    </span>

                    <span style={{ width: "250px", left: "70px", top: "18px" }}>
                        <Input onInput={e => this.props.handleChange(e)} name={`${p.index}:name:`} type="text" disabled={!editable} style={{ width: "100%" }} value={l.getNameFromRedisEntry(rec0)} />
                    </span>
                    <span style={{ width: "100px", left: "340px", top: "18px" }}>
                        {rec0.value.rr_type === "SOA" ? (
                            <Input disabled={!editable} value={rec0.value.rr_type} />
                        ) : (
                            <Select style={{ width: "100%" }} name={`${p.index}:type:`} disabled={!editable} value={rec0.value.rr_type} onChange={e => this.props.handleChange(e)}>
                                {["A", "AAAA", "NS", "CNAME", "MX", "TXT", "SRV", "CAA", "OPENPGPKEY", "TLSA"].map(e => (
                                    <MenuItem key={e} value={e}>
                                        {e}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </span>
                    <span style={{ width: "100px", left: "460px", top: "18px" }}>
                        <Input onInput={e => this.props.handleChange(e)} name={`${p.index}:ttl:`} type="number" value={rr.ttl} />
                    </span>
                    <span style={{ right: "100px", left: "580px", top: "5px" }}>{this.simpleView(rec0)}</span>

                    <span style={{ width: "50px", position: "absolute", right: "40px", top: "17px" }}>
                        <IconButton size="small" onClick={e => this.props.changeMeta(e, p.index, "expanded")}>
                            {this.props.meta?.expanded ? <KeyboardArrowUp name="expanded" /> : <KeyboardArrowDown name="expanded" />}
                        </IconButton>
                    </span>
                    <span style={{ width: "50px", position: "absolute", right: "0px", top: "13px" }}>
                        <Fab onClick={this.props.saveRecord} disabled={!this.props.meta?.changed} color="secondary" size="small">
                            <Check />
                        </Fab>
                    </span>
                </div>
                <div
                    className="advancedRow"
                    style={{
                        borderLeft: `5px solid rgb(${color})`,
                        borderBottom: this.props.meta?.expanded ? "" : "unset"
                    }}
                >
                    <div>
                        <Collapse in={this.props.meta?.expanded} style={{ padding: "16px" }} timeout={{ appear: 0, enter: 0, exit: 0 }} unmountOnExit>
                            <Grid container spacing={3} style={{ maxWidth: "100%", margin: "20px 0px" }}>
                                <Grid item xs={4}>
                                    <Grid item xs={12} style={{ marginBottom: "20px" }}>
                                        <Paper>
                                            <Container style={{ paddingBottom: "20px" }}>
                                                <div className="cardHead">
                                                    <Ballot />
                                                    <span className="caps label">data</span>
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
                    </div>
                </div>
            </div>
        );
    };
}
// {rec0ToBind(rec0, rec0.name, true)}
