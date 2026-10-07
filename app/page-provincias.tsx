'use client'

import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type Mode = 'inicial' | 'calculador' | 'optimizador'

const PROVINCIAS = ['Buenos Aires', 'Jujuy', 'Córdoba']

export default function EasyChargeCalculator() {
  const [mode, setMode] = useState<Mode>('inicial')
  const [provincia, setProvincia] = useState('')
  const [equipment, setEquipment] = useState<{ name: string; watts: number }[]>([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWatts, setEquipmentWatts] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // OPTIMIZADOR STATE
  const [billAmount, setBillAmount] = useState('')
  const [tariff, setTariff] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [savingsPercent, setSavingsPercent] = useState('')
  const [savingsRecommendation, setSavingsRecommendation] = useState<any>(null)

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

      // Consumo actual estimado
      const monthlyConsumption = bill / tariffValue
      const dailyConsumption = monthlyConsumption / 30

      // kWh que necesita generar diariamente
      const kWhToGenerate = dailyConsumption * percent * hours

      // Watts necesarios
      const wattsNeeded = (kWhToGenerate * 1000) / hours

      // Obtener recomendación del generador
      const response = await axios.post('/api/recommend', { totalConsumption: wattsNeeded })

      // Calcular ahorros
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
        paybackMonths,
        kWhPerDay: dailyConsumption,
        kWhToGenerate: Math.round(kWhToGenerate),
        wattsNeeded: Math.round(wattsNeeded),
        dailyHours: hours
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al calcular ahorros')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId)
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save(filename)
  }

  if (mode === 'inicial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Easy Charge</h1>
            <p className="text-lg text-gray-600">Soluciones de Energía Personalizada</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="mb-6 pb-6 border-b">
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿De qué provincia sos?</label>
              <select
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona tu provincia</option>
                {PROVINCIAS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              ¿Cuál es tu necesidad?
            </h2>

            <button
              onClick={() => {
                setMode('calculador')
                setEquipment([])
                setRecommendation(null)
                setError('')
              }}
              className="w-full mb-4 p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  1️⃣ Cubrir mi consumo
                </h3>
                <p className="text-gray-600">
                  Tengo estos equipos y quiero que funcionen. ¿Qué generador necesito?
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                setMode('optimizador')
                setSavingsRecommendation(null)
                setError('')
              }}
              className="w-full mb-4 p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  2️⃣ Reducir mi factura
                </h3>
                <p className="text-gray-600">
                  Mi boleta de luz es cara. ¿Cuánto ahorraría con un generador?
                </p>
              </div>
            </button>

            <button
              disabled
              className="w-full p-6 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed opacity-60"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  3️⃣ Solución con paneles (Próximamente)
                </h3>
                <p className="text-gray-500">
                  Quiero funcionar 24/7 con energía 100% renovable
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'calculador') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setMode('inicial')
              setEquipment([])
              setRecommendation(null)
            }}
            className="mb-4 text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Volver al inicio
          </button>

          <h1 className="text-3xl font-bold text-blue-900 mb-8">
            Calculador de Generador
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar Equipos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre del equipo (ej: TV, Heladera)"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Consumo (W)"
                value={equipmentWatts}
                onChange={(e) => setEquipmentWatts(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={addEquipment}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Agregar Equipo
            </button>
          </div>

          {equipment.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Equipos Agregados</h2>

              <div className="space-y-2">
                {equipment.map((eq, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded"
                  >
                    <span className="font-semibold text-gray-800">
                      {eq.name}: {eq.watts}W
                    </span>
                    <button
                      onClick={() => removeEquipment(idx)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-lg font-bold text-blue-900">
                  Consumo Total: {totalWatts}W
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Con margen de seguridad: {Math.round(totalWatts * 1.5)}W
                </p>
              </div>

              <button
                onClick={getRecommendation}
                disabled={loading}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Buscando recomendación...' : 'Obtener Recomendación'}
              </button>
            </div>
          )}

          {recommendation && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-300">
                <h2 className="text-2xl font-bold text-green-900 mb-4">✅ Recomendación</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Consumo solicitado</p>
                    <p className="text-2xl font-bold text-blue-900">{totalWatts}W</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Con margen de seguridad (+50%)</p>
                    <p className="text-2xl font-bold text-green-900">
                      {Math.round(totalWatts * 1.5)}W
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded md:col-span-2">
                    <p className="text-gray-600 text-sm">Generador Recomendado</p>
                    <p className="text-2xl font-bold text-purple-900">{recommendation.productName}</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Potencia</p>
                    <p className="text-xl font-bold text-yellow-900">{recommendation.power}</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Batería</p>
                    <p className="text-xl font-bold text-orange-900">{recommendation.battery}</p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Autonomía</p>
                    <p className="text-xl font-bold text-indigo-900">{recommendation.autonomy}</p>
                  </div>

                  <div className="bg-red-50 p-4 rounded">
                    <p className="text-gray-600 text-sm">Precio</p>
                    <p className="text-xl font-bold text-red-900">{recommendation.price}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded">
                  <strong>Beneficios:</strong> Este generador cubre con holgura tu consumo actual y te
                  permite agregar más equipos sin problemas. Ideal para emergencias y crecimiento futuro.
                </p>

                <button
                  onClick={() => generatePDF('pdf-calculador', 'cotizacion-easy-charge.pdf')}
                  className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
                >
                  📄 Descargar PDF
                </button>
              </div>

              <div id="pdf-calculador" className="hidden">
                <div style={{ width: '210mm', height: '297mm', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px', backgroundColor: 'white' }}>
                  <div style={{ borderBottom: '3px solid #1F4E78', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F4E78' }}>EASY CHARGE</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Soluciones de Energía Renovable</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11px' }}>
                    <div>
                      <div><strong>Cotización Nº:</strong> EC-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</div>
                      <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div><strong>Técnico:</strong> Easy Charge</div>
                      <div><strong>Válida por:</strong> 30 días</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '13px', borderBottom: '2px solid #1F4E78', paddingBottom: '5px' }}>
                      EQUIPOS SOLICITADOS
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#E8F0F7' }}>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #999' }}>Equipo</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #999' }}>Consumo (W)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.map((eq, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '8px' }}>{eq.name}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{eq.watts}W</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#F5F5F5' }}>
                          <td style={{ padding: '8px' }}>TOTAL CONSUMO</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>{totalWatts}W</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F0F8F0', border: '2px solid #4CAF50' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '13px', color: '#1F4E78' }}>
                      ✓ GENERADOR RECOMENDADO
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F4E78', marginBottom: '10px' }}>
                      {recommendation.productName}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                      <div><strong>Potencia:</strong> {recommendation.power}</div>
                      <div><strong>Batería:</strong> {recommendation.battery}</div>
                      <div><strong>Autonomía:</strong> {recommendation.autonomy}</div>
                      <div><strong>Precio:</strong> {recommendation.price}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px', paddingLeft: '10px', fontSize: '11px', lineHeight: '1.6' }}>
                    <strong>Beneficios de esta solución:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      <li>✓ Cubre tu consumo actual con margen de seguridad</li>
                      <li>✓ Permite agregar más equipos sin problemas</li>
                      <li>✓ Ideal para emergencias y crecimiento futuro</li>
                      <li>✓ Energía limpia y renovable</li>
                    </ul>
                  </div>

                  <div style={{ marginTop: '30px', borderTop: '1px solid #999', paddingTop: '20px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'center', width: '45%' }}>
                        <div style={{ height: '40px' }}></div>
                        <div>Firma del Cliente</div>
                        <div style={{ fontSize: '10px', marginTop: '5px' }}>Fecha: ______________</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '45%' }}>
                        <div style={{ height: '40px' }}></div>
                        <div>Firma del Técnico</div>
                        <div style={{ fontSize: '10px', marginTop: '5px' }}>Easy Charge</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #999', textAlign: 'center', fontSize: '9px', color: '#666' }}>
                    <div>Easy Charge - Soluciones de Energía Renovable</div>
                    <div>Energía sostenible para tu futuro</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        </div>
      </div>
    )
  }

  if (mode === 'optimizador') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setMode('inicial')
              setSavingsRecommendation(null)
            }}
            className="mb-4 text-green-600 hover:text-green-800 font-semibold"
          >
            ← Volver al inicio
          </button>

          <h1 className="text-3xl font-bold text-green-900 mb-8">
            Optimizador de Costos
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Calcula tu Ahorro</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  💰 Boleta de luz actual ($)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 280000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  ⚡ Tarifa de tu zona ($/kWh)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 45, 60, 85"
                  value={tariff}
                  onChange={(e) => setTariff(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-gray-500 text-sm mt-1">Tarifa promedio por kWh en tu provincia</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  ⏰ Horas/día que funcionaría el generador
                </label>
                <input
                  type="number"
                  placeholder="Ej: 6, 12, 24"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  📊 % de reducción deseada
                </label>
                <input
                  type="number"
                  placeholder="Ej: 30, 50"
                  value={savingsPercent}
                  onChange={(e) => setSavingsPercent(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                onClick={calculateSavings}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Calculando...' : 'Calcular Ahorro'}
              </button>
            </div>
          </div>

          {savingsRecommendation && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-300">
              <h2 className="text-2xl font-bold text-green-900 mb-4">💰 Análisis de Ahorro</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Factura actual</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${savingsRecommendation.currentBill.toLocaleString()}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Tarifa de tu zona</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${savingsRecommendation.tariffValue}/kWh
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Reducción deseada</p>
                  <p className="text-2xl font-bold text-red-900">
                    {savingsRecommendation.savingsPercent.toFixed(0)}%
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">💚 Ahorro mensual</p>
                  <p className="text-3xl font-bold text-green-900">
                    ${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Ahorro anual</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${savingsRecommendation.annualSavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Payback (meses)</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {savingsRecommendation.paybackMonths} meses
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">Generador recomendado</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {savingsRecommendation.productName}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded">
                <strong>Conclusión:</strong> Con este generador funcionando{' '}
                {savingsRecommendation.dailyHours} horas/día, ahorrarás{' '}
                <strong>${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}/mes</strong>
                . Tu inversión se amortiza en aproximadamente{' '}
                <strong>{savingsRecommendation.paybackMonths} meses</strong>.
              </p>

              <button
                onClick={() => generatePDF('pdf-optimizador', 'analisis-ahorro-easy-charge.pdf')}
                className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
              >
                📄 Descargar PDF
              </button>
            </div>
          )}

          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        </div>
      </div>
    )
  }
}
