import type { Metadata } from 'next'
import { Wisc5CalculadoraPublicaClient } from './Wisc5CalculadoraPublicaClient'

export const metadata: Metadata = {
  title: 'Calculadora WISC‑V Gratuita | AQN Praxis',
  description: 'Calcula puntajes escalares, índices y CIT del WISC‑V en tiempo real. Gratis, sin registro.',
}

export default function Wisc5CalculadoraPublicaPage() {
  return <Wisc5CalculadoraPublicaClient />
}