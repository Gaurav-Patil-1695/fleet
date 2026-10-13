import React, { useState } from 'react';
import type { WorkOrder } from '../../types/workOrder';
import type { WorkOrderClose } from '../../types/workOrder';
import { closeWorkOrder } from '../../services/workOrdersService';
import { extractErrorMessage } from '../../utils/errorUtils';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import styles from './CloseWorkOrderForm.module.css';

interface CloseWorkOrderFormProps {
  workOrderId: string;
  onSuccess: (workOrder: WorkOrder) => void;
  onCancel?: () => void;
}

interface FormValues {
  completion_notes: string;
  post_service_odometer_km: string;
}

interface FormErrors {
  completion_notes?: string;
  post_service_odometer_km?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.completion_notes || values.completion_notes.trim() === '') {
    errors.completion_notes = 'Completion notes are required to close a work order.';
  }

  const km = parseFloat(values.post_service_odometer_km);
  if (
    values.post_service_odometer_km === '' ||
    isNaN(km) ||
    km < 0
  ) {
    errors.post_service_odometer_km =
      'Post-service odometer reading is required and must be a non-negative number.';
  }

  return errors;
}

const CloseWorkOrderForm: React.FC<CloseWorkOrderFormProps> = ({
  workOrderId,
  onSuccess,
  onCancel,
}) => {
  const [values, setValues] = useState<FormValues>({
    completion_notes: '',
    post_service_odometer_km: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: WorkOrderClose = {
      completion_notes: values.completion_notes.trim(),
      post_service_odometer_km: parseFloat(values.post_service_odometer_km),
    };

    setIsSubmitting(true);
    try {
      const result = await closeWorkOrder(workOrderId, payload);
      onSuccess(result);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>Close Work Order</h2>
      <p className={styles.description}>
        Please provide completion details before closing this work order.
      </p>

      {submitError && (
        <Alert variant="error" className={styles.alert}>
          {submitError}
        </Alert>
      )}

      <div className={styles.field}>
        <label htmlFor="completion_notes" className={styles.label}>
          Completion Notes <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <Textarea
          id="completion_notes"
          name="completion_notes"
          value={values.completion_notes}
          onChange={handleChange}
          placeholder="Describe the work completed..."
          rows={4}
          disabled={isSubmitting}
          aria-required="true"
          aria-describedby={
            errors.completion_notes ? 'completion_notes-error' : undefined
          }
          className={errors.completion_notes ? styles.inputError : undefined}
        />
        {errors.completion_notes && (
          <span
            id="completion_notes-error"
            className={styles.errorText}
            role="alert"
          >
            {errors.completion_notes}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="post_service_odometer_km" className={styles.label}>
          Post-Service Odometer (km){' '}
          <span className={styles.required} aria-hidden="true">*</span>
        </label>
        <Input
          id="post_service_odometer_km"
          name="post_service_odometer_km"
          type="number"
          min={0}
          step="any"
          value={values.post_service_odometer_km}
          onChange={handleChange}
          placeholder="e.g. 123456"
          disabled={isSubmitting}
          aria-required="true"
          aria-describedby={
            errors.post_service_odometer_km
              ? 'post_service_odometer_km-error'
              : undefined
          }
          className={errors.post_service_odometer_km ? styles.inputError : undefined}
        />
        {errors.post_service_odometer_km && (
          <span
            id="post_service_odometer_km-error"
            className={styles.errorText}
            role="alert"
          >
            {errors.post_service_odometer_km}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Close Work Order
        </Button>
      </div>
    </form>
  );
};

export default CloseWorkOrderForm;
