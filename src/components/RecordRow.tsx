import * as l from "./lib";
import * as t from "./types";
import { Component, Fragment } from "react";
import {
    Collapse,
    IconButton,
    Checkbox,
    TextField,
    Input,
    Fab,
    Select,
    MenuItem,
    Grid,
    Paper,
    Container
} from "@material-ui/core";
import DataDisplay from "./DataDisplay";
import { Ballot, Check, Info, KeyboardArrowDown, KeyboardArrowUp } from "@material-ui/icons";
import isEqual from "lodash/isEqual";

interface RowProps {
    readonly handleChange: Function;
    readonly saveRecord: any;
    readonly changeMeta: Function;
    readonly index: number;
    readonly record: t.DisplayRecord;
    readonly meta: t.DomainMeta;
    readonly config: t.Config;
    readonly style: any;
    readonly search: string;
    readonly domainName: string;
    readonly variant?: string;
}
interface RowState {
    //dnssec: boolean;
}

export default class RecordRow extends Component<RowProps, RowState> {
    advancedView = (record: t.DisplayRecord) => {
        const p = this.props;
        const rr = record.value;

        if (record.type === "SOA") {
            const v = rr["SOA"] as t.SOAValue;
            return (
                <Fragment>
                    <div className={l.rrTemplates["SOA"]?.fields[0]?.verify(v.mname)?.type}>
                        <br />
                        <div className="tfName">mname</div>
                        <div className="tfHelper">{l.rrTemplates["SOA"].fields[0].helperText}</div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={
                                l.rrTemplates["SOA"]?.fields[0]?.verify(v.mname)?.message || " "
                            }
                            placeholder="ns1.example.com"
                            name={`${p.index}:rrField:mname`}
                            value={v.mname + ""}
                        />
                    </div>
                    <div className={l.rrTemplates["SOA"]?.fields[1]?.verify(v.rname)?.type}>
                        <div className="tfName">rname</div>
                        <div className="tfHelper">{l.rrTemplates["SOA"].fields[1].helperText}</div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={
                                l.rrTemplates["SOA"].fields[1].verify(v.rname)?.message || " "
                            }
                            placeholder="hostmaster.example.com"
                            name={`${p.index}:rrField:rname`}
                            value={v.rname + ""}
                        />
                    </div>
                </Fragment>
            );
        }
    };
    simpleView = (record: t.DisplayRecord) => {
        const p = this.props;
        const rr = record.value;
        const type = record.type;
        let v: any = rr[type];

        const fields = l.rrTemplates[type]?.fields;
        if (!fields) return;

        const currentSearchField = this.props.meta.searchMatch.value[type] || false;

        return (
            <Grid spacing={2} container>
                {fields.map((field: any) => {
                    const fieldValue = fields.length > 1 ? v[field.name] + "" : v + "";
                    const isSearchMatch =
                        fields.length > 1 ? currentSearchField[field.name] : currentSearchField;

                    return (
                        <Grid key={field.name} xs={field.width} item>
                            <TextField
                                size="small"
                                type={field.inputType}
                                style={{
                                    width: "100%"
                                }}
                                className={(() => {
                                    let c = isSearchMatch ? "searchMatch" : "";
                                    const d = field.verify ? field.verify(fieldValue) : "";
                                    c += " " + d.type;
                                    return c;
                                })()}
                                onChange={e => this.props.handleChange(e)}
                                placeholder={field.placeholder.toString()}
                                title={field.verify ? field.verify(fieldValue).message : ""}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                inputProps={{
                                    min: field.min,
                                    max: field.max
                                }}
                                label={field.name}
                                name={`${p.index}:rrField:${field.name}`}
                                value={fieldValue}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        );
    };
    shouldComponentUpdate = (nextProps: RowProps, nextState: RowState) => {
        if (isEqual(this.props, nextProps)) return false;
        return true;
    };

    render = () => {
        const p = this.props;
        const { record } = p;
        const editable = record.type === "SOA" ? false : true;
        const color =
            JSON.stringify(l.rrTemplates[record.type]?.color).replace("[", "").replace("]", "") ||
            "0 0 0";

        const backgroundColor = this.props.config.local?.synesthesia ? `rgba(${color},0.2)` : "";
        const borderBottom = this.props.config.local?.synesthesia ? "" : "1px solid lightgrey";
        const opacity = this.props.meta?.anySearchMatch || this.props.search?.length === 0 ? 1 : 1;
        return (
            <div
                className="rowWrapper"
                style={{
                    ...this.props.style,
                    background: backgroundColor,
                    borderBottom,
                    borderLeft: `5px solid rgb(${color})`,
                    opacity
                }}
            >
                <div className="recRow" style={{ position: "relative" }}>
                    <span style={{ left: "10px", top: "10px" }}>
                        <Checkbox
                            checked={this.props.meta?.selected}
                            name="selected"
                            onChange={e => this.props.changeMeta(e, p.index, "selected")}
                        />
                    </span>

                    <span
                        style={{
                            width: "310px",
                            left: "70px",
                            top: "18px"
                        }}
                        className={(() => {
                            let c = this.props.meta?.searchMatch.name ? "searchMatch" : "";
                            const d = l.verifyDomain(record.name);
                            c += " " + d.type;
                            return c;
                        })()}
                    >
                        <TextField
                            onInput={e => this.props.handleChange(e)}
                            name={`${p.index}:name:`}
                            type="text"
                            disabled={!editable}
                            style={{ width: "100%" }}
                            value={record.name}
                            placeholder={this.props.domainName}
                            title={l.verifyDomain(record.name).message}
                        />
                    </span>
                    <span
                        style={{
                            width: "90px",
                            left: "390px",
                            top: "18px"
                        }}
                        className={this.props.meta?.searchMatch?.type ? "searchMatch" : ""}
                    >
                        {record.type === "SOA" ? (
                            <Input disabled={!editable} value={record.type} />
                        ) : (
                            <Select
                                style={{ width: "100%" }}
                                name={`${p.index}:type:`}
                                disabled={!editable}
                                value={record.type}
                                onChange={e => this.props.handleChange(e)}
                            >
                                {[
                                    "A",
                                    "AAAA",
                                    "NS",
                                    "CNAME",
                                    "PTR",
                                    "MX",
                                    "TXT",
                                    "SRV",
                                    "CAA",
                                    "OPENPGPKEY",
                                    "TLSA"
                                ].map(e => (
                                    <MenuItem key={e} value={e}>
                                        {e}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </span>
                    <span
                        style={{
                            width: "75px",
                            left: "490px",
                            top: "18px"
                        }}
                        className={this.props.meta.searchMatch.ttl ? "searchMatch" : ""}
                    >
                        <Input
                            onInput={e => this.props.handleChange(e)}
                            name={`${p.index}:ttl:`}
                            type="number"
                            value={record.ttl}
                        />
                    </span>
                    <span style={{ right: "100px", left: "580px", top: "5px" }}>
                        {this.simpleView(record)}
                    </span>

                    <span
                        style={{
                            width: "50px",
                            position: "absolute",
                            right: this.props.variant === "import" ? "0px" : "40px",
                            top: "17px"
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={e => this.props.changeMeta(e, p.index, "expanded")}
                        >
                            {this.props.meta?.expanded ? (
                                <KeyboardArrowUp name="expanded" />
                            ) : (
                                <KeyboardArrowDown name="expanded" />
                            )}
                        </IconButton>
                    </span>
                    {this.props.variant === "import" ? (
                        ""
                    ) : (
                        <span
                            style={{
                                width: "50px",
                                position: "absolute",
                                right: "0px",
                                top: "13px"
                            }}
                        >
                            <Fab
                                onClick={() => this.props.saveRecord(p.index)}
                                disabled={!this.props.meta?.changed}
                                size="small"
                            >
                                <Check />
                            </Fab>
                        </span>
                    )}
                </div>
                <div
                    className="advancedRow"
                    style={{
                        borderBottom: this.props.meta?.expanded ? "" : "unset"
                    }}
                >
                    <div>
                        <Collapse
                            in={this.props.meta?.expanded}
                            style={{ padding: "10px", paddingTop: "0px", marginTop: "-30px" }}
                            timeout={{ appear: 0, enter: 0, exit: 0 }}
                            unmountOnExit
                        >
                            <Grid
                                container
                                spacing={3}
                                style={{ maxWidth: "100%", margin: "20px 0px" }}
                            >
                                <Grid item xs={4}>
                                    <Grid item xs={12} style={{ marginBottom: "20px" }}>
                                        <Paper>
                                            <Container style={{ paddingBottom: "20px" }}>
                                                <div className="cardHead">
                                                    <Ballot />
                                                    <span className="caps label">data</span>
                                                </div>
                                                {this.advancedView(record)}
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
                                                <div>{l.rrTemplates[record.type]?.info}</div>
                                            </Container>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <DataDisplay
                                    style={{ maxHeight: "600px" }}
                                    config={this.props.config}
                                    data={record}
                                ></DataDisplay>
                            </Grid>
                        </Collapse>
                    </div>
                </div>
            </div>
        );
    };
}
