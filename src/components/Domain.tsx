import React, { Component } from "react";
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Delete, Flare, Map, VerticalAlignCenter } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { RouteComponentProps, withRouter } from "react-router-dom";
import Row from "./DomainRow";

interface DomainState {
    readonly data: t.RedisEntry[];
    readonly meta: Array<Array<t.DomainMeta>>;
    readonly ogData: t.RedisEntry[];
}

interface DomainRouterProps {
    domainName: string; // This one is coming from the router
}

interface DomainProps extends RouteComponentProps<DomainRouterProps> {
    config: t.Config;
    variant?: "headless";
    records?: t.RedisEntry[];
    style?: any;
}

class Domain extends Component<DomainProps, DomainState> {
    state: DomainState = {
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
                data[rec_index].value.rr_set[0].value = l.rrTemplates[e.target.value].template;
            } else if (fieldType === "switch") {
                //if (e.target.name === "dnssec") data[rec_index].value.dnssec = e.target.checked;
            }
            meta[rec_index][rr_index].changed = !isEqual(data, this.state.ogData);

            return { data, meta };
        });
    };

    initData = (d: t.RedisEntry[]) => {
        const meta = d.map((rec0: t.RedisEntry, i: number) => {
            return rec0.value.rr_set.map((rr: t.ResourceRecord, j: number) => {
                return { selected: false, expanded: false, changed: false };
            });
        });

        this.setState({ data: d, ogData: cloneDeep(d), meta });
    };

    componentDidMount = async () => {
        if (this.props.records) {
            this.initData(this.props.records);
        }
        //const d: t.RedisEntry[] = await l.getRecords({ domainName: this.props.match.params.domainName, pektinApiAuth: this.props.config.pektinApiAuth });
        //this.initData(d);
    };
    /*
    componentDidUpdate = e => {
        // replace the current state when the components props change to a new domain page
        if (this.props.router.query?.name !== e.router.query.name) this.initData();
    };*/

    render = () => {
        return (
            <div style={{ ...this.props.style }}>
                {this.props.variant !== "headless" ? (
                    <div style={{ height: "55px", width: "100%", background: "var(--a2)", padding: "3px" }}>
                        <IconButton>{<AddCircle />}</IconButton>
                        <IconButton>{<Delete />}</IconButton>
                        <IconButton>{<VerticalAlignCenter />}</IconButton>
                        <IconButton>{<Flare />}</IconButton>
                        <IconButton>{<Map />}</IconButton>
                    </div>
                ) : (
                    ""
                )}
                <TableContainer style={{ height: "calc(100% - 55px)" }}>
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
                        <TableBody style={{ height: "100%" }}>
                            {this.state.data.length ? (
                                this.state.data.map((rec0: t.RedisEntry, i: number) => {
                                    if (!rec0.value.rr_set?.length) return false;
                                    return rec0.value.rr_set.map((rr: t.ResourceRecord, j: number) => {
                                        return (
                                            <Row
                                                config={this.props.config}
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
                            ) : (
                                <React.Fragment></React.Fragment>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    };
}

export default withRouter(Domain);
