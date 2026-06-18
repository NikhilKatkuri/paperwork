"use client";

import { useEffect, useRef, useState } from "react";

function OTPInput() {
  const length = 6;
  const [otpValues, setOtpValues] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    inputRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const handleChange = (index: number, value: string) => {
    const digit = value.slice(-1);

    const newOtpValues = [...otpValues];
    newOtpValues[index] = digit;
    setOtpValues(newOtpValues);

    if (digit && index < length - 1) {
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        setActiveIndex(index - 1);

        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {otpValues.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="border border-gray-300 rounded-md p-3 h-12 w-12 text-center text-lg font-semibold aspect-square focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ))}
    </div>
  );
}

export default OTPInput;
