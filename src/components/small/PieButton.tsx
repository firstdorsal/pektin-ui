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

const defaultTime = 200;

type ButtonMode = "ok" | "warning" | "error" | "apiError" | "disabled";

interface PieButtonProps {
  readonly predictedTime?: number;
  readonly mode: ButtonMode;
  readonly title: string;
  readonly onClick: Function;
  readonly type?: string;
}
interface PieButtonState {
  animActive: boolean;
}

export default class PieButton extends Component<PieButtonProps, PieButtonState> {
  canvas: any;
  bgCanvas: any;
  updateBlock = false;
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
    this.runAnimation(0, ["ok", "warning"].includes(this.props.mode), this.props.mode);
  };
  componentDidMount = () => {
    this.runAnimation(0, false, "disabled", this.bgCanvas.current);
    this.runAnimation(0, false, this.props.mode);
  };

  runAnimation = (frame: number, anim: boolean, mode: ButtonMode, canvas = this.canvas.current) => {
    if (this.updateBlock) return;
    if (!canvas) return;
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d");
    if (anim && frame === 0) {
      this.setState({ animActive: true });
    }
    const { width, height } = canvas;
    ctx.fillStyle = colors[mode].b;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const pi = Math.PI;
    const frameRate = 60;
    const time = (this.props.predictedTime || defaultTime) / 1000;

    const rot = ((pi * 2) / (frameRate * time)) * frame;
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

    if (anim && rot < pi * 2) {
      frame += 1;
      requestAnimationFrame(() => this.runAnimation(frame, true, mode));
    } else if (anim) {
      this.runAnimation(0, false, "disabled");
      this.updateBlock = true;
      this.setState({ animActive: false });
      setTimeout(() => {
        this.updateBlock = false;
        this.runAnimation(0, false, this.props.mode);
      }, 100);
    }
  };

  render = () => {
    this.runAnimation(0, false, this.props.mode);
    return (
      <button title={this.props.title} style={{ all: "unset" }}>
        <canvas
          style={{
            width: "40px",
            position: "absolute",
            zIndex: 3,
            top: "2px",
            cursor: ["ok", "warning"].includes(this.props.mode) ? "pointer" : "default",
            display: this.props.mode === "disabled" ? "none" : "block",
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
