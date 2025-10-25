
import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';

interface TextFilterProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  type?: 'text' | 'number' | 'datetime-local' | 'email' | 'password';
  inputProps?: any;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: any;
}

export const TextFilter: React.FC<TextFilterProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  inputProps = {},
  fullWidth = true,
  size = 'medium',
}) => (
  <TextField
    fullWidth={fullWidth}
    size={size}
    label={label}
    type={type}
    value={value || ''}
    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
    InputLabelProps={type === 'datetime-local' ? { shrink: true } : undefined}
    inputProps={inputProps}
  />
);

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  value,
  onChange,
  options,
  fullWidth = true,
  size = 'medium',
}) => (
  <FormControl fullWidth={fullWidth} size={size}>
    <InputLabel>{label}</InputLabel>
    <Select
      value={value}
      label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

interface MultiSelectFilterProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  value = [],
  onChange,
  options,
  fullWidth = true,
  size = 'medium',
}) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const newValue = event.target.value;
    onChange(typeof newValue === 'string' ? newValue.split(',') : newValue);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.length === 0 ? (
              <em>None</em>
            ) : (
              selected.map((val) => (
                <Chip 
                  key={val} 
                  label={options.find(opt => opt.value === val)?.label || val}
                  size="small" 
                />
              ))
            )}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

interface SwitchFilterProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SwitchFilter: React.FC<SwitchFilterProps> = ({
  label,
  checked = false,
  onChange,
}) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    }
    label={label}
  />
);