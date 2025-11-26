import React, { useEffect, useState } from 'react';
import { WebMidi, Output } from 'webmidi';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const MidiDeviceChooser: React.FC = () => {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enableWebMIDI = async () => {
      try {
        await WebMidi.enable();
        setOutputs(WebMidi.outputs);
      } catch (err) {
        console.error('Error enabling WebMIDI:', err);
        setError('WebMIDI is not supported or permission was denied.');
      }
    };

    enableWebMIDI();

    // Cleanup on unmount
    return () => {
      if (WebMidi.enabled) WebMidi.disable();
    };
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedId(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 250, my: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="midi-device-select-label">MIDI Output</InputLabel>
        <Select
          labelId="midi-device-select-label"
          value={selectedId}
          label="MIDI Output"
          onChange={handleChange}
          disabled={outputs.length === 0 || !!error}
        >
          {outputs.map((output) => (
            <MenuItem key={output.id} value={output.id}>
              {output.name || `Device ${output.id}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MidiDeviceChooser;