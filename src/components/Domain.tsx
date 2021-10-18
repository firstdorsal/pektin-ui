import { Component, Fragment } from "react";
import { Checkbox, Fab, IconButton, TextField } from "@material-ui/core";
import * as t from "./types";
import { AddCircle, Check, Clear, Close, Delete, Refresh } from "@material-ui/icons";
import * as l from "./lib";
import cloneDeep from "lodash/cloneDeep";
import sortBy from "lodash/sortBy";
import { RouteComponentProps } from "react-router-dom";
import RecordRow from "./RecordRow";
import { AutoSizer, List } from "react-virtualized";
import "react-virtualized/styles.css";
import {
    FaSortAlphaDownAlt,
    FaSortAlphaDown,
    FaSortNumericDownAlt,
    FaSortNumericDown
} from "react-icons/fa";
import { ContextMenu } from "./ContextMenu";
import { VscRegex, VscReplaceAll } from "react-icons/vsc";

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
    readonly allValid: t.ValidationType;
    readonly useRegex: boolean;
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
}

interface ColumnItem {
    name: "name" | "type" | "ttl" | "value";
    left: string;
    type: "string" | "number";
    direction: 0 | 1 | 2;
    search: boolean;
}

const columnItems: ColumnItem[] = [
    { name: "name", left: "70px", type: "string", direction: 0, search: true },
    { name: "type", left: "405px", type: "string", direction: 0, search: true },
    { name: "ttl", left: "490px", type: "number", direction: 0, search: true },
    { name: "value", left: "580px", type: "string", direction: 0, search: true }
];

export default class Domain extends Component<DomainProps, DomainState> {
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
        changedRecords: 0,
        allValid: "ok",
        useRegex: true
    };

    list: any;

    saveRecord = async (i: number) => {
        const saveSuccessState = async (setRecord: t.DisplayRecord, i: number) => {
            let record = setRecord;
            try {
                record = (await l.getAllRecords(this.props.config, this.state.domainName)).filter(
                    dbRecord => {
                        return (
                            dbRecord.name.toLowerCase().replaceAll(/\s+/g, "") ===
                                setRecord.name.toLowerCase().replaceAll(/\s+/g, "") &&
                            dbRecord.type === setRecord.type
                        );
                    }
                )[0];
            } catch (e) {}
            if (!record) {
                return;
            }

            this.setState(({ meta, ogRecords, records, changedRecords }) => {
                meta = cloneDeep(meta);
                records = cloneDeep(records);
                ogRecords[i] = cloneDeep(record);
                records[i] = cloneDeep(record);
                meta[i].validity = this.validateRecord(record, this.state.domainName);
                [meta[i].changed, meta[i].anyChanged] = this.hasRecordChanged(record, "no");
                changedRecords = meta.filter(m => m.anyChanged).length;

                return { meta, ogRecords, records, changedRecords };
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
                await saveSuccessState(this.state.records[i], i);
            }
        } else {
            const res = await l.setRecords(this.props.config, [this.state.records[i]]);
            if (res && res.error !== undefined && res.error === false) {
                await saveSuccessState(this.state.records[i], i);
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
            const toBeAdded: t.DisplayRecord[] = [];
            const toBeDeleted: t.DisplayRecord[] = [];
            this.state.records.forEach((record, i) => {
                if (this.state.meta[i].anyChanged) {
                    toBeAdded.push(record);
                    if (
                        (this.state.ogRecords[i].name !== this.state.records[i].name ||
                            this.state.ogRecords[i].type !== this.state.records[i].type) &&
                        this.state.ogRecords[i].type !== "NEW"
                    ) {
                        toBeDeleted.push(this.state.ogRecords[i]);
                    }
                }
            });
            const setRes = await l.setRecords(this.props.config, toBeAdded);

            if (setRes && setRes.error !== undefined && setRes.error === false) {
                await l.deleteRecords(this.props.config, toBeDeleted);
                this.updateRecords(toBeAdded);
            }
        }
    };

    updateRecords = async (toUpdate?: t.DisplayRecord[]) => {
        if (!toUpdate) {
            this.handleReloadClick();
        } else {
            const updatedRecords = await l.getRecords(this.props.config, toUpdate);
            this.setState(({ meta, ogRecords, records, changedRecords }) => {
                meta = cloneDeep(meta);
                records = cloneDeep(records);
                records.forEach((record, i) => {
                    updatedRecords.forEach(updatedRecord => {
                        if (
                            updatedRecord.type === record.type &&
                            updatedRecord.name === record.name
                        ) {
                            ogRecords[i] = cloneDeep(updatedRecord);
                            records[i] = cloneDeep(updatedRecord);
                            meta[i].validity = this.validateRecord(
                                updatedRecord,
                                this.state.domainName
                            );
                            [meta[i].changed, meta[i].anyChanged] = this.hasRecordChanged(
                                updatedRecord,
                                "no"
                            );
                        }
                    });
                });
                changedRecords = meta.filter(m => m.anyChanged).length;

                return { meta, ogRecords, records, changedRecords };
            });
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
        ogRecord: t.DisplayRecord,
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
            if (v === ogRecord.type) {
                record.values[0] = ogRecord.values[0];
            } else {
                record.values[0] = l.rrTemplates[v as t.RRType].template;
            }
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
        return [record, ogRecord];
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
            [meta[recordIndex].changed, meta[recordIndex].anyChanged] = this.hasRecordChanged(
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
            [meta[recordIndex].changed, meta[recordIndex].anyChanged] = this.hasRecordChanged(
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

        this.setState(({ records, meta, domainName, ogRecords, changedRecords, allValid }) => {
            [records[recordIndex], ogRecords[recordIndex]] = this.handleRecordChange(
                records[recordIndex],
                ogRecords[recordIndex],
                parseInt(rrIndex),
                fieldName,
                fieldChildName,
                newValue
            );

            if (records[recordIndex].type === "SOA" && fieldName === "name") {
                domainName = records[recordIndex].name;
            }
            meta[recordIndex] = cloneDeep(meta[recordIndex]);
            meta[recordIndex].validity = this.validateRecord(records[recordIndex], domainName);
            [meta[recordIndex].changed, meta[recordIndex].anyChanged] = this.hasRecordChanged(
                records[recordIndex],
                ogRecords[recordIndex]
            );

            if (meta[recordIndex].validity?.totalValidity !== "ok" && allValid !== "error") {
                allValid = meta[recordIndex].validity?.totalValidity || "error";
            } else {
                allValid = meta[recordIndex].validity?.totalValidity || "error";
            }

            changedRecords = meta.filter(m => m.anyChanged).length;

            return { meta, records, domainName, ogRecords, changedRecords, allValid };
        });
    };

    validateRecord = (record: t.DisplayRecord, domainName: string): t.FieldValidity => {
        const valName = l.validateDomain(this.props.config, record?.name, { domainName });
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
                    ].validate(this.props.config, record.values[rrIndex].value);
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
                            this.props.config,
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
            /*@ts-ignore*/
            const m: t.DomainMeta = cloneDeep(l.defaultMeta);
            if (this.props.variant === "import") {
                m.selected = true;
            }
            m.validity = this.validateRecord(record, domainName);
            [m.changed, m.anyChanged] = this.hasRecordChanged(record, "no");
            return m;
        });

        const defaultOrder = records.map((e, i) => i);
        this.setState({
            records,
            ogRecords: cloneDeep(records),
            meta,
            defaultOrder,
            domainName,
            selectAll: this.props.variant === "import" ? true : false,
            allValid: "ok",
            changedRecords: 0
        });
        if (this.state.search.length) {
            this.handleSearchAndReplaceChange({
                target: { name: "search", value: this.state.search }
            });
        }
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
            this.setState({ domainName: this.props.match.params.domainName });
            const records = await l.getAllRecords(
                this.props.config,
                this.props.match.params.domainName
            );
            this.initData(records, this.props.match.params.domainName);
        }
    };

    componentDidUpdate = async (e: DomainProps) => {
        // replace the current state when the components props change to a new domain page
        if (this.props.match?.params?.domainName !== e.match?.params?.domainName) {
            const records = await l.getAllRecords(
                this.props.config,
                this.props.match.params.domainName
            );
            this.initData(records, this.props.match.params.domainName);
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
        this.setState(({ records, meta, columnItems, defaultOrder, ogRecords }) => {
            let combine: [t.DisplayRecord, t.DomainMeta, number, t.DisplayRecord][] = records.map(
                (e, i) => {
                    return [records[i], meta[i], defaultOrder[i], ogRecords[i]];
                }
            );

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
                ogRecords[i] = combine[i][3];
            });
            this.list.recomputeRowHeights();

            return { records, meta, columnItems, ogRecords };
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

    handleSearchAndReplaceChange = (e: any, useRegex = this.state.useRegex) => {
        if (e.target.name === "search") {
            const search = e.target.value;
            this.setState(({ records, meta, defaultOrder, ogRecords }) => {
                meta = cloneDeep(meta);

                records.forEach((rec, i) => {
                    // reset all
                    meta[i].anySearchMatch = false;
                    meta[i].searchMatch = cloneDeep(l.defaultSearchMatch);
                    // handle first three columns
                    if (search.length) {
                        {
                            const match = useRegex
                                ? rec.name.match(RegExp(search, "g"))
                                : rec.name.indexOf(search) > -1;

                            if (match) {
                                meta[i].searchMatch.name = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }
                        {
                            const match = useRegex
                                ? rec.type.match(RegExp(search, "g"))
                                : rec.type.indexOf(search) > -1;
                            if (match) {
                                meta[i].searchMatch.type = !!match;
                                meta[i].anySearchMatch = true;
                            }
                        }

                        // handle values column
                        meta[i].searchMatch.values = [];

                        rec.values.forEach((value, rrIndex) => {
                            const fieldValues = Object.values(value);
                            const fieldNames = Object.keys(value);
                            meta[i].searchMatch.values.push({});
                            for (
                                let fieldIndex = 0;
                                fieldIndex < fieldValues.length;
                                fieldIndex++
                            ) {
                                const m = useRegex
                                    ? fieldValues[fieldIndex].toString().match(RegExp(search, "g"))
                                    : fieldValues[fieldIndex].toString().indexOf(search) > -1;

                                if (m) {
                                    meta[i].searchMatch.values[rrIndex][fieldNames[fieldIndex]] =
                                        true;
                                    if (rrIndex > 0) {
                                        meta[i].expanded = true;
                                    }

                                    meta[i].anySearchMatch = true;
                                } else {
                                    meta[i].searchMatch.values[rrIndex][fieldNames[fieldIndex]] =
                                        false;
                                }
                            }
                        });
                    }
                });

                let combine: [t.DisplayRecord, t.DomainMeta, number, t.DisplayRecord][] =
                    records.map((e, i) => {
                        return [records[i], meta[i], defaultOrder[i], ogRecords[i]];
                    });
                combine = sortBy(combine, [
                    key => {
                        if (!search.length) return key[2];
                        return key[1].anySearchMatch;
                    }
                ]);
                if (search.length) combine.reverse();
                combine.forEach((e, i) => {
                    records[i] = combine[i][0];
                    meta[i] = combine[i][1];
                    defaultOrder[i] = combine[i][2];
                    ogRecords[i] = combine[i][3];
                });
                this.list.recomputeRowHeights();
                this.list.scrollToPosition(0);

                return { records, meta, search, ogRecords };
            });
        } else {
            this.setState(prevState => ({
                ...prevState,
                [e.target.name]: e.target.value.toString()
            }));
        }
    };

    handleReplaceClick = () => {
        this.setState(
            ({
                meta,
                search,
                replace,
                records,
                domainName,
                useRegex,
                allValid,
                changedRecords,
                ogRecords
            }) => {
                records = cloneDeep(records);
                meta.forEach((m, recordIndex) => {
                    if (!m.anySearchMatch) return;
                    if (m.searchMatch.name) {
                        const replaced = useRegex
                            ? records[recordIndex].name.replaceAll(RegExp(search, "g"), replace)
                            : records[recordIndex].name.replaceAll(search, replace);

                        if (records[recordIndex].type === "SOA") {
                            if (this.props.variant === "import") {
                                domainName = replaced;
                                records[recordIndex].name = replaced;
                            }
                        } else {
                            records[recordIndex].name = replaced;
                        }
                    }
                    if (m.searchMatch.type) {
                        const replaced = useRegex
                            ? (records[recordIndex].type.replaceAll(
                                  RegExp(search, "g"),
                                  replace
                              ) as t.RRType)
                            : (records[recordIndex].type.replaceAll(search, replace) as t.RRType);

                        if (records[recordIndex].type !== "SOA") {
                            records[recordIndex].type = replaced;
                            records[recordIndex].values = [l.rrTemplates[replaced].template];
                        }
                    }

                    if (m.searchMatch.values) {
                        records[recordIndex].values.forEach((value, rrIndex) => {
                            const fieldValues = Object.values(value);
                            const fieldNames = Object.keys(value);

                            for (let ii = 0; ii < fieldValues.length; ii++) {
                                if (m.searchMatch.values[rrIndex][fieldNames[ii]]) {
                                    /*@ts-ignore*/
                                    const fieldValue = fieldValues[ii];

                                    const replaced = useRegex
                                        ? fieldValue.replaceAll(RegExp(search, "g"), replace)
                                        : fieldValue.replaceAll(search, replace);
                                    /*@ts-ignore*/
                                    records[recordIndex].values[rrIndex][fieldNames[ii]] = replaced;
                                }
                            }
                        });
                    }
                    meta[recordIndex] = cloneDeep(meta[recordIndex]);
                    meta[recordIndex].validity = this.validateRecord(
                        records[recordIndex],
                        domainName
                    );
                    [meta[recordIndex].changed, meta[recordIndex].anyChanged] =
                        this.hasRecordChanged(records[recordIndex], ogRecords[recordIndex]);

                    if (
                        meta[recordIndex].validity?.totalValidity !== "ok" &&
                        allValid !== "error"
                    ) {
                        allValid = meta[recordIndex].validity?.totalValidity || "error";
                    } else {
                        allValid = meta[recordIndex].validity?.totalValidity || "error";
                    }
                });
                changedRecords = meta.filter(m => m.anyChanged).length;

                return { records, meta, domainName, allValid, changedRecords };
            }
        );
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
            /*@ts-ignore*/
            const newMeta: t.DomainMeta = cloneDeep(l.defaultMeta);
            [newMeta.changed, newMeta.anyChanged] = this.hasRecordChanged(newRecord, "yes");

            newMeta.validity = this.validateRecord(newRecord, this.state.domainName);
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

    handleRegexClick = () => {
        const newUseRegex = !this.state.useRegex;
        this.setState({ useRegex: newUseRegex });
        if (this.state.search.length) {
            this.handleSearchAndReplaceChange(
                {
                    target: { name: "search", value: this.state.search }
                },
                newUseRegex
            );
        }
    };

    handleClearSearchClick = () => {
        this.setState({ search: "", replace: "" });
        this.handleSearchAndReplaceChange({
            target: { name: "search", value: "" }
        });
    };

    handleReloadClick = async () => {
        const records = await l.getAllRecords(
            this.props.config,
            this.props.match.params.domainName
        );
        this.initData(records, this.props.match.params.domainName);
    };

    hasRecordChanged = (
        record: t.DisplayRecord,
        ogRecord: t.DisplayRecord | "yes" | "no"
    ): [t.FieldsChanged, boolean] => {
        const changed = { name: false, type: false, values: [] as Array<any> };
        let anyChanged = false;
        if (ogRecord === "yes" || ogRecord === "no") {
            const valid = ogRecord === "yes";
            changed.name = valid;
            changed.type = valid;
            record.values.forEach((recordValue: t.RRVal, i: number) => {
                changed.values.push({});
                const fieldKeys = Object.keys(recordValue);
                fieldKeys.forEach((fieldKey: string) => {
                    /*@ts-ignore*/
                    changed.values[i][fieldKey] = valid;
                });
            });
            return [changed as t.FieldsChanged, valid];
        }

        if (
            record.name.toLowerCase().replaceAll(/\s+/g, "") !==
            ogRecord.name.toLowerCase().replaceAll(/\s+/g, "")
        ) {
            changed.name = true;
            anyChanged = true;
        }
        if (record.type !== ogRecord.type) {
            changed.type = true;
            anyChanged = true;
        }

        record.values.forEach((recordValue: t.RRVal, i: number) => {
            changed.values.push({});
            const fieldKeys = Object.keys(recordValue);
            fieldKeys.forEach((fieldKey: string) => {
                if (
                    /*@ts-ignore*/
                    recordValue[fieldKey] !== ogRecord.values[i][fieldKey]
                ) {
                    changed.values[i][fieldKey] = true;
                    anyChanged = true;
                } else {
                    changed.values[i][fieldKey] = false;
                }
            });
        });

        return [changed as t.FieldsChanged, anyChanged];
    };

    rowRenderer = (r: {
        key: any;
        index: number;
        style: any;
        //record: t.DisplayRecord;
        //meta: t.DomainMeta;
        //totalRows: number;
    }) => {
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
                recordIndex={index}
                record={this.state.records[index]}
                meta={this.state.meta[index]}
                totalRows={this.state.records.length}
                domainName={this.state.domainName}
                variant={this.props.variant}
                addRRValue={this.addRRValue}
                removeRRValue={this.removeRRValue}
            />
        );
    };

    sortDirectionIcon = (columnItem: ColumnItem) => {
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

    tableHead = () => {
        return (
            <div
                className="tableHead"
                style={{
                    height: "70px",
                    position: "relative",
                    borderBottom: "1px solid var(--border-bottom-color)",
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
                            className="caps columnTitles"
                            key={item.name}
                            onClick={() =>
                                item.name !== "value" ? this.sortColumns(item.name) : ""
                            }
                        >
                            <span>{item.name}</span>
                            <span> {this.sortDirectionIcon(this.state.columnItems[i])}</span>
                        </span>
                    );
                })}
                <span
                    className="applyChanges"
                    style={{
                        width: "50px",
                        position: "absolute",
                        right: "8px",
                        top: "13px"
                    }}
                >
                    <Fab
                        onClick={() => this.saveAllChangedRecords()}
                        disabled={(() => {
                            let v = false;
                            if (this.state.changedRecords === 0 && this.props.variant !== "import")
                                v = true;
                            if (this.state.allValid === "error") v = true;
                            return v;
                        })()}
                        size="small"
                        className={this.state.allValid}
                    >
                        {this.state.allValid === "error" ? <Clear /> : <Check />}
                    </Fab>
                </span>
            </div>
        );
    };

    searchAndReplace = () => {
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
                    style={{ paddingRight: "10px" }}
                    color="secondary"
                    variant="standard"
                    type="text"
                    name="search"
                    placeholder="Search"
                    value={this.state.search}
                    onChange={this.handleSearchAndReplaceChange}
                />
                <IconButton
                    onClick={this.handleRegexClick}
                    style={{
                        paddingTop: "7px",
                        marginRight: "15px",
                        background: this.state.useRegex
                            ? "var(--actionbar-selected-background)"
                            : "",
                        color: "white",
                        borderRadius: "0px"
                    }}
                    title="Use Regex"
                    size="small"
                >
                    <VscRegex></VscRegex>
                </IconButton>

                <TextField
                    variant="standard"
                    type="text"
                    color="secondary"
                    name="replace"
                    placeholder="Replace All"
                    value={this.state.replace}
                    onChange={this.handleSearchAndReplaceChange}
                />
                <span style={{ marginTop: "7px", marginRight: "40px" }}>
                    <IconButton
                        title="Replace All"
                        disabled={this.state.search.length ? false : true}
                        onClick={this.handleReplaceClick}
                        size="small"
                    >
                        <VscReplaceAll></VscReplaceAll>
                    </IconButton>
                </span>
                <span
                    style={{
                        top: "22px",
                        right: "15px",
                        position: "absolute"
                    }}
                >
                    <IconButton title="Clear" onClick={this.handleClearSearchClick} size="small">
                        <Close></Close>
                    </IconButton>
                </span>
            </span>
        );
    };

    render = () => {
        return (
            <div style={{ height: "100%", ...this.props.style }}>
                <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />

                <div
                    className="actionBar"
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
                            <IconButton title="Refresh list" onClick={this.handleReloadClick}>
                                {<Refresh />}
                            </IconButton>
                            <IconButton title="New Record" onClick={this.handleAddClick}>
                                {<AddCircle />}
                            </IconButton>
                            <IconButton title="Delete selected" onClick={this.handleDeleteClick}>
                                {<Delete />}
                            </IconButton>
                        </Fragment>
                    )}

                    {this.searchAndReplace()}
                </div>

                <div
                    style={{
                        height: "calc(100% - 125px)",
                        width: "100%",
                        background: this.props.config.local.synesthesia ? "lightgrey" : ""
                    }}
                >
                    {this.tableHead()}
                    <AutoSizer>
                        {({ height, width }) => (
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
                                rowRenderer={this.rowRenderer}
                                rowCount={this.state.records.length}
                            />
                        )}
                    </AutoSizer>
                </div>
            </div>
        );
    };
}
