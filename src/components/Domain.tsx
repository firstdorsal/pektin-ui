import React, { Component } from "react";
import {
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    TextField,
    Input,
    Fab,
    Select,
    MenuItem,
    Grid,
    Paper,
    Container,
    Switch
} from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Ballot, Check, Delete, Flare, Info, KeyboardArrowDown, KeyboardArrowUp, Map, VerticalAlignCenter } from "@material-ui/icons";
import * as lib from "./lib";
import { cloneDeep, isEqual } from "lodash";
import DataDisplay from "./DataDisplay";
import { RouteComponentProps, withRouter } from "react-router-dom";

interface DomainState {
    data: t.Rec0[];
    meta: Array<any>;
    ogData: t.Rec0[];
}

interface DomainRouterProps {
    domainName: string; // This one is coming from the router
}

interface DomainProps extends RouteComponentProps<DomainRouterProps> {
    config: t.Config;
}

class Domain extends Component<DomainProps, DomainState> {
    state = {
        data: [],
        meta: [],
        ogData: []
    };
    saveRecord = () => {};

    changeMeta = (e: any, rec_index: number, rr_index: number, fieldType: string) => {
        this.setState(({ meta }) => {
            const m = meta[rec_index][rr_index];
            if (fieldType === "selected") {
                m.selected = !meta[rec_index][rr_index].selected;
            } else if (fieldType === "expanded") {
                m.expanded = !meta[rec_index][rr_index].expanded;
            }
            return { meta: cloneDeep(meta) };
        });
    };

    handleChange = (e: any, rec_index: number, rr_index: number, fieldType: string) => {
        this.setState(({ data, meta }) => {
            const v: any = data[rec_index].value.rr_set[rr_index];

            if (fieldType === "rrField") {
                const v2 = v.value[data[rec_index].value.rr_type];
                if (typeof v2 === "string") {
                    v.value[data[rec_index].value.rr_type] = e.target.value;
                } else {
                    v2[e.target.name] = e.target.value;
                }
            } else if (fieldType === "ttl") {
                if (e.target.value >= 0) v.ttl = e.target.value;
            } else if (fieldType === "type") {
                const n = data[rec_index].name;
                data[rec_index].name = n.substring(0, n.indexOf(".:") + 2) + e.target.value;
                data[rec_index].value.rr_type = e.target.value;
                data[rec_index].value.rr_set[0].value = lib.rrTemplates[e.target.value].template;
            } else if (fieldType === "switch") {
                if (e.target.name === "dnssec") data[rec_index].value.dnssec = e.target.checked;
            }
            meta[rec_index][rr_index].changed = !isEqual(data, this.state.ogData);

            return { data, meta };
        });
    };

    initData = (d: t.Rec0[]) => {
        const meta = d.map((rec0: t.Rec0, i: number) => {
            return rec0.value.rr_set.map((rr: t.ResourceRecord, j: number) => {
                return { selected: false, expanded: false, changed: false };
            });
        });

        this.setState({ data: d, ogData: cloneDeep(d), meta });
    };

    componentDidMount = async () => {
        const d: t.Rec0[] = await lib.getRecords({ domainName: this.props.match.params.domainName, endpoint: this.props.config.endpoint });
        this.initData(d);
    };
    /*
    componentDidUpdate = e => {
        // replace the current state when the components props change to a new domain page
        if (this.props.router.query?.name !== e.router.query.name) this.initData();
    };*/

    render = () => {
        return (
            <React.Fragment>
                <div style={{ height: "55px", width: "100%", background: "lightblue", padding: "3px" }}>
                    <IconButton>{<AddCircle />}</IconButton>
                    <IconButton>{<Delete />}</IconButton>
                    <IconButton>{<VerticalAlignCenter />}</IconButton>
                    <IconButton>{<Flare />}</IconButton>
                    <IconButton>{<Map />}</IconButton>
                </div>
                <TableContainer style={{ overflowY: "scroll", height: "calc(100% - 55px)" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" style={{ paddingLeft: "10px" }}>
                                    <Checkbox></Checkbox>
                                </TableCell>
                                <TableCell>NAME</TableCell>
                                <TableCell>TYPE</TableCell>
                                <TableCell>TTL</TableCell>
                                <TableCell>VALUE</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.data.length
                                ? this.state.data.map((rec0: t.Rec0, i: number) => {
                                      if (!rec0.value.rr_set?.length) return false;
                                      return rec0.value.rr_set.map((rr: t.ResourceRecord, j: number) => {
                                          return (
                                              <Row
                                                  handleChange={this.handleChange}
                                                  saveRecord={this.saveRecord}
                                                  changeMeta={this.changeMeta}
                                                  key={j}
                                                  rec_index={i}
                                                  rr_index={j}
                                                  rr={rr}
                                                  rec0={rec0}
                                                  meta={this.state.meta[i][j]}
                                              />
                                          );
                                      });
                                  })
                                : ""}
                        </TableBody>
                    </Table>
                </TableContainer>
            </React.Fragment>
        );
    };
}

export default withRouter(Domain);

interface RowProps {
    handleChange: any;
    saveRecord: any;
    changeMeta: any;
    rec_index: number;
    rr_index: number;
    rr: t.ResourceRecord;
    rec0: t.Rec0;
    meta: t.DomainMeta;
}
interface RowState {
    dnssec: boolean;
}

class Row extends Component<RowProps, RowState> {
    advancedView = (rec0: t.Rec0, rr: t.ResourceRecord) => {
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
                            helperText={lib.rrTemplates["SOA"].fields[0].helperText}
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
                            helperText={lib.rrTemplates["SOA"].fields[1].helperText}
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
    simpleView = (rec0: t.Rec0, rr: t.ResourceRecord) => {
        const p = this.props;

        const v: any = rr.value[rec0.value.rr_type];
        const fields = lib.rrTemplates[rec0.value.rr_type]?.fields;
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
        const name = lib.getName(rec0);

        return (
            <React.Fragment>
                <TableRow className={`recRow `} style={{ borderColor: lib.rrTemplates[rec0.value.rr_type]?.color || "black" }}>
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
                        style={{ padding: 0, borderLeft: `10px solid ${lib.rrTemplates[rec0.value.rr_type]?.color || "black"}`, borderBottom: this.props.meta?.expanded ? "" : "unset", width: "100%" }}
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
                                                <div>{lib.rrTemplates[rec0.value.rr_type]?.info}</div>
                                            </Container>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <DataDisplay data={rec0}></DataDisplay>
                            </Grid>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };
}
// {rec0ToBind(rec0, rec0.name, true)}
