import { Component, Fragment } from "react";
import { Checkbox, IconButton, TextField } from "@material-ui/core";
import * as t from "./types";
import {
  AddCircle,
  CheckBox,
  Close,
  Dashboard,
  Delete,
  KeyboardArrowUp,
  Refresh,
  Search,
} from "@material-ui/icons";
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
  FaSortNumericDown,
} from "react-icons/fa";
import { ContextMenu } from "./ContextMenu";
import { VscRegex, VscReplaceAll } from "react-icons/vsc";
import { MdFlashOn } from "react-icons/md";
import { HotKeys } from "react-hotkeys";
import Helper from "../components/Helper";
import {
  PektinClient,
  PektinRRType,
  ApiResponseType,
  clampTTL,
  absoluteName,
} from "@pektin/client";
import { isSupportedRecordType } from "@pektin/client";

import ContentLoader from "react-content-loader";
//@ts-ignore
import Fade from "react-reveal/Fade";
import PieButton from "./small/PieButton";
import { ApiRecord, ApiResponseBody } from "@pektin/client";
import { validateDomain } from "./validators/common";

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
  readonly warningRecords: number;
  readonly errorRecords: number;
  readonly useRegex: boolean;
  readonly instantSearch: boolean;
  readonly helper: boolean;
  readonly itemsLoaded: boolean;
  readonly lastApiCall?: ApiResponseBody;
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
  readonly client: PektinClient;
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
  { name: "value", left: "580px", type: "string", direction: 0, search: true },
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
    warningRecords: 0,
    errorRecords: 0,
    useRegex: true,
    instantSearch: true,
    helper: false,
    itemsLoaded: false,
  };

  list: any;
  papa: any;
  searchElement: any;
  replaceElement: any;

  handleHelper = (method: string) => {
    if (method === "close") {
      this.setState({ helper: false });
    }
  };

  saveRecord = async (i: number) => {
    const saveSuccessState = async (
      setRecord: t.DisplayRecord,
      i: number,
      apiRes: ApiResponseBody
    ) => {
      let record = setRecord;
      this.setState(({ meta, ogRecords, records, changedRecords }) => {
        meta = cloneDeep(meta);
        records = cloneDeep(records);
        ogRecords[i] = cloneDeep(record);
        records[i] = cloneDeep(record);

        meta[i].validity = this.validateRecord(record, this.state.domainName);
        [meta[i].changed, meta[i].anyChanged] = this.hasRecordChanged(record, "no");
        changedRecords = meta.filter((m) => m.anyChanged).length;

        return { meta, ogRecords, records, changedRecords, lastApiCall: apiRes };
      });
    };

    if (
      (this.state.ogRecords[i].name !== this.state.records[i].name ||
        this.state.ogRecords[i].rr_type !== this.state.records[i].rr_type) &&
      this.state.ogRecords[i].rr_type !== ("NEW" as PektinRRType)
    ) {
      // delete the key with the old name and or type and create one with the new name
      const setRes = await this.props.client.set(
        [l.toPektinApiRecord(this.props.config, this.state.records[i])],
        false
      );
      if (setRes.type === ApiResponseType.Error) {
        this.props.client.deleteRecords(
          [this.state.ogRecords[i]].map((r) => ({ name: r.name, rr_type: r.rr_type }))
        );
        await saveSuccessState(this.state.records[i], i, setRes);
      }
    } else {
      const setRecord = l.toPektinApiRecord(this.props.config, this.state.records[i]);
      const res = await this.props.client.set([setRecord], false);
      if (res.type !== "error") {
        await saveSuccessState(l.toUiRecord(this.props.config, setRecord), i, res);
      } else {
        this.setState(({ meta }) => {
          if (!res.data) {
            meta[i].apiError = res.message;
          } else {
            meta[i].apiError = res.data[0].message;
          }
          return { lastApiCall: res, meta };
        });
      }
    }
  };
  // TODO add error/warning text below the fields; i thought it was like this already at some point?
  // TODO add abort button to import
  saveAllChangedRecords = async () => {
    if (this.props.variant === "import") {
      const toBeAdded: t.DisplayRecord[] = [];
      this.state.records.forEach((record, i) => {
        if (this.state.meta[i].selected) toBeAdded.push(record);
      });
      const res = await this.props.client.set(
        toBeAdded.map((r) => l.toPektinApiRecord(this.props.config, r)),
        false
      );
      if (res.type !== "error") {
        this.props.g.loadDomains();
        this.props.history.push({
          pathname: `/domain/${this.state.domainName}/`,
        });
      }
    } else {
      const toBeAdded: t.DisplayRecord[] = [];
      const toBeDeleted: t.DisplayRecord[] = [];
      this.state.records.forEach((record, i) => {
        if (this.state.meta[i].anyChanged) {
          toBeAdded.push(record);
          if (
            (this.state.ogRecords[i].name !== this.state.records[i].name ||
              this.state.ogRecords[i].rr_type !== this.state.records[i].rr_type) &&
            this.state.ogRecords[i].rr_type !== ("NEW" as PektinRRType)
          ) {
            toBeDeleted.push(this.state.ogRecords[i]);
          }
        }
      });
      const setRes = await this.props.client.set(
        toBeAdded.map((r) => l.toPektinApiRecord(this.props.config, r)),
        false
      );

      if (setRes.type !== "error") {
        if (toBeDeleted.length) {
          await this.props.client.deleteRecords(
            toBeDeleted.map((r) => ({ name: r.name, rr_type: r.rr_type }))
          );
        }
        await this.updateRecords(setRes, toBeAdded);
      } else {
        this.setState(({ meta }) => {
          meta
            .filter((m) => m.anyChanged)
            .forEach((m, i) => {
              if (!setRes.data) {
                m.apiError = setRes.message;
                return;
              }
              m.apiError = setRes.data[i].message;
            });

          return { lastApiCall: setRes, meta };
        });
      }
    }
  };

  updateRecords = async (apiRes: ApiResponseBody, toUpdate?: t.DisplayRecord[]) => {
    if (!toUpdate) {
      this.handleReloadClick();
    } else {
      const res = await this.props.client.get(toUpdate);
      if (res.type === ApiResponseType.Success) {
        const updatedRecords = res.data.map((r) =>
          l.toUiRecord(this.props.config, r.data as ApiRecord)
        );
        this.setState(({ meta, ogRecords, records, changedRecords }) => {
          meta = cloneDeep(meta);
          records = cloneDeep(records);
          records.forEach((record, i) => {
            updatedRecords.forEach((updatedRecord) => {
              if (updatedRecord.rr_type === record.rr_type && updatedRecord.name === record.name) {
                ogRecords[i] = cloneDeep(updatedRecord);
                records[i] = cloneDeep(updatedRecord);
                meta[i].validity = this.validateRecord(updatedRecord, this.state.domainName);
                [meta[i].changed, meta[i].anyChanged] = this.hasRecordChanged(updatedRecord, "no");
              }
            });
          });
          changedRecords = meta.filter((m) => m.anyChanged).length;

          return { meta, ogRecords, records, changedRecords, lastApiCall: apiRes };
        });
      }
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
      /*@ts-ignore*/
      record.rr_set = record.rr_set.map((e) => {
        record.ttl = v ? clampTTL(v) : 0;
        return e;
      });
    } else if (fieldName === "type") {
      record.rr_type = v;
      record.rr_set = [];
      if (v === ogRecord.rr_type) {
        record.rr_set[0] = ogRecord.rr_set[0];
      } else {
        record.rr_set[0] = l.rrTemplates[v as PektinRRType].template;
      }
    } else if (fieldName === "rrField" && record.rr_set[rrIndex] !== undefined) {
      if (record.rr_set[rrIndex].hasOwnProperty("value")) {
        /*@ts-ignore*/
        record.rr_set[rrIndex].value = v;
      } else {
        const isNumber = typeof l.rrTemplates[record.rr_type].template[fieldChildName] === "number";
        /*@ts-ignore*/
        record.rr_set[rrIndex][fieldChildName] = isNumber ? parseInt(v) : v;
      }
    }
    return [record, ogRecord];
  };

  addRRValue = (recordIndex: number, newRRValueIndex: number) => {
    this.setState(({ records, meta }) => {
      const record = cloneDeep(records[recordIndex]);
      /*@ts-ignore*/
      record.rr_set[newRRValueIndex] = cloneDeep(record.rr_set[0]);
      records[recordIndex] = record;

      meta[recordIndex] = cloneDeep(meta[recordIndex]);
      meta[recordIndex].validity = this.validateRecord(records[recordIndex], this.state.domainName);

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
      /*@ts-ignore*/
      record.rr_set = record.rr_set.filter((e, i) => i !== rrIndex);
      records[recordIndex] = record;

      meta[recordIndex] = cloneDeep(meta[recordIndex]);
      meta[recordIndex].validity = this.validateRecord(records[recordIndex], this.state.domainName);

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

    this.setState(
      ({
        records,
        meta,
        domainName,
        ogRecords,
        changedRecords,
        warningRecords,
        errorRecords,
        helper,
        lastApiCall,
      }) => {
        [records[recordIndex], ogRecords[recordIndex]] = this.handleRecordChange(
          records[recordIndex],
          ogRecords[recordIndex],
          parseInt(rrIndex),
          fieldName,
          fieldChildName,
          newValue
        );

        if (records[recordIndex].rr_type === "SOA" && fieldName === "name") {
          domainName = records[recordIndex].name;
          meta = cloneDeep(meta);
          meta.forEach((m, i) => {
            m.validity = this.validateRecord(records[i], domainName);
          });
        } else {
          meta[recordIndex] = cloneDeep(meta[recordIndex]);
          meta[recordIndex].validity = this.validateRecord(records[recordIndex], domainName);
        }

        if (records[recordIndex].rr_type === "TXT" && this.props.config.local.helper) {
          /*@ts-ignore*/
          const changedValue = records[recordIndex]?.rr_set[rrIndex]?.value;
          if (changedValue?.startsWith("v=spf")) {
            helper = true;
          }
        }

        [meta[recordIndex].changed, meta[recordIndex].anyChanged] = this.hasRecordChanged(
          records[recordIndex],
          ogRecords[recordIndex]
        );

        changedRecords = meta.filter((m) => m.anyChanged).length;
        warningRecords = meta.filter(
          (m) => m.validity?.totalValidity === "warning" && m.anyChanged
        ).length;

        errorRecords = meta.filter(
          (m) => m.validity?.totalValidity === "error" && m.anyChanged
        ).length;

        meta[recordIndex].apiError = null;
        if (lastApiCall) lastApiCall.type = ApiResponseType.Success;

        return {
          meta,
          records,
          domainName,
          ogRecords,
          changedRecords,
          warningRecords,
          errorRecords,
          helper,
          lastApiCall,
        };
      }
    );
  };

  validateRecord = (record: t.DisplayRecord, domainName: string): t.FieldValidity => {
    const valName = validateDomain(this.props.config, record?.name, {
      domainName,
    });
    const fieldValidity: t.FieldValidity = {
      name: valName,
      values: [],
      totalValidity: valName.type,
    };
    if (!record) return fieldValidity;

    fieldValidity.values = record.rr_set.map((rr, rrIndex) => {
      const rrValidity: t.RRValidity = {};
      if (record.rr_set[rrIndex].hasOwnProperty("value")) {
        const templateFields = Object.keys(l.rrTemplates[record.rr_type]?.fields);

        if (l.rrTemplates[record.rr_type]?.fields[templateFields[0]]?.validate) {
          rrValidity[templateFields[0]] = l.rrTemplates[record.rr_type].fields[
            templateFields[0]
            /*@ts-ignore*/
          ].validate(this.props.config, record.rr_set[rrIndex].value);
          if (
            fieldValidity.totalValidity !== "error" &&
            rrValidity[templateFields[0]].type !== "ok"
          ) {
            fieldValidity.totalValidity = rrValidity[templateFields[0]]?.type;
          }
        }
      } else {
        const keys = Object.keys(record.rr_set[rrIndex]);
        const values = Object.values(record.rr_set[rrIndex]);

        keys.forEach((key, i) => {
          if (l.rrTemplates[record.rr_type]?.fields[key]?.validate !== undefined) {
            rrValidity[key] = l.rrTemplates[record.rr_type].fields[key].validate(
              this.props.config,
              values[i],
              record.rr_set[rrIndex]
            );

            if (fieldValidity.totalValidity !== "error" && rrValidity[key].type !== "ok") {
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
    const meta = records.map((record) => {
      const m: t.DomainMeta = cloneDeep(l.defaultMeta) as unknown as t.DomainMeta;
      if (this.props.variant === "import") {
        m.selected = true;
      }
      m.validity = this.validateRecord(record, domainName);
      m.apiError = null;
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
      errorRecords: 0,
      warningRecords: 0,
      changedRecords: 0,
      itemsLoaded: true,
    });
    this.list.recomputeRowHeights();
    if (this.state.search.length) {
      this.handleSearchAndReplaceChange({
        target: { name: "search", value: this.state.search },
      });
    }
  };

  componentDidMount = async () => {
    if (this.props.variant === "import") {
      if (!this.props.records) {
        return console.error(`domain component is set to variant "import" but has no records`);
      }
      let domainName = "";
      for (let i = 0; i < this.props.records.length; i++) {
        const record = this.props.records[i];
        if (record.rr_type === "SOA") {
          domainName = record.name;

          break;
        }
      }
      this.initData(this.props.records, domainName);
    } else {
      const domainName = this.props.match?.params?.domainName;
      this.setState({ domainName: this.props.match.params.domainName });
      const res = await this.props.client.getZoneRecords([domainName]);
      if (res.type === ApiResponseType.Success) {
        const records = res.data[0].data as ApiRecord[];
        this.initData(
          records
            /*@ts-ignore*/
            .filter((r) => r.rr_type !== "DNSKEY")
            .map((r) => l.toUiRecord(this.props.config, r)),
          this.props.match.params.domainName
        );
      }
    }
  };

  componentDidUpdate = async (e: DomainProps) => {
    const domainName = this.props.match?.params?.domainName;
    // replace the current state when the components props change to a new domain page
    if (e.match?.params?.domainName !== domainName) {
      this.setState({ itemsLoaded: false });
      const res = await this.props.client.getZoneRecords([domainName]);
      if (res.type === ApiResponseType.Success) {
        const records = res.data[0].data as ApiRecord[];

        this.initData(
          records
            /*@ts-ignore*/
            .filter((r) => r.rr_type !== "DNSKEY")
            .map((r) => l.toUiRecord(this.props.config, r)),
          domainName
        );
      }
    }
  };

  selectAll = () => {
    this.setState(({ selectAll, meta }) => {
      meta = cloneDeep(meta);
      meta = meta.map((m) => {
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
      columnItems = columnItems.map((e) => {
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
        (key) => {
          if (currentSortDirection === 0) return key[2];
          if (name === "name") return key[0].name;
          if (name === "ttl") return key[0].ttl;
          if (name === "type") return key[0].rr_type;
          if (name === "search") return key[1].searchMatch;
        },
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
        return this.handleSearchAndReplaceChange({
          target: { name: target.name, value },
        });
      }
      return this.handleChange({ target: { name: target.name, value } });
    }
  };

  handleSearchAndReplaceChange = (e: any, useRegex = this.state.useRegex, searchNow = false) => {
    try {
      "".match(RegExp(e.target.value));
    } catch (error) {
      useRegex = false;
    }

    if (e.target.name === "replace") {
      this.setState((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value.toString(),
      }));
    } else {
      this.setState(
        ({ records, meta, defaultOrder, ogRecords, instantSearch, search, columnItems }) => {
          if (!searchNow) search = e.target.value;

          if (instantSearch || searchNow) {
            meta = cloneDeep(meta);

            records.forEach((rec, i) => {
              // reset all
              meta[i].anySearchMatch = false;
              meta[i].expanded = false;
              meta[i].searchMatch = cloneDeep(l.defaultSearchMatch);
              // handle first three columns
              if (search.length) {
                if (columnItems[0].search) {
                  const match = useRegex
                    ? rec.name.match(RegExp(search, "g"))
                    : rec.name.indexOf(search) > -1;

                  if (match) {
                    meta[i].searchMatch.name = !!match;
                    meta[i].anySearchMatch = true;
                  }
                }
                if (columnItems[1].search) {
                  const match = useRegex
                    ? rec.rr_type.match(RegExp(search, "g"))
                    : rec.rr_type.indexOf(search) > -1;
                  if (match) {
                    meta[i].searchMatch.rr_type = !!match;
                    meta[i].anySearchMatch = true;
                  }
                }
                if (columnItems[2].search || columnItems[3].search) {
                  // handle values column
                  meta[i].searchMatch.rr_set = [];

                  // TODO:in strict mode the search matches a legacy ip address when input is "y" surely because of array.push and double state updates
                  // TODO:error handling on failed import

                  rec.rr_set.forEach((value, rrIndex) => {
                    const fieldValues = Object.values(value);
                    const fieldNames = Object.keys(value);
                    meta[i].searchMatch.rr_set.push({});
                    for (let fieldIndex = 0; fieldIndex < fieldValues.length; fieldIndex++) {
                      const m = useRegex
                        ? fieldValues[fieldIndex].toString().match(RegExp(search, "g"))
                        : fieldValues[fieldIndex].toString().indexOf(search) > -1;

                      if (
                        m &&
                        ((fieldNames[fieldIndex] === "ttl" && columnItems[2].search) ||
                          (fieldNames[fieldIndex] !== "ttl" && columnItems[3].search))
                      ) {
                        meta[i].searchMatch.rr_set[rrIndex][fieldNames[fieldIndex]] = true;
                        if (rrIndex > 0) {
                          meta[i].expanded = true;
                        }

                        meta[i].anySearchMatch = true;
                      } else {
                        meta[i].searchMatch.rr_set[rrIndex][fieldNames[fieldIndex]] = false;
                      }
                    }
                  });
                }
              }
            });

            let combine: [t.DisplayRecord, t.DomainMeta, number, t.DisplayRecord][] = records.map(
              (e, i) => {
                return [records[i], meta[i], defaultOrder[i], ogRecords[i]];
              }
            );
            combine = sortBy(combine, [
              (key) => {
                if (!search.length) return key[2];
                return key[1].anySearchMatch;
              },
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
          }
          return { records, meta, search, ogRecords };
        }
      );
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
        changedRecords,
        ogRecords,
        warningRecords,
        errorRecords,
      }) => {
        records = cloneDeep(records);
        meta.forEach((m, recordIndex) => {
          if (!m.anySearchMatch) return;
          if (m.searchMatch.name) {
            const replaced = useRegex
              ? records[recordIndex].name.replaceAll(RegExp(search, "g"), replace)
              : records[recordIndex].name.replaceAll(search, replace);

            if (records[recordIndex].rr_type === "SOA") {
              if (this.props.variant === "import") {
                domainName = replaced;
                records[recordIndex].name = replaced;
              }
            } else {
              records[recordIndex].name = replaced;
            }
          }
          if (m.searchMatch.rr_type) {
            const replaced = useRegex
              ? records[recordIndex].rr_type.replaceAll(RegExp(search, "g"), replace)
              : records[recordIndex].rr_type.replaceAll(search, replace);

            if (records[recordIndex].rr_type !== "SOA" && isSupportedRecordType(replaced)) {
              records[recordIndex].rr_type = replaced as PektinRRType;
              records[recordIndex].rr_set = [l.rrTemplates[replaced].template];
            }
          }

          if (m.searchMatch.rr_set) {
            records[recordIndex].rr_set.forEach((value, rrIndex) => {
              const fieldValues = Object.values(value);
              const fieldNames = Object.keys(value);

              for (let ii = 0; ii < fieldValues.length; ii++) {
                if (
                  m.searchMatch.rr_set[rrIndex] &&
                  m.searchMatch.rr_set[rrIndex][fieldNames[ii]]
                ) {
                  const fieldValue =
                    typeof fieldValues[ii] === "number"
                      ? fieldValues[ii].toString()
                      : fieldValues[ii];

                  const replaced = useRegex
                    ? fieldValue.replaceAll(RegExp(search, "g"), replace)
                    : fieldValue.replaceAll(search, replace);
                  /*@ts-ignore*/
                  records[recordIndex].rr_set[rrIndex][fieldNames[ii]] =
                    typeof fieldValues[ii] === "number" ? clampTTL(replaced) : replaced;
                }
              }
            });
          }
        });

        meta.forEach((m, recordIndex) => {
          meta[recordIndex] = cloneDeep(meta[recordIndex]);
          meta[recordIndex].validity = this.validateRecord(records[recordIndex], domainName);
          [meta[recordIndex].changed, meta[recordIndex].anyChanged] = this.hasRecordChanged(
            records[recordIndex],
            ogRecords[recordIndex]
          );
        });
        changedRecords = meta.filter((m) => m.anyChanged).length;
        warningRecords = meta.filter(
          (m) => m.validity?.totalValidity === "warning" && m.anyChanged
        ).length;
        errorRecords = meta.filter(
          (m) => m.validity?.totalValidity === "error" && m.anyChanged
        ).length;

        return {
          records,
          meta,
          domainName,
          warningRecords,
          errorRecords,
          changedRecords,
        };
      }
    );
  };

  handleDeleteClick = async () => {
    const toBeDeleted = this.state.records.filter((e, i) => this.state.meta[i].selected);
    let deletedSoa = false;
    let toBeDeletedOnServer = this.state.records.filter((e, i) => {
      if (this.state.meta[i].selected && this.state.records[i].rr_type === "SOA") deletedSoa = true;
      return (
        this.state.meta[i].selected && this.state.ogRecords[i].rr_type !== ("NEW" as PektinRRType)
      );
    });

    if (toBeDeletedOnServer.length) {
      if (deletedSoa) {
        toBeDeletedOnServer = toBeDeleted.filter((e, i) => {
          return this.state.ogRecords[i].rr_type !== ("NEW" as PektinRRType);
        });
      }
      await Promise.all([
        this.props.client.deleteRecords(
          toBeDeletedOnServer.map((r) => ({ name: r.name, rr_type: r.rr_type }))
        ),
        this.props.client.deletePektinSigner(this.state.domainName),
      ]);
    }
    if (deletedSoa) {
      this.props.g.loadDomains();
      this.props.history.push({
        pathname: `/`,
      });
    } else {
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
        name: absoluteName(defaultName),
        ttl: 60,

        rr_type: PektinRRType.AAAA,
        rr_set: [cloneDeep(l.rrTemplates.AAAA.template)],
      };
      const newMeta: t.DomainMeta = cloneDeep(l.defaultMeta) as unknown as t.DomainMeta;
      [newMeta.changed, newMeta.anyChanged] = this.hasRecordChanged(newRecord, "yes");

      newMeta.validity = this.validateRecord(newRecord, this.state.domainName);
      const newOgData: t.DisplayRecord = {
        name: "",
        ttl: 60,
        rr_type: "NEW" as PektinRRType,
        rr_set: [cloneDeep(l.rrTemplates.AAAA.template)],
      };
      const newDefaultOrder = defaultOrder.length;

      this.list.scrollToPosition(0);

      return {
        records: [newRecord, ...records],
        meta: [newMeta, ...meta],
        ogRecords: [newOgData, ...ogData],
        defaultOrder: [newDefaultOrder, ...defaultOrder],
      };
    });
  };

  handleRegexClick = () => {
    const newUseRegex = !this.state.useRegex;
    this.setState({ useRegex: newUseRegex });
    if (this.state.search.length) {
      this.handleSearchAndReplaceChange(
        {
          target: { name: "search", value: this.state.search },
        },
        newUseRegex
      );
    }
  };

  handleClearSearchClick = () => {
    this.setState({ search: "", replace: "" });
    this.handleSearchAndReplaceChange({
      target: { name: "search", value: "" },
    });
  };

  handleReloadClick = async () => {
    const res = await this.props.client.getZoneRecords([this.state.domainName]);
    if (res.type === ApiResponseType.Success) {
      const records = res.data[0].data as ApiRecord[];

      this.initData(
        records
          /*@ts-ignore*/
          .filter((r) => r.rr_type !== "DNSKEY")
          .map((r) => l.toUiRecord(this.props.config, r)),
        this.props.match.params.domainName
      );
    }
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
      record.rr_set.forEach((recordValue, i) => {
        changed.values.push({});
        const fieldKeys = Object.keys(recordValue);
        fieldKeys.forEach((fieldKey: string) => {
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
    if (record.rr_type !== ogRecord.rr_type) {
      changed.type = true;
      anyChanged = true;
    }

    record.rr_set.forEach((recordValue, i) => {
      changed.values.push({});
      const fieldKeys = Object.keys(recordValue);
      fieldKeys.forEach((fieldKey: string) => {
        if (
          /*@ts-ignore*/
          recordValue[fieldKey] !==
          /*@ts-ignore*/
          (ogRecord.rr_set[i] ? ogRecord.rr_set[i][fieldKey] : false)
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

  handleCollapseAllClick = () => {
    this.setState(({ meta }) => {
      meta = cloneDeep(meta).map((m) => {
        m.expanded = false;
        return m;
      });
      this.list.recomputeRowHeights();
      return { meta };
    });
  };

  handleInstantSearchClick = () => {
    this.setState(({ instantSearch }) => ({ instantSearch: !instantSearch }));
  };

  handleSelectSearchResultsClick = () => {
    this.setState(({ meta }) => {
      meta = cloneDeep(meta).map((m) => {
        m.selected = m.anySearchMatch;
        return m;
      });
      return { meta };
    });
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
        client={this.props.client}
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
        lastApiCall={this.state.lastApiCall}
      />
    );
  };

  sortDirectionIcon = (columnItem: ColumnItem) => {
    const style = {
      height: "1px",
      transform: "translate(4px,-5px) scale(20)",
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
          width: "100%",
        }}
      >
        <span
          style={{
            left: "15px",
            top: "10px",
            position: "absolute",
          }}
          title="Select All: ctrl+a"
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
                cursor: item.name !== "value" ? "pointer" : "default",
              }}
              className="caps columnTitles"
              key={item.name}
              onClick={() => (item.name !== "value" ? this.sortColumns(item.name) : "")}
            >
              <span>{item.name}</span>
              <span> {this.sortDirectionIcon(this.state.columnItems[i])}</span>
            </span>
          );
        })}
        <span
          style={{
            position: "absolute",
            right: "67px",
            top: "20px",
          }}
        >
          <IconButton size="small" title="Collapse All" onClick={this.handleCollapseAllClick}>
            <KeyboardArrowUp />
          </IconButton>
        </span>
        <span
          className="applyChanges"
          style={{
            width: "50px",
            position: "absolute",
            right: "8px",
            top: "13px",
          }}
        >
          <PieButton
            title={(() => {
              if (this.props.variant === "import") return "Import selected records";

              if (this.state.lastApiCall?.type === ApiResponseType.Success) {
                return this.state.lastApiCall.message;
              }
              if (this.state.changedRecords <= 0) return "";
              if (this.state.errorRecords) {
                return "Can't save records";
              }
              if (this.state.warningRecords) {
                return "Fix warnings and apply all changes ctrl+s";
              }
              return "Apply all changes ctrl+s";
            })()}
            onClick={this.saveAllChangedRecords}
            mode={(() => {
              if (this.props.variant === "import") return "ok";

              if (this.state.lastApiCall?.type === ApiResponseType.Error) return "apiError";
              if (this.state.changedRecords > 0 && this.state.errorRecords) return "error";
              if (this.state.changedRecords > 0 && this.state.warningRecords) return "warning";
              if (this.state.changedRecords > 0) return "ok";
              return "disabled";
            })()}
            predictedTime={this.state.lastApiCall?.time}
          />
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
          padding: "20px",
        }}
      >
        <TextField
          inputRef={(ref) => (this.searchElement = ref)}
          style={{ paddingRight: "5px" }}
          color="secondary"
          variant="standard"
          type="text"
          name="search"
          title="Search ctrl+f"
          placeholder="Search"
          value={this.state.search}
          onChange={this.handleSearchAndReplaceChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              this.handleSearchAndReplaceChange(e, this.state.useRegex, true);
            }
          }}
        />
        <IconButton
          style={{
            marginRight: "10px",
            marginTop: "4px",
          }}
          title="Search"
          size="small"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              this.handleSearchAndReplaceChange(e, this.state.useRegex, true);
            }
          }}
          onClick={(e) => this.handleSearchAndReplaceChange(e, this.state.useRegex, true)}
        >
          <Search />
        </IconButton>
        <span
          className="selectColumns"
          style={{
            marginRight: "5px",
            display: "inline-flex",
            verticalAlign: "middle",
          }}
          onDoubleClick={(e) => {
            this.setState(({ columnItems }) => {
              columnItems = columnItems.map((columnItem) => {
                columnItem.search = true;
                return columnItem;
              });

              return { columnItems };
            });
            this.handleSearchAndReplaceChange(e, this.state.useRegex, true);
          }}
        >
          {this.state.columnItems.map((columnItem, i) => {
            return (
              <span
                className="column"
                key={columnItem.name}
                onClick={(e) => {
                  this.setState(({ columnItems }) => {
                    columnItems[i].search = !columnItems[i].search;
                    return { columnItems };
                  });
                  this.handleSearchAndReplaceChange(e, this.state.useRegex, true);
                }}
                title={`Search through column ${columnItem.name.toUpperCase()}`}
                style={{
                  height: "28px",
                  width: "8px",
                  marginRight: "2px",
                  background: columnItem.search
                    ? "var(--action-bar-color)"
                    : "var(--action-bar-selected-background)",
                  display: "inline-flex",
                }}
              ></span>
            );
          })}
        </span>

        <IconButton
          onClick={this.handleRegexClick}
          style={{
            paddingTop: "7px",
            marginRight: "5px",
            background: this.state.useRegex ? "var(--action-bar-selected-background)" : "",
            borderRadius: "0px",
          }}
          title="Use Regex"
          size="small"
        >
          <VscRegex />
        </IconButton>
        <IconButton
          onClick={this.handleInstantSearchClick}
          style={{
            marginRight: "5px",
            background: this.state.instantSearch ? "var(--action-bar-selected-background)" : "",
            borderRadius: "0px",
            height: "28px",
          }}
          title="Instant Search"
          size="small"
        >
          <MdFlashOn style={{ transform: "scale(1.2)" }} />
        </IconButton>
        <IconButton
          onClick={this.handleSelectSearchResultsClick}
          style={{
            marginRight: "25px",
          }}
          title="Select all search results"
          size="small"
        >
          <CheckBox />
        </IconButton>

        <TextField
          title="Replace All ctrl+h"
          inputRef={(ref) => (this.replaceElement = ref)}
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
            <VscReplaceAll />
          </IconButton>
        </span>
        <span
          style={{
            top: "22px",
            right: "15px",
            position: "absolute",
          }}
        >
          <IconButton title="Clear" onClick={this.handleClearSearchClick} size="small">
            <Close />
          </IconButton>
        </span>
      </span>
    );
  };

  contentLoader = (height: number, width: number) => {
    return (
      <ContentLoader
        style={{ position: "absolute", top: 75, pointerEvents: "none" }}
        height={height}
        width={width}
        backgroundColor={"#333"}
        foregroundColor={"#999"}
      >
        {Array(20)
          .fill(0)
          .map((e, i) => {
            const ypos = i * 70 + 20;

            if (ypos > height) {
              return; // eslint-disable-line
            }
            return (
              <Fragment key={i}>
                <rect x="29" y={ypos - 1} rx="5" ry="5" width="20" height="20" />
                <rect x="0" y={ypos + 45} rx="1" ry="1" width={width} height="1" />
                <rect x="70" y={ypos} rx="5" ry="5" width="310" height="20" />
                <rect x="390" y={ypos} rx="5" ry="5" width="90" height="20" />
                <rect x="490" y={ypos} rx="5" ry="5" width="75" height="20" />
                <rect x="580" y={ypos} rx="5" ry="5" width={width - 700} height="20" />
                <rect x={width - 90} y={ypos - 1} rx="5" ry="5" width="20" height="20" />
                <circle cx={width - 38} cy={ypos + 8} r="20" />
              </Fragment>
            );
          })}
      </ContentLoader>
    );
  };

  render = () => {
    return (
      <HotKeys
        /*@ts-ignore*/
        innerRef={(c) => (this.papa = c)}
        style={{ height: "100%", ...this.props.style }}
        handlers={{
          SELECT_ALL: (e) => {
            /*@ts-ignore*/
            if (e?.target?.nodeName !== "INPUT") {
              e?.preventDefault();
              this.selectAll();
            }
          },
          RELOAD: (e) => {
            e?.preventDefault();
            if (this.props.variant === "import") return;
            this.handleReloadClick();
          },
          DELETE: (e) => {
            if (this.props.variant === "import") return;
            /* this.handleDeleteClick(); */
          },
          NEW: (e) => {
            if (this.props.variant === "import") return;
            /*@ts-ignore*/
            if (e?.target?.nodeName !== "INPUT") {
              e?.preventDefault();
              this.handleAddClick();
            }
          },
          SAVE: (e) => {
            e?.preventDefault();
            if (this.props.variant === "import") return;

            if (this.state.changedRecords) this.saveAllChangedRecords();
          },
          ESCAPE: (e) => {
            this.papa.focus();
          },
          SEARCH: (e) => {
            e?.preventDefault();
            this.searchElement?.focus();
          },
          REPLACE: (e) => {
            e?.preventDefault();
            this.replaceElement?.focus();
          },
        }}
      >
        <Helper show={this.state.helper} handleHelper={this.handleHelper}></Helper>
        <ContextMenu config={this.props.config} cmClick={this.cmClick} g={this.props.g} />
        <div
          className="actionBar"
          style={{
            height: "55px",
            width: "100%",
            background: "var(--a2)",
            padding: "3px",
            position: "relative",
          }}
        >
          {this.props.variant === "import" ? (
            ""
          ) : (
            <Fragment>
              <IconButton
                title="Domain Dashboard"
                onClick={() => {
                  this.props.history.push({
                    pathname: `/domain/${this.state.domainName}/dashboard/`,
                  });
                }}
              >
                {<Dashboard />}
              </IconButton>
              <IconButton title="Refresh List ctrl+r" onClick={this.handleReloadClick}>
                {<Refresh />}
              </IconButton>
              <IconButton title="New Record shift+a" onClick={this.handleAddClick}>
                {<AddCircle />}
              </IconButton>
              <IconButton title="Delete Selected" onClick={this.handleDeleteClick}>
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
            background: this.props.config.local.synesthesia ? "lightgrey" : "",
          }}
        >
          {this.tableHead()}

          <AutoSizer>
            {({ height, width }) => (
              <Fragment>
                <Fade when={this.state.itemsLoaded} left>
                  <List
                    overscanRowCount={5}
                    style={{ overflowY: "scroll" }}
                    ref={(ref) => (this.list = ref)}
                    height={height}
                    width={width}
                    estimatedRowSize={70}
                    rowHeight={({ index }) => {
                      return this.state.meta[index]?.expanded ? 670 : 70;
                    }}
                    rowRenderer={this.rowRenderer}
                    rowCount={this.state.records.length}
                  />
                </Fade>
                <Fade when={!this.state.itemsLoaded} left>
                  {this.contentLoader(height, width)}
                </Fade>
              </Fragment>
            )}
          </AutoSizer>
        </div>
      </HotKeys>
    );
  };
}
