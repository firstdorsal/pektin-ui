import { Component, Fragment } from "react";
import { Checkbox, IconButton } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Delete, Flare, Map, VerticalAlignCenter } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { RouteComponentProps, withRouter } from "react-router-dom";
import Row from "./DomainRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once
import { FaSortAlphaDownAlt, FaSortAlphaDown, FaSortNumericDownAlt, FaSortNumericDown } from "react-icons/fa";

interface DomainState {
    readonly data: t.RedisEntry[];
    readonly meta: Array<t.DomainMeta>;
    readonly ogData: t.RedisEntry[];
    readonly selectAll: boolean;
    readonly columnItems: ColumnItem[];
    readonly defaultOrder: number[];
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

interface ColumnItem {
    name: "name" | "type" | "ttl" | "value";
    left: string;
    type: "string" | "number";
    direction: 0 | 1 | 2;
}

const columnItems: ColumnItem[] = [
    { name: "name", left: "70px", type: "string", direction: 0 },
    { name: "type", left: "350px", type: "string", direction: 0 },
    { name: "ttl", left: "465px", type: "number", direction: 0 },
    { name: "value", left: "580px", type: "string", direction: 0 }
];

class Domain extends Component<DomainProps, DomainState> {
    state: DomainState = {
        data: [],
        meta: [],
        ogData: [],
        selectAll: false,
        columnItems,
        defaultOrder: []
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
                this.list.recomputeRowHeights();
            }

            return { meta: cloneDeep(meta) };
        });
    };

    handleChange = (e: any, i: number, fieldType: string) => {
        this.setState(({ data, meta }) => {
            const rr_set = data[i].value.rr_set[0];
            const rr_type = data[i].value.rr_type;
            if (fieldType === "name") {
                data[i].name = `${e.target.value}:${l.getTypeFromRedisEntry(data[i])}`;
            } else if (fieldType === "rrField") {
                if (typeof rr_set.value[rr_type] === "string") {
                    rr_set.value[rr_type] = e.target.value;
                } else {
                    /*@ts-ignore*/
                    rr_set.value[rr_type][e.target.name] = e.target.value;
                }
            } else if (fieldType === "ttl") {
                if (e.target.value >= 0) rr_set.ttl = e.target.value;
            } else if (fieldType === "type") {
                data[i].name = `${l.getNameFromRedisEntry(data[i])}:${e.target.value}`;
                data[i].value.rr_type = e.target.value;
                data[i].value.rr_set[0].value = l.rrTemplates[e.target.value].template;
            } else if (fieldType === "switch") {
                //if (e.target.name === "dnssec") data[rec_index].value.dnssec = e.target.checked;
            }
            meta[i].changed = !isEqual(data[i], this.state.ogData[i]);
            return { data, meta };
        });
    };

    initData = (d: t.RedisEntry[]) => {
        const meta = d.map((rec0: t.RedisEntry, i: number) => {
            return { selected: false, expanded: false, changed: false };
        });

        const defaultOrder = d.map((e, i) => i);
        this.setState({ data: d, ogData: cloneDeep(d), meta, defaultOrder });
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

    selectAll = () => {
        this.setState(({ selectAll, meta }) => {
            meta = meta.map(m => {
                m.selected = !selectAll;
                return m;
            });
            return { selectAll: !selectAll, meta };
        });
    };
    sort = (name: string) => {
        this.setState(({ data, meta, columnItems, defaultOrder }) => {
            let combine: [t.RedisEntry, t.DomainMeta, number][] = data.map((e, i) => {
                return [data[i], meta[i], defaultOrder[i]];
            });

            let currentSortDirection = 0;
            columnItems = columnItems.map(e => {
                if (name === e.name) {
                    if (e.direction === 2) {
                        e.direction = 0;
                    } else if (e.direction === 1) {
                        e.direction += 1;
                    } else {
                        e.direction += 1;
                    }
                    currentSortDirection = e.direction;
                } else {
                    e.direction = 0;
                }
                return e;
            });
            combine = sortBy(combine, [
                key => {
                    if (currentSortDirection === 0) return key[2];
                    if (name === "name") return key[0].name;
                    if (name === "ttl") return key[0].value.rr_set[0].ttl;
                    if (name === "type") return key[0].value.rr_type;
                }
            ]);
            if (currentSortDirection === 2) combine.reverse();

            combine.forEach((e, i) => {
                data[i] = combine[i][0];
                meta[i] = combine[i][1];
                defaultOrder[i] = combine[i][2];
            });

            return { data, meta, columnItems };
        });
    };

    render = () => {
        const rowRenderer = (r: { key: any; index: number; style: any; data: t.RedisEntry; meta: t.DomainMeta }) => {
            const { key, index, style } = r;

            return (
                <Row
                    style={style}
                    config={this.props.config}
                    handleChange={this.handleChange}
                    saveRecord={this.saveRecord}
                    changeMeta={this.changeMeta}
                    key={key}
                    index={index}
                    rec0={r.data}
                    meta={r.meta}
                />
            );
        };
        const sortDirectionIcon = (columnItem: ColumnItem) => {
            const style = { height: "1px", transform: "translate(4px,-5px) scale(20)" };
            if (columnItem.direction === 0) return;
            if (columnItem.direction === 1) {
                if (columnItem.type === "string") return <FaSortAlphaDown style={style} />;
                return <FaSortNumericDown style={style} />;
            }
            if (columnItem.direction === 2) {
                if (columnItem.type === "string") return <FaSortAlphaDownAlt style={style} />;
                return <FaSortNumericDownAlt style={style} />;
            }
        };

        const tableHead = () => {
            return (
                <div style={{ height: "70px", position: "relative", borderBottom: "1px solid var(--b1)", width: "100%" }}>
                    <span style={{ left: "15px", top: "10px", position: "absolute" }}>
                        <Checkbox checked={this.state.selectAll} onChange={this.selectAll} />
                    </span>
                    {columnItems.map((item, i) => {
                        return (
                            <span
                                style={{ left: item.left, top: "26px", position: "absolute", fontWeight: 500, fontSize: "14px", cursor: item.name !== "value" ? "pointer" : "default" }}
                                className="caps"
                                key={item.name}
                                onClick={() => (item.name !== "value" ? this.sort(item.name) : "")}
                            >
                                <span>{item.name}</span>
                                <span> {sortDirectionIcon(this.state.columnItems[i])}</span>
                            </span>
                        );
                    })}
                </div>
            );
        };
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
                <div style={{ height: "calc(100% - 55px - 70px)", width: "100%" }}>
                    {tableHead()}
                    <AutoSizer>
                        {({ height, width }) => (
                            <Fragment>
                                <List
                                    style={{ overflowY: "scroll" }}
                                    ref={ref => (this.list = ref)}
                                    height={height}
                                    width={width}
                                    rowHeight={({ index }) => {
                                        return this.state.meta[index].expanded ? 670 : 70;
                                    }}
                                    rowRenderer={props => rowRenderer({ ...props, data: this.state.data[props.index], meta: this.state.meta[props.index] })}
                                    rowCount={this.state.data.length}
                                />
                            </Fragment>
                        )}
                    </AutoSizer>
                </div>
            </div>
        );
    };
}

export default withRouter(Domain);
