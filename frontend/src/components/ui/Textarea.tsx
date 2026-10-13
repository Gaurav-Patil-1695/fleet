import React, { forwardRef } from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  {
    label,
    error,
    hint,
    id,
    className,
    containerClassName,
    disabled,
    rows = 4,
    ...rest
  },
  ref
) => {
  const textareaClasses = [
    styles.textarea,
    error ? styles['textarea--error'] : '',
    disabled ? styles['textarea--disabled'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClasses = [
    styles.field,
    containerClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const textareaId =
    id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={textareaId} className={styles.field__label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : hint
            ? `${textareaId}-hint`
            : undefined
        }
        {...rest}
      />
      {error && (
        <span
          id={`${textareaId}-error`}
          className={styles.field__error}
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${textareaId}-hint`} className={styles.field__hint}>
          {hint}
        </span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
