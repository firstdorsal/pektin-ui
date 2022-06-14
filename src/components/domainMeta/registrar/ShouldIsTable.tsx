import {
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
} from "@material-ui/core";
import { PureComponent } from "react";

interface ShouldIsTableProps {}
interface ShouldIsTableState {
  rows: ShouldIsRow[];
}

interface ShouldIsRow {
  id: string;
  name: string;
  should: string;
  is: string;
}

const defaultRows = [
  {
    id: "ns",
    name: "Nameservers",
    should: "",
    is: "",
  },
  {
    id: "glue",
    name: "Glue",
    should: "",
    is: "",
  },
  {
    id: "dnssec",
    name: "DNSSEC",
    should: "",
    is: "",
  },
];

export default class ShouldIsTable extends PureComponent<ShouldIsTableProps, ShouldIsTableState> {
  constructor(props: ShouldIsTableProps) {
    super(props);
    this.state = {
      rows: defaultRows,
    };
  }
  componentDidMount = async () => {};

  render = () => {
    return (
      <div className="ShouldIsTable">
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>IS</TableCell>
                <TableCell align="right">SHOULD</TableCell>
                <TableCell align="right">FIX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell component="th" scope="row">
                    {row.is}
                  </TableCell>
                  <TableCell align="right">{row.should}</TableCell>
                  <TableCell align="right">
                    <button>Apply</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };
}
