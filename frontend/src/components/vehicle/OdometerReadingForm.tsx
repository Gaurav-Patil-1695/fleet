import React, { useState } from 'react';
import { ReadingCreate } from '../../types/reading';
import { createReading } from '../../services/readingsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../ui/Alert';
import styles from './OdometerReadingForm.module.css';

interface OdometerReadingFormProps {
  vehicleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormValues {
  odometer_km: string;
  source: 'manual' | 'telematics';
  reading_timestamp: string;
  is_test_mode: boolean;
}

interface FormErrors {
  odometer_km?: string;
  source?: string;
  reading_timestamp?: string;
  is_test_mode?: string;
  form?: string;
}

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}

function validate(values: FormValues, vehicleId: string): FormErrors {
  const errors: FormErrors = {};

  if (!vehicleId || !UUID_PATTERN.test(vehicleId)) {
    errors.form = 'Vehicle ID must be a valid UUID.';
  }

  const odoNum = parseFloat(values.odometer_km);
  if (values.odometer_km.trim() === '' || isNaN(odoNum) || odoNum < 0) {
    errors.odometer_km = 'Odometer reading is required and must be a non-negative number.';
  }

  if (!values.source || (values.source !== 'manual' && values.source !== 'telematics')) {
    errors.source = "Source must be either 'manual' or 'telematics'.";
  }

  if (!values.reading_timestamp || values.reading_timestamp.trim() === '') {
    errors.reading_timestamp = 'Reading timestamp is required and must be a valid date-time value.';
  } else {
    const d = new Date(values.reading_timestamp);
    if (isNaN(d.getTime())) {
      errors.reading_timestamp = 'Reading timestamp is required and must be a valid date-time value.';
    }
  }

  return errors;
}

const OdometerReadingForm: React.FC<OdometerReadingFormProps> = ({
  vehicleId,
  onSuccess,
  onCancel,
}) => {
  const [values, setValues] = useState<FormValues>({
    odometer_km: '',
    source: 'manual',
    reading_timestamp: toLocalDateTimeValue(new Date()),
    is_test_mode: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const name = target.name;
    const value =
      target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const validationErrors = validate(values, vehicleId);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payload: ReadingCreate = {
        vehicle_id: vehicleId,
        odometer_km: parseFloat(values.odometer_km),
        source: values.source,
        reading_timestamp: new Date(values.reading_timestamp).toISOString(),
        is_test_mode: values.is_test_mode,
      };

      await createReading(payload);
      setSuccessMessage('Odometer reading submitted successfully.');
      setValues({
        odometer_km: '',
        source: 'manual',
        reading_timestamp: toLocalDateTimeValue(new Date()),
        is_test_mode: false,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formTitle}>Submit Odometer Reading</div>

      {errors.form && (
        <Alert variant="error" className={styles.formAlert}>
          {errors.form}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className={styles.formAlert}>
          {successMessage}
        </Alert>
      )}

      <div className={styles.field}>
        <label htmlFor="odometer_km" className={styles.label}>
          Odometer Reading (km)
          <span className={styles.required} aria-hidden="true"> *</span>
        </label>
        <Input
          id="odometer_km"
          name="odometer_km"
          type="number"
          min={0}
          step="any"
          value={values.odometer_km}
          onChange={handleChange}
          placeholder="e.g. 125000"
          aria-describedby={errors.odometer_km ? 'odometer_km-error' : undefined}
          aria-invalid={!!errors.odometer_km}
          disabled={submitting}
        />
        {errors.odometer_km && (
          <span id="odometer_km-error" className={styles.errorText} role="alert">
            {errors.odometer_km}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="source" className={styles.label}>
          Source
          <span className={styles.required} aria-hidden="true"> *</span>
        </label>
        <Select
          id="source"
          name="source"
          value={values.source}
          onChange={handleChange}
          aria-describedby={errors.source ? 'source-error' : undefined}
          aria-invalid={!!errors.source}
          disabled={submitting}
        >
          <option value="manual">Manual</option>
          <option value="telematics">Telematics</option>
        </Select>
        {errors.source && (
          <span id="source-error" className={styles.errorText} role="alert">
            {errors.source}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="reading_timestamp" className={styles.label}>
          Reading Timestamp
          <span className={styles.required} aria-hidden="true"> *</span>
        </label>
        <Input
          id="reading_timestamp"
          name="reading_timestamp"
          type="datetime-local"
          value={values.reading_timestamp}
          onChange={handleChange}
          aria-describedby={errors.reading_timestamp ? 'reading_timestamp-error' : undefined}
          aria-invalid={!!errors.reading_timestamp}
          disabled={submitting}
        />
        {errors.reading_timestamp && (
          <span id="reading_timestamp-error" className={styles.errorText} role="alert">
            {errors.reading_timestamp}
          </span>
        )}
      </div>

      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_test_mode"
            checked={values.is_test_mode}
            onChange={handleChange}
            disabled={submitting}
            className={styles.checkbox}
          />
          <span>Test mode</span>
        </label>
        {errors.is_test_mode && (
          <span className={styles.errorText} role="alert">
            {errors.is_test_mode}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={submitting}
          disabled={submitting}
        >
          Submit Reading
        </Button>
      </div>
    </form>
  );
};

export default OdometerReadingForm;
