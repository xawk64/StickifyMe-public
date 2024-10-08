import React, { useState } from "react";
import {
  DateRangePicker as DateRangePickerLibrary,
  DateValue,
  RangeValue,
} from "@nextui-org/react";

interface IComponentProps {
  initValue: RangeValue<DateValue> | null;
  onChange: (value: RangeValue<DateValue>) => void;
  minValue: DateValue;
  maxValue: DateValue;
}

const DateRangePicker: React.FC<IComponentProps> = ({
  initValue,
  onChange,
  minValue,
  maxValue,
}) => {
  const [value, setValue] = useState<RangeValue<DateValue> | null>(initValue);

  const handleChange = (value: RangeValue<DateValue>) => {
    setValue(value);

    onChange(value);
  };

  return (
    <DateRangePickerLibrary
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      labelPlacement="outside-left"
      onChange={handleChange}
    />
  );
};

export default DateRangePicker;
