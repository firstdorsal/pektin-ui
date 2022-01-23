import * as l from "./lib";
import * as t from "./types";
import { Component } from "react";
import {
  Collapse,
  IconButton,
  Checkbox,
  TextField,
  Input,
  Select,
  MenuItem,
  Grid,
  Paper,
  Container,
} from "@material-ui/core";
import DataDisplay from "./DataDisplay";
import {
  AddCircle,
  Ballot,
  KeyboardArrowDown,
  KeyboardArrowUp,
  RemoveCircle,
} from "@material-ui/icons";

import { GrDocumentTxt } from "react-icons/gr";

import isEqual from "lodash/isEqual";
import TxtAssistant from "./TxtAssistant";
import Domain from "./Domain";
import { ExtendedPektinApiClient } from "@pektin/client";
import PieButton from "./small/PieButton";
import { ApiRecord, PektinApiResponseBody } from "@pektin/client/src/types";

interface RowProps {
  readonly handleChange: InstanceType<typeof Domain>["handleChange"];
  readonly saveRecord: any;
  readonly changeMeta: InstanceType<typeof Domain>["changeMeta"];
  readonly recordIndex: number;
  readonly record: ApiRecord;
  readonly meta: t.DomainMeta;
  readonly config: t.Config;
  readonly style: any;
  readonly search: string;
  readonly domainName: string;
  readonly variant?: string;
  readonly totalRows: number;
  readonly addRRValue: InstanceType<typeof Domain>["addRRValue"];
  readonly removeRRValue: InstanceType<typeof Domain>["removeRRValue"];
  readonly client: ExtendedPektinApiClient;
  readonly lastApiCall?: PektinApiResponseBody;
}
interface RowState {}

// TODO: firefox always shows up/down arrows for number fields chrome shows them only on hover

export default class RecordRow extends Component<RowProps, RowState> {
  advancedView = () => {
    const p = this.props;
    const recordValue = (record: ApiRecord, rrIndex: number) => {
      let v: any = record.rr_set[rrIndex];
      const { rr_type } = record;

      const fields = l.rrTemplates[rr_type]?.fields;
      const fieldNames = Object.keys(fields);

      const fieldValues = Object.values(fields);
      return (
        <div style={{ position: "relative" }} key={rrIndex}>
          <Grid
            spacing={2}
            container
            style={{
              width: `calc(100% - 25px${this.props.record.rr_type === "TXT" ? " - 35px" : ""})`,
            }}
          >
            {fieldNames.map((fieldName: any, fieldIndex: number) => {
              const field: any = fieldValues[fieldIndex];
              const fieldValue = fieldNames?.length > 1 ? v[fieldName] + "" : v?.value + "";

              const isSearchMatch = this.props.meta.searchMatch.rr_set[rrIndex]
                ? this.props.meta.searchMatch.rr_set[rrIndex][fieldName]
                : false;

              const verify =
                this.props.meta.validity && this.props.meta.validity.values[rrIndex]
                  ? this.props.meta.validity.values[rrIndex][fieldName]
                  : undefined;

              const changed = this.props.meta.changed.values[rrIndex]
                ? this.props.meta.changed.values[rrIndex][fieldName]
                : false;
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
                      width: "100%",
                    }}
                    className={(() => {
                      let c = isSearchMatch ? "searchMatch " : "";
                      c += verify ? " " + verify?.type : "";
                      c += changed ? " changed" : "";
                      return c;
                    })()}
                    onChange={(e) => this.props.handleChange(e)}
                    placeholder={field.placeholder.toString()}
                    title={verify ? verify.message : ""}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: field.min,
                      max: field.max,
                    }}
                    label={field.name}
                    name={`${p.recordIndex}:rrField:${rrIndex}:${fieldName}`}
                    value={fieldValue}
                  />
                </Grid>
              );
            })}
          </Grid>
          {this.props.record.rr_type === "TXT" ? (
            <span className="txtButton">
              <IconButton
                style={{
                  position: "absolute",
                  bottom: "0px",
                  right: "30px",
                }}
              >
                <GrDocumentTxt />
              </IconButton>
            </span>
          ) : (
            ""
          )}
          <span>
            <IconButton
              disabled={record.rr_set.length === 1}
              title="Remove resource record"
              style={{
                width: "35px",
                height: "35px",
                position: "absolute",
                bottom: "5px",
                right: "0px",
              }}
              onClick={(e) => this.props.removeRRValue(this.props.recordIndex, rrIndex)}
            >
              <RemoveCircle />
            </IconButton>
          </span>
        </div>
      );
    };

    return this.props.record.rr_set.map((value, rrIndex) => {
      return recordValue(this.props.record, rrIndex);
    });
  };
  simpleView = (record: ApiRecord) => {
    const p = this.props;
    const rr = record.rr_set;
    const type = record.rr_type;
    let v: any = rr[0];

    const fields = l.rrTemplates[type]?.fields;

    const fieldNames = Object.keys(fields);
    const fieldValues = Object.values(fields);
    return (
      <Grid spacing={2} container>
        {fieldNames.map((fieldName: any, fieldIndex: number) => {
          const field: any = fieldValues[fieldIndex];
          const fieldValue = fieldNames?.length > 1 ? v[fieldName] + "" : v.value + "";

          const isSearchMatch = this.props.meta.searchMatch.rr_set[0]
            ? this.props.meta.searchMatch.rr_set[0][fieldName]
            : false;
          const verify = this.props.meta.validity
            ? this.props.meta.validity.values[0][fieldName]
            : false;
          const changed = this.props.meta.changed.values[0]
            ? this.props.meta.changed.values[0][fieldName]
            : false;

          return (
            <Grid key={fieldName} xs={field.width} item>
              <TextField
                size="small"
                type={field.inputType}
                style={{
                  width: "100%",
                }}
                className={(() => {
                  let c = isSearchMatch ? "searchMatch " : "";
                  c += verify ? " " + verify?.type : "";
                  c += changed ? " changed" : "";
                  return c;
                })()}
                onChange={(e) => this.props.handleChange(e)}
                placeholder={field.placeholder.toString()}
                title={verify ? verify.message : ""}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: field.min,
                  max: field.max,
                }}
                label={
                  field.name +
                  (this.props.record.rr_set.length > 1
                    ? ` 1/${this.props.record.rr_set.length}`
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
    const editable = record.rr_type === "SOA" && this.props.variant !== "import" ? false : true;
    const color =
      JSON.stringify(l.rrTemplates[record.rr_type]?.color).replace("[", "").replace("]", "") ||
      "0 0 0";

    const backgroundColor = this.props.config.local?.synesthesia ? `rgba(${color},0.2)` : "";
    const borderBottom = this.props.config.local?.synesthesia
      ? ""
      : "1px solid var(--border-bottom-color)";
    const opacity = this.props.meta?.anySearchMatch || this.props.search?.length === 0 ? 1 : 1;
    return (
      <div
        className="rowWrapper"
        style={{
          ...this.props.style,
          background: backgroundColor,
          borderBottom,
          borderLeft: `5px solid rgb(${color})`,
          opacity,
        }}
      >
        <div className="recRow" style={{ position: "relative" }}>
          <span style={{ left: "10px", top: "10px" }}>
            <Checkbox
              checked={this.props.meta?.selected}
              name="selected"
              onChange={(e) => this.props.changeMeta(e, p.recordIndex, "selected")}
            />
          </span>

          <span
            style={{
              width: "310px",
              left: "70px",
              top: "18px",
            }}
          >
            <TextField
              onInput={(e) => this.props.handleChange(e)}
              name={`${p.recordIndex}:name:`}
              type="text"
              disabled={!editable}
              style={{ width: "100%" }}
              value={record.name}
              placeholder={this.props.domainName}
              title={this.props.meta.validity?.name?.message}
              className={(() => {
                let c = this.props.meta.searchMatch.name ? "searchMatch" : "";
                c += this.props.meta.changed.name ? " changed" : "";
                c +=
                  this.props.meta.validity?.name !== undefined
                    ? " " + this.props.meta.validity?.name?.type
                    : "";
                return c;
              })()}
            />
          </span>
          <span
            style={{
              width: "90px",
              left: "390px",
              top: "18px",
            }}
            className={(() => {
              let c = this.props.meta.searchMatch.rr_type ? "searchMatch" : "";
              c += this.props.meta.changed.type ? " changed" : "";

              return c;
            })()}
          >
            {record.rr_type === "SOA" ? (
              <Input disabled={!editable} value={record.rr_type} />
            ) : (
              <Select
                style={{ width: "100%" }}
                name={`${p.recordIndex}:type:`}
                disabled={!editable}
                value={record.rr_type}
                onChange={(e) => this.props.handleChange(e)}
              >
                {["A", "AAAA", "NS", "CNAME", "MX", "TXT", "SRV", "CAA", "OPENPGPKEY", "TLSA"].map(
                  (e) => (
                    <MenuItem key={e} value={e}>
                      {e}
                    </MenuItem>
                  )
                )}
              </Select>
            )}
          </span>
          <span
            style={{
              width: "75px",
              left: "490px",
              top: "18px",
            }}
            className={(() => {
              let c = this.props.meta.searchMatch.rr_set[0]?.ttl ? "searchMatch" : "";
              c += this.props.meta.changed.values[0]?.ttl ? " changed" : "";
              return c;
            })()}
          >
            <Input
              onInput={(e) => this.props.handleChange(e)}
              name={`${p.recordIndex}:ttl:`}
              type="number"
              value={record.rr_set[0]?.ttl}
              inputProps={{
                min: 0,
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
              top: "17px",
            }}
          >
            <IconButton
              size="small"
              title={this.props.meta?.expanded ? "Collapse" : "Expand"}
              onClick={(e) => this.props.changeMeta(e, p.recordIndex, "expanded")}
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
              className="applyChanges"
              style={{
                width: "50px",
                position: "absolute",
                right: "0px",
                top: "13px",
              }}
            >
              <PieButton
                title={(() => {
                  if (this.props.meta.apiError) {
                    return this.props.meta.apiError;
                  }
                  if (!this.props.meta.anyChanged) return "";

                  const v = this.props.meta.validity?.totalValidity;
                  if (v === "ok") {
                    return "Apply changes";
                  }
                  if (v === "warning") {
                    return "Fix issues and apply changes";
                  }
                  if (v === "error") {
                    return "Can't apply changes";
                  }
                  return "";
                })()}
                type={this.props.record.rr_type}
                onClick={() => this.props.saveRecord(p.recordIndex)}
                mode={(() => {
                  if (this.props.meta.apiError) {
                    return "apiError";
                  }
                  const v = this.props.meta.validity?.totalValidity;
                  if (v && this.props.meta.anyChanged) return v;

                  return "disabled";
                })()}
                predictedTime={this.props?.lastApiCall?.time}
              />
            </span>
          )}
        </div>
        <div
          className="advancedRow"
          style={{
            borderBottom: this.props.meta?.expanded ? "" : "unset",
          }}
        >
          <Collapse
            in={this.props.meta?.expanded}
            style={{ padding: "0px 10px", marginTop: "-30px", height: "630px" }}
            timeout={{ appear: 0, enter: 0, exit: 0 }}
            unmountOnExit
          >
            <Grid
              container
              spacing={3}
              style={{ maxWidth: "100%", margin: "20px 0px", height: "630px" }}
            >
              <Grid item xs={6}>
                <Grid item xs={12} style={{ marginBottom: "20px" }}>
                  <Paper elevation={3}>
                    <Container style={{ paddingBottom: "20px" }}>
                      <div className="cardHead">
                        <Ballot />
                        <span className="caps label">rrset</span>
                      </div>
                      {this.advancedView()}
                      {record.rr_type !== "SOA" ? (
                        <div>
                          <IconButton
                            title="Add resource record"
                            style={{
                              width: "35px",
                              height: "35px",
                              marginTop: "5px",
                            }}
                            onClick={() => this.props.addRRValue(this.props.recordIndex)}
                          >
                            <AddCircle />
                          </IconButton>
                        </div>
                      ) : (
                        ""
                      )}
                    </Container>
                  </Paper>
                  {this.props.record.rr_type === "TXT" ? (
                    <Paper elevation={3} style={{ padding: "10px 20px", marginTop: "10px" }}>
                      <TxtAssistant></TxtAssistant>
                    </Paper>
                  ) : (
                    ""
                  )}
                </Grid>
              </Grid>
              <Grid container item xs={6}>
                <DataDisplay
                  style={{ maxHeight: "400px" }}
                  config={this.props.config}
                  data={record}
                  client={this.props.client}
                ></DataDisplay>
              </Grid>
            </Grid>
          </Collapse>
        </div>
      </div>
    );
  };
}
//{l.rrTemplates[record.type]?.info}
