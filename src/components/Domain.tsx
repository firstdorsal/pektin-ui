import { Component, Fragment } from "react";
import { Checkbox, Fab, IconButton, TextField } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Check, Delete, Flare, Map } from "@material-ui/icons";
import * as l from "./lib";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { RouteComponentProps, withRouter } from "react-router-dom";
import RecordRow from "./RecordRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once
import {
    FaSortAlphaDownAlt,
    FaSortAlphaDown,
    FaSortNumericDownAlt,
    FaSortNumericDown
} from "react-icons/fa";
import { ContextMenu } from "./ContextMenu";
import { VscReplaceAll } from "react-icons/vsc";

interface DomainState {
    readonly records: t.DisplayRecord[];
    readonly meta: Array<t.DomainMeta>;
    readonly ogRecords: t.DisplayRecord[];
    readonly selectAll: boolean;
    readonly columnItems: ColumnItem[];
    readonly defaultOrder: number[];
    readonly search: string;
    readonly replace: string;
    readonly anySelected: boolean;
    readonly domainName: string;
    readonly changedRecords: number;
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
    { name: "type", left: "405px", type: "string", direction: 0 },
    { name: "ttl", left: "490px", type: "number", direction: 0 },
    { name: "value", left: "580px", type: "string", direction: 0 }
];

class Domain extends Component<DomainProps, DomainState> {
    state: DomainState = {
        records: [],
        ogRecords: [],
        meta: [],
        selectAll: this.props.variant === "import",
        columnItems,
        defaultOrder: [],
        search: "",
        replace: "",
        anySelected: false,
        domainName: "",
        changedRecords: 0
    };
    list: any;
    saveRecord = async (i: number) => {
        const successState = async (setRecord: t.DisplayRecord) => {
            let record = setRecord;
            try {
                record = (await l.getRecords(this.props.config, this.state.domainName)).filter(
                    dbRecord =>
                        dbRecord.name.toLowerCase() === setRecord.name.toLowerCase() &&
                        dbRecord.type === setRecord.type
                )[0];
            } catch (e) {}

            this.setState(({ meta, ogRecords, records }) => {
                meta = cloneDeep(meta);
                records = cloneDeep(records);
                ogRecords[i] = cloneDeep(record);
                records[i] = cloneDeep(record);
                meta[i].validity = this.validateRecord(record, this.state.domainName);
                meta[i].changed = false;
                return { meta, ogRecords, records };
            });
        };
        if (
            (this.state.ogRecords[i].name !== this.state.records[i].name ||
                this.state.ogRecords[i].type !== this.state.records[i].type) &&
            this.state.ogRecords[i].type !== "NEW"
        ) {
            // delete the key with the old name and or type and create one with the new name

            const setRes = await l.setRecords(this.props.config, [this.state.records[i]]);
            if (setRes && setRes.error !== undefined && setRes.error === false) {
                l.deleteRecords(this.props.config, [this.state.ogRecords[i]]);
                await successState(this.state.records[i]);
            }
        } else {
            const res = await l.setRecords(this.props.config, [this.state.records[i]]);
            if (res && res.error !== undefined && res.error === false) {
                await successState(this.state.records[i]);
            }
        }
    };
    saveAllChangedRecords = async () => {
        if (this.props.variant === "import") {
            const toBeAdded: t.DisplayRecord[] = [];
            this.state.records.forEach((record, i) => {
                if (this.state.meta[i].selected) toBeAdded.push(record);
            });
            const res = await l.setRecords(this.props.config, toBeAdded);
            if (res && res.error !== undefined && res.error === false) {
                this.props.g.loadDomains();
                this.props.history.push({ pathname: `/domain/${this.state.domainName}` });
            }
        } else {
            //TODO add normal accept all pending records
        }
    };

    changeMeta = (e: any, index: number, fieldName: string) => {
        this.setState(({ meta, selectAll }) => {
            meta = cloneDeep(meta);
            if (fieldName === "selected") {
                if (selectAll) selectAll = !selectAll;
                meta[index].selected = !meta[index].selected;
            } else if (fieldName === "expanded") {
                meta[index].expanded = !meta[index].expanded;
                this.list.recomputeRowHeights();
            }
            return { meta, selectAll };
        });
    };

    handleRecordChange = (
        record: t.DisplayRecord,
        rrIndex: number,
        fieldName: string,
        fieldChildName: string,
        v: any
    ) => {
        record = cloneDeep(record);
        if (fieldName === "name") {
            record.name = v;
        } else if (fieldName === "ttl") {
            record.values = record.values.map(e => {
                e.ttl = v ? parseInt(v) : 0;
                return e;
            });
        } else if (fieldName === "type") {
            record.type = v;
            record.values = [];
            record.values[0] = l.rrTemplates[v as t.RRType].template;
        } else if (fieldName === "rrField" && record.values[rrIndex] !== undefined) {
            if (record.values[rrIndex]?.value !== undefined) {
                record.values[rrIndex].value = v;
            } else {
                const isNumber =
                    typeof l.rrTemplates[record.type].template[fieldChildName] === "number";
                /*@ts-ignore*/
                record.values[rrIndex][fieldChildName] = isNumber ? parseInt(v) : v;
            }
        }
        return record;
    };
    addRRValue = (recordIndex: number) => {
        this.setState(({ records, meta }) => {
            const record = cloneDeep(records[recordIndex]);
            record.values = [...record.values, cloneDeep(record.values[0])];
            records[recordIndex] = record;

            meta[recordIndex] = cloneDeep(meta[recordIndex]);
            meta[recordIndex].validity = this.validateRecord(
                records[recordIndex],
                this.state.domainName
            );
            meta[recordIndex].changed = !isEqual(
                records[recordIndex],
                this.state.ogRecords[recordIndex]
            );

            return { records, meta };
        });
    };
    removeRRValue = (recordIndex: number, rrIndex: number) => {
        this.setState(({ records, meta }) => {
            const record = cloneDeep(records[recordIndex]);
            record.values = record.values.filter((e, i) => i !== rrIndex);
            records[recordIndex] = record;

            meta[recordIndex] = cloneDeep(meta[recordIndex]);
            meta[recordIndex].validity = this.validateRecord(
                records[recordIndex],
                this.state.domainName
            );
            meta[recordIndex].changed = !isEqual(
                records[recordIndex],
                this.state.ogRecords[recordIndex]
            );

            return { records, meta };
        });
    };

    handleChange = (e: any) => {
        const fullName = e?.target?.name;
        const newValue = e?.target?.value;

        if (!fullName || !newValue === undefined) return;
        const [recordIndex, fieldName, rrIndex, fieldChildName] = fullName.split(":");

        this.setState(({ records, meta, domainName }) => {
            records[recordIndex] = this.handleRecordChange(
                records[recordIndex],
                parseInt(rrIndex),
                fieldName,
                fieldChildName,
                newValue
            );

            if (records[recordIndex].type === "SOA" && fieldName === "name") {
                domainName = records[recordIndex].name;
            }
            meta[recordIndex] = cloneDeep(meta[recordIndex]);
            meta[recordIndex].validity = this.validateRecord(
                records[recordIndex],
                this.state.domainName
            );
            meta[recordIndex].changed = !isEqual(
                records[recordIndex],
                this.state.ogRecords[recordIndex]
            );
            return { meta, records, domainName };
        });
    };

    validateRecord = (record: t.DisplayRecord, domainName: string): t.FieldValidity => {
        const valName = l.validateDomain(record?.name, { domainName });
        /*@ts-ignore*/
        const fieldValidity: t.FieldValidity = {
            name: valName,
            values: [],
            totalValidity: valName.type
        };
        if (!record) return fieldValidity;

        fieldValidity.values = record.values.map((rr, rrIndex) => {
            const rrValidity: t.RRValidity = {};

            if (record.values[rrIndex].value !== undefined) {
                const templateFields = Object.keys(l.rrTemplates[record.type]?.fields);

                if (l.rrTemplates[record.type]?.fields[templateFields[0]]?.validate) {
                    rrValidity[templateFields[0]] = l.rrTemplates[record.type].fields[
                        templateFields[0]
                    ].validate(record.values[rrIndex].value);
                    if (
                        fieldValidity.totalValidity !== "error" &&
                        rrValidity[templateFields[0]].type !== "ok"
                    ) {
                        fieldValidity.totalValidity = rrValidity[templateFields[0]]?.type;
                    }
                }
            } else {
                const keys = Object.keys(record.values[rrIndex]);
                const values = Object.values(record.values[rrIndex]);

                keys.forEach((key, i) => {
                    if (l.rrTemplates[record.type]?.fields[key]?.validate !== undefined) {
                        rrValidity[key] = l.rrTemplates[record.type].fields[key].validate(
                            values[i],
                            record.values[rrIndex]
                        );

                        if (
                            fieldValidity.totalValidity !== "error" &&
                            rrValidity[key].type !== "ok"
                        ) {
                            fieldValidity.totalValidity = rrValidity[key]?.type;
                        }
                    }
                });
            }
            return rrValidity;
        });
        return fieldValidity;
    };

    initData = (records: t.DisplayRecord[], domainName: string) => {
        const meta = records.map(record => {
            const m: t.DomainMeta = cloneDeep(l.defaultMeta);
            if (this.props.variant === "import") {
                m.selected = true;
            }
            m.validity = this.validateRecord(record, domainName);

            return m;
        });
        const defaultOrder = records.map((e, i) => i);
        this.setState({ records, ogRecords: cloneDeep(records), meta, defaultOrder, domainName });
    };

    componentDidMount = async () => {
        if (this.props.variant === "import") {
            if (!this.props.records) {
                return console.error(
                    `domain component is set to variant "import" but has no records`
                );
            }
            let domainName = "";
            for (let i = 0; i < this.props.records.length; i++) {
                const record = this.props.records[i];
                if (record.type === "SOA") {
                    domainName = record.name;

                    break;
                }
            }
            this.initData(this.props.records, domainName);
        } else {
            this.setState({ domainName: this.props.computedMatch.params.domainName });
            const records = await l.getRecords(
                this.props.config,
                this.props.computedMatch.params.domainName
            );
            this.initData(records, this.props.computedMatch.params.domainName);
        }
    };

    componentDidUpdate = async (e: DomainProps) => {
        // replace the current state when the components props change to a new domain page
        if (this.props.computedMatch?.params?.domainName !== e.computedMatch?.params?.domainName) {
            const records = await l.getRecords(
                this.props.config,
                this.props.computedMatch.params.domainName
            );
            this.initData(records, this.props.computedMatch.params.domainName);
        }
    };

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
        this.setState(({ records, meta, columnItems, defaultOrder }) => {
            let combine: [t.DisplayRecord, t.DomainMeta, number][] = records.map((e, i) => {
                return [records[i], meta[i], defaultOrder[i]];
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
                    if (name === "ttl") return key[0].values[0].ttl;
                    if (name === "type") return key[0].type;
                    if (name === "search") return key[1].searchMatch;
                }
            ]);
            if (currentSortDirection === 2) combine.reverse();

            combine.forEach((e, i) => {
                records[i] = combine[i][0];
                meta[i] = combine[i][1];
                defaultOrder[i] = combine[i][2];
            });
            this.list.recomputeRowHeights();
            return { records, meta, columnItems };
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
            this.setState(({ records, meta, defaultOrder }) => {
                meta = cloneDeep(meta);

                records.forEach((rec, i) => {
                    // reset all
                    meta[i].anySearchMatch = false;
                    meta[i].searchMatch = cloneDeep(l.defaultSearchMatch);
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
                            const match = rec.values[0].ttl.toString().match(v);
                            if (match) {
                                meta[i].searchMatch.ttl = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        // handle values column
                        const value = rec.values[0];

                        if (value.value !== undefined) {
                            const m = value.value.match(v);
                            if (m) {
                                meta[i].searchMatch.values.value = !!m;
                                meta[i].anySearchMatch = true;
                            }
                        } else {
                            const fieldValues = Object.values(value);
                            const fields = Object.keys(value);
                            meta[i].searchMatch.values = { [rec.type]: {} };

                            for (let ii = 0; ii < fieldValues.length; ii++) {
                                const m = fieldValues[ii].toString().match(v);
                                if (m) {
                                    meta[i].searchMatch.values[fields[ii]] = !!m;
                                    meta[i].anySearchMatch = true;
                                }
                            }
                        }
                    }
                });

                let combine: [t.DisplayRecord, t.DomainMeta, number][] = records.map((e, i) => {
                    return [records[i], meta[i], defaultOrder[i]];
                });
                combine = sortBy(combine, [
                    key => {
                        if (!v.length) return key[2];
                        return key[1].anySearchMatch;
                    }
                ]);
                if (v.length) combine.reverse();
                combine.forEach((e, i) => {
                    records[i] = combine[i][0];
                    meta[i] = combine[i][1];
                    defaultOrder[i] = combine[i][2];
                });
                this.list.recomputeRowHeights();

                return { records, meta, search: v };
            });
        } else {
            this.setState(prevState => ({
                ...prevState,
                [e.target.name]: e.target.value.toString()
            }));
        }
    };

    handleReplaceClick = () => {
        this.setState(({ meta, search, replace, records, domainName }) => {
            records = cloneDeep(records);
            const regex = true;
            meta.forEach((m, i) => {
                if (!m.anySearchMatch) return;
                if (m.searchMatch.name) {
                    const replaced = regex
                        ? records[i].name.replaceAll(RegExp(search, "g"), replace)
                        : records[i].name.replaceAll(search, replace);

                    if (records[i].type === "SOA") {
                        if (this.props.variant === "import") {
                            domainName = replaced;
                            records[i].name = replaced;
                        }
                    } else {
                        records[i].name = replaced;
                    }
                }
                if (m.searchMatch.type) {
                    const replaced = regex
                        ? (records[i].type.replaceAll(RegExp(search, "g"), replace) as t.RRType)
                        : (records[i].type.replaceAll(search, replace) as t.RRType);

                    records[i].type = replaced;
                    records[i].values = l.rrTemplates[replaced].template;
                }
                if (m.searchMatch.ttl) {
                    const replaced = regex
                        ? parseInt(
                              records[i].values[0].ttl
                                  .toString()
                                  .replaceAll(RegExp(search, "g"), replace)
                          )
                        : parseInt(records[i].values[0].ttl.toString().replaceAll(search, replace));

                    if (!isNaN(replaced) && replaced >= 0) records[i].values[0].ttl = replaced;
                }
                if (m.searchMatch.values) {
                    const type = records[i].type;
                    const value = records[i].values[0];
                    if (value.value !== undefined) {
                        const replaced = regex
                            ? value.value.replaceAll(RegExp(search, "g"), replace)
                            : value.value.replaceAll(search, replace);
                        records[i].values[0].value = replaced;
                    } else {
                        let smKeys: any[] = [];
                        if (m.searchMatch.values[type])
                            smKeys = Object.keys(m.searchMatch.values[type]);
                        for (let ii = 0; ii < smKeys.length; ii++) {
                            if (m.searchMatch.values[type][smKeys[ii]]) {
                                /*@ts-ignore*/
                                const fieldValue = value[smKeys[ii]];
                                if (!fieldValue || typeof fieldValue !== "string") break;

                                const replaced = regex
                                    ? fieldValue.replaceAll(RegExp(search, "g"), replace)
                                    : fieldValue.replaceAll(search, replace);
                                /*@ts-ignore*/
                                records[i].values[type][smKeys[ii]] = replaced;
                            }
                        }
                    }
                }
                meta[i].changed = !isEqual(records[i], this.state.ogRecords[i]);
            });
            return { records, meta, domainName };
        });
    };

    handleDeleteClick = async () => {
        const toBeDeleted = this.state.records.filter((e, i) => this.state.meta[i].selected);
        const delRes = await l.deleteRecords(this.props.config, toBeDeleted);
        if (delRes && delRes.error !== undefined && delRes.error === false) {
            this.setState(({ records, meta, ogRecords: ogData, defaultOrder }) => {
                records = records.filter((e, i) => !meta[i].selected);
                ogData = ogData.filter((e, i) => !meta[i].selected);
                defaultOrder = defaultOrder.filter((e, i) => !meta[i].selected);
                meta = meta.filter((e, i) => !meta[i].selected);

                return { records, meta, ogRecords: ogData, defaultOrder };
            });
        }
    };
    handleAddClick = () => {
        this.setState(({ records, meta, ogRecords: ogData, defaultOrder }) => {
            //records = cloneDeep(records);
            //meta = cloneDeep(meta);
            let defaultName = this.state.domainName;
            defaultName = defaultName ? defaultName : "";
            const newRecord: t.DisplayRecord = {
                name: l.absoluteName(defaultName),
                type: "AAAA",
                values: [cloneDeep(l.rrTemplates.AAAA.template)]
            };
            const newMeta: t.DomainMeta = cloneDeep(l.defaultMeta);
            newMeta.changed = true;
            const newOgData: t.DisplayRecord = {
                name: "",
                type: "NEW",
                values: [cloneDeep(l.rrTemplates.AAAA.template)]
            };
            const newDefaultOrder = defaultOrder.length;

            return {
                records: [newRecord, ...records],
                meta: [newMeta, ...meta],
                ogRecords: [newOgData, ...ogData],
                defaultOrder: [newDefaultOrder, ...defaultOrder]
            };
        });
    };

    render = () => {
        const rowRenderer = (r: {
            key: any;
            index: number;
            style: any;
            record: t.DisplayRecord;
            meta: t.DomainMeta;
            totalRows: number;
        }) => {
            const { key, index, style, totalRows } = r;

            return (
                <RecordRow
                    style={style}
                    config={this.props.config}
                    handleChange={this.handleChange}
                    saveRecord={this.saveRecord}
                    changeMeta={this.changeMeta}
                    search={this.state.search}
                    key={key}
                    recordIndex={index}
                    record={r.record}
                    meta={r.meta}
                    totalRows={totalRows}
                    domainName={this.state.domainName}
                    variant={this.props.variant}
                    addRRValue={this.addRRValue}
                    removeRRValue={this.removeRRValue}
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
                                onClick={() =>
                                    item.name !== "value" ? this.sortColumns(item.name) : ""
                                }
                            >
                                <span>{item.name}</span>
                                <span> {sortDirectionIcon(this.state.columnItems[i])}</span>
                            </span>
                        );
                    })}
                    <span
                        style={{
                            width: "50px",
                            position: "absolute",
                            right: "15px",
                            top: "13px"
                        }}
                    >
                        <Fab
                            onClick={() => this.saveAllChangedRecords()}
                            disabled={
                                this.state.changedRecords === 0 && this.props.variant !== "import"
                            }
                            size="small"
                        >
                            <Check />
                        </Fab>
                    </span>
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
                    {this.props.variant === "import" ? (
                        ""
                    ) : (
                        <Fragment>
                            <IconButton onClick={this.handleAddClick}>{<AddCircle />}</IconButton>
                            <IconButton onClick={this.handleDeleteClick}>{<Delete />}</IconButton>
                            <IconButton>{<Flare />}</IconButton>
                            <IconButton>{<Map />}</IconButton>
                        </Fragment>
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
                                        return this.state.meta[index]?.expanded ? 670 : 70;
                                    }}
                                    rowRenderer={props =>
                                        rowRenderer({
                                            ...props,
                                            record: this.state.records[props.index],
                                            meta: this.state.meta[props.index],
                                            totalRows: this.state.records.length
                                        })
                                    }
                                    rowCount={this.state.records.length}
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
