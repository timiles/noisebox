import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useAudioContext } from 'AudioContextProvider';
import ControlContainer from 'components/ControlContainer';
import Peaks, { PeaksInstance, PeaksOptions, Segment } from 'peaks.js';
import { useEffect, useRef, useState } from 'react';
import { AudioSource, AudioSourceSample } from 'types/AudioSource';
import { v4 as uuidv4 } from 'uuid';
import LoadingPlaceholder from './LoadingPlaceholder';
import SamplesList from './SamplesList';
import ZoomviewSegmentMarker from './ZoomviewSegmentMarker';

interface IProps {
  audioSource: AudioSource;
  onChange: (audioSource: AudioSource) => void;
}

const ZOOM_LEVELS = [512, 1024, 2048, 4096];

function SamplesEditor(props: IProps) {
  const { audioSource: initialAudioSource, onChange } = props;

  const audioContext = useAudioContext();

  const [audioSource, setAudioSource] = useState(initialAudioSource);
  const [peaks, setPeaks] = useState<PeaksInstance>();
  const [canZoomIn, setCanZoomIn] = useState(false);
  const [canZoomOut, setCanZoomOut] = useState(true);

  const zoomviewWaveformRef = useRef<HTMLDivElement>(null);
  const overviewWaveformRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const audioElementSrc = window.URL.createObjectURL(
    new Blob([audioSource.rawData], { type: audioSource.contentType }),
  );

  const handleZoomUpdated = (nextZoomLevel: number) => {
    setCanZoomIn(nextZoomLevel !== ZOOM_LEVELS[0]);
    setCanZoomOut(nextZoomLevel !== ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
  };

  const createAudioSourceSample = ({
    id,
    labelText,
    startTime,
    endTime,
  }: Segment): AudioSourceSample => ({
    id: id!,
    name: labelText!,
    startTime,
    duration: endTime - startTime,
  });

  const handleSegmentAdded = (segment: Segment) => {
    setAudioSource((prevAudioSource) => {
      const nextSample = createAudioSourceSample(segment);
      const nextSamples = [...prevAudioSource.samples, nextSample];
      return { ...prevAudioSource, samples: nextSamples };
    });
  };

  const handleSegmentUpdated = (segment: Segment) => {
    setAudioSource((prevAudioSource) => {
      const nextSample = createAudioSourceSample(segment);
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

  useEffect(() => {
    if (!peaks) {
      const options: PeaksOptions = {
        containers: {
          zoomview: zoomviewWaveformRef.current,
          overview: overviewWaveformRef.current,
        },
        mediaElement: audioElementRef.current!,
        keyboard: true,
        // eslint-disable-next-line no-console
        logger: console.error.bind(console),
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
        labelText: `Sample ${peaks.segments.getSegments().length}`,
        editable: true,
      });
    }
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

      {audioSource.samples.length > 0 && <SamplesList samples={audioSource.samples} />}
    </ControlContainer>
  );
}

export default SamplesEditor;
