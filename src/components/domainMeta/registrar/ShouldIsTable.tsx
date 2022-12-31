import {
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
} from "@material-ui/core";
import { absoluteName, concatDomain, deAbsolute, PektinClient, PektinRRType } from "@pektin/client";
import { DNSECKey, GlobalRegistrar, GlueRecord } from "@pektin/global-registrar";
import { PureComponent } from "react";

interface ShouldIsTableProps {
  client: PektinClient;
  domain: string;
  gr?: GlobalRegistrar;
}
interface ShouldIsTableState {
  rows: ShouldIsRows;
  needsGlue: boolean;
}

type ShouldIsRows = [
  {
    id: string;
    name: string;
    should: string[];
    is: string[];
  },
  {
    id: string;
    name: string;
    should: GlueRecord[];
    is: GlueRecord[];
  },
  {
    id: string;
    name: string;
    should: DNSECKey[];
    is: DNSECKey[];
  }
];

const defaultRows: ShouldIsRows = [
  {
    id: "ns",
    name: "Nameservers",
    should: [],
    is: [],
  },
  {
    id: "glue",
    name: "Glue",
    should: [],
    is: [],
  },
  {
    id: "dnssec",
    name: "DNSSEC",
    should: [],
    is: [],
  },
];

export default class ShouldIsTable extends PureComponent<ShouldIsTableProps, ShouldIsTableState> {
  constructor(props: ShouldIsTableProps) {
    super(props);
    this.state = {
      rows: defaultRows,
      needsGlue: false,
    };
  }

  componentWillUnmount = () => {};

  componentDidMount = async () => {
    if (this.props.gr === undefined) return;
    const [nsShouldReq, domainInfo, dnssecIs, dnssecShouldAll] = await Promise.all([
      this.props.client.get([{ name: this.props.domain, rr_type: PektinRRType.NS }]),
      this.props.gr.getDomainInfo(this.props.domain),
      this.props.gr.getDNSSECKeys(this.props.domain),
      this.props.client.getPublicDnssecData(this.props.domain),
    ]);

    const nsShould = nsShouldReq?.data?.[0]?.data?.rr_set?.map((ns) => (ns as any).value).sort() as
      | string[]
      | undefined;

    // check if domain refers to itself and therefore needs a glue record
    const needsGlue =
      (nsShould && absoluteName(nsShould[0]).endsWith(absoluteName(this.props.domain))) ?? false;

    let glueShould: GlueRecord[] = [];
    let glueIs: GlueRecord[] = [];
    if (nsShould && needsGlue) {
      const glueShouldRes = await this.props.client.get(
        nsShould.flatMap((ns) => {
          return [
            { name: ns, rr_type: PektinRRType.AAAA },
            { name: ns, rr_type: PektinRRType.A },
          ];
        })
      );

      glueShould = nsShould.map((ns, i) => {
        const ips = glueShouldRes?.data?.[i * 2]?.data?.rr_set?.map((r) => (r as any).value);
        const legacyIps = glueShouldRes?.data?.[i * 2 + 1]?.data?.rr_set?.map(
          (r) => (r as any).value
        );
        return {
          ips,
          legacyIps,
          domain: this.props.domain,
          subDomain: deAbsolute(ns.replace(this.props.domain, "")),
        };
      });

      glueIs = await this.props.gr.getGlueRecords(this.props.domain);
    }

    const nsIs = domainInfo?.nameservers?.map((ns: string) => absoluteName(ns)).sort();

    this.setState(({ rows }) => {
      rows = rows.map((row) => {
        if (row.id === "ns") {
          return { ...row, should: nsShould ?? [], is: nsIs ?? [] };
        } else if (row.id === "dnssec") {
          return {
            ...row,
            should:
              [
                {
                  keyTag: dnssecShouldAll.keyTag,
                  algorithm: dnssecShouldAll.algorithm,
                  digestType: 2,
                  digest: dnssecShouldAll.digests.sha256,
                  type: dnssecShouldAll.flag === 257 ? "ksk" : "zsk",
                  publicKey: dnssecShouldAll.pubKeyDns,
                },
              ] ?? [],
            is: dnssecIs ?? [],
          };
        } else if (row.id === "glue") {
          return { ...row, should: glueShould, is: glueIs };
        }
        return row;
      }) as ShouldIsRows;

      return { rows, needsGlue, glueShould };
    });
  };

  applyFix = async (id: string) => {
    if (this.props.gr === undefined) return;
    if (id === "ns") {
      await this.props.gr.setNameServers(this.props.domain, this.state.rows[0].should);
    } else if (id === "dnssec") {
      await this.props.gr.setDNSSECKeys(this.props.domain, this.state.rows[2].should);
    } else if (id === "glue") {
      await this.props.gr.setGlueRecords(this.state.rows[1].should);
    }
  };

  render = () => {
    return (
      <div className="ShouldIsTable">
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>SHOULD</TableCell>
                <TableCell>IS</TableCell>
                <TableCell>FIX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.rows.map((row) => {
                if (row.id === "glue" && !this.state.needsGlue) return null;
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="should">
                      {row.should.map((r) => (
                        <div
                          key={"should" + JSON.stringify(r)}
                          className={row.id === "dnssec" ? "break code" : "code"}
                        >
                          {row.id === "glue"
                            ? renderGlue(r as GlueRecord)
                            : row.id === "dnssec"
                            ? renderDNSSEC(r as DNSECKey)
                            : r}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="is">
                      {row.is.map((r) => (
                        <div
                          key={"is" + JSON.stringify(r)}
                          className={row.id === "dnssec" ? "break code" : "code"}
                        >
                          {row.id === "glue"
                            ? renderGlue(r as GlueRecord)
                            : row.id === "dnssec"
                            ? renderDNSSEC(r as DNSECKey)
                            : r}
                        </div>
                      ))}
                    </TableCell>

                    <TableCell className="fix">
                      <button onClick={() => this.applyFix(row.id)}>Apply</button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };
}

const renderDNSSEC = (r: DNSECKey) => {
  return <div>{r.publicKey}</div>;
};

const renderGlue = (r: GlueRecord) => {
  return (
    <div>
      <div>{absoluteName(concatDomain(r.domain, r.subDomain))}</div>
      <div>{r.ips}</div>
      <div>{r.legacyIps}</div>
    </div>
  );
};
