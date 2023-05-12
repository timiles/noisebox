import { Note } from './Note';
import { Sample } from './Sample';

export type Track = {
  id: string;
  name: string;
  instrument: string;
  notes: Array<Note>;
  sample?: Sample;
};
