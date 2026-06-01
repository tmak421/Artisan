'use client'
import dynamic from 'next/dynamic'

const RegulatoryIntelligencePlatform = dynamic(
  () => import('../../components/RegulatoryIntelligencePlatform'),
  { ssr: false }
)

export default function PlatformPage() {
  return <RegulatoryIntelligencePlatform />
}
