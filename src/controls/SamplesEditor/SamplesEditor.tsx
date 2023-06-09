import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import { useLogger } from 'LoggerProvider';
import ControlContainer from 'components/ControlContainer';
import { enqueueSnackbar } from 'notistack';
import Peaks, { PeaksInstance, PeaksOptions, Segment } from 'peaks.js';
import { useEffect, useRef, useState } from 'react';
import { AudioSource, AudioSourceSample } from 'types/AudioSource';
import { clipSampleByTime, getClipsFromAudioBuffer } from 'utils/sampleUtils';
import { v4 as uuidv4 } from 'uuid';
import LoadingPlaceholder from './LoadingPlaceholder';
import SampleControl from './SampleControl';
import ZoomviewSegmentMarker from './ZoomviewSegmentMarker';

interface IProps {
  audioSource: AudioSource;
  onChange: (audioSource: AudioSource) => void;
}

// Small sound files throw error on mobile when calling `resample`, so include zoom level 1
const ZOOM_LEVELS = [1, 512, 1024, 2048, 4096];

export default function SamplesEditor(props: IProps) {
  const { audioSource: initialAudioSource, onChange } = props;

  const audioContext = useAudioContext();
  const { log } = useLogger();

  const [audioSource, setAudioSource] = useState(initialAudioSource);
  const [peaks, setPeaks] = useState<PeaksInstance>();
  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(true);

  const zoomviewWaveformRef = useRef<HTMLDivElement>(null);
  const overviewWaveformRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const audioElementSrc = window.URL.createObjectURL(
    new Blob([audioSource.rawData], { type: audioSource.contentType }),
  );

  const handleZoomUpdated = (nextZoomLevel: number) => {
    log('info', `zoom level: ${nextZoomLevel}`);
    setCanZoomIn(nextZoomLevel !== ZOOM_LEVELS[0]);
    setCanZoomOut(nextZoomLevel !== ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
  };

  const createAudioSourceSample = ({
    id,
    labelText,
    startTime,
    endTime,
  }: Segment): AudioSourceSample | undefined => {
    try {
      const sample = clipSampleByTime(audioSource.audioBuffer, startTime, endTime);
      return {
        id: id!,
        name: labelText!,
        startTime,
        duration: endTime - startTime,
        audioBuffer: sample,
      };
    } catch (error) {
      log('error', `Error creating "${labelText ?? 'sample'}": ${error}`);
      enqueueSnackbar({ message: `Error creating "${labelText ?? 'sample'}".`, variant: 'error' });
      return undefined;
    }
  };

  const handleSegmentAdded = (segment: Segment) => {
    setAudioSource((prevAudioSource) => {
      const nextSample = createAudioSourceSample(segment);
      if (!nextSample) {
        return prevAudioSource;
      }
      const nextSamples = [...prevAudioSource.samples, nextSample];
      return { ...prevAudioSource, samples: nextSamples };
    });
  };

  const handleSegmentUpdated = (segment: Segment) => {
    setAudioSource((prevAudioSource) => {
      const nextSample = createAudioSourceSample(segment);
      if (!nextSample) {
        return prevAudioSource;
      }
      const nextSamples = prevAudioSource.samples.slice();
      const index = nextSamples.findIndex(({ id }) => id === nextSample.id);
      if (index < 0) {
        // Handle in case this sample was somehow not created on 'segments.add'
        nextSamples.push(nextSample);
      } else {
        nextSamples[index] = nextSample;
      }

      return { ...prevAudioSource, samples: nextSamples };
    });
  };

  const getDefaultSampleLabel = (sampleNumber: number) => `Sample ${sampleNumber}`;

  useEffect(() => {
    if (!peaks) {
      const options: PeaksOptions = {
        containers: {
          zoomview: zoomviewWaveformRef.current,
          overview: overviewWaveformRef.current,
        },
        mediaElement: audioElementRef.current!,
        keyboard: true,
        logger: (...args: any[]) => log('error', args.join(' | ')),
        createSegmentMarker: (o) => (o.view === 'zoomview' ? new ZoomviewSegmentMarker(o) : null),
        createSegmentLabel: () => null,
        webAudio: { audioContext },
        zoomLevels: ZOOM_LEVELS,
      };

      Peaks.init(options, (err, nextPeaks) => {
        if (nextPeaks) {
          nextPeaks.on('zoom.update', (currentZoomLevel) => handleZoomUpdated(currentZoomLevel));
          nextPeaks.on('segments.add', ([segment]) => handleSegmentAdded(segment));
          nextPeaks.on('segments.dragend', ({ segment }) => handleSegmentUpdated(segment));

          // Start at ZOOM_LEVELS[1]
          nextPeaks.zoom.zoomOut();

          const clips = getClipsFromAudioBuffer(audioSource.audioBuffer, {
            minimumSilenceDuration: 0.005,
            minimumClipDuration: 0.25,
            maximumClipDuration: 2,
          });

          const { sampleRate } = audioSource.audioBuffer;
          clips.forEach(({ start, length }, index) => {
            nextPeaks.segments.add({
              id: uuidv4(),
              startTime: start / sampleRate,
              endTime: (start + length) / sampleRate,
              labelText: getDefaultSampleLabel(index + 1),
              editable: true,
            });
          });
        }
        setPeaks(nextPeaks);
      });
    }
  }, [peaks]);

  useEffect(() => {
    onChange(audioSource);
  }, [audioSource]);

  const handleZoomIn = () => {
    if (peaks) {
      peaks.zoom.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (peaks) {
      peaks.zoom.zoomOut();
    }
  };

  const handleAddSegment = () => {
    if (peaks) {
      const time = peaks.player.getCurrentTime();

      peaks.segments.add({
        id: uuidv4(),
        startTime: time,
        endTime: time + 0.5,
        labelText: getDefaultSampleLabel(peaks.segments.getSegments().length + 1),
        editable: true,
      });
    }
  };

  const handleChangeSampleFrequency = (sampleId: string, frequency: number | null) => {
    setAudioSource((prevAudioSource) => {
      const nextSamples = prevAudioSource.samples.slice();
      nextSamples.find((sample) => sample.id === sampleId)!.frequency = frequency;
      return { ...prevAudioSource, samples: nextSamples };
    });
  };

  return (
    <ControlContainer>
      <Typography component="h2" variant="h6" mb={1}>
        {audioSource.name}
      </Typography>

      <Box mb={3}>
        <Paper square>
          <div ref={zoomviewWaveformRef} style={{ height: 200 }}>
            <LoadingPlaceholder />
          </div>
        </Paper>
      </Box>
      <Box mb={3}>
        <Paper square>
          <div ref={overviewWaveformRef} style={{ height: 85 }}>
            <LoadingPlaceholder />
          </div>
        </Paper>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioElementRef} controls>
          <source src={audioElementSrc} type={audioSource.contentType} />
          Your browser does not support the audio element.
        </audio>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" disabled={!peaks || !canZoomIn} onClick={handleZoomIn}>
            Zoom in
          </Button>
          <Button variant="outlined" disabled={!peaks || !canZoomOut} onClick={handleZoomOut}>
            Zoom out
          </Button>
          <Button variant="outlined" disabled={!peaks} onClick={handleAddSegment}>
            Add new sample
          </Button>
        </Stack>
      </Stack>

      {audioSource.samples.map((sample) => (
        <SampleControl
          key={sample.id}
          sample={sample}
          onChangeSampleFrequency={handleChangeSampleFrequency}
        />
      ))}
    </ControlContainer>
  );
}
