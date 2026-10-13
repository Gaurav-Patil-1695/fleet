import React, { useEffect, useState } from 'react';
import type { Schedule } from '../../types/schedule';
import type { VehicleType } from '../../types/vehicleType';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import styles from './ScheduleForm.module.css';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type VehicleClassOption = 'heavy_truck' | 'light_commercial' | 'other';

interface CreateFields {
  vehicle_type_id: string;
  vehicle_class: VehicleClassOption | '';
  km_interval: string;
  month_interval: string;
  is_active: boolean;
}

interface UpdateFields {
  km_interval: string;
  month_interval: string;
  is_active: boolean;
}

export interface ScheduleFormCreateProps {
  mode: 'create';
  vehicleTypes: VehicleType[];
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (data: {
    vehicle_type_id: string;
    vehicle_class: string;
    km_interval: number;
    month_interval: number;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
}

export interface ScheduleFormEditProps {
  mode: 'edit';
  schedule: Schedule;
  vehicleTypes?: VehicleType[];
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (data: {
    km_interval: number;
    month_interval: number;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
}

export type ScheduleFormProps = ScheduleFormCreateProps | ScheduleFormEditProps;

interface FormErrors {
  vehicle_type_id?: string;
  vehicle_class?: string;
  km_interval?: string;
  month_interval?: string;
  is_active?: string;
}

const VEHICLE_CLASS_OPTIONS: { value: VehicleClassOption; label: string }[] = [
  { value: 'heavy_truck', label: 'Heavy Truck' },
  { value: 'light_commercial', label: 'Light Commercial' },
  { value: 'other', label: 'Other' },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = (props) => {
  const { mode, isSubmitting, serverError, onSubmit, onCancel } = props;

  const [createFields, setCreateFields] = useState<CreateFields>({
    vehicle_type_id: '',
    vehicle_class: '',
    km_interval: '',
    month_interval: '',
    is_active: true,
  });

  const [updateFields, setUpdateFields] = useState<UpdateFields>({
    km_interval: '',
    month_interval: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit') {
      const { schedule } = props as ScheduleFormEditProps;
      setUpdateFields({
        km_interval: String(schedule.km_interval),
        month_interval: String(schedule.month_interval),
        is_active: schedule.is_active,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function validateCreate(fields: CreateFields): FormErrors {
    const errs: FormErrors = {};

    if (!fields.vehicle_type_id.trim()) {
      errs.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
    } else if (!UUID_PATTERN.test(fields.vehicle_type_id.trim())) {
      errs.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
    }

    if (!fields.vehicle_class) {
      errs.vehicle_class = 'Vehicle class is required and must not exceed 50 characters.';
    } else if (fields.vehicle_class.length > 50) {
      errs.vehicle_class = 'Vehicle class is required and must not exceed 50 characters.';
    }

    const km = parseInt(fields.km_interval, 10);
    if (!fields.km_interval.trim() || isNaN(km) || km < 1) {
      errs.km_interval = 'Kilometre interval is required and must be a positive whole number.';
    }

    const month = parseInt(fields.month_interval, 10);
    if (!fields.month_interval.trim() || isNaN(month) || month < 1) {
      errs.month_interval = 'Month interval is required and must be a positive whole number.';
    }

    return errs;
  }

  function validateUpdate(fields: UpdateFields): FormErrors {
    const errs: FormErrors = {};

    if (fields.km_interval.trim() !== '') {
      const km = parseInt(fields.km_interval, 10);
      if (isNaN(km) || km < 1) {
        errs.km_interval = 'Kilometre interval must be a positive whole number.';
      }
    }

    if (fields.month_interval.trim() !== '') {
      const month = parseInt(fields.month_interval, 10);
      if (isNaN(month) || month < 1) {
        errs.month_interval = 'Month interval must be a positive whole number.';
      }
    }

    return errs;
  }

  function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateCreate(createFields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    (onSubmit as ScheduleFormCreateProps['onSubmit'])({
      vehicle_type_id: createFields.vehicle_type_id.trim(),
      vehicle_class: createFields.vehicle_class as string,
      km_interval: parseInt(createFields.km_interval, 10),
      month_interval: parseInt(createFields.month_interval, 10),
      is_active: createFields.is_active,
    });
  }

  function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateUpdate(updateFields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: { km_interval?: number; month_interval?: number; is_active: boolean } = {
      is_active: updateFields.is_active,
    };

    if (updateFields.km_interval.trim() !== '') {
      payload.km_interval = parseInt(updateFields.km_interval, 10);
    }
    if (updateFields.month_interval.trim() !== '') {
      payload.month_interval = parseInt(updateFields.month_interval, 10);
    }

    (onSubmit as ScheduleFormEditProps['onSubmit'])({
      km_interval: parseInt(updateFields.km_interval, 10),
      month_interval: parseInt(updateFields.month_interval, 10),
      is_active: updateFields.is_active,
    });
  }

  if (mode === 'create') {
    const { vehicleTypes } = props as ScheduleFormCreateProps;
    const vehicleTypeOptions = vehicleTypes.map((vt) => ({
      value: vt.id,
      label: vt.name,
    }));

    return (
      <form
        className={styles.form}
        onSubmit={handleCreateSubmit}
        noValidate
        aria-label="Create schedule form"
      >
        <h2 className={styles.formTitle}>Create Schedule</h2>

        {serverError && (
          <Alert variant="error" className={styles.serverError}>
            {serverError}
          </Alert>
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vehicle_type_id">
            Vehicle Type <span className={styles.required}>*</span>
          </label>
          <Select
            id="vehicle_type_id"
            name="vehicle_type_id"
            value={createFields.vehicle_type_id}
            onChange={(e) => {
              setCreateFields((prev) => ({ ...prev, vehicle_type_id: e.target.value }));
              setErrors((prev) => ({ ...prev, vehicle_type_id: undefined }));
            }}
            options={[
              { value: '', label: 'Select vehicle type' },
              ...vehicleTypeOptions,
            ]}
            aria-describedby={errors.vehicle_type_id ? 'vehicle_type_id-error' : undefined}
            aria-invalid={!!errors.vehicle_type_id}
          />
          {errors.vehicle_type_id && (
            <span id="vehicle_type_id-error" className={styles.errorText} role="alert">
              {errors.vehicle_type_id}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="vehicle_class">
            Vehicle Class <span className={styles.required}>*</span>
          </label>
          <Select
            id="vehicle_class"
            name="vehicle_class"
            value={createFields.vehicle_class}
            onChange={(e) => {
              setCreateFields((prev) => ({
                ...prev,
                vehicle_class: e.target.value as VehicleClassOption | '',
              }));
              setErrors((prev) => ({ ...prev, vehicle_class: undefined }));
            }}
            options={[
              { value: '', label: 'Select vehicle class' },
              ...VEHICLE_CLASS_OPTIONS,
            ]}
            aria-describedby={errors.vehicle_class ? 'vehicle_class-error' : undefined}
            aria-invalid={!!errors.vehicle_class}
          />
          {errors.vehicle_class && (
            <span id="vehicle_class-error" className={styles.errorText} role="alert">
              {errors.vehicle_class}
            </span>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="km_interval">
              KM Interval <span className={styles.required}>*</span>
            </label>
            <Input
              id="km_interval"
              name="km_interval"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 12000"
              value={createFields.km_interval}
              onChange={(e) => {
                setCreateFields((prev) => ({ ...prev, km_interval: e.target.value }));
                setErrors((prev) => ({ ...prev, km_interval: undefined }));
              }}
              aria-describedby={errors.km_interval ? 'km_interval-error' : undefined}
              aria-invalid={!!errors.km_interval}
            />
            {errors.km_interval && (
              <span id="km_interval-error" className={styles.errorText} role="alert">
                {errors.km_interval}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="month_interval">
              Month Interval <span className={styles.required}>*</span>
            </label>
            <Input
              id="month_interval"
              name="month_interval"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 6"
              value={createFields.month_interval}
              onChange={(e) => {
                setCreateFields((prev) => ({ ...prev, month_interval: e.target.value }));
                setErrors((prev) => ({ ...prev, month_interval: undefined }));
              }}
              aria-describedby={errors.month_interval ? 'month_interval-error' : undefined}
              aria-invalid={!!errors.month_interval}
            />
            {errors.month_interval && (
              <span id="month_interval-error" className={styles.errorText} role="alert">
                {errors.month_interval}
              </span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.checkboxLabel} htmlFor="is_active">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              className={styles.checkbox}
              checked={createFields.is_active}
              onChange={(e) => {
                setCreateFields((prev) => ({ ...prev, is_active: e.target.checked }));
              }}
            />
            Active
          </label>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Schedule
          </Button>
        </div>
      </form>
    );
  }

  // Edit mode
  const editSchedule = (props as ScheduleFormEditProps).schedule;

  function formatVehicleClass(vc: string): string {
    switch (vc) {
      case 'heavy_truck': return 'Heavy Truck';
      case 'light_commercial': return 'Light Commercial';
      case 'other': return 'Other';
      default: return vc;
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleUpdateSubmit}
      noValidate
      aria-label="Edit schedule form"
    >
      <h2 className={styles.formTitle}>Edit Schedule</h2>

      {serverError && (
        <Alert variant="error" className={styles.serverError}>
          {serverError}
        </Alert>
      )}

      <div className={styles.readonlyGroup}>
        <span className={styles.readonlyLabel}>Vehicle Class</span>
        <span className={styles.readonlyValue}>
          {formatVehicleClass(editSchedule.vehicle_class)}
        </span>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="km_interval">
            KM Interval <span className={styles.required}>*</span>
          </label>
          <Input
            id="km_interval"
            name="km_interval"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 12000"
            value={updateFields.km_interval}
            onChange={(e) => {
              setUpdateFields((prev) => ({ ...prev, km_interval: e.target.value }));
              setErrors((prev) => ({ ...prev, km_interval: undefined }));
            }}
            aria-describedby={errors.km_interval ? 'km_interval-error' : undefined}
            aria-invalid={!!errors.km_interval}
          />
          {errors.km_interval && (
            <span id="km_interval-error" className={styles.errorText} role="alert">
              {errors.km_interval}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="month_interval">
            Month Interval <span className={styles.required}>*</span>
          </label>
          <Input
            id="month_interval"
            name="month_interval"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 6"
            value={updateFields.month_interval}
            onChange={(e) => {
              setUpdateFields((prev) => ({ ...prev, month_interval: e.target.value }));
              setErrors((prev) => ({ ...prev, month_interval: undefined }));
            }}
            aria-describedby={errors.month_interval ? 'month_interval-error' : undefined}
            aria-invalid={!!errors.month_interval}
          />
          {errors.month_interval && (
            <span id="month_interval-error" className={styles.errorText} role="alert">
              {errors.month_interval}
            </span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.checkboxLabel} htmlFor="is_active">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            className={styles.checkbox}
            checked={updateFields.is_active}
            onChange={(e) => {
              setUpdateFields((prev) => ({ ...prev, is_active: e.target.checked }));
            }}
          />
          Active
        </label>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ScheduleForm;
