import { Group } from 'konva/lib/Group';
import { Label, Tag } from 'konva/lib/shapes/Label';
import { Line } from 'konva/lib/shapes/Line';
import { Text as KonvaText } from 'konva/lib/shapes/Text';
import { CreateSegmentMarkerOptions, SegmentMarker } from 'peaks.js';

class ZoomviewSegmentMarker implements SegmentMarker {
  private group?: Group;

  private line?: Line;

  private text?: KonvaText;

  constructor(private options: CreateSegmentMarkerOptions) {}

  init(group: object) {
    this.group = group as Group;

    const color = this.options.segment.color?.toString();

    const label = new Label({
      x: 0.5,
      y: 0.5,
    });

    const tag = new Tag({
      fill: color,
      stroke: color,
      strokeWidth: 1,
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowOpacity: 0.3,
    });

    this.text = new KonvaText({
      text: this.options.startMarker ? this.options.segment.labelText : 'end',
      padding: 5,
      fill: 'white',
    });

    label.add(tag);
    label.add(this.text);
    this.group.add(label);

    // Vertical Line - create with default y and points, the real values are set in fitToView().
    this.line = new Line({
      x: 0,
      y: 0,
      stroke: color,
      strokeWidth: 1,
    });
    this.group.add(this.line);

    this.fitToView();

    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this.group!.on('mouseenter', () => {
      document.body.style.cursor = 'move';
    });

    this.group!.on('mouseleave', () => {
      document.body.style.cursor = 'default';
    });
  }

  fitToView() {
    const height = this.options.layer.getHeight();

    const textHeight = this.text!.height() + 2 * this.text!.padding();

    const offsetTop = 14 + (this.options.startMarker ? 0 : 26);
    const offsetBottom = 26;

    this.group!.y(offsetTop + textHeight + 0.5);

    this.line!.points([0.5, 0, 0.5, height - textHeight - offsetTop - offsetBottom]);
  }
}

export default ZoomviewSegmentMarker;
