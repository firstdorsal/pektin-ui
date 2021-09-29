import { Component, Fragment } from "react";
import { Checkbox, IconButton, TextField } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Delete, Flare, Map } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { RouteComponentProps, withRouter } from "react-router-dom";
import Row from "./DomainRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once
import { FaSortAlphaDownAlt, FaSortAlphaDown, FaSortNumericDownAlt, FaSortNumericDown } from "react-icons/fa";
import { ContextMenu } from "./ContextMenu";
import { VscReplaceAll } from "react-icons/vsc";

interface DomainState {
    readonly dData: t.RedisEntry[];
    readonly rData: t.RedisEntry[];
    readonly meta: Array<t.DomainMeta>;
    readonly ogData: t.RedisEntry[];
    readonly selectAll: boolean;
    readonly columnItems: ColumnItem[];
    readonly defaultOrder: number[];
    readonly search: string;
    readonly replace: string;
    readonly anySelected: boolean;
}

interface DomainRouterProps {
    readonly domainName: string; // This one is coming from the router
}

interface DomainProps extends RouteComponentProps<DomainRouterProps> {
    readonly config: t.Config;
    readonly g: t.Glob;
    readonly variant?: "import";
    readonly records?: t.RedisEntry[];
    readonly style?: any;
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
const defaultSearchMatch = { name: false, type: false, ttl: false, value: {} };

class Domain extends Component<DomainProps, DomainState> {
    state: DomainState = {
        dData: [],
        rData: [],
        ogData: [],
        meta: [],
        selectAll: false,
        columnItems,
        defaultOrder: [],
        search: "",
        replace: "",
        anySelected: false
    };
    list: any;
    saveRecord = () => {};

    changeMeta = (e: any, index: number, fieldName: string) => {
        this.setState(({ meta }) => {
            meta = cloneDeep(meta);
            const m = meta[index];
            if (fieldName === "selected") {
                m.selected = !meta[index].selected;
            } else if (fieldName === "expanded") {
                m.expanded = !meta[index].expanded;
                this.list.recomputeRowHeights();
            }

            return { meta };
        });
    };

    handleChange = (e: any, mode: string = "default") => {
        let fullName = mode === "default" ? e?.target?.name : e.name;
        const v = mode === "default" ? e?.target?.value : e.value;
        if (!fullName || !v === undefined) return;
        const [i, fieldName, fieldChildName] = fullName.split(":");

        this.setState(({ dData, meta }) => {
            dData = cloneDeep(dData);
            meta = cloneDeep(meta);
            const rr_set = dData[i].value.rr_set[0];
            const rr_type = dData[i].value.rr_type;

            if (fieldName === "name") {
                dData[i].name = `${v}:${l.getTypeFromRedisEntry(dData[i])}`;
            } else if (fieldName === "rrField") {
                if (typeof rr_set.value[rr_type] === "string") {
                    rr_set.value[rr_type] = v;
                } else {
                    /*@ts-ignore*/
                    rr_set.value[rr_type][fieldChildName] = v;
                }
            } else if (fieldName === "ttl") {
                if (v >= 0) rr_set.ttl = parseInt(v);
            } else if (fieldName === "type") {
                dData[i].name = `${l.getNameFromRedisEntry(dData[i])}:${v}`;
                dData[i].value.rr_type = v;
                dData[i].value.rr_set[0].value = l.rrTemplates[v].template;
            }
            meta[i].changed = !isEqual(dData[i], this.state.ogData[i]);
            return { dData, meta };
        });
    };

    initData = (d: t.RedisEntry[]) => {
        const meta = d.map((rec0: t.RedisEntry, i: number) => {
            return {
                selected: false,
                expanded: false,
                changed: false,
                searchMatch: defaultSearchMatch,
                anySearchMatch: false
            };
        });

        const defaultOrder = d.map((e, i) => i);
        this.setState({ dData: d, ogData: cloneDeep(d), meta, defaultOrder, rData: cloneDeep(d) });
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
            meta = cloneDeep(meta);
            meta = meta.map(m => {
                m.selected = !selectAll;
                return m;
            });
            return { selectAll: !selectAll, meta };
        });
    };

    sortColumns = (name: string) => {
        this.setState(({ dData, rData, meta, columnItems, defaultOrder }) => {
            let combine: [t.RedisEntry, t.DomainMeta, number, t.RedisEntry][] = dData.map((e, i) => {
                return [dData[i], meta[i], defaultOrder[i], rData[i]];
            });

            let currentSortDirection = 0;
            columnItems = columnItems.map(e => {
                if (name === e.name) {
                    if (e.direction === 2) {
                        e.direction = 0;
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
                    if (name === "search") return key[1].searchMatch;
                }
            ]);
            if (currentSortDirection === 2) combine.reverse();

            combine.forEach((e, i) => {
                dData[i] = combine[i][0];
                meta[i] = combine[i][1];
                defaultOrder[i] = combine[i][2];
                rData[i] = combine[i][3];
            });
            this.list.recomputeRowHeights();
            return { dData, rData, meta, columnItems };
        });
    };

    cmClick = (target: any, action: string, value: string | number) => {
        if (action === "paste") {
            this.handleChange({ name: target.name, value }, action);
        }
    };

    handleSearchAndReplaceChange = (e: any) => {
        if (e.target.name === "search") {
            const v = e.target.value;
            this.setState(({ dData, rData, meta, defaultOrder }) => {
                meta = cloneDeep(meta);

                dData.forEach((rec, i) => {
                    // reset all
                    meta[i].anySearchMatch = false;
                    meta[i].searchMatch = cloneDeep(defaultSearchMatch);
                    // handle first three columns
                    if (v.length) {
                        {
                            const match = l.getNameFromRedisEntry(rec).match(v);
                            if (match) {
                                meta[i].searchMatch.name = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        {
                            const match = rec.value.rr_type.match(v);
                            if (match) {
                                meta[i].searchMatch.type = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        {
                            const match = rec.value.rr_set[0].ttl.toString().match(v);
                            if (match) {
                                meta[i].searchMatch.ttl = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        const type = rec.value.rr_type;
                        const value = rec.value.rr_set[0].value[type];
                        if (typeof value === "string") {
                            const m = value.match(v);
                            if (m) {
                                meta[i].searchMatch.value[type] = !!m;
                                meta[i].anySearchMatch = true;
                            }
                        } else {
                            const values = Object.values(value);
                            const keys = Object.keys(value);
                            meta[i].searchMatch.value[type] = {};
                            for (let ii = 0; ii < values.length; ii++) {
                                const m = values[ii].toString().match(v);
                                if (m) {
                                    meta[i].searchMatch.value[type][keys[ii]] = !!m;
                                    meta[i].anySearchMatch = true;
                                }
                            }
                        }
                    }
                });

                let combine: [t.RedisEntry, t.DomainMeta, number, t.RedisEntry][] = dData.map((e, i) => {
                    return [dData[i], meta[i], defaultOrder[i], rData[i]];
                });
                combine = sortBy(combine, [
                    key => {
                        if (!v.length) return key[2];
                        return key[1].anySearchMatch;
                    }
                ]);
                if (v.length) combine.reverse();
                combine.forEach((e, i) => {
                    dData[i] = combine[i][0];
                    meta[i] = combine[i][1];
                    defaultOrder[i] = combine[i][2];
                    rData[i] = combine[i][3];
                });
                this.list.recomputeRowHeights();
                return { dData, rData, meta, search: v };
            });
        } else {
            this.setState(prevState => ({ ...prevState, [e.target.name]: e.target.value.toString() }));
        }
    };

    handleReplaceClick = () => {
        this.setState(({ meta, search, replace, dData }) => {
            dData = cloneDeep(dData);
            const regex = true;
            meta.forEach((m, i) => {
                if (!m.anySearchMatch) return;
                if (m.searchMatch.name) {
                    const replaced = regex
                        ? `${l
                              .getNameFromRedisEntry(dData[i])
                              .replaceAll(RegExp(search, "g"), replace)}:${l.getTypeFromRedisEntry(dData[i])}`
                        : `${l.getNameFromRedisEntry(dData[i]).replaceAll(search, replace)}:${l.getTypeFromRedisEntry(dData[i])}`;

                    dData[i].name = replaced;
                }
                if (m.searchMatch.type) {
                    const replaced = regex
                        ? (l.getTypeFromRedisEntry(dData[i]).replaceAll(RegExp(search, "g"), replace) as t.RRTypes)
                        : (l.getTypeFromRedisEntry(dData[i]).replaceAll(search, replace) as t.RRTypes);

                    dData[i].name = `${l.getNameFromRedisEntry(dData[i])}:${replaced}`;
                    dData[i].value.rr_type = replaced;
                    dData[i].value.rr_set[0].value = l.rrTemplates[replaced].template;
                }
                if (m.searchMatch.ttl) {
                    const replaced = regex
                        ? parseInt(dData[i].value.rr_set[0].ttl.toString().replaceAll(RegExp(search, "g"), replace))
                        : parseInt(dData[i].value.rr_set[0].ttl.toString().replaceAll(search, replace));

                    if (!isNaN(replaced) && replaced >= 0) dData[i].value.rr_set[0].ttl = replaced;
                }
                if (m.searchMatch.value) {
                    const type = dData[i].value.rr_type;
                    const value = dData[i].value.rr_set[0].value[type];
                    if (typeof value === "string") {
                        const replaced = regex
                            ? value.replaceAll(RegExp(search, "g"), replace)
                            : value.replaceAll(search, replace);
                        dData[i].value.rr_set[0].value[type] = replaced;
                    } else {
                        const smKeys = Object.keys(m.searchMatch.value[type]);
                        for (let ii = 0; ii < smKeys.length; ii++) {
                            if (m.searchMatch.value[type][smKeys[ii]]) {
                                /*@ts-ignore*/
                                const fieldValue = value[smKeys[ii]];
                                if (!fieldValue) break;

                                const replaced = regex
                                    ? fieldValue.replaceAll(RegExp(search, "g"), replace)
                                    : fieldValue.replaceAll(search, replace);
                                /*@ts-ignore*/
                                dData[i].value.rr_set[0].value[type][smKeys[ii]] = replaced;
                            }
                        }
                    }
                }
            });

            return { dData };
        });
    };

    handleDeleteClick = () => {};

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
                    search={this.state.search}
                    key={key}
                    index={index}
                    rec0={r.data}
                    meta={r.meta}
                />
            );
        };
        const sortDirectionIcon = (columnItem: ColumnItem) => {
            const style = {
                height: "1px",
                transform: "translate(4px,-5px) scale(20)"
            };
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
                <div
                    style={{
                        height: "70px",
                        position: "relative",
                        borderBottom: "1px solid var(--b1)",
                        width: "100%"
                    }}
                >
                    <span
                        style={{
                            left: "15px",
                            top: "10px",
                            position: "absolute"
                        }}
                    >
                        <Checkbox checked={this.state.selectAll} onChange={this.selectAll} />
                    </span>
                    {columnItems.map((item, i) => {
                        return (
                            <span
                                style={{
                                    left: item.left,
                                    top: "26px",
                                    position: "absolute",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    cursor: item.name !== "value" ? "pointer" : "default"
                                }}
                                className="caps"
                                key={item.name}
                                onClick={() => (item.name !== "value" ? this.sortColumns(item.name) : "")}
                            >
                                <span>{item.name}</span>
                                <span> {sortDirectionIcon(this.state.columnItems[i])}</span>
                            </span>
                        );
                    })}
                </div>
            );
        };

        const searchAndReplace = () => {
            return (
                <span
                    style={{
                        position: "absolute",
                        top: "-10px",
                        right: "10px",
                        padding: "20px"
                    }}
                >
                    <TextField
                        style={{ paddingRight: "20px" }}
                        color="secondary"
                        variant="standard"
                        type="text"
                        name="search"
                        placeholder="Search"
                        value={this.state.search}
                        onChange={this.handleSearchAndReplaceChange}
                    />
                    <TextField
                        variant="standard"
                        type="text"
                        color="secondary"
                        name="replace"
                        placeholder="Replace All"
                        value={this.state.replace}
                        onChange={this.handleSearchAndReplaceChange}
                    />
                    <IconButton
                        disabled={this.state.search.length ? false : true}
                        onClick={this.handleReplaceClick}
                        style={{ paddingTop: "7px" }}
                        size="small"
                    >
                        <VscReplaceAll></VscReplaceAll>
                    </IconButton>
                </span>
            );
        };

        return (
            <div style={{ ...this.props.style }}>
                <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />

                <div
                    style={{
                        height: "55px",
                        width: "100%",
                        background: "var(--a2)",
                        padding: "3px",
                        position: "relative"
                    }}
                >
                    <IconButton>{<AddCircle />}</IconButton>
                    <IconButton>{<Delete />}</IconButton>
                    {this.props.variant !== "import" ? (
                        <Fragment>
                            <IconButton>{<Flare />}</IconButton>
                            <IconButton>{<Map />}</IconButton>
                        </Fragment>
                    ) : (
                        ""
                    )}

                    {searchAndReplace()}
                </div>

                <div
                    style={{
                        height: "calc(100% - 55px - 70px)",
                        width: "100%",
                        background: this.props.config.local.synesthesia ? "lightgrey" : ""
                    }}
                >
                    {tableHead()}
                    <AutoSizer>
                        {({ height, width }) => (
                            <Fragment>
                                <List
                                    overscanRowCount={5}
                                    style={{ overflowY: "scroll" }}
                                    ref={ref => (this.list = ref)}
                                    height={height}
                                    width={width}
                                    estimatedRowSize={70}
                                    rowHeight={({ index }) => {
                                        return this.state.meta[index].expanded ? 670 : 70;
                                    }}
                                    rowRenderer={props =>
                                        rowRenderer({
                                            ...props,
                                            data: this.state.dData[props.index],
                                            meta: this.state.meta[props.index]
                                        })
                                    }
                                    rowCount={this.state.dData.length}
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
