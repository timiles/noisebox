import lamejs from 'lamejstmp';

const MAX_INT16_VALUE = 32768; // 2 ** 15;

export function encodeBufferToMp3(
  channelDataArrays: ReadonlyArray<Float32Array>,
  sampleRate: number,
  bitRate: number,
): Blob {
  const [leftChannel, rightChannel] = channelDataArrays;

  if (leftChannel === undefined || rightChannel === undefined) {
    throw new Error('MP3 encoding requires 2 data channels.');
  }

  const mp3encoder = new lamejs.Mp3Encoder(2, sampleRate, bitRate);
  const mp3Data = [];

  // Multiply Float32s up to Int16s
  const leftChannelInt16 = leftChannel.map((value) => value * MAX_INT16_VALUE);
  const rightChannelInt16 = rightChannel.map((value) => value * MAX_INT16_VALUE);
  const sampleBlockSize = 1152;

  for (let blockStart = 0; blockStart < leftChannelInt16.length; blockStart += sampleBlockSize) {
    const leftChannelBlock = leftChannelInt16.slice(blockStart, blockStart + sampleBlockSize);
    const rightChannelBlock = rightChannelInt16.slice(blockStart, blockStart + sampleBlockSize);
    const encodedBuffer = mp3encoder.encodeBuffer(leftChannelBlock, rightChannelBlock);
    if (encodedBuffer.length > 0) {
      mp3Data.push(encodedBuffer);
    }
  }

  const encodedBuffer = mp3encoder.flush();
  if (encodedBuffer.length > 0) {
    mp3Data.push(encodedBuffer);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
