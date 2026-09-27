import { useEffect, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DRAFT_DELAY_MS = 200
const LOOKUP_DELAY_MS = 700

interface PlaceNameFieldsProps {
  city: string
  country: string
  active: boolean
  onActivity: () => void
  onDraft: (city: string, country: string) => void
  onLookup: (city: string, country: string) => void
}

export function PlaceNameFields({
  city,
  country,
  active,
  onActivity,
  onDraft,
  onLookup,
}: PlaceNameFieldsProps) {
  const [localCity, setLocalCity] = useState(city)
  const [localCountry, setLocalCountry] = useState(country)
  const echoed = useRef({ city, country })
  const onActivityRef = useRef(onActivity)
  const onDraftRef = useRef(onDraft)
  const onLookupRef = useRef(onLookup)
  onActivityRef.current = onActivity
  onDraftRef.current = onDraft
  onLookupRef.current = onLookup

  useEffect(() => {
    if (city === echoed.current.city && country === echoed.current.country) {
      return
    }
    echoed.current = { city, country }
    setLocalCity(city)
    setLocalCountry(country)
  }, [city, country])

  useEffect(() => {
    if (!active) {
      onActivityRef.current()
      return
    }

    const draftTimer = window.setTimeout(() => {
      if (localCity === echoed.current.city && localCountry === echoed.current.country) {
        return
      }
      echoed.current = { city: localCity, country: localCountry }
      onDraftRef.current(localCity, localCountry)
    }, DRAFT_DELAY_MS)

    const lookupTimer = window.setTimeout(() => {
      onLookupRef.current(localCity, localCountry)
    }, LOOKUP_DELAY_MS)

    return () => {
      window.clearTimeout(draftTimer)
      window.clearTimeout(lookupTimer)
    }
  }, [active, localCity, localCountry])

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={localCity}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setLocalCity(event.target.value)
            onActivityRef.current()
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={localCountry}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setLocalCountry(event.target.value)
            onActivityRef.current()
          }}
        />
      </div>
    </>
  )
}
