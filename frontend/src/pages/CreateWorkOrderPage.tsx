import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { createWorkOrder } from '../services/workOrdersService';
import { listDepots } from '../services/depotsService';
import { parseError } from '../utils/errorUtils';
import type { Depot } from '../types/depot';
import type { Vehicle } from '../types/vehicle';
import type { User } from '../types/auth';
import { apiClient } from '../services/apiClient';
import styles from './CreateWorkOrderPage.module.css';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface FormErrors {
  vehicle_id?: string;
  depot_id?: string;
  description?: string;
}

interface Technician {
  id: string;
  full_name: string;
}

const CreateWorkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Pre-populate vehicle if arriving from /vehicles/:id
  const preselectedVehicleId = searchParams.get('vehicle_id') ?? '';

  // Form state
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId);
  const [depotId, setDepotId] = useState(user?.depot_id ?? '');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Supporting data
  const [depots, setDepots] = useState<Depot[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [depotsLoading, setDepotsLoading] = useState(true);
  const [techsLoading, setTechsLoading] = useState(true);

  const { vehicles, loading: vehiclesLoading } = useVehicles({ status: 'active', page: 1, page_size: 200 });

  // Derived summary values
  const selectedVehicle: Vehicle | undefined = vehicles.find((v) => v.id === vehicleId);
  const selectedDepot: Depot | undefined = depots.find((d) => d.id === depotId);
  const selectedTech: Technician | undefined = technicians.find((t) => t.id === assignedTechnicianId);

  const optionsLoading = vehiclesLoading || depotsLoading || techsLoading;

  // Fetch depots
  useEffect(() => {
    let cancelled = false;
    setDepotsLoading(true);
    listDepots({ page: 1, pageSize: 200 })
      .then((res) => {
        if (!cancelled) {
          setDepots(res.data);
          // Set default depot to user's depot if not already set
          if (!depotId && res.data.length > 0) {
            const userDepot = user?.depot_id
              ? res.data.find((d) => d.id === user.depot_id)
              : undefined;
            setDepotId(userDepot?.id ?? res.data[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setOptionsError('Could not load form options. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setDepotsLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch technicians (users with role=technician)
  useEffect(() => {
    let cancelled = false;
    setTechsLoading(true);
    // Use apiClient directly — no dedicated service function for user listing by role
    apiClient
      .get<{ data: User[] }>('/users', { params: { role: 'technician', page: 1, page_size: 200 } })
      .then((res) => {
        if (!cancelled) {
          setTechnicians(
            (res.data.data ?? []).map((u) => ({ id: u.id, full_name: u.full_name }))
          );
        }
      })
      .catch(() => {
        // Technicians not critical; don't block the form
        if (!cancelled) setTechnicians([]);
      })
      .finally(() => {
        if (!cancelled) setTechsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const isManagerOrAdmin =
    user?.role === 'administrator' || user?.role === 'manager';

  const validate = useCallback((): FormErrors => {
    const errors: FormErrors = {};
    if (!vehicleId) {
      errors.vehicle_id = 'Vehicle ID must be a valid UUID.';
    } else if (!UUID_RE.test(vehicleId)) {
      errors.vehicle_id = 'Vehicle ID must be a valid UUID.';
    }
    if (!depotId) {
      errors.depot_id = 'Depot ID must be a valid UUID.';
    } else if (!UUID_RE.test(depotId)) {
      errors.depot_id = 'Depot ID must be a valid UUID.';
    }
    return errors;
  }, [vehicleId, depotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      const body: { vehicle_id: string; depot_id: string; description?: string } = {
        vehicle_id: vehicleId,
        depot_id: depotId,
      };
      if (description.trim()) {
        body.description = description.trim();
      }
      const workOrder = await createWorkOrder(body);
      navigate(`/work-orders/${workOrder.id}`, {
        state: { toast: { message: 'Work order created.', type: 'success' } },
      });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setSubmitError(parsed.message ?? 'Work order could not be created. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !submitting && !optionsLoading;

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        fontFamily: 'var(--font-family-base)',
        color: 'var(--color-on-surface)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-h1)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-2)',
          lineHeight: 'var(--font-line-height-h1)',
        }}
      >
        Create Work Order
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-small)',
          color: 'var(--color-muted)',
          marginBottom: 'var(--space-6)',
          lineHeight: 'var(--font-line-height-small)',
        }}
      >
        Raise a new maintenance work order and assign it to a depot technician.
      </p>

      {/* Options load error banner */}
      {optionsError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-body)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Could not load form options. Please try again.</span>
        </div>
      )}

      {/* Submit error banner */}
      {submitError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-5)',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-body)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Work order could not be created. Please try again.</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-6)',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Main form card */}
        <div
          style={{
            flex: '1 1 0',
            minWidth: '0',
            padding: 'var(--space-6)',
            boxShadow: 'var(--elevation-2)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

              {/* Section: Vehicle */}
              <div style={{ color: 'var(--color-on-surface)' }}>
                <p
                  style={{
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  Vehicle
                </p>
                <div style={{ marginBottom: 0, color: 'var(--color-on-surface)' }}>
                  <label
                    htmlFor="create-work-order-vehicle_id"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Vehicle{' '}
                    <span style={{ color: 'var(--color-error)' }} aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="create-work-order-vehicle_id"
                    name="vehicle_id"
                    value={vehicleId}
                    onChange={(e) => {
                      setVehicleId(e.target.value);
                      if (formErrors.vehicle_id) {
                        setFormErrors((prev) => ({ ...prev, vehicle_id: undefined }));
                      }
                    }}
                    disabled={vehiclesLoading || !!optionsError}
                    aria-invalid={!!formErrors.vehicle_id}
                    aria-describedby={formErrors.vehicle_id ? 'vehicle-error' : 'vehicle-hint'}
                    style={{
                      width: '100%',
                      background: 'var(--color-canvas)',
                      color: vehicleId ? 'var(--color-ink)' : 'var(--color-muted)',
                      border: formErrors.vehicle_id
                        ? '1px solid var(--color-error)'
                        : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-2) var(--space-3)',
                      fontSize: 'var(--font-size-body)',
                      height: 'var(--touch-target-min)',
                      fontFamily: 'var(--font-family-base)',
                      cursor: vehiclesLoading ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    {vehiclesLoading ? (
                      <option value="" disabled>
                        Loading options…
                      </option>
                    ) : (
                      <>
                        <option value="" disabled style={{ color: 'var(--color-muted)' }}>
                          Select a vehicle…
                        </option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id} style={{ color: 'var(--color-ink)' }}>
                            {v.registration_number} — {v.make} {v.model}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {formErrors.vehicle_id ? (
                    <p
                      id="vehicle-error"
                      role="alert"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      {formErrors.vehicle_id}
                    </p>
                  ) : (
                    <p
                      id="vehicle-hint"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-muted)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      Select the vehicle requiring maintenance. Registration and model are shown for clarity.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

              {/* Section: Depot */}
              <div style={{ color: 'var(--color-on-surface)' }}>
                <p
                  style={{
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  Depot
                </p>
                <div style={{ marginBottom: 0, color: 'var(--color-on-surface)' }}>
                  <label
                    htmlFor="create-work-order-depot_id"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Depot{' '}
                    <span style={{ color: 'var(--color-error)' }} aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="create-work-order-depot_id"
                    name="depot_id"
                    value={depotId}
                    onChange={(e) => {
                      setDepotId(e.target.value);
                      if (formErrors.depot_id) {
                        setFormErrors((prev) => ({ ...prev, depot_id: undefined }));
                      }
                    }}
                    disabled={depotsLoading || !!optionsError}
                    aria-invalid={!!formErrors.depot_id}
                    aria-describedby={formErrors.depot_id ? 'depot-error' : 'depot-hint'}
                    style={{
                      width: '100%',
                      background: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                      border: formErrors.depot_id
                        ? '1px solid var(--color-error)'
                        : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-2) var(--space-3)',
                      fontSize: 'var(--font-size-body)',
                      height: 'var(--touch-target-min)',
                      fontFamily: 'var(--font-family-base)',
                      cursor: depotsLoading ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    {depotsLoading ? (
                      <option value="" disabled>
                        Loading options…
                      </option>
                    ) : (
                      depots.map((d) => (
                        <option key={d.id} value={d.id} style={{ color: 'var(--color-ink)' }}>
                          {d.name}{d.address ? ` — ${d.address}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.depot_id ? (
                    <p
                      id="depot-error"
                      role="alert"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      {formErrors.depot_id}
                    </p>
                  ) : (
                    <p
                      id="depot-hint"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-muted)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      Pre-set to your current depot. Change if the work is being carried out elsewhere.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

              {/* Section: Technician Assignment */}
              <div style={{ color: 'var(--color-on-surface)' }}>
                <p
                  style={{
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  Technician Assignment
                </p>
                <div style={{ marginBottom: 0, color: 'var(--color-on-surface)' }}>
                  <label
                    htmlFor="create-work-order-assigned_technician_id"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    Assign technician
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: 'var(--space-1) var(--space-2)',
                        fontSize: 'var(--font-size-caption)',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-info-light)',
                        color: 'var(--color-on-info)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      Manager / Admin only
                    </span>
                  </label>
                  <select
                    id="create-work-order-assigned_technician_id"
                    name="assigned_technician_id"
                    value={assignedTechnicianId}
                    onChange={(e) => setAssignedTechnicianId(e.target.value)}
                    disabled={!isManagerOrAdmin || techsLoading || !!optionsError}
                    style={{
                      width: '100%',
                      background: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-2) var(--space-3)',
                      fontSize: 'var(--font-size-body)',
                      height: 'var(--touch-target-min)',
                      fontFamily: 'var(--font-family-base)',
                      cursor:
                        !isManagerOrAdmin || techsLoading ? 'not-allowed' : 'pointer',
                      opacity: !isManagerOrAdmin ? 0.6 : 1,
                      boxSizing: 'border-box',
                    }}
                  >
                    {techsLoading ? (
                      <option value="" disabled>
                        Loading options…
                      </option>
                    ) : (
                      <>
                        <option value="" style={{ color: 'var(--color-ink)' }}>
                          Unassigned — assign later
                        </option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id} style={{ color: 'var(--color-ink)' }}>
                            {t.full_name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Only depot technicians are listed. You can assign or reassign after creation.
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

              {/* Section: Description */}
              <div style={{ color: 'var(--color-on-surface)' }}>
                <p
                  style={{
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  Work Description
                </p>
                <div style={{ marginBottom: 0, color: 'var(--color-on-surface)' }}>
                  <label
                    htmlFor="create-work-order-description"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Description{' '}
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="create-work-order-description"
                    name="description"
                    rows={5}
                    placeholder="Describe the fault, symptoms, or maintenance task — e.g. 'Offside front brake pad worn below 3mm. Replacement and disc inspection required.'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      background: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-3)',
                      fontSize: 'var(--font-size-body)',
                      fontFamily: 'var(--font-family-base)',
                      lineHeight: 'var(--font-line-height-body)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Be specific about symptoms and location on the vehicle. This is visible to the assigned technician.
                  </p>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-7)',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/work-orders')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-muted)',
                  fontSize: 'var(--font-size-body)',
                  fontFamily: 'var(--font-family-base)',
                  cursor: 'pointer',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  background: canSubmit ? 'var(--color-primary)' : 'var(--color-disabled)',
                  color: 'var(--color-on-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontSize: 'var(--font-size-body)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: 'var(--font-family-base)',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                {submitting ? 'Raising work order…' : 'Raise work order'}
              </button>
            </div>
          </form>
        </div>

        {/* Right sidebar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            width: '280px',
            flexShrink: 0,
          }}
        >
          {/* Order summary card */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-surface-raised)',
              color: 'var(--color-on-surface-raised)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-ink)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Order summary
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {/* Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Status
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-warning-light)',
                    color: 'var(--color-ink)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Open
                </span>
              </div>

              {/* Vehicle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Vehicle
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-ink)',
                    fontWeight: 'var(--font-weight-medium)',
                    textAlign: 'right',
                    maxWidth: '160px',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedVehicle
                    ? `${selectedVehicle.registration_number} — ${selectedVehicle.make} ${selectedVehicle.model}`
                    : 'Not selected'}
                </span>
              </div>

              {/* Depot */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Depot
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-ink)',
                    fontWeight: 'var(--font-weight-medium)',
                    textAlign: 'right',
                    maxWidth: '160px',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedDepot ? selectedDepot.name : '—'}
                </span>
              </div>

              {/* Technician */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Technician
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-ink)',
                    fontWeight: 'var(--font-weight-medium)',
                    textAlign: 'right',
                    maxWidth: '160px',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedTech ? selectedTech.full_name : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Guidance card */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-info-light)',
              color: 'var(--color-on-info)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--color-info)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-ink)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Tips for a good work order
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 'var(--space-4)',
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-ink)',
                lineHeight: 'var(--font-line-height-body)',
              }}
            >
              <li style={{ marginBottom: 'var(--space-1)', color: 'var(--color-ink)' }}>
                Select the exact vehicle registration to avoid routing to the wrong bay.
              </li>
              <li style={{ marginBottom: 'var(--space-1)', color: 'var(--color-ink)' }}>
                Describe the fault precisely — include location, severity, and any driver report reference.
              </li>
              <li style={{ marginBottom: 'var(--space-1)', color: 'var(--color-ink)' }}>
                Assign a technician now if availability is confirmed, or leave blank and assign later.
              </li>
              <li style={{ color: 'var(--color-ink)' }}>
                You can edit the description and assignment after creation from the work order detail view.
              </li>
            </ul>
          </div>

          {/* Quick link */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
                marginBottom: 'var(--space-2)',
              }}
            >
              View all existing work orders
            </p>
            <button
              type="button"
              onClick={() => navigate('/work-orders')}
              style={{
                width: '100%',
                fontSize: 'var(--font-size-small)',
                background: 'var(--color-secondary)',
                color: 'var(--color-on-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3) var(--space-4)',
                fontFamily: 'var(--font-family-base)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              Work order list →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkOrderPage;
