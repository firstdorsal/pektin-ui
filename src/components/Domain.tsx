import { Component } from "react";
import { IconButton, TableCell, TableHead, TableRow, Checkbox } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Delete, Flare, Map, VerticalAlignCenter } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { RouteComponentProps, withRouter } from "react-router-dom";
import Row from "./DomainRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once

interface DomainState {
    readonly data: t.RedisEntry[];
    readonly meta: Array<t.DomainMeta>;
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
    list: any;
    saveRecord = () => {};

    changeMeta = (e: any, index: number, fieldType: string) => {
        this.setState(({ meta }) => {
            const m = meta[index];
            if (fieldType === "selected") {
                m.selected = !meta[index].selected;
            } else if (fieldType === "expanded") {
                m.expanded = !meta[index].expanded;
            }
            this.list.recomputeRowHeights();
            return { meta: cloneDeep(meta) };
        });
    };

    handleChange = (e: any, i: number, fieldType: string) => {
        this.setState(({ data, meta }) => {
            const rr_set = data[i].value.rr_set[0];
            const type = data[i].value.rr_type;

            if (fieldType === "rrField") {
                if (typeof rr_set.value[type] === "string") {
                    rr_set.value[type] = e.target.value;
                } else {
                    /*@ts-ignore*/
                    rr_set.value[type][e.target.name] = e.target.value;
                }
            } else if (fieldType === "ttl") {
                if (e.target.value >= 0) rr_set.ttl = e.target.value;
            } else if (fieldType === "type") {
                const n = data[i].name;
                data[i].name = n.substring(0, n.indexOf(".:") + 2) + e.target.value;
                data[i].value.rr_type = e.target.value;
                data[i].value.rr_set[0].value = l.rrTemplates[e.target.value].template;
            } else if (fieldType === "switch") {
                //if (e.target.name === "dnssec") data[rec_index].value.dnssec = e.target.checked;
            }
            meta[i].changed = !isEqual(data, this.state.ogData);

            return { data, meta };
        });
    };

    initData = (d: t.RedisEntry[]) => {
        const meta = d.map((rec0: t.RedisEntry, i: number) => {
            return { selected: false, expanded: false, changed: false };
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

    rowRenderer = ({ key, index, style, data, meta }: { key: any; index: number; style: any; data: t.RedisEntry; meta: t.DomainMeta }) => {
        return (
            <Row style={style} config={this.props.config} handleChange={this.handleChange} saveRecord={this.saveRecord} changeMeta={this.changeMeta} key={key} index={index} rec0={data} meta={meta} />
        );
    };

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
                <div style={{ height: "calc(100% - 55px)" }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                style={{ overflowY: "scroll" }}
                                ref={ref => (this.list = ref)}
                                height={height}
                                width={width}
                                rowHeight={({ index }) => {
                                    return this.state.meta[index].expanded ? 670 : 70;
                                }}
                                rowRenderer={props => this.rowRenderer({ ...props, data: this.state.data[props.index], meta: this.state.meta[props.index] })}
                                rowCount={this.state.data.length}
                            ></List>
                        )}
                    </AutoSizer>
                </div>
            </div>
        );
    };
}

export default withRouter(Domain);
