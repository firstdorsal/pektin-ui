import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { PureComponent } from "react";

interface CertificatesProps {}
interface CertificatesState {
  rows: CertificatesRow[];
}

interface CertificatesRow {}

export default class Certificates extends PureComponent<CertificatesProps, CertificatesState> {
  constructor(props: CertificatesProps) {
    super(props);
    this.state = { rows: [] };
  }

  render = () => {
    return (
      <div className="Certificates">
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
              {/*this.state.rows.map((row) => (
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
              ))*/}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  };
}
