'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, FileText, MapPin, Plus, Search } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import type { Patient } from '@/src/types/domain'
import { getPatients, searchPatients } from '@/src/lib/repositories/patients.repository'

const ownerById = new Map(codaMockData.owners.map((owner) => [owner.id, owner]))

export default function PatientsPage() {
  const [query, setQuery] = useState('')
  const [directoryPatients, setDirectoryPatients] = useState<Patient[]>([])
  const [totalPatients, setTotalPatients] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    void getPatients()
      .then((result) => {
        if (!isCurrent) return
        setDirectoryPatients(result)
        setTotalPatients(result.length)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const handleSearch = async (value: string) => {
    setQuery(value)
    const matches = await searchPatients(value)
    setDirectoryPatients(matches)
  }

  return <div className="content inner-page"><div className="page-heading"><div><h1>Pet Patients</h1><p>Manage all clinic patients and their medical records.</p></div><div className="heading-actions"><div className="table-search"><Search size={20} /><input value={query} onChange={(event) => void handleSearch(event.target.value)} placeholder="Search patients..." aria-label="Search patients" /></div><button className="new-appointment"><Plus size={18} /> Add New Patient</button></div></div><section className="patient-directory"><div className="directory-head"><span>PET</span><span>BREED</span><span>OWNER</span><span>LAST VISIT</span><span>MEDICAL FILE</span><span>RESIDENCE</span></div>{isLoading ? <div className="patient-empty-state" role="status">Loading patients...</div> : directoryPatients.length > 0 ? directoryPatients.map(patient => { const owner = ownerById.get(patient.ownerId); return <div className="directory-row" key={patient.id}><div className="patient-cell"><img src={patient.avatar} alt={`${patient.name} pet`} onError={(event) => { event.currentTarget.src = '/placeholder-user.jpg' }} /><strong>{patient.name}</strong></div><span>{patient.breed}</span><span>{owner?.displayName ?? 'Clinic patient'}</span><span>{patient.lastVisit}</span><FileText className="file-icon" size={22} /><span className="muted-text">{patient.residence}</span></div> }) : <div className="patient-empty-state" role="status">{query.trim() ? 'No patients found.' : 'No patients available.'}</div>}<footer>Showing {directoryPatients.length} of {totalPatients} patients <div className="pagination"><button disabled><ChevronDown size={16} /></button><button className="current">1</button><button>2</button><button>3</button><button><ChevronDown size={16} /></button></div></footer></section><div className="patient-summary"><section><h2><CalendarDays size={23} /> Appointment Status</h2><div className="summary-cards"><div className="summary-card"><span>PENDING</span><strong>12</strong><b className="warning">! &nbsp; Requires clinic review</b></div><div className="summary-card"><span>APPROVED</span><strong>48</strong><b className="success">↗ &nbsp; +12% from last week</b></div></div></section><section><h2>Patient Residences</h2><div className="residence-card"><MapPin size={22} /><strong>Top region: Pennsylvania</strong></div></section></div></div>
}
