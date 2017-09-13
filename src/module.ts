import { LocateStream } from './streams/locate';
import { StripStream } from './streams/strip';

export const createLocateStream = () => new LocateStream();

export const createStripStream = () => new StripStream();
