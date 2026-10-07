'use client'

import { useState } from 'react'
import axios from 'axios'

type Mode = 'inicial' | 'calculador' | 'optimizador'
const PROVINCIAS = ['Buenos Aires', 'Jujuy', 'Córdoba']

export default function NexEnergyApp() {
  const [mode, setMode] = useState<Mode>('inicial')
  const [provincia, setProvincia] = useState('')
  const [equipment, setEquipment] = useState<{ name: string; watts: number }[]>([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWatts, setEquipmentWatts] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [billAmount, setBillAmount] = useState('')
  const [tariff, setTariff] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [savingsPercent, setSavingsPercent] = useState('')
  const [savingsRecommendation, setSavingsRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addEquipment = () => {
    if (!equipmentName || !equipmentWatts) {
      setError('Por favor completa nombre y consumo')
      return
    }
    setEquipment([...equipment, { name: equipmentName, watts: parseInt(equipmentWatts) }])
    setEquipmentName('')
    setEquipmentWatts('')
    setError('')
  }

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  const getRecommendation = async () => {
    if (equipment.length === 0) {
      setError('Agrega al menos un equipo')
      return
    }
    setLoading(true)
    setError('')
    try {
      const totalConsumption = equipment.reduce((sum, eq) => sum + eq.watts, 0)
      const response = await axios.post('/api/recommend', { totalConsumption })
      setRecommendation(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al obtener recomendación')
    } finally {
      setLoading(false)
    }
  }

  const calculateSavings = async () => {
    if (!billAmount || !tariff || !dailyHours || !savingsPercent) {
      setError('Por favor completa todos los campos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const bill = parseFloat(billAmount)
      const tariffValue = parseFloat(tariff)
      const hours = parseFloat(dailyHours)
      const percent = parseFloat(savingsPercent) / 100
      const monthlyConsumption = bill / tariffValue
      const dailyConsumption = monthlyConsumption / 30
      const kWhToGenerate = dailyConsumption * percent * hours
      const wattsNeeded = (kWhToGenerate * 1000) / hours
      const response = await axios.post('/api/recommend', { totalConsumption: wattsNeeded })
      const monthlySavings = bill * percent
      const annualSavings = monthlySavings * 12
      const paybackMonths = Math.ceil((response.data.price ? parseFloat(response.data.price.replace(/[^0-9]/g, '')) : 500000) / monthlySavings)
      setSavingsRecommendation({
        ...response.data,
        currentBill: bill,
        tariffValue: tariffValue,
        savingsPercent: percent * 100,
        monthlySavings,
        annualSavings,
        paybackMonths
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al calcular ahorros')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'inicial') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <div>
              <p className="text-sm font-semibold text-teal-600 tracking-wider mb-2">HERRAMIENTA DIGITAL</p>
              <h1 className="text-5xl font-bold text-gray-900">Del consumo real<br />al equipo justo.</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">N</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">NexEnergy</p>
                <p className="text-xs text-gray-600">Soluciones Energéticas</p>
              </div>
            </div>
          </div>

          {/* Provincia Selector */}
          <div className="mb-12 max-w-md">
            <label className="block text-sm font-semibold text-gray-700 mb-2">¿De qué provincia sos?</label>
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600">
              <option value="">Selecciona tu provincia</option>
              {PROVINCIAS.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Steps */}
            <div>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="bg-white rounded-xl p-6 flex-grow">
                    <h3 className="font-bold text-gray-900 mb-1">Cargás tus artefactos</h3>
                    <p className="text-sm text-gray-600">Heladera, aire, iluminación, equipos de trabajo: lo que no puede quedarse sin energía.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="bg-white rounded-xl p-6 flex-grow">
                    <h3 className="font-bold text-gray-900 mb-1">Calculamos el consumo</h3>
                    <p className="text-sm text-gray-600">La herramienta suma la potencia y estima los kW que hay que respaldar.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="bg-white rounded-xl p-6 flex-grow">
                    <h3 className="font-bold text-gray-900 mb-1">Te recomendamos el equipo</h3>
                    <p className="text-sm text-gray-600">Sugiere la opción NexEnergy que mejor se ajusta a ese consumo.</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-8 space-y-3">
                <button onClick={() => { setMode('calculador'); setEquipment([]); setRecommendation(null); setError('') }} className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
                  ⚡ Cubrir mi consumo
                </button>
                <button onClick={() => { setMode('optimizador'); setSavingsRecommendation(null); setError('') }} className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition">
                  💰 Reducir mi factura
                </button>
              </div>
            </div>

            {/* Right: Calculator Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
              <p className="text-teal-400 text-xs font-semibold mb-6 tracking-widest">CALCULADORA DE CONSUMO</p>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 bg-teal-400 rounded-full"></span>Heladera</span>
                  <span className="font-semibold">150 W</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 bg-teal-400 rounded-full"></span>Aire acondicionado</span>
                  <span className="font-semibold">1.200 W</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 bg-teal-400 rounded-full"></span>Iluminación LED</span>
                  <span className="font-semibold">120 W</span>
                </div>
              </div>
              <div className="bg-teal-600 rounded-lg p-4 mb-4">
                <p className="text-teal-100 text-xs mb-1">Consumo estimado</p>
                <p className="text-3xl font-bold">1,47 kW</p>
              </div>
              <div className="bg-teal-500 rounded-lg p-4">
                <p className="text-teal-100 text-xs mb-1 tracking-widest">EQUIPO RECOMENDADO</p>
                <p className="font-semibold">NexEnergy [modelo según catálogo]</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'calculador') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setMode('inicial'); setEquipment([]); setRecommendation(null) }} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Volver al inicio</button>
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Calculador de Generador</h1>
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Agregar Equipos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nombre del equipo (ej: TV, Heladera)" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
              <input type="number" placeholder="Consumo (W)" value={equipmentWatts} onChange={(e) => setEquipmentWatts(e.target.value)} className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
            </div>
            <button onClick={addEquipment} className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition">+ Agregar Equipo</button>
          </div>
          {equipment.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Equipos Agregados</h2>
              <div className="space-y-2 mb-6">
                {equipment.map((eq, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <span className="font-semibold text-gray-800">{eq.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{eq.watts}W</span>
                      <button onClick={() => removeEquipment(idx)} className="text-red-600 hover:text-red-800 font-bold">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-teal-50 border-l-4 border-teal-600 p-4 mb-6">
                <p className="text-lg font-bold text-teal-900">Consumo Total: {totalWatts}W</p>
              </div>
              <button onClick={getRecommendation} disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:bg-gray-400">
                {loading ? '⏳ Buscando recomendación...' : '✓ Obtener Recomendación'}
              </button>
            </div>
          )}
          {recommendation && (
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-teal-600">
              <h2 className="text-3xl font-bold text-teal-900 mb-8">✅ Recomendación</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-teal-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Consumo solicitado</p>
                  <p className="text-2xl font-bold text-teal-900">{totalWatts}W</p>
                </div>
                <div className="bg-teal-600 text-white p-6 rounded-lg md:col-span-2">
                  <p className="text-teal-100 text-sm mb-2">Generador Recomendado</p>
                  <p className="text-2xl font-bold">{recommendation.productName}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Potencia</p>
                  <p className="text-lg font-bold text-gray-900">{recommendation.power}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Batería</p>
                  <p className="text-lg font-bold text-gray-900">{recommendation.battery}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Autonomía</p>
                  <p className="text-lg font-bold text-gray-900">{recommendation.autonomy}</p>
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-red-600 font-semibold text-center mt-6">{error}</div>}
        </div>
      </div>
    )
  }

  if (mode === 'optimizador') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setMode('inicial'); setSavingsRecommendation(null) }} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Volver al inicio</button>
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Optimizador de Costos</h1>
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Calcula tu Ahorro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">💰 Boleta actual ($)</label>
                <input type="number" placeholder="280000" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">📊 Tarifa ($/kWh)</label>
                <input type="number" placeholder="50" value={tariff} onChange={(e) => setTariff(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">⏰ Horas/día generador</label>
                <input type="number" placeholder="8" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">📊 % reducción deseada</label>
                <input type="number" placeholder="30" value={savingsPercent} onChange={(e) => setSavingsPercent(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600" />
              </div>
              <button onClick={calculateSavings} disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400">
                {loading ? '⏳ Calculando...' : '✓ Calcular Ahorro'}
              </button>
            </div>
          </div>
          {savingsRecommendation && (
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-teal-600">
              <h2 className="text-3xl font-bold text-teal-900 mb-8">💰 Análisis de Ahorro</h2>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-teal-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Factura actual</p>
                  <p className="text-2xl font-bold text-teal-900">${savingsRecommendation.currentBill.toLocaleString()}</p>
                </div>
                <div className="bg-teal-600 text-white p-6 rounded-lg">
                  <p className="text-teal-100 text-sm mb-2">Ahorro mensual</p>
                  <p className="text-2xl font-bold">${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Ahorro anual</p>
                  <p className="text-2xl font-bold text-gray-900">${savingsRecommendation.annualSavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Payback (meses)</p>
                  <p className="text-2xl font-bold text-gray-900">{savingsRecommendation.paybackMonths}</p>
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-red-600 font-semibold text-center mt-6">{error}</div>}
        </div>
      </div>
    )
  }

  return null
}
