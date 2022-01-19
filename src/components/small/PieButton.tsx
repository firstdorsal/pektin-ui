import { Component, createRef } from "react";

const check = new Path2D("M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z");
const cross = new Path2D(
  "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
);

const colors = {
  error: { b: "#f44336", f: "black" },
  warning: { b: "#ffa632", f: "black" },
  ok: { b: "#13d434", f: "black" },
  disabled: { b: "#1c2027", f: "#404349" },
  apiError: { b: "#f31a2d", f: "black" },
};

const defaultTime = 0.2;

type ButtonMode = "ok" | "warning" | "error" | "apiError" | "disabled";

interface PieButtonProps {
  readonly predictedTime?: number;
  readonly mode: ButtonMode;
  readonly title: string;
  readonly onClick: Function;
}
interface PieButtonState {
  animActive: boolean;
}
export default class PieButton extends Component<PieButtonProps, PieButtonState> {
  canvas: any;
  bgCanvas: any;
  state = {
    animActive: false,
  };

  constructor(props: PieButtonProps) {
    super(props);
    this.canvas = createRef();
    this.bgCanvas = createRef();
  }

  clicked = () => {
    this.props.onClick();
    this.runAnimation(0, false, "disabled", this.bgCanvas.current);
    this.runAnimation(0, ["ok", "warning"].includes(this.props.mode));
  };
  componentDidMount = () => {
    this.runAnimation(0, false);
  };

  runAnimation = (
    frame: number,
    anim: boolean,
    mode = this.props.mode,
    canvas = this.canvas.current
  ) => {
    if (!canvas) return;
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.fillStyle = colors[mode].b;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const pi = Math.PI;
    const frameRate = 60;

    if (anim && frame === 0) {
      this.setState({ animActive: true });
    }

    const rot = ((pi * 2) / (frameRate * (this.props.predictedTime || defaultTime))) * frame;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    //draw circular mask
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-pi / 2);
    ctx.beginPath();
    ctx.lineTo(0, 0);
    ctx.arc(0, 0, height / 2, anim ? rot : 2 * pi, 0);
    ctx.clip();

    // draw background
    ctx.beginPath();
    ctx.rotate(pi / 2);
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.fill();

    // draw icon
    ctx.beginPath();
    ctx.translate(-(width / 2), -(height / 2));
    ctx.translate(width / 5, height / 5);
    ctx.scale(2.5, 2.5);
    ctx.fillStyle = colors[mode].f;
    ctx.fill(["error", "apiError"].includes(mode) ? cross : check);
    ctx.restore();

    frame += 1;

    if (anim && rot < pi * 2) {
      requestAnimationFrame(() => this.runAnimation(frame, true));
    } else if (anim) {
      this.setState({ animActive: false });
      ctx.clearRect(0, 0, width, height);
    }
  };
  render = () => {
    this.runAnimation(0, false);
    return (
      <button title={this.props.title} className={this.props.mode} style={{ all: "unset" }}>
        <canvas
          style={{
            width: "40px",
            position: "absolute",
            zIndex: 3,
            top: "2px",
            cursor: ["ok", "warning"].includes(this.props.mode) ? "pointer" : "default",
          }}
          ref={this.canvas}
          onClick={() =>
            ["ok", "warning"].includes(this.props.mode) && !this.state.animActive
              ? this.clicked()
              : 1
          }
          width="100px"
          height="100px"
        />
        <canvas
          style={{
            width: "40px",
            position: "absolute",
            zIndex: 2,
            top: "2px",
          }}
          ref={this.bgCanvas}
          width="100px"
          height="100px"
        />
      </button>
    );
  };
}

/*
<Fab style={{ width: "40px", position: "absolute" }} size="small">
          {false ? <Clear /> : <Check />}
        </Fab>
*/
