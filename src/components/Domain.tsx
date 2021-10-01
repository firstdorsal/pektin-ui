import { Component, Fragment } from "react";
import { Checkbox, IconButton, TextField } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Delete, Flare, Map } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { RouteComponentProps, withRouter } from "react-router-dom";
import RecordRow from "./RecordRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once
import { FaSortAlphaDownAlt, FaSortAlphaDown, FaSortNumericDownAlt, FaSortNumericDown } from "react-icons/fa";
import { ContextMenu } from "./ContextMenu";
import { VscReplaceAll } from "react-icons/vsc";

interface DomainState {
    readonly dData: t.DisplayRecord[];
    readonly meta: Array<t.DomainMeta>;
    readonly ogData: t.DisplayRecord[];
    readonly selectAll: boolean;
    readonly columnItems: ColumnItem[];
    readonly defaultOrder: number[];
    readonly search: string;
    readonly replace: string;
    readonly anySelected: boolean;
}

interface RouteParams {
    readonly domainName: string;
}

interface DomainProps extends RouteComponentProps<RouteParams> {
    readonly config: t.Config;
    readonly g: t.Glob;
    readonly variant?: "import";
    readonly records?: t.DisplayRecord[];
    readonly style?: any;
    readonly computedMatch?: any;
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

    handleDDataChange = (dData: t.DisplayRecord, fieldName: string, fieldChildName: string, v: any) => {
        dData = cloneDeep(dData);
        if (fieldName === "name") {
            dData.name = v;
        } else if (fieldName === "ttl") {
            dData.ttl = v;
        } else if (fieldName === "type") {
            dData.type = v;
            dData.value = l.rrTemplates[v].template;
        } else if (fieldName === "rrField") {
            if (typeof dData.value[dData.type] === "string") {
                dData.value[dData.type] = v;
            } else {
                /*@ts-ignore*/
                dData.value[dData.type][fieldChildName] = v;
            }
        }
        return dData;
    };

    handleChange = (e: any) => {
        const fullName = e?.target?.name;
        const v = e?.target?.value;

        if (!fullName || !v === undefined) return;
        const [i, fieldName, fieldChildName] = fullName.split(":");

        this.setState(({ dData, meta }) => {
            //rData[i] = this.handleRDataChange(rData[i], fieldName, fieldChildName, v);
            dData[i] = this.handleDDataChange(dData[i], fieldName, fieldChildName, v);
            meta[i] = cloneDeep(meta[i]);

            meta[i].changed = !isEqual(dData[i], this.state.ogData[i]);
            return { meta, dData };
        });
    };

    initData = (d: t.DisplayRecord[]) => {
        const meta = d.map(() => {
            return {
                selected: false,
                expanded: false,
                changed: false,
                searchMatch: defaultSearchMatch,
                anySearchMatch: false
            };
        });

        const defaultOrder = d.map((e, i) => i);
        this.setState({ dData: d, ogData: cloneDeep(d), meta, defaultOrder });
    };

    componentDidMount = async () => {
        if (this.props.records) {
            this.initData(this.props.records);
        } else {
            const records = await l.getRecords(this.props.config, this.props.computedMatch.params.domainName);
            console.log(records);
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
        this.setState(({ dData, meta, columnItems, defaultOrder }) => {
            let combine: [t.DisplayRecord, t.DomainMeta, number][] = dData.map((e, i) => {
                return [dData[i], meta[i], defaultOrder[i]];
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
                    if (name === "ttl") return key[0].ttl;
                    if (name === "type") return key[0].type;
                    if (name === "search") return key[1].searchMatch;
                }
            ]);
            if (currentSortDirection === 2) combine.reverse();

            combine.forEach((e, i) => {
                dData[i] = combine[i][0];
                meta[i] = combine[i][1];
                defaultOrder[i] = combine[i][2];
            });
            this.list.recomputeRowHeights();
            return { dData, meta, columnItems };
        });
    };

    cmClick = (target: any, action: string, value: string | number) => {
        if (action === "paste") {
            if (["search", "replace"].includes(target.name)) {
                return this.handleSearchAndReplaceChange({ target: { name: target.name, value } });
            }
            return this.handleChange({ target: { name: target.name, value } });
        }
    };

    handleSearchAndReplaceChange = (e: any) => {
        if (e.target.name === "search") {
            const v = e.target.value;
            this.setState(({ dData, meta, defaultOrder }) => {
                meta = cloneDeep(meta);

                dData.forEach((rec, i) => {
                    // reset all
                    meta[i].anySearchMatch = false;
                    meta[i].searchMatch = cloneDeep(defaultSearchMatch);
                    // handle first three columns
                    if (v.length) {
                        {
                            const match = rec.name.match(v);
                            if (match) {
                                meta[i].searchMatch.name = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        {
                            const match = rec.type.match(v);
                            if (match) {
                                meta[i].searchMatch.type = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        {
                            const match = rec.ttl.toString().match(v);
                            if (match) {
                                meta[i].searchMatch.ttl = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        const type = rec.type;
                        const value = rec.value[type];
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

                let combine: [t.DisplayRecord, t.DomainMeta, number][] = dData.map((e, i) => {
                    return [dData[i], meta[i], defaultOrder[i]];
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
                });
                this.list.recomputeRowHeights();
                return { dData, meta, search: v };
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
                        ? dData[i].name.replaceAll(RegExp(search, "g"), replace)
                        : dData[i].name.replaceAll(search, replace);

                    dData[i].name = replaced;
                }
                if (m.searchMatch.type) {
                    const replaced = regex
                        ? (dData[i].type.replaceAll(RegExp(search, "g"), replace) as t.RRTypes)
                        : (dData[i].type.replaceAll(search, replace) as t.RRTypes);

                    dData[i].type = replaced;
                    dData[i].value = l.rrTemplates[replaced].template;
                }
                if (m.searchMatch.ttl) {
                    const replaced = regex
                        ? parseInt(dData[i].ttl.toString().replaceAll(RegExp(search, "g"), replace))
                        : parseInt(dData[i].ttl.toString().replaceAll(search, replace));

                    if (!isNaN(replaced) && replaced >= 0) dData[i].ttl = replaced;
                }
                if (m.searchMatch.value) {
                    const type = dData[i].type;
                    const value = dData[i].value[type];
                    if (typeof value === "string") {
                        const replaced = regex
                            ? value.replaceAll(RegExp(search, "g"), replace)
                            : value.replaceAll(search, replace);
                        dData[i].value[type] = replaced;
                    } else {
                        const smKeys = Object.keys(m.searchMatch.value[type]);
                        for (let ii = 0; ii < smKeys.length; ii++) {
                            if (m.searchMatch.value[type][smKeys[ii]]) {
                                /*@ts-ignore*/
                                const fieldValue = value[smKeys[ii]];
                                if (!fieldValue || typeof fieldValue !== "string") break;

                                const replaced = regex
                                    ? fieldValue.replaceAll(RegExp(search, "g"), replace)
                                    : fieldValue.replaceAll(search, replace);
                                /*@ts-ignore*/
                                dData[i].value[type][smKeys[ii]] = replaced;
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
        const rowRenderer = (r: { key: any; index: number; style: any; dData: t.DisplayRecord; meta: t.DomainMeta }) => {
            const { key, index, style } = r;

            return (
                <RecordRow
                    style={style}
                    config={this.props.config}
                    handleChange={this.handleChange}
                    saveRecord={this.saveRecord}
                    changeMeta={this.changeMeta}
                    search={this.state.search}
                    key={key}
                    index={index}
                    dData={r.dData}
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
            <div style={{ height: "100%", ...this.props.style }}>
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
                        height: "calc(100% - 125px)",
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
                                            dData: this.state.dData[props.index],
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
