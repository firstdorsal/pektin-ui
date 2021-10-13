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
import {
    AddCircle,
    Ballot,
    Check,
    Clear,
    Info,
    KeyboardArrowDown,
    KeyboardArrowUp,
    RemoveCircle
} from "@material-ui/icons";
import isEqual from "lodash/isEqual";

interface RowProps {
    readonly handleChange: Function;
    readonly saveRecord: any;
    readonly changeMeta: Function;
    readonly recordIndex: number;
    readonly record: t.DisplayRecord;
    readonly meta: t.DomainMeta;
    readonly config: t.Config;
    readonly style: any;
    readonly search: string;
    readonly domainName: string;
    readonly variant?: string;
    readonly totalRows: number;
    readonly addRRValue: Function;
    readonly removeRRValue: Function;
}
interface RowState {
    //dnssec: boolean;
}

export default class RecordRow extends Component<RowProps, RowState> {
    advancedView = (record: t.DisplayRecord) => {
        const p = this.props;
        const rr = record.values;
        const recordValue = (record: t.DisplayRecord, rrIndex: number) => {
            let v: any = record.values[rrIndex];
            const { type } = record;

            const fields = l.rrTemplates[type]?.fields;
            const fieldNames = Object.keys(fields);

            const fieldValues = Object.values(fields);
            return (
                <div style={{ position: "relative" }} key={rrIndex}>
                    <Grid
                        spacing={2}
                        container
                        style={{
                            width: "calc(100% - 25px)"
                        }}
                    >
                        {fieldNames.map((fieldName: any, fieldIndex: number) => {
                            const field: any = fieldValues[fieldIndex];
                            const fieldValue =
                                fieldNames?.length > 1 ? v[fieldName] + "" : v?.value + "";

                            const verify =
                                this.props.meta.validity && this.props.meta.validity.values[rrIndex]
                                    ? this.props.meta.validity.values[rrIndex][fieldName]
                                    : undefined;

                            return (
                                <Grid
                                    key={`${p.recordIndex}:rrField:${rrIndex}:${fieldName}`}
                                    xs={field.width}
                                    item
                                >
                                    <TextField
                                        size="small"
                                        type={field.inputType}
                                        style={{
                                            width: "100%"
                                        }}
                                        className={verify !== undefined ? verify?.type : ""}
                                        onChange={e => this.props.handleChange(e)}
                                        placeholder={field.placeholder.toString()}
                                        title={verify ? verify.message : ""}
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                        inputProps={{
                                            min: field.min,
                                            max: field.max
                                        }}
                                        label={field.name}
                                        name={`${p.recordIndex}:rrField:${rrIndex}:${fieldName}`}
                                        value={fieldValue}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                    <span>
                        <IconButton
                            disabled={record.values.length === 1}
                            title="Remove resource record"
                            style={{
                                width: "35px",
                                height: "35px",
                                position: "absolute",
                                bottom: "5px",
                                right: "0px"
                            }}
                            onClick={e => this.props.removeRRValue(this.props.recordIndex, rrIndex)}
                        >
                            <RemoveCircle />
                        </IconButton>
                    </span>
                </div>
            );
        };
        if (record.type === "SOA") {
            const v = rr[0] as t.SOA;
            return (
                <Fragment>
                    <div className={this.props.meta.validity?.values[0].mname?.type}>
                        <br />
                        <div className="tfName">mname</div>
                        <div className="tfHelper">
                            {l.rrTemplates["SOA"].fields.mname.helperText}
                        </div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={this.props.meta.validity?.values[0].mname?.message || " "}
                            placeholder="ns1.example.com"
                            name={`${p.recordIndex}:rrField:0:mname`}
                            value={v.mname + ""}
                        />
                    </div>
                    <div className={this.props.meta.validity?.values[0].rname?.type}>
                        <div className="tfName">rname</div>
                        <div className="tfHelper">
                            {l.rrTemplates["SOA"].fields.rname.helperText}
                        </div>
                        <TextField
                            onChange={e => this.props.handleChange(e)}
                            helperText={this.props.meta.validity?.values[0].rname?.message || " "}
                            placeholder="hostmaster.example.com"
                            name={`${p.recordIndex}:rrField:0:rname`}
                            value={v.rname + ""}
                        />
                    </div>
                </Fragment>
            );
        } else {
            return this.props.record.values.map((value, rrIndex) => {
                return recordValue(this.props.record, rrIndex);
            });
        }
    };
    simpleView = (record: t.DisplayRecord) => {
        const p = this.props;
        const rr = record.values;
        const type = record.type;
        let v: any = rr[0];

        const fields = l.rrTemplates[type]?.fields;

        const currentSearchField = this.props.meta.searchMatch.values || false;

        const fieldNames = Object.keys(fields);
        const fieldValues = Object.values(fields);
        return (
            <Grid spacing={2} container>
                {fieldNames.map((fieldName: any, fieldIndex: number) => {
                    const field: any = fieldValues[fieldIndex];
                    const fieldValue = fieldNames?.length > 1 ? v[fieldName] + "" : v.value + "";
                    const isSearchMatch =
                        currentSearchField.value !== undefined
                            ? currentSearchField
                            : currentSearchField[fieldName];

                    const verify = this.props.meta.validity
                        ? this.props.meta.validity.values[0][fieldName]
                        : undefined;

                    return (
                        <Grid key={fieldName} xs={field.width} item>
                            <TextField
                                size="small"
                                type={field.inputType}
                                style={{
                                    width: "100%"
                                }}
                                className={(() => {
                                    let c = isSearchMatch ? "searchMatch " : "";
                                    c += " " + verify !== undefined ? verify?.type : "";
                                    return c;
                                })()}
                                onChange={e => this.props.handleChange(e)}
                                placeholder={field.placeholder.toString()}
                                title={verify ? verify.message : ""}
                                InputLabelProps={{
                                    shrink: true
                                }}
                                inputProps={{
                                    min: field.min,
                                    max: field.max
                                }}
                                label={
                                    field.name +
                                    (this.props.record.values.length > 1
                                        ? ` 1/${this.props.record.values.length}`
                                        : "")
                                }
                                name={`${p.recordIndex}:rrField:0:${fieldName}`}
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
        if (!record) return <div>Invalid Record</div>;
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
                //title={`${this.props.index + 1}/${this.props.totalRows}`}
            >
                <div className="recRow" style={{ position: "relative" }}>
                    <span style={{ left: "10px", top: "10px" }}>
                        <Checkbox
                            checked={this.props.meta?.selected}
                            name="selected"
                            onChange={e => this.props.changeMeta(e, p.recordIndex, "selected")}
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
                            const d = this.props.meta.validity?.name;
                            c += " " + d?.type;
                            return c;
                        })()}
                    >
                        <TextField
                            onInput={e => this.props.handleChange(e)}
                            name={`${p.recordIndex}:name:`}
                            type="text"
                            disabled={!editable}
                            style={{ width: "100%" }}
                            value={record.name}
                            placeholder={this.props.domainName}
                            title={this.props.meta.validity?.name?.message}
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
                                name={`${p.recordIndex}:type:`}
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
                            name={`${p.recordIndex}:ttl:`}
                            type="number"
                            value={record.values[0]?.ttl}
                            inputProps={{
                                min: 0
                            }}
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
                            title={this.props.meta?.expanded ? "Collapse" : "Expand"}
                            onClick={e => this.props.changeMeta(e, p.recordIndex, "expanded")}
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
                                onClick={() => this.props.saveRecord(p.recordIndex)}
                                disabled={(() => {
                                    if (!this.props.meta?.changed) return true;

                                    const v = this.props.meta.validity?.totalValidity;
                                    if (v === "error") return true;
                                })()}
                                size="small"
                                title={(() => {
                                    const v = this.props.meta.validity?.totalValidity;
                                    if (v === "ok") return "Apply changes";
                                    if (v === "warning") return "Fix issues and apply changes";
                                    if (v === "error") return "Can't apply changes";
                                    return "";
                                })()}
                                className={this.props.meta.validity?.totalValidity}
                            >
                                {this.props.meta.validity?.totalValidity === "error" ? (
                                    <Clear />
                                ) : (
                                    <Check />
                                )}
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
                                <Grid item xs={6}>
                                    <Grid item xs={12} style={{ marginBottom: "20px" }}>
                                        <Paper>
                                            <Container style={{ paddingBottom: "20px" }}>
                                                <div className="cardHead">
                                                    <Ballot />
                                                    <span className="caps label">rrset</span>
                                                </div>
                                                {this.advancedView(record)}
                                                {record.type !== "SOA" ? (
                                                    <div>
                                                        <IconButton
                                                            title="Add resource record"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                marginTop: "5px"
                                                            }}
                                                            onClick={() =>
                                                                this.props.addRRValue(
                                                                    this.props.recordIndex
                                                                )
                                                            }
                                                        >
                                                            <AddCircle />
                                                        </IconButton>
                                                    </div>
                                                ) : (
                                                    ""
                                                )}
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
                                <Grid container item xs={6}>
                                    <DataDisplay
                                        style={{ maxHeight: "600px" }}
                                        config={this.props.config}
                                        data={record}
                                    ></DataDisplay>
                                </Grid>
                            </Grid>
                        </Collapse>
                    </div>
                </div>
            </div>
        );
    };
}
