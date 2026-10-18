'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import { createPatient } from '@/src/lib/repositories/patients.repository'
import type { Patient, Sex, Species } from '@/src/types/domain'

const speciesOptions: { value: Species; label: string }[] = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'bird', label: 'Bird' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'other', label: 'Other' },
]

const sexOptions: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
]

type PatientFormValues = {
  name: string
  ownerId: string
  species: string
  breed: string
  sex: string
  neutered: string
  dateOfBirth: string
  weightKg: string
  color: string
  microchipNumber: string
  residence: string
}

type PatientFormField = keyof PatientFormValues

const initialValues: PatientFormValues = {
  name: '', ownerId: '', species: '', breed: '', sex: '', neutered: '',
  dateOfBirth: '', weightKg: '', color: '', microchipNumber: '', residence: '',
}

const inputClassName = 'mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'

function calculateAge(dateOfBirth: string, today: Date): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`)
  let age = today.getFullYear() - birthDate.getFullYear()
  const beforeBirthday = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  if (beforeBirthday) age -= 1
  return age
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export default function PatientCreatePage() {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<Record<PatientFormField, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [submissionError, setSubmissionError] = useState('')

  const updateValue = (field: PatientFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmissionError('')
  }

  const validate = (): Partial<Record<PatientFormField, string>> => {
    const nextErrors: Partial<Record<PatientFormField, string>> = {}
    const requiredFields: PatientFormField[] = ['name', 'ownerId', 'species', 'breed', 'sex', 'neutered', 'dateOfBirth', 'weightKg', 'color', 'residence']

    for (const field of requiredFields) {
      if (!values[field].trim()) nextErrors[field] = 'This field is required.'
    }

    if (values.ownerId && !codaMockData.owners.some((owner) => owner.id === values.ownerId)) {
      nextErrors.ownerId = 'Select a valid owner.'
    }
    if (values.species && !speciesOptions.some((option) => option.value === values.species)) {
      nextErrors.species = 'Select a valid species.'
    }
    if (values.sex && !sexOptions.some((option) => option.value === values.sex)) {
      nextErrors.sex = 'Select a valid sex.'
    }
    if (values.neutered && values.neutered !== 'yes' && values.neutered !== 'no') {
      nextErrors.neutered = 'Select Yes or No.'
    }
    if (values.dateOfBirth) {
      const birthDate = new Date(`${values.dateOfBirth}T00:00:00`)
      if (!isValidDateOnly(values.dateOfBirth)) nextErrors.dateOfBirth = 'Enter a valid date.'
      else if (birthDate > new Date(new Date().toDateString())) nextErrors.dateOfBirth = 'Date of birth cannot be in the future.'
    }
    if (values.weightKg) {
      const weight = Number(values.weightKg)
      if (!Number.isFinite(weight) || weight <= 0) nextErrors.weightKg = 'Enter a weight greater than 0 kg.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage('')
    setSubmissionError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const ownerExists = codaMockData.owners.some((owner) => owner.id === values.ownerId)
    const species = speciesOptions.find((option) => option.value === values.species)?.value
    const sex = sexOptions.find((option) => option.value === values.sex)?.value
    if (!ownerExists || !species || !sex) return

    setIsSubmitting(true)
    try {
      const today = new Date()
      const patient: Patient = {
        id: `pet_${crypto.randomUUID()}`,
        clinicId: codaMockData.clinic.id,
        ownerId: values.ownerId,
        name: values.name.trim(),
        species,
        breed: values.breed.trim(),
        sex,
        neutered: values.neutered === 'yes',
        dateOfBirth: values.dateOfBirth,
        ageYears: calculateAge(values.dateOfBirth, today),
        weightKg: Number(values.weightKg),
        color: values.color.trim(),
        microchipNumber: values.microchipNumber.trim() || null,
        residence: values.residence.trim(),
        status: 'active',
        lastVisit: '',
        nextAppointment: null,
        avatar: '/placeholder-user.jpg',
        allergies: [],
        conditions: [],
        notes: '',
        vaccinations: [],
      }

      await createPatient(patient)
      setSuccessMessage('Patient saved successfully. Returning to Patients...')
      window.setTimeout(() => router.push('/patients'), 700)
    } catch {
      setSubmissionError('The patient could not be saved. Check your browser storage and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldError = (field: PatientFormField) => errors[field]

  return (
    <div className="content inner-page">
      <div className="page-heading">
        <div>
          <h1>New Patient</h1>
          <p>Enter the patient and owner information to add a clinic record.</p>
        </div>
        <Link href="/patients" className="date-button text-inherit no-underline"><ArrowLeft size={18} /> Cancel</Link>
      </div>

      <form className="panel p-6 md:p-8" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {submissionError && <p className="mb-5 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300" role="alert">{submissionError}</p>}
        {successMessage && <p className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-300" role="status">{successMessage}</p>}

        <section aria-labelledby="patient-details-heading">
          <h2 id="patient-details-heading" className="mb-5 text-xl font-semibold text-white">Patient Information</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-200">Patient name *
              <input className={inputClassName} value={values.name} onChange={(event) => updateValue('name', event.target.value)} aria-invalid={Boolean(fieldError('name'))} aria-describedby={fieldError('name') ? 'name-error' : undefined} autoComplete="off" />
              {fieldError('name') && <span id="name-error" className="mt-1 block text-xs text-rose-300">{fieldError('name')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Owner *
              <select className={inputClassName} value={values.ownerId} onChange={(event) => updateValue('ownerId', event.target.value)} aria-invalid={Boolean(fieldError('ownerId'))} aria-describedby={fieldError('ownerId') ? 'owner-error' : undefined}>
                <option value="">Select an owner</option>
                {codaMockData.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.displayName}</option>)}
              </select>
              {fieldError('ownerId') && <span id="owner-error" className="mt-1 block text-xs text-rose-300">{fieldError('ownerId')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Species *
              <select className={inputClassName} value={values.species} onChange={(event) => updateValue('species', event.target.value)} aria-invalid={Boolean(fieldError('species'))} aria-describedby={fieldError('species') ? 'species-error' : undefined}>
                <option value="">Select a species</option>
                {speciesOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {fieldError('species') && <span id="species-error" className="mt-1 block text-xs text-rose-300">{fieldError('species')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Breed *
              <input className={inputClassName} value={values.breed} onChange={(event) => updateValue('breed', event.target.value)} aria-invalid={Boolean(fieldError('breed'))} aria-describedby={fieldError('breed') ? 'breed-error' : undefined} />
              {fieldError('breed') && <span id="breed-error" className="mt-1 block text-xs text-rose-300">{fieldError('breed')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Sex *
              <select className={inputClassName} value={values.sex} onChange={(event) => updateValue('sex', event.target.value)} aria-invalid={Boolean(fieldError('sex'))} aria-describedby={fieldError('sex') ? 'sex-error' : undefined}>
                <option value="">Select sex</option>
                {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {fieldError('sex') && <span id="sex-error" className="mt-1 block text-xs text-rose-300">{fieldError('sex')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Neutered *
              <select className={inputClassName} value={values.neutered} onChange={(event) => updateValue('neutered', event.target.value)} aria-invalid={Boolean(fieldError('neutered'))} aria-describedby={fieldError('neutered') ? 'neutered-error' : undefined}>
                <option value="">Select an option</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
              {fieldError('neutered') && <span id="neutered-error" className="mt-1 block text-xs text-rose-300">{fieldError('neutered')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Date of birth *
              <input className={inputClassName} type="date" max={new Date().toISOString().slice(0, 10)} value={values.dateOfBirth} onChange={(event) => updateValue('dateOfBirth', event.target.value)} aria-invalid={Boolean(fieldError('dateOfBirth'))} aria-describedby={fieldError('dateOfBirth') ? 'dateOfBirth-error' : undefined} />
              {fieldError('dateOfBirth') && <span id="dateOfBirth-error" className="mt-1 block text-xs text-rose-300">{fieldError('dateOfBirth')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Weight (kg) *
              <input className={inputClassName} type="number" min="0.01" step="0.01" value={values.weightKg} onChange={(event) => updateValue('weightKg', event.target.value)} aria-invalid={Boolean(fieldError('weightKg'))} aria-describedby={fieldError('weightKg') ? 'weightKg-error' : undefined} />
              {fieldError('weightKg') && <span id="weightKg-error" className="mt-1 block text-xs text-rose-300">{fieldError('weightKg')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Color *
              <input className={inputClassName} value={values.color} onChange={(event) => updateValue('color', event.target.value)} aria-invalid={Boolean(fieldError('color'))} aria-describedby={fieldError('color') ? 'color-error' : undefined} />
              {fieldError('color') && <span id="color-error" className="mt-1 block text-xs text-rose-300">{fieldError('color')}</span>}
            </label>
            <label className="text-sm font-medium text-slate-200">Microchip number <span className="font-normal text-slate-400">(optional)</span>
              <input className={inputClassName} value={values.microchipNumber} onChange={(event) => updateValue('microchipNumber', event.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-200 md:col-span-2">Residence *
              <input className={inputClassName} value={values.residence} onChange={(event) => updateValue('residence', event.target.value)} aria-invalid={Boolean(fieldError('residence'))} aria-describedby={fieldError('residence') ? 'residence-error' : undefined} />
              {fieldError('residence') && <span id="residence-error" className="mt-1 block text-xs text-rose-300">{fieldError('residence')}</span>}
            </label>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-700 pt-6">
          <Link href="/patients" className="date-button text-inherit no-underline">Cancel</Link>
          <button className="new-appointment disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
