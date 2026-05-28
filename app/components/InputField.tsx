"use client";

import { useState } from "react";

interface InputFieldProps {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  labelAction?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function InputField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  labelAction,
  rightElement,
}: InputFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-sm">
        <label className="text-[9px] text-outline uppercase tracking-widest">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <span className="absolute left-xs top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xs pointer-events-none" style={{ fontSize: '20px' }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-surface-container-high border border-outline-variant rounded-lg pl-8 py-sm font-code-sm text-code-sm text-on-surface focus:border-primary-container outline-none transition-colors placeholder:text-outline ${
            rightElement ? "pr-10" : "pr-md"
          }`}
        />
        {rightElement && (
          <div className="absolute right-md top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xs" style={{ fontSize: '5px' }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  labelAction?: React.ReactNode;
}

export function PasswordField({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••••••",
  required,
  labelAction,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <InputField
      label={label}
      icon="lock"
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      labelAction={labelAction}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xs">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      }
    />
  );
}
