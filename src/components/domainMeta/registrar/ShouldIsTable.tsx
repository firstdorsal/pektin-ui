import {
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
} from "@material-ui/core";
import { absoluteName, PektinClient, PektinRRType } from "@pektin/client";
import { DNSECKey, GlobalRegistrar } from "@pektin/global-registrar";
import { PureComponent } from "react";

interface ShouldIsTableProps {
  client: PektinClient;
  domain: string;
  gr?: GlobalRegistrar;
}
interface ShouldIsTableState {
  rows: ShouldIsRows;
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
    should: string[];
    is: string[];
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
    };
  }

  componentDidMount = async () => {
    if (this.props.gr === undefined) return;
    const [nsShouldReq, domainInfo, dnssecIs, dnssecShouldAll] = await Promise.all([
      this.props.client.get([{ name: this.props.domain, rr_type: PektinRRType.NS }]),
      this.props.gr.getDomainInfo(this.props.domain),
      this.props.gr.getDNSSECKeys(this.props.domain),
      this.props.client.getPublicDnssecData(this.props.domain),
    ]);

    const nsShould = nsShouldReq?.data?.[0]?.data?.rr_set?.map((ns) => (ns as any).value).sort();
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
        }
        return row;
      }) as ShouldIsRows;

      return { rows };
    });
  };

  applyFix = async (id: string) => {
    if (this.props.gr === undefined) return;
    if (id === "ns") {
      await this.props.gr.setNameServers(this.props.domain, this.state.rows[0].should);
    } else if (id === "dnssec") {
      await this.props.gr.setDNSSECKeys(this.props.domain, this.state.rows[2].should);
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
                console.log(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="should">
                      {row.should.map((r) => (
                        <div
                          key={"should" + r}
                          className={row.id === "dnssec" ? "break code" : "code"}
                        >
                          {typeof r === "string" ? r : r.publicKey}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="is">
                      {row.is.map((r) => (
                        <div key={"is" + r} className={row.id === "dnssec" ? "break code" : "code"}>
                          {typeof r === "string" ? r : r.publicKey}
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
