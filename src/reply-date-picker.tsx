import React from "react";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { dateValue, localDate, validDate } from "./reply-dates";

// Metro selects the native module on iOS/Android. Keep browser exports usable.
export default function DatePicker(props: {
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: string;
  display?: string;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
}) {
  return React.createElement("input", {
    type: "date",
    "aria-label": "Calendar date",
    value: dateValue(props.value),
    min: props.minimumDate ? dateValue(props.minimumDate) : undefined,
    max: props.maximumDate ? dateValue(props.maximumDate) : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      if (validDate(event.target.value)) {
        const date = localDate(event.target.value);
        props.onChange?.(
          {
            type: "set",
            nativeEvent: {
              timestamp: date.getTime(),
              utcOffset: -date.getTimezoneOffset(),
            },
          },
          date,
        );
      }
    },
    style: { minHeight: 44, padding: 12, fontSize: 16 },
  });
}
